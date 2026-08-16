import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CatalogView } from "@/components/CatalogView";
import { Reveal } from "@/components/Reveal";
import {
  getCategories,
  getCategory,
  getProductsByCategory,
  getBrands,
  getPriceRange,
} from "@/lib/products";

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Catégorie introuvable" };
  return {
    title: `${category.name} — la sélection`,
    description: category.description,
    openGraph: { title: category.name, description: category.description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const priceRange = getPriceRange();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: category.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 opacity-50">
          <Image src={category.image} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <Reveal>
            <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-accent">Accueil</Link>
              <span>/</span>
              <span className="text-foreground">{category.name}</span>
            </nav>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent">{getProductsByCategory(slug).length} produits</span>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-6xl">{category.name}</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">{category.tagline}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CatalogView products={products} brands={brands} priceRange={priceRange} />
      </section>
    </>
  );
}
