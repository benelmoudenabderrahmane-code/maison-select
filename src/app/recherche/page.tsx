import type { Metadata } from "next";
import { SearchBar } from "@/components/SearchBar";
import { CatalogView } from "@/components/CatalogView";
import { Reveal } from "@/components/Reveal";
import { searchProducts, getAllProducts, getBrands, getPriceRange } from "@/lib/products";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Recherchez dans notre sélection premium de produits Amazon.",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? searchProducts(query) : getAllProducts();
  const brands = Array.from(new Set(results.map((p) => p.brand))).sort();
  const priceRange = getPriceRange();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            {query ? <>Résultats pour <span className="text-accent">&ldquo;{query}&rdquo;</span></> : "Parcourir le catalogue"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {query ? `${results.length} produit${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}` : "Recherchez un produit, une marque ou une catégorie."}
          </p>
          <div className="mt-6"><SearchBar variant="hero" /></div>
        </div>
      </Reveal>

      <div className="mt-12">
        {results.length > 0 ? (
          <CatalogView products={results} brands={brands} priceRange={priceRange} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-serif text-2xl">Aucun résultat</p>
            <p className="mt-2 text-sm text-muted-foreground">Essayez d'autres mots-clés.</p>
          </div>
        )}
      </div>
    </section>
  );
}
