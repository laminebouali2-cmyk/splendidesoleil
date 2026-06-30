"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import { engine } from "@/components/webgl/engine";
import { Dock } from "./Dock";

// Contrôleur de l'accueil. Le canvas WebGL ne lui appartient plus : il vit dans le
// layout (PersistentCanvas) et est piloté par le moteur persistant. Ce composant
// ne fait que : demander l'affichage du cylindre à l'entrée, le cacher à la sortie,
// et brancher les boutons (label / dock) sur les commandes du moteur.
export function HeroCarousel({ onTilt }: { onTilt?: () => void }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [flat, setFlat] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [ready, setReady] = useState(false);

  // Clic sur un panneau : il se déplie (playExit), puis on navigue vers la galerie.
  // L'index courant est lu sur le moteur (source de vérité) → pas de closure périmée.
  const openGallery = () => {
    if (engine.isExiting) return;
    setExiting(true);
    const slug = categories[engine.activeIndex].slug;
    engine.playExit(() => router.push(`/galerie/${slug}`));
  };

  useEffect(() => {
    engine.showCylinder(
      categories.map((c) => c.image),
      {
        onChange: setActive,
        onTilt,
        onReady: () => setReady(true),
        onActivate: openGallery,
      },
    );
    return () => engine.hideCylinder();
    // Montage/démontage uniquement : le moteur gère la persistance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cat = categories[active];

  return (
    <>
      <button
        className={`hero__label${ready ? " hero__label--ready" : ""}${exiting ? " hero__label--exit" : ""}`}
        key={cat.id}
        onClick={openGallery}
      >
        {cat.name}
      </button>
      <Dock
        category={cat}
        flat={flat}
        onOpen={openGallery}
        onPrev={() => engine.prev()}
        onNext={() => engine.next()}
        onToggleFlat={() => {
          engine.toggleFlat();
          setFlat((f) => !f);
        }}
      />
    </>
  );
}
