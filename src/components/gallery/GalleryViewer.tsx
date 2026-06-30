"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { engine } from "@/components/webgl/engine";

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

  // Les éclats hérités de la transition (canvas persistant) flottent autour de la
  // galerie et s'effacent quand on défile. On pilote leur fondu via le scroll.
  useEffect(() => {
    const root = scrollerRef.current;
    engine.enterGallery();
    const onScroll = () => {
      if (!root) return;
      const max = Math.max(1, window.innerHeight * 0.7);
      engine.setScrollFade((root.scrollTop + root.scrollLeft) / max);
    };
    root?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root?.removeEventListener("scroll", onScroll);
      engine.leaveGallery();
    };
  }, []);

  // Reveal au scroll : chaque image apparaît (fondu + montée) quand elle entre en vue
  // (comme le vrai site : les images se révèlent au passage).
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { root, threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    slideRefs.current.forEach((s, i) => {
      if (s && i >= 1 && i <= total) io.observe(s);
    });
    return () => io.disconnect();
  }, [items, dir, total]);

  // Lightbox : Échap ferme, ←/→ naviguent ; on masque le « Contact » du header.
  useEffect(() => {
    if (lightbox === null) return;
    document.body.classList.add("lb-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight") setLightbox((l) => (l === null ? l : (l + 1) % total));
      else if (e.key === "ArrowLeft") setLightbox((l) => (l === null ? l : (l - 1 + total) % total));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("lb-open");
    };
  }, [lightbox, total]);

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
            className="gv__slide gv__fig reveal"
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
          aria-label={dir === "v" ? "Défilement horizontal" : "Défilement vertical"}
          aria-pressed={dir === "h"}
        >
          {dir === "h" ? (
            // mode horizontal actif → 3 colonnes
            <svg className="dock__round-svg" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3.6" y="4" width="2" height="12" rx="1" fill="currentColor" />
              <rect x="9" y="4" width="2" height="12" rx="1" fill="currentColor" />
              <rect x="14.4" y="4" width="2" height="12" rx="1" fill="currentColor" />
            </svg>
          ) : (
            // mode vertical actif → 3 rangées
            <svg className="dock__round-svg" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="4" y="4.6" width="12" height="2" rx="1" fill="currentColor" />
              <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor" />
              <rect x="4" y="13.4" width="12" height="2" rx="1" fill="currentColor" />
            </svg>
          )}
        </button>
      </nav>

      {/* Lightbox : flèches grises pour swiper, fond pour fermer. */}
      {lightbox !== null && (
        <div className="lb" onClick={() => setLightbox(null)} role="dialog" aria-modal>
          <Image
            src={items[lightbox].src}
            alt={name}
            width={items[lightbox].w}
            height={items[lightbox].h}
            className="lb__img"
            sizes="100vw"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="lb__nav lb__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((l) => (l === null ? l : (l - 1 + total) % total));
            }}
            aria-label="Image précédente"
          >
            ←
          </button>
          <button
            className="lb__nav lb__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((l) => (l === null ? l : (l + 1) % total));
            }}
            aria-label="Image suivante"
          >
            →
          </button>
          <button className="lb__close" aria-label="Fermer">
            ×
          </button>
        </div>
      )}
    </>
  );
}
