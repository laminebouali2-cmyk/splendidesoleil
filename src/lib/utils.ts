import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — merge conditional class names and resolve Tailwind conflicts.
 * Utilisé par les composants générés pendant le clone.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
