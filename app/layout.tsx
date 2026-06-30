import type { Metadata } from "next";
import { editorialOld, neueMontreal } from "./fonts";
import { PersistentCanvas } from "@/components/webgl/PersistentCanvas";
import { HeaderContact } from "@/components/HeaderContact";
import "./globals.css";

const SITE_URL = "https://splendide-soleil.vercel.app";
const OG_DESC =
  "Photographe — mariages, portraits et lumière du soir, dans un esprit poétique et solaire.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Splendide Soleil — French photographer",
  description: OG_DESC,
  openGraph: {
    title: "Splendide Soleil — French photographer",
    description: OG_DESC,
    url: SITE_URL,
    siteName: "Splendide Soleil",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/opt/IMG_3386.webp",
        width: 2000,
        height: 1334,
        alt: "Splendide Soleil — photographe, lumière du soir",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Splendide Soleil — French photographer",
    description: OG_DESC,
    images: ["/opt/IMG_3386.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${editorialOld.variable} ${neueMontreal.variable}`}>
      <body>
        <PersistentCanvas />
        <HeaderContact />
        {children}
      </body>
    </html>
  );
}
