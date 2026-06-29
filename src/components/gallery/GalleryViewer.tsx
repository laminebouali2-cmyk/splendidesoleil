"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface GalleryItem {
  src: string;
  w: number;
  h: number;
}

interface Props {
  items: GalleryItem[];
  name: string;
  tagline: string;
  others: { slug: string; name: string }[];
}

export function GalleryViewer({ items, name, tagline, others }: Props) {
  const [dir, setDir] = useState<"v" | "h">("v");
  const [active, setActive] = useState(0); // 0 = carte titre, 1..N = images
  const [lightbox, setLightbox] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const total = items.length;

  // Suivre la diapo active (pour le compteur)
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { root, threshold: 0.55 },
    );
    slideRefs.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, [items, dir]);

  // Fermer la lightbox à l'Échap
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const goTo = (slide: number) => {
    const clamped = Math.min(slideRefs.current.length - 1, Math.max(0, slide));
    slideRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  };

  return (
    <>
      <div ref={scrollerRef} className={`gv gv--${dir}`}>
        {/* Carte titre */}
        <section
          className="gv__slide gv__title"
          data-i={0}
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
        >
          <p className="gv__kicker">Galerie</p>
          <h1 className="gv__h1">{name}</h1>
          <p className="gv__tag">{tagline}</p>
          <span className="gv__hint">{dir === "v" ? "Défilez ↓" : "Défilez →"}</span>
        </section>

        {items.map((it, i) => (
          <figure
            key={it.src}
            className="gv__slide"
            data-i={i + 1}
            ref={(el) => {
              slideRefs.current[i + 1] = el;
            }}
          >
            <button
              className="gv__imgbtn"
              onClick={() => setLightbox(i)}
              aria-label={`Agrandir l'image ${i + 1}`}
            >
              <Image
                src={it.src}
                alt={name}
                width={it.w}
                height={it.h}
                className="gv__img"
                sizes="(max-width: 720px) 92vw, 66vw"
                priority={i < 2}
              />
            </button>
          </figure>
        ))}

        {/* Fin : continuer ailleurs */}
        <section
          className="gv__slide gv__end"
          data-i={total + 1}
          ref={(el) => {
            slideRefs.current[total + 1] = el;
          }}
        >
          <p className="gv__kicker">Continuer</p>
          <div className="gv__end-links">
            {others.map((c) => (
              <Link key={c.slug} href={`/galerie/${c.slug}`} className="gv__end-link">
                {c.name}
              </Link>
            ))}
            <Link href="/" className="gv__end-link gv__end-home">
              Accueil
            </Link>
          </div>
        </section>
      </div>

      {/* Dock : retour, nom, compteur, préc/suiv, sens de défilement */}
      <nav className="dock dock--gallery">
        <Link href="/" className="dock__lead" aria-label="Retour à l'accueil">
          <span className="dock__lead-arrow">←</span>
        </Link>
        <div className="dock__bar">
          <span className="dock__name">{name}</span>
          <span className="dock__count">
            {active === 0
              ? `— / ${String(total).padStart(2, "0")}`
              : active > total
                ? "fin"
                : `${String(active).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
          </span>
        </div>
        <button className="dock__arrow" onClick={() => goTo(active - 1)} aria-label="Précédent">
          {dir === "v" ? "↑" : "←"}
        </button>
        <button className="dock__arrow" onClick={() => goTo(active + 1)} aria-label="Suivant">
          {dir === "v" ? "↓" : "→"}
        </button>
        <button
          className={`dock__round${dir === "h" ? " dock__round--active" : ""}`}
          onClick={() => setDir((d) => (d === "v" ? "h" : "v"))}
          aria-label="Changer le sens de défilement"
          aria-pressed={dir === "h"}
        >
          <span className="dock__round-icon" />
        </button>
      </nav>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="lb" onClick={() => setLightbox(null)} role="dialog" aria-modal>
          <Image
            src={items[lightbox].src}
            alt={name}
            width={items[lightbox].w}
            height={items[lightbox].h}
            className="lb__img"
            sizes="100vw"
          />
          <button className="lb__close" aria-label="Fermer">
            ×
          </button>
        </div>
      )}
    </>
  );
}
