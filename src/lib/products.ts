import featured from "@/data/featuredProducts.json";
import custom from "@/data/customProducts.json";
import categoriesData from "@/data/categories.json";
import reviewsData from "@/data/reviews.json";
import type { Category, Product, Review } from "@/lib/types";

/**
 * Source of truth = featuredProducts.json, overlaid by customProducts.json
 * (admin-created/edited). Merge happens once at module load, per spec.
 */
function mergeProducts(): Product[] {
  const base = featured as Product[];
  const overrides = custom as Product[];
  const byAsin = new Map<string, Product>();
  for (const p of base) byAsin.set(p.asin, p);
  for (const p of overrides) byAsin.set(p.asin, { ...byAsin.get(p.asin), ...p });
  return Array.from(byAsin.values());
}

const ALL = mergeProducts();

export function getAllProducts(): Product[] {
  return ALL;
}

export function getProductByAsin(asin: string): Product | undefined {
  return ALL.find((p) => p.asin === asin);
}

export function getProductBySlug(slug: string): Product | undefined {
  return ALL.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return ALL.filter((p) => p.category === slug);
}

export function getFeaturedProducts(): Product[] {
  return ALL.filter((p) => p.featured);
}

export function getDeals(): Product[] {
  return ALL.filter((p) => p.oldPrice && p.oldPrice > p.price).sort(
    (a, b) =>
      (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!,
  );
}

export function getRelatedProducts(asin: string, limit = 4): Product[] {
  const product = getProductByAsin(asin);
  if (!product) return ALL.slice(0, limit);
  return ALL.filter((p) => p.asin !== asin && p.category === product.category)
    .concat(ALL.filter((p) => p.asin !== asin && p.category !== product.category))
    .slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL.map((p) => {
    const haystack = [p.title, p.brand, p.category, ...(p.tags ?? [])]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (p.title.toLowerCase().includes(q)) score += 5;
    if (p.brand.toLowerCase().includes(q)) score += 3;
    if (haystack.includes(q)) score += 1;
    for (const word of q.split(/\s+/)) if (haystack.includes(word)) score += 1;
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function getCategories(): Category[] {
  return (categoriesData as Category[]).slice().sort((a, b) => a.order - b.order);
}

export function getCategory(slug: string): Category | undefined {
  return (categoriesData as Category[]).find((c) => c.slug === slug);
}

export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of ALL) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
}

export function getReviews(): Review[] {
  return reviewsData as Review[];
}

export function getBrands(): string[] {
  return Array.from(new Set(ALL.map((p) => p.brand))).sort();
}

export function getPriceRange(): { min: number; max: number } {
  const prices = ALL.map((p) => p.price);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}
