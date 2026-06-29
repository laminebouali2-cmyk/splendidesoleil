import { notFound } from "next/navigation";
import { categories, getCategory } from "@/data/categories";
import dimsData from "@/data/image-dims.json";
import { GalleryViewer, type GalleryItem } from "@/components/gallery/GalleryViewer";
import { ShatterIntro } from "@/components/gallery/ShatterIntro";

const dims = dimsData as Record<string, { w: number; h: number }>;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  return { title: cat ? `${cat.name} — Splendide Soleil` : "Galerie" };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const items: GalleryItem[] = cat.gallery.map((src) => ({
    src,
    w: dims[src]?.w ?? 1200,
    h: dims[src]?.h ?? 1500,
  }));
  const others = categories
    .filter((c) => c.slug !== cat.slug)
    .map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <main className="gal gal--viewer">
      <ShatterIntro src={cat.image} label={cat.name} />
      <GalleryViewer items={items} name={cat.name} tagline={cat.tagline} others={others} />
    </main>
  );
}
