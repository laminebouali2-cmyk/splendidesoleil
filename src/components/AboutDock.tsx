"use client";

import Link from "next/link";
import { useState } from "react";

// Réseaux. NOTE : remplacer par les vrais comptes de la cliente (handles fournis plus tard).
const SOCIALS = [
  { label: "Email", href: "mailto:contact@splendide-soleil.fr", ext: false },
  { label: "Instagram", href: "#", ext: true },
  { label: "Facebook", href: "#", ext: true },
];

// Dock de la page About. Comme le vrai site : ← retour, pilule avec le nom de la page,
// et un bouton qui DÉPLIE le contact (la pilule devient « Contact » et les réseaux
// s'affichent au-dessus). Re-cliquer referme.
export function AboutDock({ thumb }: { thumb: string }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <nav className="dock dock--page dock--about">
      <div className={`ab-contact${open ? " ab-contact--open" : ""}`} aria-hidden={!open}>
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            className="ab-contact__link"
            href={s.href}
            {...(s.ext ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {s.label}
          </a>
        ))}
      </div>

      <Link href="/" className="dock__lead" aria-label="Retour à l'accueil">
        <span className="dock__lead-arrow" aria-hidden>
          ←
        </span>
      </Link>

      <button className="dock__bar dock__bar--btn" onClick={toggle} aria-expanded={open}>
        <span className="dock__thumb" style={{ backgroundImage: `url(${thumb})` }} />
        <span className="dock__name">{open ? "Contact" : "À propos"}</span>
      </button>

      <button
        className="dock__round dock__round--home"
        onClick={toggle}
        aria-label={open ? "Fermer le contact" : "Voir le contact"}
        aria-pressed={open}
      >
        <span className="dock__toggle-glyph">{open ? "×" : "="}</span>
      </button>
    </nav>
  );
}
