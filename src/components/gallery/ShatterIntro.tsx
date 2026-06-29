"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface Shard {
  clip: string;
  crack: string; // transform fissuré (quasi en place)
  fall: string; // transform explosé (vol 3D + chute)
  delay: number;
}

// Fracture irrégulière façon verre : grille de sommets « jitterés » → cellules
// quadrilatères de tailles variées. Déterministe (pas de mismatch d'hydratation).
// Les transforms sont calculés ICI en unités dures (vw/vh/px/deg), pas via des
// custom-properties CSS : sous Turbopack, un transform construit avec var() non
// enregistrées n'était pas appliqué → les éclats ne bougeaient pas.
function makeShards(seed: number): Shard[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const COLS = 8;
  const ROWS = 6;
  const V: { x: number; y: number }[][] = [];
  for (let j = 0; j <= ROWS; j++) {
    V[j] = [];
    for (let i = 0; i <= COLS; i++) {
      let x = (i / COLS) * 100;
      let y = (j / ROWS) * 100;
      if (i > 0 && i < COLS) x += (rnd() * 2 - 1) * (100 / COLS) * 0.46;
      if (j > 0 && j < ROWS) y += (rnd() * 2 - 1) * (100 / ROWS) * 0.46;
      V[j][i] = { x, y };
    }
  }
  const shards: Shard[] = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = V[j][i];
      const b = V[j][i + 1];
      const c = V[j + 1][i + 1];
      const d = V[j + 1][i];
      const cx = (a.x + b.x + c.x + d.x) / 4;
      const cy = (a.y + b.y + c.y + d.y) / 4;
      const dx = cx - 50;
      const dy = cy - 50;
      const len = Math.hypot(dx, dy) || 1;
      const ox = dx / len;
      const oy = dy / len;
      // rotations modérées : les éclats culbutent sans jamais passer de profil
      const oz = Math.round((rnd() * 2 - 1) * 150);
      const rx = Math.round((rnd() * 2 - 1) * 45);
      const ry = Math.round((rnd() * 2 - 1) * 45);
      const rot = Math.round((rnd() * 2 - 1) * 60);
      // chute gravitaire : écart latéral modéré, descente verticale dominante
      const dxv = ox * 14 + (rnd() * 2 - 1) * 4;
      const dyv = 55 + rnd() * 50 + oy * 8;
      const f = (n: number) => n.toFixed(2);
      shards.push({
        clip: `polygon(${f(a.x)}% ${f(a.y)}%, ${f(b.x)}% ${f(b.y)}%, ${f(c.x)}% ${f(c.y)}%, ${f(d.x)}% ${f(d.y)}%)`,
        crack: `translate3d(${f(ox * 0.5)}vw, ${f(oy * 0.5)}vh, 0px)`,
        fall: `translate3d(${f(dxv)}vw, ${f(dyv)}vh, ${oz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg)`,
        delay: Math.round(rnd() * 150),
      });
    }
  }
  return shards;
}

export function ShatterIntro({ src, label }: { src: string; label?: string }) {
  const shards = useMemo(() => makeShards(src.length * 2654435761), [src]);
  const [phase, setPhase] = useState<"crack" | "fall" | "gone">("crack");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }
    let fell = false;
    const fall = () => {
      if (fell) return;
      fell = true;
      setPhase("fall");
      window.setTimeout(() => setPhase("gone"), 2050);
    };
    // on voit le verre fissuré ~1 s, puis il éclate (le 1er scroll/clic l'accélère)
    const auto = window.setTimeout(fall, 1000);
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener("wheel", fall, opts);
    window.addEventListener("touchmove", fall, opts);
    window.addEventListener("pointerdown", fall);
    window.addEventListener("keydown", fall);
    return () => {
      window.clearTimeout(auto);
      window.removeEventListener("wheel", fall);
      window.removeEventListener("touchmove", fall);
      window.removeEventListener("pointerdown", fall);
      window.removeEventListener("keydown", fall);
    };
  }, [src]);

  if (phase === "gone") return null;

  const exploding = phase === "fall";

  return (
    <div className={`shatter ${exploding ? "is-fall" : "is-crack"}`} aria-hidden>
      <div className="shatter__flash" />
      {shards.map((sh, i) => (
        <span
          key={i}
          className="shatter__shard"
          style={
            {
              backgroundImage: `url(${src})`,
              clipPath: sh.clip,
              transform: exploding ? sh.fall : sh.crack,
              opacity: exploding ? 0 : 1,
              transition: `transform 1.7s cubic-bezier(0.45, 0.05, 0.8, 0.7) ${sh.delay}ms, opacity 0.55s ease ${1150 + sh.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
      {label && <span className="shatter__label">{label}</span>}
    </div>
  );
}
