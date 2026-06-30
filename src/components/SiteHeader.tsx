import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/about" className="site-header__brand">
        Splendide Soleil
      </Link>
      <span className="site-header__sub">gardienne de lumière</span>
    </header>
  );
}
