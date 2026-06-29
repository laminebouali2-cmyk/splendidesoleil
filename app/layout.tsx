import type { Metadata } from "next";
import { editorialOld, neueMontreal } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splendide Soleil — Photographe de mariage",
  description:
    "Splendide Soleil, photographe de mariage. Mariages, nature et lumière du soir, dans un esprit poétique et solaire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${editorialOld.variable} ${neueMontreal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
