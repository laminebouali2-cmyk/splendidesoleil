export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string; // image « hero » du bracelet
  gallery: string[]; // toutes les photos de la galerie
}

// Photos réelles de la cliente (Splendide Soleil), classées en 3 univers cohérents :
// Mariages (sa prestation), Nature (paysages/mer/fleurs/cygnes), Lumière (golden hour).
export const categories: Category[] = [
  {
    id: "mariages",
    slug: "mariages",
    name: "Mariages",
    tagline: "Deux familles, un même jour",
    image: "/opt/IMG_3316.webp",
    gallery: [
      "/opt/IMG_3316.webp",
      "/opt/IMG_3317.webp",
      "/opt/IMG_3315.webp",
      "/opt/IMG_3375.webp",
      "/opt/IMG_3376.webp",
      "/opt/IMG_3377.webp",
      "/opt/IMG_3378.webp",
      "/opt/IMG_3318.webp",
      "/opt/IMG_3393.webp",
      "/opt/IMG_3394.webp",
      "/opt/IMG_3395.webp",
      "/opt/IMG_3397.webp",
      "/opt/IMG_3398.webp",
      "/opt/IMG_3399.webp",
      "/opt/IMG_3401.webp",
      "/opt/IMG_3413.webp",
    ],
  },
  {
    id: "nature",
    slug: "nature",
    name: "Nature",
    tagline: "La mer, les arbres, le silence",
    image: "/opt/IMG_3368.webp",
    gallery: [
      "/opt/IMG_3406.webp",
      "/opt/IMG_3408.webp",
      "/opt/IMG_3410.webp",
      "/opt/IMG_3409.webp",
      "/opt/IMG_3425.webp",
      "/opt/IMG_3426.webp",
      "/opt/IMG_3428.webp",
      "/opt/IMG_3430.webp",
      "/opt/IMG_3368.webp",
      "/opt/IMG_3389.webp",
      "/opt/IMG_3390.webp",
      "/opt/IMG_3391.webp",
      "/opt/IMG_3392.webp",
      "/opt/IMG_3384.webp",
      "/opt/IMG_3385.webp",
      "/opt/IMG_3416.webp",
      "/opt/IMG_3417.webp",
      "/opt/IMG_3418.webp",
      "/opt/IMG_3422.webp",
      "/opt/IMG_3396.webp",
      "/opt/IMG_3400.webp",
      "/opt/IMG_3402.webp",
      "/opt/IMG_3403.webp",
      "/opt/IMG_3404.webp",
      "/opt/IMG_3432.webp",
      "/opt/IMG_3370.webp",
      "/opt/IMG_3371.webp",
    ],
  },
  {
    id: "lumiere",
    slug: "lumiere",
    name: "Lumière",
    tagline: "Quand le jour s'en va",
    image: "/opt/IMG_3386.webp",
    gallery: [
      "/opt/IMG_3386.webp",
      "/opt/IMG_3380.webp",
      "/opt/IMG_3381.webp",
      "/opt/IMG_3382.webp",
      "/opt/IMG_3383.webp",
      "/opt/IMG_3387.webp",
      "/opt/IMG_3415.webp",
      "/opt/IMG_3423.webp",
      "/opt/IMG_3436.webp",
      "/opt/IMG_3439.webp",
      "/opt/IMG_3456.webp",
      "/opt/IMG_3457.webp",
      "/opt/IMG_3369.webp",
      "/opt/IMG_3427.webp",
    ],
  },
];

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);
