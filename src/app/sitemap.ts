import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/products";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3006";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/recherche`, lastModified: now, priority: 0.5 },
    { url: `${BASE}/comparer`, lastModified: now, priority: 0.5 },
  ];
  const categories = getCategories().map((c) => ({ url: `${BASE}/categorie/${c.slug}`, lastModified: now, priority: 0.8 }));
  const products = getAllProducts().map((p) => ({ url: `${BASE}/produit/${p.asin}`, lastModified: now, priority: 0.7 }));
  return [...staticRoutes, ...categories, ...products];
}
