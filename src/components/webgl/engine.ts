// Moteur WebGL persistant.
//
// Le canvas vit dans `app/layout.tsx` (hors de `{children}`) → il N'EST JAMAIS
// démonté à la navigation (les layouts persistent ; seul le `template.tsx` reçoit
// une key par route et remonte les pages). C'est la condition d'une transition
// sans couture : un seul contexte WebGL, partagé entre l'accueil (cylindre) et,
// plus tard, la fissure 3D + les éclats ambiants de la galerie.
//
// Pattern : singleton module-level (PAS de React Context — le canvas n'est pas
// dans l'arbre React des pages). Les pages parlent au moteur ; le moteur émet via
// les callbacks fournis. Init idempotent pour survivre au double-mount StrictMode.

import * as THREE from "three";
import { gsap } from "gsap";
import { CarouselScene } from "@/components/hero/CarouselScene";
import { ShatterMesh } from "./ShatterMesh";

// Compose la photo du panneau + le nom du thème dans UNE texture → la fissure fait
// exploser la page ET le titre ensemble (et non plus « seule l'image bouge »).
function makeTitledTexture(
  img: HTMLImageElement,
  label: string,
  aspect: number,
): THREE.CanvasTexture {
  const W = 1280;
  const H = Math.max(1, Math.round(W / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Photo en cover (recadrée pour remplir).
  const ir = img.width / img.height;
  const cr = W / H;
  let dw: number, dh: number;
  if (ir > cr) {
    dh = H;
    dw = H * ir;
  } else {
    dw = W;
    dh = W / ir;
  }
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // Titre du thème, centré, dans la vraie police d'affichage (lue sur la var CSS).
  const fam =
    getComputedStyle(document.documentElement).getPropertyValue("--font-editorial").trim() ||
    "Georgia, serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = H * 0.045;
  ctx.font = `${Math.round(H * 0.24)}px ${fam}`;
  ctx.fillText(label, W / 2, H / 2 + H * 0.02);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

type Mode = "idle" | "home" | "transition";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface EngineCallbacks {
  onChange?: (index: number) => void;
  onTilt?: () => void;
  onReady?: () => void;
  onActivate?: () => void; // clic sur le canvas en mode accueil → ouvrir la galerie
}

class TransitionEngine {
  private canvas: HTMLCanvasElement | null = null;
  private cylinder: CarouselScene | null = null;
  private shatter: ShatterMesh | null = null;
  private titledTex: THREE.CanvasTexture | null = null; // composite photo+titre (à disposer)
  private mode: Mode = "idle";
  private cbs: EngineCallbacks = {};
  private inputBound = false;
  private shatterActive = false; // vrai tant que des éclats vivent (burst OU flottants restants)

  // Appelé une seule fois par PersistentCanvas. Idempotent : un re-mount React
  // (StrictMode/HMR) ne recrée ni le renderer ni les listeners.
  init(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas) return;
    this.canvas = canvas;
    this.applyMode();
    this.bindInput();
  }

  private bindInput() {
    if (this.inputBound) return;
    this.inputBound = true;
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("pointermove", this.onPointer);
    window.addEventListener("resize", this.onResize);
  }

  // Crée la fissure UNE fois, partagée dans la scène du cylindre (même contexte WebGL),
  // dimensionnée pile sur le panneau déplié pour un raccord invisible.
  private ensureShatter() {
    if (this.shatter || !this.cylinder) return;
    const { scene } = this.cylinder.getContext();
    const { width, height, z } = this.cylinder.getFlatPanelSize();
    const aspect = width / height;
    const N = 720; // ~grille dense (recette ≈ 20×40), cellules quasi carrées
    const cols = Math.max(8, Math.round(Math.sqrt(N * aspect)));
    const rows = Math.max(8, Math.round(N / cols));
    this.shatter = new ShatterMesh({ width, height, z, cols, rows });
    scene.add(this.shatter.mesh);
    this.cylinder.addFrameHook((now) => {
      if (this.shatter) this.shatter.time = now / 1000;
    });
  }

  // L'accueil prend la main : crée le cylindre à la 1re visite, sinon le ré-affiche
  // (rejoue l'intro). Les callbacks sont relues en direct via `this.cbs`.
  showCylinder(images: string[], cbs: EngineCallbacks) {
    this.cbs = cbs;
    this.endShatter(); // si on revient de la galerie, on efface tout éclat restant
    this.mode = "home";
    this.applyMode();
    if (!this.canvas) return;
    if (!this.cylinder) {
      this.cylinder = new CarouselScene(this.canvas, {
        images,
        onChange: (i) => this.cbs.onChange?.(i),
        onTilt: () => this.cbs.onTilt?.(),
        onReady: () => this.cbs.onReady?.(),
      });
      this.cylinder.start();
    } else {
      this.cylinder.show();
    }
  }

  // L'accueil quitte la scène (navigation) : on cache le cylindre, canvas non cliquable.
  // Mais SI une transition (éclat) est en cours, on ne touche pas au mode/z-index :
  // le canvas doit rester au-dessus du DOM galerie jusqu'à la fin de l'éclat.
  hideCylinder() {
    this.cylinder?.hide();
    if (!this.shatterActive) {
      this.mode = "idle";
      this.applyMode();
    }
  }

  private applyMode() {
    const c = this.canvas;
    if (!c) return;
    c.classList.toggle("webgl-stage--home", this.mode === "home");
    c.classList.toggle("webgl-stage--transition", this.mode === "transition");
  }

  // Transition complète accueil → galerie, sans couture :
  // 1) le panneau focus se déplie à plat (playExit) ;
  // 2) la fissure prend EXACTEMENT le relais (même image, même place) et explose ;
  // 3) on navigue derrière (la galerie monte cachée, fond en CSS) pendant que le
  //    canvas passe au-dessus du DOM ; 4) les éclats se dispersent et s'effacent,
  //    le canvas redescend → galerie nette.
  beginEnterGallery(label: string, routerPush: () => void) {
    // Mouvement réduit : pas d'explosion, on navigue directement (la galerie a déjà
    // son entrée neutralisée par @media prefers-reduced-motion).
    if (!this.cylinder || prefersReducedMotion()) {
      routerPush();
      return;
    }
    this.ensureShatter();
    const s = this.shatter;
    const cyl = this.cylinder;
    if (!s) {
      cyl.playExit(routerPush);
      return;
    }
    this.shatterActive = true;
    cyl.playExit(() => {
      // Le panneau est déplié à plat → la fissure (identique) prend le relais.
      // On compose photo + titre du thème → la PAGE ET LE TITRE explosent ensemble.
      const photoTex = cyl.getFocusTexture();
      const img = photoTex?.image as HTMLImageElement | undefined;
      this.titledTex?.dispose();
      this.titledTex = null;
      if (img && img.width) {
        const { width, height } = cyl.getFlatPanelSize();
        this.titledTex = makeTitledTexture(img, label, width / height);
        s.setTexture(this.titledTex);
      } else {
        s.setTexture(photoTex);
      }
      const u = s.material.uniforms;
      gsap.killTweensOf([u.uProgress, u.uLinger, u.uFloat, u.uOpacity, u.uScrollFade]);
      u.uProgress.value = 0;
      u.uLinger.value = 0;
      u.uFloat.value = 0;
      u.uOpacity.value = 1;
      u.uScrollFade.value = 0;
      s.show();
      cyl.hide();
      this.mode = "transition";
      this.applyMode(); // le canvas couvre le DOM galerie pendant l'éclat
      routerPush();

      // Explosion, puis la plupart des pièces s'effacent et ~12% RESTENT et flottent
      // autour de la galerie (elles s'effaceront au scroll — cf. setScrollFade).
      gsap.to(u.uProgress, { value: 1, duration: 1.05, ease: "power3.inOut" });
      gsap.to(u.uLinger, { value: 1, duration: 0.7, delay: 0.55, ease: "power2.inOut" });
      gsap.to(u.uFloat, { value: 1, duration: 1.3, delay: 0.6, ease: "power2.out" });
    });
  }

  // La galerie est montée. Rien à déclencher (l'éclat vient de l'accueil) — mais on
  // expose le pilotage du fondu au scroll et un nettoyage à la sortie.
  enterGallery() {
    /* présence galerie : voir setScrollFade / leaveGallery */
  }

  // Le scroll de la galerie efface progressivement les éclats restants.
  setScrollFade(p: number) {
    if (!this.shatter || !this.shatterActive) return;
    this.shatter.material.uniforms.uScrollFade.value = Math.max(0, Math.min(1, p));
    if (p >= 0.99) this.endShatter(); // tout effacé → on libère le canvas
  }

  // Quitter la galerie (navigation) : on coupe net les éclats restants.
  leaveGallery() {
    this.endShatter();
  }

  // Éteint la fissure et remet ses uniforms à zéro pour la prochaine fois ; le canvas
  // redescend sous le DOM (mode idle) s'il était en transition.
  private endShatter() {
    if (!this.shatterActive) return;
    this.shatterActive = false;
    if (this.shatter) {
      const u = this.shatter.material.uniforms;
      gsap.killTweensOf([u.uProgress, u.uLinger, u.uFloat, u.uOpacity, u.uScrollFade]);
      u.uProgress.value = 0;
      u.uLinger.value = 0;
      u.uFloat.value = 0;
      u.uOpacity.value = 1;
      u.uScrollFade.value = 0;
      this.shatter.hide();
    }
    if (this.mode === "transition") {
      this.mode = "idle";
      this.applyMode();
    }
  }

  // Clic sur le canvas (géré par PersistentCanvas) → ouvrir la galerie, en mode accueil seulement.
  activate() {
    if (this.mode === "home" && !this.isExiting) this.cbs.onActivate?.();
  }

  playExit(onComplete: () => void) {
    if (this.cylinder) this.cylinder.playExit(onComplete);
    else onComplete();
  }

  next() {
    this.cylinder?.next();
  }

  prev() {
    this.cylinder?.prev();
  }

  toggleFlat() {
    this.cylinder?.toggleFlat();
  }

  get flattened() {
    return this.cylinder?.flattened ?? false;
  }

  get isExiting() {
    return this.cylinder?.isExiting ?? false;
  }

  get activeIndex() {
    return this.cylinder?.activeIndex ?? 0;
  }

  private onWheel = (e: WheelEvent) => {
    if (this.mode !== "home" || !this.cylinder) return;
    e.preventDefault();
    this.cylinder.onWheel(e.deltaY);
  };

  private onPointer = (e: PointerEvent) => {
    if (this.mode !== "home" || !this.cylinder) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.cylinder.onPointerMove(nx, ny);
  };

  private onResize = () => {
    this.cylinder?.resize();
  };
}

// Dédup à travers les re-évaluations HMR du module en dev (évite d'empiler des
// contextes WebGL). En prod, simple singleton module-level.
const globalForEngine = globalThis as unknown as { __ssEngine?: TransitionEngine };
export const engine = globalForEngine.__ssEngine ?? (globalForEngine.__ssEngine = new TransitionEngine());
