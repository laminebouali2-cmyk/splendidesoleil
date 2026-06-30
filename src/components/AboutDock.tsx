import Link from "next/link";

// Dock simple de la page About : retour + nom + accueil. Le contact vit désormais
// sur la page (réseaux écrits) et dans le « Contact » global du header.
export function AboutDock() {
  return (
    <nav className="dock dock--page">
      <Link href="/" className="dock__lead" aria-label="Retour à l'accueil">
        <span className="dock__lead-arrow" aria-hidden>
          ←
        </span>
      </Link>
      <div className="dock__bar">
        <span className="dock__name">À propos</span>
      </div>
      <Link href="/" className="dock__round dock__round--home" aria-label="Accueil">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </nav>
  );
}
