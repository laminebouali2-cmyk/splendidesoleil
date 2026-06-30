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

import { gsap } from "gsap";
import { CarouselScene } from "@/components/hero/CarouselScene";
import { ShatterMesh } from "./ShatterMesh";

type Mode = "idle" | "home";

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
  private mode: Mode = "idle";
  private cbs: EngineCallbacks = {};
  private inputBound = false;

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
    window.addEventListener("keydown", this.onKey);
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

  // DEBUG (brique 3) : déclenche la fissure isolée sur le panneau focus (touche F).
  // Cache le cylindre pour voir l'éclat sur fond blanc. Sera remplacé par le flux
  // clic→galerie en brique 4.
  debugShatter() {
    if (!this.cylinder) return;
    this.ensureShatter();
    const s = this.shatter;
    if (!s) return;
    this.cylinder.hide();
    s.setTexture(this.cylinder.getFocusTexture());
    s.opacity = 1;
    s.floatAmount = 0;
    s.progress = 0;
    s.show();
    gsap.killTweensOf(s.material.uniforms.uProgress);
    gsap.to(s.material.uniforms.uProgress, { value: 1, duration: 1.05, ease: "power3.inOut" });
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "f" || e.key === "F") this.debugShatter();
  };

  // L'accueil prend la main : crée le cylindre à la 1re visite, sinon le ré-affiche
  // (rejoue l'intro). Les callbacks sont relues en direct via `this.cbs`.
  showCylinder(images: string[], cbs: EngineCallbacks) {
    this.cbs = cbs;
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
  hideCylinder() {
    this.mode = "idle";
    this.applyMode();
    this.cylinder?.hide();
  }

  private applyMode() {
    const c = this.canvas;
    if (!c) return;
    c.classList.toggle("webgl-stage--home", this.mode === "home");
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
