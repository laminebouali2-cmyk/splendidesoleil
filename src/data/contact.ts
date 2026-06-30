export interface ContactChannel {
  label: string;
  href: string;
  ext: boolean; // lien externe (nouvel onglet)
}

// Canaux de contact. NOTE : remplacer par les VRAIS comptes de la cliente
// (handle Instagram, page Facebook, numéro WhatsApp `https://wa.me/33…`, email).
export const CONTACT: ContactChannel[] = [
  { label: "Email", href: "mailto:contact@splendide-soleil.fr", ext: false },
  { label: "Instagram", href: "#", ext: true },
  { label: "Facebook", href: "#", ext: true },
  { label: "WhatsApp", href: "#", ext: true },
];
