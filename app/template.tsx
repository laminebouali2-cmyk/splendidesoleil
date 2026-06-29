"use client";

import { usePathname } from "next/navigation";

// Fondu doux à l'entrée de chaque sous-page (l'accueil garde sa propre intro).
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className={pathname === "/" ? undefined : "page-fade"}>{children}</div>;
}
