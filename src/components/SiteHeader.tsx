import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <h1 className="site-header__title">
        <Link href="/about" className="site-header__link">
          Splendide Soleil
        </Link>{" "}
        gardienne de lumière.
      </h1>
    </header>
  );
}
