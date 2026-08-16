"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, SlidersHorizontal, X, Check } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "reviews";
const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Pertinence" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "reviews", label: "Plus d'avis" },
];

interface CatalogViewProps {
  products: Product[];
  brands: string[];
  priceRange: { min: number; max: number };
}

const PAGE = 8;

export function CatalogView({ products, brands, priceRange }: CatalogViewProps) {
  const [maxPrice, setMaxPrice] = React.useState(priceRange.max);
  const [minRating, setMinRating] = React.useState(0);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [primeOnly, setPrimeOnly] = React.useState(false);
  const [sort, setSort] = React.useState<Sort>("featured");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [visible, setVisible] = React.useState(PAGE);
  const [drawer, setDrawer] = React.useState(false);

  const filtered = React.useMemo(() => {
    const out = products.filter(
      (p) =>
        p.price <= maxPrice &&
        p.rating >= minRating &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        (!primeOnly || p.prime),
    );
    out.sort((a, b) => {
      switch (sort) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "rating": return b.rating - a.rating;
        case "reviews": return b.reviewCount - a.reviewCount;
        default: return Number(b.featured ?? false) - Number(a.featured ?? false) || b.reviewCount - a.reviewCount;
      }
    });
    return out;
  }, [products, maxPrice, minRating, selectedBrands, primeOnly, sort]);

  React.useEffect(() => setVisible(PAGE), [maxPrice, minRating, selectedBrands, primeOnly, sort]);

  const sentinel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => e[0].isIntersecting && setVisible((v) => Math.min(v + PAGE, filtered.length)),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const activeFilters = selectedBrands.length + (minRating > 0 ? 1 : 0) + (primeOnly ? 1 : 0) + (maxPrice < priceRange.max ? 1 : 0);

  function reset() {
    setMaxPrice(priceRange.max);
    setMinRating(0);
    setSelectedBrands([]);
    setPrimeOnly(false);
  }

  const filters = (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Prix maximum</h3>
          <span className="font-serif text-sm tabular-nums">{formatPrice(maxPrice)}</span>
        </div>
        <Slider value={[maxPrice]} min={priceRange.min} max={priceRange.max} step={5} onValueChange={([v]) => setMaxPrice(v)} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Note minimum</h3>
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", minRating === r ? "border-accent bg-accent/10 text-foreground" : "border-border hover:bg-muted")}>
              {r === 0 ? "Tous" : `${r}★ et plus`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Marque</h3>
        <div className="space-y-1.5">
          {brands.map((b) => {
            const on = selectedBrands.includes(b);
            return (
              <button key={b} onClick={() => setSelectedBrands((s) => (on ? s.filter((x) => x !== b) : [...s, b]))} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted">
                <span className={cn("flex h-4 w-4 items-center justify-center rounded border transition-colors", on ? "border-accent bg-accent text-accent-foreground" : "border-border")}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted">
        <span className="text-sm font-medium">Prime uniquement</span>
        <button role="switch" aria-checked={primeOnly} onClick={() => setPrimeOnly((v) => !v)} className={cn("relative h-6 w-11 rounded-full transition-colors", primeOnly ? "bg-accent" : "bg-muted-foreground/30")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", primeOnly ? "left-[22px]" : "left-0.5")} />
        </button>
      </label>

      {activeFilters > 0 && (
        <Button variant="outline" size="sm" onClick={reset} className="w-full">Réinitialiser les filtres</Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">{filters}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{filtered.length}</span> produit{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filtres {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] text-accent-foreground">{activeFilters}</span>}
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-accent" aria-label="Trier">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="hidden items-center rounded-full border border-border p-1 sm:flex">
              <button onClick={() => setView("grid")} aria-label="Vue grille" className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "grid" ? "bg-foreground text-background" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} aria-label="Vue liste" className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", view === "list" ? "bg-foreground text-background" : "text-muted-foreground")}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-serif text-2xl">Aucun produit</p>
            <p className="mt-2 text-sm text-muted-foreground">Essayez d'élargir vos filtres.</p>
            <Button variant="outline" size="sm" onClick={reset} className="mt-5">Réinitialiser</Button>
          </div>
        ) : (
          <motion.div layout className={cn(view === "grid" ? "grid grid-cols-2 gap-4 lg:grid-cols-3" : "flex flex-col gap-4")}>
            <AnimatePresence mode="popLayout">
              {shown.map((p) => (
                <motion.div key={p.asin} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
                  <ProductCard product={p} layout={view === "list" ? "list" : "card"} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {visible < filtered.length && <div ref={sentinel} className="h-10" />}
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-auto bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-xl">Filtres</h2>
                <button onClick={() => setDrawer(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full border border-border"><X className="h-4 w-4" /></button>
              </div>
              {filters}
              <Button variant="accent" className="mt-7 w-full" onClick={() => setDrawer(false)}>Voir {filtered.length} produit{filtered.length > 1 ? "s" : ""}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
