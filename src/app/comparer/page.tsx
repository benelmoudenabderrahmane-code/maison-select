import type { Metadata } from "next";
import { Compare } from "@/components/Compare";
import { SectionHeading } from "@/components/SectionHeading";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Comparateur de produits",
  description: "Comparez jusqu'à 4 produits côte à côte : prix, note, avis et caractéristiques.",
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const { add } = await searchParams;
  const products = getAllProducts();
  const requested = (add ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const initial = requested.length ? requested : products.slice(0, 2).map((p) => p.asin);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Comparer" title="Comparez avant de choisir" description="Jusqu'à 4 produits côte à côte. Les meilleures valeurs mises en avant." className="mb-10" />
      <Compare products={products} initial={initial} />
    </section>
  );
}
