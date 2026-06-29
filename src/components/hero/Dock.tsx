"use client";

import type { Category } from "@/data/categories";

interface DockProps {
  category: Category;
  onPrev: () => void;
  onNext: () => void;
  onToggleFlat: () => void;
  onOpen: () => void;
  flat: boolean;
}

export function Dock({ category, onPrev, onNext, onToggleFlat, onOpen, flat }: DockProps) {
  return (
    <div className="dock">
      <div className="dock__bar">
        <button
          className="dock__open"
          onClick={onOpen}
          aria-label={`Voir la galerie ${category.name}`}
        >
          <span
            className="dock__thumb"
            style={{ backgroundImage: `url(${category.image})` }}
          />
          <span className="dock__name">{category.name}</span>
        </button>
        <button className="dock__arrow" onClick={onPrev} aria-label="Précédent">
          &larr;
        </button>
        <button className="dock__arrow" onClick={onNext} aria-label="Suivant">
          &rarr;
        </button>
      </div>
      <button
        className={`dock__round${flat ? " dock__round--active" : ""}`}
        onClick={onToggleFlat}
        aria-label={flat ? "Reformer le bracelet" : "Étaler à l'horizontal"}
        aria-pressed={flat}
      >
        {flat ? (
          // 3 barres verticales décalées vers la droite (mode colonnes)
          <svg className="dock__round-svg" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="3.4" y="5.5" width="1.8" height="9" rx="0.9" fill="currentColor" />
            <rect x="8.2" y="6.5" width="1.8" height="9" rx="0.9" fill="currentColor" />
            <rect x="13" y="7.5" width="1.8" height="9" rx="0.9" fill="currentColor" />
          </svg>
        ) : (
          // rond en 3 parties (l'anneau / le tambour)
          <svg className="dock__round-svg" viewBox="0 0 20 20" aria-hidden="true">
            <circle
              cx="10"
              cy="10"
              r="6.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeDasharray="10.6 3.65"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
