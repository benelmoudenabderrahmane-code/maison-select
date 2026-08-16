import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number, currency = "EUR"): string {
  if (currency === "EUR") return eur.format(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    value,
  );
}

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact" });

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
