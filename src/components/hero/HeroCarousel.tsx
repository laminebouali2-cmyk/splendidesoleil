"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import { CarouselScene } from "./CarouselScene";
import { Dock } from "./Dock";

export function HeroCarousel({ onTilt }: { onTilt?: () => void }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CarouselScene | null>(null);
  const [active, setActive] = useState(0);
  const [flat, setFlat] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [ready, setReady] = useState(false);

  // Clic sur un panneau : il se déplie en plein écran (playExit), puis on navigue
  // vers la galerie qui enchaîne avec l'explosion en fragments.
  const openGallery = () => {
    if (exiting) return;
    setExiting(true);
    const slug = categories[active].slug;
    const scene = sceneRef.current;
    if (scene) scene.playExit(() => router.push(`/galerie/${slug}`));
    else router.push(`/galerie/${slug}`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new CarouselScene(canvas, {
      images: categories.map((c) => c.image),
      onChange: setActive,
      onTilt,
      onReady: () => setReady(true),
    });
    sceneRef.current = scene;
    scene.start();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scene.onWheel(e.deltaY);
    };
    const onPointer = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      scene.onPointerMove(nx, ny);
    };
    const onResize = () => scene.resize();

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      scene.dispose();
    };
  }, []);

  const cat = categories[active];

  return (
    <>
      <canvas
        ref={canvasRef}
        className="hero__canvas hero__canvas--clickable"
        onClick={openGallery}
      />
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
        onPrev={() => sceneRef.current?.prev()}
        onNext={() => sceneRef.current?.next()}
        onToggleFlat={() => {
          sceneRef.current?.toggleFlat();
          setFlat((f) => !f);
        }}
      />
    </>
  );
}
