import Image from "next/image";
import { AboutDock } from "@/components/AboutDock";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "À propos — Splendide Soleil",
};

const FULL = "/opt/IMG_3420.webp";
const THUMB = "/opt/IMG_3386.webp";

// Minimal, comme le vrai site : nom serif géant + (Photographe), puis une image
// intégrée plein cadre. Le dock déplie le contact (réseaux).
export default function AboutPage() {
  return (
    <main className="ab">
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

      <section className="ab__full">
        <Image src={FULL} alt="" fill priority sizes="100vw" className="ab__full-img" />
      </section>

      <AboutDock thumb={THUMB} />
    </main>
  );
}
