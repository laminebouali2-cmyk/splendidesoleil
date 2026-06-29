import localFont from "next/font/local";

// Polices d'origine (PP — commerciales). Utilisées pour la démo de fidélité.
// Pour une mise en ligne réelle : licences requises ou substitution.
export const editorialOld = localFont({
  src: "./fonts/EditorialOld-Regular.woff2",
  variable: "--font-editorial",
  weight: "400",
  display: "swap",
});

export const neueMontreal = localFont({
  src: [
    { path: "./fonts/NeueMontreal-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NeueMontreal-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-neue",
  display: "swap",
});
