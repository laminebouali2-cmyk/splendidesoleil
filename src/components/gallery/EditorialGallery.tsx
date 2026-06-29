"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export interface GalleryItem {
  src: string;
  w: number;
  h: number;
}

export function EditorialGallery({
  items,
  category,
}: {
  items: GalleryItem[];
  category: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const figs = Array.from(root.querySelectorAll(".ed-fig"));
    if (typeof IntersectionObserver === "undefined") {
      figs.forEach((f) => f.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );
    figs.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, [items]);

  return (
    <div className="ed" ref={rootRef}>
      {items.map((it, i) => (
        <figure className={`ed-fig ed-fig--p${i % 7}`} key={it.src}>
          <div className="ed-fig__media">
            <Image
              src={it.src}
              alt={`${category} — ${i + 1}`}
              width={it.w}
              height={it.h}
              sizes="(max-width: 720px) 92vw, (max-width: 1100px) 60vw, 46vw"
              className="ed-fig__img"
              loading={i < 2 ? "eager" : "lazy"}
            />
            <span className="ed-fig__veil" aria-hidden />
          </div>
          <figcaption className="ed-cap">
            {category} — {String(i + 1).padStart(2, "0")}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
