import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/TrustBar";
import { BentoGrid } from "@/components/BentoGrid";
import { DealOfDay } from "@/components/home/DealOfDay";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import {
  getFeaturedProducts,
  getDeals,
  getReviews,
  getCategories,
  getAllProducts,
} from "@/lib/products";

export default function Home() {
  const featured = getFeaturedProducts();
  const deal = getDeals()[0];
  const reviews = getReviews();
  const categories = getCategories();
  const trending = getAllProducts()
    .slice()
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  return (
    <>
      <Hero />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <TrustBar />
        </Reveal>
      </div>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Nos Collections" title="Parcourir par Catégorie" description="Quatre catégories, un seul standard : l'excellence." />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.06}>
              <Link href={`/categorie/${c.slug}`} className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-border">
                <Image src={c.image} alt={c.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/85 to-transparent" />
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                <div className="relative z-10 p-5 text-white">
                  <h3 className="font-serif text-2xl">{c.name}</h3>
                  <p className="mt-1 text-sm text-white/70">{c.tagline}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="À la Une" title="Les Pièces du Moment" description="Nos meilleures sélections de la saison, en pleine lumière." href="/recherche" hrefLabel="Voir le catalogue" />
        <BentoGrid products={featured} className="mt-8" />
      </section>

      {deal && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <DealOfDay product={deal} />
        </section>
      )}

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Tendances" title="Les Favoris" description="Ce que la communauté adore en ce moment." />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {trending.map((p, i) => (
            <Reveal key={p.asin} delay={i * 0.05}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 border-y border-border bg-surface/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Ils nous font confiance" title="Des milliers de clients satisfaits" align="center" className="mb-10" />
        </div>
        <TestimonialMarquee reviews={reviews} />
      </section>
    </>
  );
}
