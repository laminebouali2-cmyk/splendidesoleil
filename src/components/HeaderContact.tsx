"use client";

import { useEffect, useState } from "react";
import { CONTACT } from "@/data/contact";

// « Contact » discret en haut à droite, présent sur TOUTES les pages (monté dans le
// layout). Un clic ouvre un voile doux listant les canaux (Email / Instagram /
// Facebook / WhatsApp). Sobre, sans icône criarde ni bulle flottante.
export function HeaderContact() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button className="site-contact" onClick={() => setOpen(true)}>
        Contact
      </button>

      <div
        className={`contact-veil${open ? " contact-veil--open" : ""}`}
        onClick={() => setOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="contact-veil__panel" onClick={(e) => e.stopPropagation()}>
          <p className="contact-veil__kicker">Écrivez-moi</p>
          <ul className="contact-veil__list">
            {CONTACT.map((c) => (
              <li key={c.label}>
                <a
                  className="contact-veil__link"
                  href={c.href}
                  {...(c.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          <button className="contact-veil__close" onClick={() => setOpen(false)}>
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}
