import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Zap, ShieldCheck, TrendingDown, GitCompareArrows } from "lucide-react";
import { ProductGallery } from "@/components/ProductGallery";
import { PriceTag } from "@/components/PriceTag";
import { StarRating } from "@/components/StarRating";
import { AffiliateButton } from "@/components/AffiliateButton";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductCard } from "@/components/ProductCard";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";
import { buildAffiliateUrl } from "@/lib/affiliate";
import { formatPrice, discountPercent } from "@/lib/utils";
import {
  getAllProducts,
  getProductByAsin,
  getRelatedProducts,
  getReviews,
  getCategory,
} from "@/lib/products";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ asin: p.asin }));
}

export async function generateMetadata({ params }: { params: Promise<{ asin: string }> }): Promise<Metadata> {
  const { asin } = await params;
  const product = getProductByAsin(asin);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: product.images[0], width: 800, height: 800, alt: product.title }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ asin: string }> }) {
  const { asin } = await params;
  const product = getProductByAsin(asin);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = getRelatedProducts(asin, 4);
  const reviews = getReviews();
  const off = discountPercent(product.price, product.oldPrice);
  const lowest = Math.min(...product.priceHistory.map((p) => p.price));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
      url: buildAffiliateUrl(product.amazonUrl, product.asin),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: category?.name ?? "Catégorie", item: `/categorie/${product.category}` },
      { "@type": "ListItem", position: 3, name: product.title },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-accent">Accueil</Link><span>/</span>
          <Link href={`/categorie/${product.category}`} className="hover:text-accent">{category?.name}</Link><span>/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          <Reveal>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</span>
                {product.badge && <Badge variant="accent">{product.badge}</Badge>}
              </div>
              <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">{product.title}</h1>
              <div className="mt-4"><StarRating rating={product.rating} count={product.reviewCount} size={16} showValue /></div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <PriceTag price={product.price} oldPrice={product.oldPrice} currency={product.currency} size="lg" />
                {off > 0 && <span className="text-sm font-medium text-success">Vous économisez {formatPrice((product.oldPrice ?? 0) - product.price)}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {product.prime && <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent" /> Livraison Prime</span>}
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" /> Vendeur vérifié</span>
              </div>

              <p className="mt-6 text-muted-foreground">{product.description}</p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1"><AffiliateButton asin={product.asin} amazonUrl={product.amazonUrl} /></div>
                <Link href={`/comparer?add=${product.asin}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-muted">
                  <GitCompareArrows className="h-4 w-4" /> Comparer
                </Link>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">
                En tant qu'associé Amazon, nous percevons une commission sur les achats éligibles.
              </p>
            </div>
          </Reveal>
        </div>

        <section className="mt-16 grid gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-accent" /><h2 className="font-serif text-2xl">Historique des prix</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Évolution du prix sur les 12 derniers mois.</p>
            <div className="mt-5"><PriceHistoryChart data={product.priceHistory} current={product.price} /></div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-2xl bg-surface-2 p-6">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Prix actuel</p><p className="font-serif text-2xl">{formatPrice(product.price)}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Plus bas observé</p><p className="font-serif text-2xl text-success">{formatPrice(lowest)}</p></div>
            {product.price <= lowest * 1.02 && <Badge variant="success" className="w-fit">Prix plancher 🔥</Badge>}
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading eyebrow="Avis clients" title="Ce que disent nos clients" className="mb-8" />
          <ProductReviews product={product} reviews={reviews} />
        </section>

        <section className="mt-20">
          <SectionHeading eyebrow="Vous aimerez aussi" title="Produits similaires" className="mb-8" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.asin} delay={i * 0.05}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      </div>

      <StickyMobileCTA product={product} />
    </>
  );
}
