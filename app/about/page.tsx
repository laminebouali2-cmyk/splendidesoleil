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
          Gardienne de lumière
        </Reveal>
      </section>

      {/* Texte sensible + réseaux écrits directement sur la page */}
      <section className="ab__story">
        <Reveal as="p" className="ab__text">
          Je crois que tout, un jour, finit par briller. Un regard, deux mains qui
          se trouvent, le soir qui descend sur une fête. Mariages, familles,
          inconnus de passage — je ne fais pas vraiment la différence. Je cherche
          la seconde où la lumière dit quelque chose, et je la garde avant
          qu&apos;elle ne s&apos;efface.
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
      </section>

      {/* L'image émerge d'un fond couleur tiré d'elle-même (bord fondu) → intégrée */}
      <section className="ab__full">
        <Image src={FULL} alt="" fill priority sizes="100vw" className="ab__full-img" />
      </section>

      <AboutDock />
    </main>
  );
}
