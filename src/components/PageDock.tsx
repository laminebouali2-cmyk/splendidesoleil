import Link from "next/link";

// Dock présent sur toutes les sous-pages : flèche retour + nom de la page +
// bouton « Accueil ». Même langage visuel que le dock du hero.
export function PageDock({ name }: { name: string }) {
  return (
    <nav className="dock dock--page">
      <Link href="/" className="dock__lead" aria-label="Retour à l'accueil">
        <span className="dock__lead-arrow" aria-hidden>
          ←
        </span>
      </Link>
      <div className="dock__bar">
        <span className="dock__name">{name}</span>
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
