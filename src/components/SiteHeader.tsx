import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <h1 className="site-header__title">
        <Link href="/about" className="site-header__brand">
          Splendide Soleil
        </Link>
        <span className="site-header__role">, French photographer</span>
      </h1>
    </header>
  );
}
