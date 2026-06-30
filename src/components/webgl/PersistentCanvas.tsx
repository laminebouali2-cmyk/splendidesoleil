"use client";

import { useEffect, useRef } from "react";
import { engine } from "./engine";

// Le canvas WebGL unique, monté dans le root layout (hors de `{children}`) → il
// persiste à travers toutes les routes. C'est le seul endroit qui crée le canvas ;
// le moteur (singleton) le pilote. Pas de cleanup destructif : le moteur doit
// survivre à la navigation (et au double-mount StrictMode en dev).
export function PersistentCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) engine.init(ref.current);
  }, []);

  return <canvas ref={ref} className="webgl-stage" onClick={() => engine.activate()} />;
}
