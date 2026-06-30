import * as THREE from "three";
import { gsap } from "gsap";

// Brique « cylindre pliable » — fidèle au vrai code de la référence :
// un plan PLAT est courbé dans le vertex shader via uCurveState (0 = cylindre, 1 = plat),
// au lieu d'une géométrie pré-courbée. Le dépliage = mix(bent, flat, uCurveState).
// La navigation passe par uRotation (uniform) pour que le mode plat reste aligné.
const VERT = /* glsl */ `
  uniform float uCurveState;  // 0 = cylindre courbé, 1 = colonnes à plat
  uniform float uRadius;      // rayon du cylindre
  uniform float uAngle;       // angle de base de ce panneau (i * slot)
  uniform float uRotation;    // rotation du tambour (navigation)
  uniform float uSlot;        // angle d'un panneau (2π / N)
  uniform float uFlatScale;   // échelle de la bande à plat (toggle 0.55, exit ~1.9)
  varying vec2 vUv;
  varying float vFacing;      // relief : 1 = face caméra, plus petit = de profil
  void main() {
    vUv = uv;
    float a = uAngle - uRotation;
    // Replie l'angle dans [-π, π] → le panneau focus revient TOUJOURS au centre quel
    // que soit le nombre de tours (fix : le panneau ne glisse plus latéralement à plat).
    a -= 6.28318530718 * floor(a / 6.28318530718 + 0.5);
    float theta = a + position.x / uRadius;            // angle le long de l'arc
    vec3 bent = vec3(sin(theta) * uRadius, position.y, cos(theta) * uRadius);
    vFacing = cos(theta);                              // bords du tambour → plus sombres (relief)

    // À plat : le cylindre se DÉROULE en bande horizontale, panneau focus centré (a≈0).
    float arc = a * uRadius + position.x;
    vec3 flatPos = vec3(arc * uFlatScale, position.y * uFlatScale, uRadius);

    vec3 pos = mix(bent, flatPos, uCurveState);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Aberration chromatique douce en bord + reflet. (Plus de fuites de couleur additives.)
const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uAberr;
  uniform float uReflect;
  uniform float uAlpha;
  uniform float uCurveState;
  varying vec2 vUv;
  varying float vFacing;

  void main() {
    vec2 uv = vUv;
    float edge = pow(abs(uv.x - 0.5) * 2.0, 1.6);
    float dir = sign(uv.x - 0.5);
    float a = uAberr * edge * 0.02;
    float r = texture2D(uTex, vec2(uv.x - dir * a, uv.y)).r;
    float g = texture2D(uTex, vec2(uv.x, uv.y)).g;
    float b = texture2D(uTex, vec2(uv.x + dir * a, uv.y)).b;
    vec3 col = vec3(r, g, b);

    // Relief 3D : les bords du tambour (de profil) s'assombrissent. Coupé à plat.
    float shade = mix(0.5 + 0.5 * smoothstep(-0.1, 1.0, vFacing), 1.0, uCurveState);
    col *= shade;

    float alpha = uAlpha;
    if (uReflect > 0.5) {
      alpha *= smoothstep(0.0, 1.0, uv.y) * 0.42; // fondu du reflet au sol
      col *= 0.95;
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface CarouselSceneOptions {
  images: string[];
  onChange?: (index: number) => void;
  onTilt?: () => void; // tiré quand le tambour commence à se redresser (sync titre)
  onReady?: () => void; // tiré quand l'intro est finie (le titre n'apparaît qu'alors)
}

export class CarouselScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private reflection = new THREE.Group();
  private materials: THREE.ShaderMaterial[] = [];
  private textures: THREE.Texture[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  private readonly images: string[];
  private readonly onChange?: (i: number) => void;
  private readonly onTilt?: () => void;
  private readonly onReady?: () => void;
  private readonly N: number;
  private readonly slot: number; // anneau continu : chaque photo = un secteur
  private readonly R = 3.0;
  private readonly H = 2.6;

  // Caméra fixe, frontale et basse, légèrement reculée → le sommet du tambour
  // descend sous le mot PORTEFOLIO et on voit peu l'ouverture du dessus.
  private readonly camY = 1.05;
  private readonly camZ = 11.0;

  // Pose de l'intro : l'anneau part vu de face (axe vers la caméra) puis bascule.
  private readonly startTilt = Math.PI / 2;
  private readonly restY = 0;

  // Proxies animés par GSAP, recopiés dans tous les matériaux chaque frame.
  private rotProxy = { v: 0 }; // rotation du tambour (radians)
  private curveProxy = { v: 0 }; // 0 = cylindre, 1 = plat
  private flatScaleProxy = { v: 0.55 }; // taille de la bande à plat
  private exiting = false;

  private raf = 0;
  private frameHooks: ((nowMs: number) => void)[] = [];
  private index = 0;
  private targetRX = 0;
  private pointerX = 0;
  private isAnimating = false;
  private wheelAccum = 0;
  private introDone = false;
  private introStarted = false;
  private texturesReady = false;
  private loadedCount = 0;
  private readyFrames = 0;
  private isFlat = false;
  private hidden = false; // vrai quand on n'est pas sur l'accueil (canvas persistant) : rendu transparent

  constructor(canvas: HTMLCanvasElement, options: CarouselSceneOptions) {
    this.images = options.images;
    this.onChange = options.onChange;
    this.onTilt = options.onTilt;
    this.onReady = options.onReady;
    this.N = this.images.length;
    this.slot = (Math.PI * 2) / this.N;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, this.camY, this.camZ);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(this.group);
    this.scene.add(this.reflection);

    this.build();
    this.resize();
  }

  // Plan PLAT (couvrant un secteur `slot` une fois courbé) — la courbure est dans le shader.
  // Largeur < slot complet → il reste un PETIT ESPACE entre panneaux (comme la réf).
  private readonly gap = 0.95; // 95% du secteur → petit espace discret entre panneaux
  private makePanelGeometry(): THREE.PlaneGeometry {
    const geo = new THREE.PlaneGeometry(this.slot * this.R * this.gap, this.H, 64, 1);
    this.geometries.push(geo);
    return geo;
  }

  private build() {
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    for (let i = 0; i < this.N; i++) {
      const tex = loader.load(this.images[i], () => {
        this.loadedCount++;
        if (this.loadedCount === this.N) this.texturesReady = true;
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearFilter;
      this.textures.push(tex);

      const makeMat = (reflect: number) =>
        new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms: {
            uTex: { value: tex },
            uAberr: { value: 0.5 },
            uReflect: { value: reflect },
            uAlpha: { value: 1 },
            uCurveState: { value: 0 },
            uRadius: { value: this.R },
            uAngle: { value: i * this.slot },
            uRotation: { value: 0 },
            uSlot: { value: this.slot },
            uFlatScale: { value: 0.55 },
          },
          // Panneaux avant OPAQUES + depth → ils s'occultent (plus de « voir à travers »).
          // Seul le reflet au sol reste transparent (il se fond).
          transparent: reflect > 0.5,
          depthWrite: reflect < 0.5,
          depthTest: true,
          side: THREE.DoubleSide,
        });

      const mat = makeMat(0);
      this.materials.push(mat);
      this.group.add(new THREE.Mesh(this.makePanelGeometry(), mat));

      const refMat = makeMat(1);
      this.materials.push(refMat);
      this.reflection.add(new THREE.Mesh(this.makePanelGeometry(), refMat));
    }

    this.reflection.scale.y = -1;
    this.reflection.position.y = -this.H - 0.02;
    this.reflection.visible = false;
  }

  private go(dir: number) {
    if (this.isAnimating) return;
    this.index += dir;
    this.isAnimating = true;
    gsap.to(this.rotProxy, {
      v: this.index * this.slot,
      duration: 1.15,
      ease: "power3.out",
      onComplete: () => {
        this.isAnimating = false;
        this.wheelAccum = 0;
      },
    });
    this.onChange?.(((this.index % this.N) + this.N) % this.N);
  }

  next() {
    this.go(1);
  }

  prev() {
    this.go(-1);
  }

  // Bouton rond : déplie le cylindre en bande plate (uCurveState 0→1), réversible.
  // Ease quint.inOut, ~1.2 s — comme la référence (ringEase).
  toggleFlat() {
    if (!this.introDone) return;
    this.isFlat = !this.isFlat;
    const flat = this.isFlat;
    if (flat) this.reflection.visible = false;
    gsap.to(this.curveProxy, {
      v: flat ? 1 : 0,
      duration: 1.2,
      ease: "quint.inOut",
      onComplete: () => {
        if (!this.isFlat) this.reflection.visible = true;
      },
    });
  }

  get flattened() {
    return this.isFlat;
  }

  // Le canvas vit dans le layout (jamais démonté) : index courant + état d'exit
  // sont la source de vérité pour le contrôleur React (HeroCarousel).
  get activeIndex() {
    return ((this.index % this.N) + this.N) % this.N;
  }

  get isExiting() {
    return this.exiting;
  }

  // Le moteur partage le MÊME contexte Three pour la fissure / les éclats (un seul
  // renderer, une seule scène, une seule caméra → transition sans couture).
  getContext() {
    return { scene: this.scene, camera: this.camera, renderer: this.renderer };
  }

  // Texture du panneau actuellement au centre (entrée de la fissure).
  getFocusTexture(): THREE.Texture | null {
    return this.textures[this.activeIndex] ?? null;
  }

  // Dimensions/position du panneau focus une fois DÉPLIÉ à plat (état de playExit) →
  // la fissure naît exactement à sa place pour un raccord invisible.
  getFlatPanelSize() {
    const flatScale = 0.62; // identique à playExit
    return {
      width: this.slot * this.R * this.gap * flatScale,
      height: this.H * flatScale,
      z: this.R,
    };
  }

  // L'accueil quitte la scène (navigation) → on cache le cylindre mais on continue
  // de rendre (transparent) pour effacer la dernière frame (sinon elle resterait
  // « gravée » derrière la galerie).
  hide() {
    this.hidden = true;
    this.group.visible = false;
    this.reflection.visible = false;
  }

  // Retour sur l'accueil : on remet la scène à zéro et on rejoue l'intro
  // (les textures sont déjà chargées → pas de gate à attendre).
  show() {
    this.hidden = false;
    this.group.visible = true;
    this.resetState();
    this.playIntro();
  }

  // Remet le tambour dans l'état de départ après un playExit (les proxies/alphas
  // avaient été poussés vers l'état « déplié + effacé »).
  private resetState() {
    gsap.killTweensOf([this.rotProxy, this.curveProxy, this.flatScaleProxy]);
    this.exiting = false;
    this.isFlat = false;
    this.isAnimating = false;
    this.wheelAccum = 0;
    this.index = 0;
    this.rotProxy.v = 0;
    this.curveProxy.v = 0;
    this.flatScaleProxy.v = 0.55;
    this.targetRX = 0;
    this.pointerX = 0;
    this.group.children.forEach((mesh) => {
      const mat = (mesh as THREE.Mesh).material as THREE.ShaderMaterial;
      gsap.killTweensOf(mat.uniforms.uAlpha);
      mat.uniforms.uAlpha.value = 1;
      mat.transparent = false;
      mat.depthWrite = true;
    });
    this.onChange?.(0);
  }

  // Transition de sortie : le panneau focus se DÉPLIE à plat et GRANDIT pour remplir
  // l'écran, les autres panneaux s'effacent. onComplete est appelé juste avant la
  // navigation → la galerie enchaîne avec l'explosion en fragments.
  playExit(onComplete: () => void) {
    if (this.exiting || !this.introDone) {
      onComplete();
      return;
    }
    this.exiting = true;
    this.reflection.visible = false;
    const focusIdx = ((this.index % this.N) + this.N) % this.N;
    this.group.children.forEach((mesh, i) => {
      if (i === focusIdx) return;
      const mat = (mesh as THREE.Mesh).material as THREE.ShaderMaterial;
      mat.transparent = true;
      gsap.to(mat.uniforms.uAlpha, { value: 0, duration: 0.4, ease: "power2.out" });
    });
    // Le panneau se déplie en gardant ~LA MÊME TAILLE (rectangle centré, pas plein
    // écran). Les autres s'effacent → fond blanc derrière. La galerie enchaîne avec
    // l'explosion panneau (parallax) → on dirait que la page était dans le panneau.
    gsap.to(this.curveProxy, { v: 1, duration: 0.5, ease: "power3.inOut" });
    gsap.to(this.flatScaleProxy, { v: 0.62, duration: 0.5, ease: "power3.inOut" });
    gsap.delayedCall(0.52, onComplete);
  }

  onWheel(delta: number) {
    if (!this.introDone || this.isAnimating) return;
    this.wheelAccum += delta;
    if (Math.abs(this.wheelAccum) > 30) {
      this.go(this.wheelAccum > 0 ? 1 : -1);
    }
  }

  onPointerMove(nx: number, ny: number) {
    this.pointerX = nx;
    this.targetRX = ny * 0.05;
  }

  resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Sur écran étroit (portrait/mobile) : FOV plus large (= plus de perspective et de
    // profondeur) + distance juste ce qu'il faut pour que tout le tambour tienne en
    // largeur. Avant on reculait beaucoup la caméra → cylindre plat et minuscule.
    const portrait = aspect < 1;
    this.camera.fov = portrait ? 46 : 34;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const targetWidth = portrait ? 7.6 : 7.2; // largeur monde occupée par le tambour
    const distForWidth = targetWidth / (2 * Math.tan(vFov / 2) * aspect);
    this.camera.position.z = Math.max(this.camZ, distForWidth);
    this.camera.updateProjectionMatrix();
  };

  // Intro : l'anneau apparaît vu de face (vue de dessus du tambour), s'éjecte en
  // hauteur, puis bascule de 90° et redescend pour se redresser en tambour — le
  // titre PORTFOLIO arrive en même temps (onTilt).
  private playIntro() {
    this.introDone = false;
    this.reflection.visible = false;
    this.group.rotation.set(this.startTilt, 0, 0); // anneau face caméra
    this.group.position.set(0, 0, 0);

    const tl = gsap.timeline({
      onComplete: () => {
        this.introDone = true;
        this.reflection.visible = true;
        this.onReady?.(); // le titre n'apparaît qu'ici (pas pendant que le cylindre est en l'air)
      },
    });
    tl.to(this.group.position, { y: 1.6, duration: 0.7, ease: "power2.out" }, 0.5);
    tl.to(this.group.position, { y: this.restY, duration: 1.6, ease: "power2.inOut" }, 1.1);
    tl.to(
      this.group.rotation,
      { x: 0, duration: 1.7, ease: "power3.inOut", onStart: () => this.onTilt?.() },
      1.0,
    );
  }

  // Hooks de frame du moteur (fissure/éclats) : tournent même quand le cylindre est
  // caché (mode galerie), car c'est justement là que la fissure vit.
  addFrameHook(fn: (nowMs: number) => void) {
    this.frameHooks.push(fn);
  }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const now = performance.now();
    for (const h of this.frameHooks) h(now);
    if (this.hidden) {
      this.renderer.render(this.scene, this.camera); // efface (group invisible → transparent)
      return;
    }
    if (this.texturesReady && !this.introStarted) {
      this.readyFrames++;
      if (this.readyFrames > 3) {
        this.introStarted = true;
        this.playIntro();
      }
    }
    if (this.introDone && !this.isFlat) {
      // parallaxe douce — gelée quand c'est déplié pour que les colonnes restent droites
      this.group.rotation.x += (this.targetRX - this.group.rotation.x) * 0.06;
      this.camera.position.x += (this.pointerX * 0.45 - this.camera.position.x) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
    // recopie des proxies animés dans tous les matériaux (tambour + reflet)
    for (const m of this.materials) {
      m.uniforms.uRotation.value = this.rotProxy.v;
      m.uniforms.uCurveState.value = this.curveProxy.v;
      m.uniforms.uFlatScale.value = this.flatScaleProxy.v;
    }
    this.reflection.rotation.x = this.group.rotation.x;
    this.renderer.render(this.scene, this.camera);
  };

  start() {
    this.introDone = false;
    this.reflection.visible = false;
    this.group.rotation.set(this.startTilt, 0, 0);
    this.group.position.set(0, 0, 0);
    this.animate();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.materials.forEach((m) => m.dispose());
    this.geometries.forEach((g) => g.dispose());
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}
