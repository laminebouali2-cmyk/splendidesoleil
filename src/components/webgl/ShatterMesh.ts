import * as THREE from "three";

// Fissure 3D : un plan (la photo du panneau) découpé en une grille dense de pièces
// rigides. Chaque pièce a une graine pseudo-aléatoire propre → direction d'éclat,
// axe et vitesse de rotation, décalage temporel. Piloté par `uProgress` (0 = image
// entière, 1 = éclats au maximum), animé en GSAP power3.inOut côté moteur.
//
// Fidèle à la recette du vrai site (grille ~20×40, hash + rotation par pièce,
// aberration chromatique sur les bords), mais réécrit proprement et poussé côté
// exécution : flottement ambiant (uTime/uFloat) et fondu (uOpacity) pour la suite.

const VERT = /* glsl */ `
  uniform float uProgress;   // 0 = image entière → 1 = éclats explosés
  uniform float uTime;       // horloge (flottement ambiant)
  uniform float uFloat;      // intensité du flottement (0 pendant la transition)
  uniform float uSpread;     // amplitude globale de l'éclatement (unités monde)
  attribute vec3 aPieceCenter; // centre local de la pièce (z = 0)
  attribute float aSeed;       // graine par pièce ∈ [0,1)
  varying vec2 vUv;
  varying float vProg;
  varying float vSeed;

  mat3 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
  }

  void main() {
    vUv = uv;
    vSeed = aSeed;
    float seed = aSeed;

    // Décalage temporel par pièce : la fissure « court » à travers l'image au lieu
    // d'exploser d'un seul bloc (plus organique).
    float delay = seed * 0.18;
    float p = clamp((uProgress - delay) / max(1.0 - delay, 0.001), 0.0, 1.0);
    vProg = p;

    vec3 center = aPieceCenter;

    // Direction d'éclat : radiale depuis le centre + part aléatoire + vers la caméra (+z).
    vec2 radial = length(center.xy) > 0.001 ? normalize(center.xy) : vec2(0.0, 1.0);
    float ang = seed * 6.2831853;
    vec2 jitter = vec2(cos(ang), sin(ang));
    vec3 dir = normalize(vec3(radial * 0.65 + jitter * 0.5, mix(0.2, 1.1, seed)));
    // Sélection des pièces « rémanentes » DÉCOUPLÉE de la graine de distance, sinon
    // les pièces qui restent seraient celles qui volent le plus loin (hors écran).
    float lingerRand = fract(sin(seed * 91.7) * 4391.3);
    float isLinger = step(0.88, lingerRand);
    // Les rémanentes volent moins loin → elles restent à l'écran et flottent.
    float dist = p * uSpread * (0.5 + seed * 1.1) * mix(1.0, 0.5, isLinger);

    // Rotation rigide propre à la pièce (axe + sens + vitesse aléatoires).
    // + lente rotation continue quand les éclats flottent (uFloat) → ils tournoient.
    vec3 axis = vec3(seed - 0.5, fract(seed * 7.13) - 0.5, fract(seed * 3.71) - 0.5);
    float dirSign = fract(seed * 9.7) > 0.5 ? 1.0 : -1.0;
    float spin = p * (2.5 + seed * 7.0) * dirSign + uFloat * uTime * 0.22 * (seed - 0.5);
    mat3 rot = rotationMatrix(axis, spin);

    // Flottement ambiant (s'active après l'éclat, brique 5).
    vec3 floatOff = vec3(
      sin(uTime * 0.6 + seed * 12.0),
      cos(uTime * 0.5 + seed * 8.0),
      sin(uTime * 0.4 + seed * 5.0)
    ) * uFloat * (0.04 + 0.10 * seed);

    vec3 local = position - center;
    local = rot * local;
    vec3 pos = center + local + dir * dist + floatOff;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uAberration;
  uniform float uOpacity;
  uniform float uLinger;     // 0 = tout visible (burst) → 1 = seules les pièces « rémanentes » restent
  uniform float uScrollFade; // 0→1 : le scroll efface les éclats restants
  varying vec2 vUv;
  varying float vProg;
  varying float vSeed;

  void main() {
    // Aberration chromatique : nulle sur l'image entière, croît à l'éclatement.
    float a = uAberration * vProg;
    vec2 dir = vUv - 0.5;
    float r = texture2D(uTexture, vUv + dir * a).r;
    float g = texture2D(uTexture, vUv).g;
    float b = texture2D(uTexture, vUv - dir * a).b;
    vec3 col = vec3(r, g, b);

    // Léger assombrissement des dos de pièces → sensation de volume/épaisseur.
    if (!gl_FrontFacing) col *= 0.55;
    // Les pièces les plus éclatées perdent un peu de lumière (matière qui s'éloigne).
    col *= 1.0 - 0.18 * vProg;

    // ~12% des pièces RESTENT et flottent ; les autres s'effacent après le burst
    // (uLinger). Le scroll efface tout (uScrollFade). Sélection identique au vertex.
    float lingerRand = fract(sin(vSeed * 91.7) * 4391.3);
    float isLinger = step(0.88, lingerRand);
    float persist = mix(1.0 - uLinger, 0.85, isLinger);
    float alpha = uOpacity * persist * (1.0 - uScrollFade);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

export interface ShatterOptions {
  width: number;
  height: number;
  z: number;
  cols: number;
  rows: number;
}

function hash01(i: number, j: number): number {
  let h = (i * 374761393 + j * 668265263) >>> 0;
  h = (Math.imul(h ^ (h >>> 13), 1274126177)) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class ShatterMesh {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;

  constructor(opts: ShatterOptions) {
    this.geometry = ShatterMesh.buildGeometry(opts);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTexture: { value: null },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uFloat: { value: 0 },
        uSpread: { value: Math.max(opts.width, opts.height) * 1.2 },
        uAberration: { value: 0.06 },
        uOpacity: { value: 1 },
        uLinger: { value: 0 },
        uScrollFade: { value: 0 },
      },
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.z = opts.z;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false; // les pièces sortent largement du plan d'origine
  }

  // Chaque cellule est un quad INDÉPENDANT (6 sommets, pas d'indices partagés) pour
  // que les pièces se séparent. Attributs : position locale (centrée), uv, centre de
  // pièce (pour la rotation rigide) et graine par pièce.
  private static buildGeometry(opts: ShatterOptions): THREE.BufferGeometry {
    const { width: W, height: H, cols: SX, rows: SY } = opts;
    const positions: number[] = [];
    const uvs: number[] = [];
    const centers: number[] = [];
    const seeds: number[] = [];

    for (let j = 0; j < SY; j++) {
      for (let i = 0; i < SX; i++) {
        const x0 = -W / 2 + (i / SX) * W;
        const x1 = -W / 2 + ((i + 1) / SX) * W;
        const y0 = -H / 2 + (j / SY) * H;
        const y1 = -H / 2 + ((j + 1) / SY) * H;
        const u0 = i / SX;
        const u1 = (i + 1) / SX;
        const v0 = j / SY;
        const v1 = (j + 1) / SY;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const seed = hash01(i, j);

        // A=(x0,y0) B=(x1,y0) C=(x1,y1) D=(x0,y1) → triangles A,B,C et A,C,D
        const quadPos = [x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1];
        const quadUv = [u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1];
        for (let k = 0; k < 6; k++) {
          positions.push(quadPos[k * 2], quadPos[k * 2 + 1], 0);
          uvs.push(quadUv[k * 2], quadUv[k * 2 + 1]);
          centers.push(cx, cy, 0);
          seeds.push(seed);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("aPieceCenter", new THREE.Float32BufferAttribute(centers, 3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    return geo;
  }

  setTexture(tex: THREE.Texture | null) {
    this.material.uniforms.uTexture.value = tex;
  }

  set progress(v: number) {
    this.material.uniforms.uProgress.value = v;
  }
  get progress() {
    return this.material.uniforms.uProgress.value as number;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
  }

  set time(v: number) {
    this.material.uniforms.uTime.value = v;
  }

  set floatAmount(v: number) {
    this.material.uniforms.uFloat.value = v;
  }

  show() {
    this.mesh.visible = true;
  }
  hide() {
    this.mesh.visible = false;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
