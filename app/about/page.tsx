import Image from "next/image";
import { AboutDock } from "@/components/AboutDock";
import { Reveal } from "@/components/Reveal";
import { CONTACT } from "@/data/contact";

export const metadata = {
  title: "À propos — Splendide Soleil",
};

const FULL = "/opt/IMG_3420.webp";

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

      {/* Image plein cadre immersive ; le texte et les réseaux sont POSÉS dessus
          (elle fait corps avec la page, comme le vrai site). */}
      <section className="ab__canvas">
        <Image src={FULL} alt="" fill priority sizes="100vw" className="ab__bg-img" />
        <div className="ab__overlay">
          <Reveal as="p" className="ab__text">
            Je photographie ce qui allait disparaître. Un regard, deux mains qui se
            trouvent, le soir qui descend sur une fête — mariages, familles,
            inconnus de passage. La seconde où la lumière dit quelque chose, je la
            garde.
          </Reveal>

          <Reveal className="ab__contact" delay={120}>
            <span className="ab__contact-kicker">Écrivez-moi</span>
            <ul className="ab__contact-list">
              {CONTACT.map((c) => (
                <li key={c.label}>
                  <a
                    className="ab__contact-link"
                    href={c.href}
                    {...(c.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <AboutDock />
    </main>
  );
}
