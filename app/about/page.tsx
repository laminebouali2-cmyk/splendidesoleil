import Image from "next/image";
import { PageDock } from "@/components/PageDock";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "À propos — Splendide Soleil",
};

const FULL = "/opt/IMG_3420.webp";

export default function AboutPage() {
  return (
    <main className="ab">
      {/* Titre serif géant, comme le vrai site */}
      <section className="ab__hero">
        <Reveal as="h1" className="ab__name">
          Splendide
          <br />
          Soleil
        </Reveal>
        <Reveal as="p" className="ab__role" delay={140}>
          (Photographe)
        </Reveal>
      </section>

      {/* Une seule pensée, en grand — parle à l'âme, n'enferme pas */}
      <section className="ab__lead-wrap">
        <Reveal as="p" className="ab__lead">
          Je crois que tout, un jour, finit par briller. Un regard, deux mains
          qui se trouvent, une lumière qui s&apos;en va. Des mariages, des
          familles, des inconnus, le soir qui tombe — je ne fais pas vraiment la
          différence. Je garde seulement ce qui allait disparaître.
        </Reveal>
      </section>

      {/* Image plein cadre : elle EST le fond, le texte vit dessus */}
      <section className="ab__full">
        <Image src={FULL} alt="" fill priority sizes="100vw" className="ab__full-img" />
        <span className="ab__sign">Splendide Soleil</span>
        <p className="ab__line">La lumière passe. Il en reste ceci.</p>
        <span className="ab__mark">©2026</span>
      </section>

      <PageDock name="À propos" />
    </main>
  );
}
