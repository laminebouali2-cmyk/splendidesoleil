"use client";

import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";
import { HeroCarousel } from "./hero/HeroCarousel";

// Le loader « 0 → 100 % » ne joue qu'à la PREMIÈRE visite. Au retour sur
// l'accueil (navigation client), on ne montre qu'une mini-animation rapide.
let hasIntroPlayed = false;

type Phase = "loading" | "revealing" | "done";

export function Experience() {
  const isReturn = useRef(hasIntroPlayed).current;
  const duration = isReturn ? 620 : 2300;

  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [titleIn, setTitleIn] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    hasIntroPlayed = true;
  }, []);

  // Le hero est une expérience plein écran fixe : on verrouille le scroll de la page
  // (restauré au démontage → les pages /about et /galerie scrollent normalement).
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  // Compteur du loader (tourne SEUL, sans le WebGL → pas de starvation rAF).
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      setProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("revealing");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      startRef.current = null;
    };
  }, [duration]);

  // Pendant le fondu du loader, on laisse le WebGL booter (textures masquées).
  useEffect(() => {
    if (phase !== "revealing") return;
    const id = window.setTimeout(() => setPhase("done"), 950);
    // Filet de sécurité : si l'intro WebGL ne se déclenche pas (textures KO),
    // on révèle quand même le titre après un délai max.
    const fallback = window.setTimeout(() => setTitleIn(true), 6000);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(fallback);
    };
  }, [phase]);

  const mountHero = phase !== "loading";

  const R = 260;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress / 100);

  return (
    <>
      {phase !== "done" && (
        <div
          className={`loader${isReturn ? " loader--mini" : ""}${phase === "revealing" ? " loader--hidden" : ""}`}
        >
          {isReturn ? (
            <span className="loader__pulse" aria-hidden="true" />
          ) : (
            <>
              <svg className="loader__ring" viewBox="0 0 700 700" aria-hidden="true">
                <circle
                  cx="350"
                  cy="350"
                  r={R}
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.2"
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                  transform="rotate(-90 350 350)"
                />
              </svg>
              <div className="loader__center">
                <div className="loader__name">Splendide Soleil</div>
                <div className="loader__pct">{progress}%</div>
              </div>
            </>
          )}
        </div>
      )}

      <main className="hero">
        <SiteHeader />
        <div
          className={`hero__title${titleIn ? " hero__title--in" : ""}`}
          aria-hidden="true"
        >
          Portfolio
        </div>
        {mountHero && <HeroCarousel onTilt={() => setTitleIn(true)} />}
      </main>
    </>
  );
}
