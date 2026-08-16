"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, X, Check, Minus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AffiliateButton } from "@/components/AffiliateButton";
import { StarRating } from "@/components/StarRating";
import { formatPrice, discountPercent, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const MAX = 4;

export function Compare({ products, initial }: { products: Product[]; initial: string[] }) {
  const [selected, setSelected] = React.useState<string[]>(initial.slice(0, MAX));
  const [picker, setPicker] = React.useState(false);

  const chosen = selected.map((a) => products.find((p) => p.asin === a)).filter(Boolean) as Product[];
  const available = products.filter((p) => !selected.includes(p.asin));

  const minPrice = Math.min(...chosen.map((p) => p.price));
  const maxRating = Math.max(...chosen.map((p) => p.rating));
  const maxReviews = Math.max(...chosen.map((p) => p.reviewCount));
  const maxOff = Math.max(...chosen.map((p) => discountPercent(p.price, p.oldPrice)));

  function add(asin: string) {
    setSelected((s) => (s.length < MAX ? [...s, asin] : s));
    setPicker(false);
  }
  function remove(asin: string) {
    setSelected((s) => s.filter((a) => a !== asin));
  }

  const rows: { label: string; render: (p: Product) => React.ReactNode; best?: (p: Product) => boolean }[] = [
    { label: "Prix", render: (p) => formatPrice(p.price), best: (p) => p.price === minPrice && chosen.length > 1 },
    { label: "Prix d'origine", render: (p) => (p.oldPrice ? formatPrice(p.oldPrice) : "—") },
    { label: "Réduction", render: (p) => { const o = discountPercent(p.price, p.oldPrice); return o ? `-${o}%` : "—"; }, best: (p) => maxOff > 0 && discountPercent(p.price, p.oldPrice) === maxOff && chosen.length > 1 },
    { label: "Note", render: (p) => <StarRating rating={p.rating} size={13} showValue />, best: (p) => p.rating === maxRating && chosen.length > 1 },
    { label: "Avis", render: (p) => p.reviewCount.toLocaleString("fr-FR"), best: (p) => p.reviewCount === maxReviews && chosen.length > 1 },
    { label: "Marque", render: (p) => p.brand },
    { label: "Prime", render: (p) => (p.prime ? <Check className="h-4 w-4 text-success" /> : <Minus className="h-4 w-4 text-muted-foreground" />) },
    { label: "Points clés", render: (p) => (<ul className="space-y-1 text-left text-xs text-muted-foreground">{p.features.slice(0, 3).map((f) => <li key={f} className="flex gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />{f}</li>)}</ul>) },
  ];

  const cols = Math.min(MAX, chosen.length + (chosen.length < MAX ? 1 : 0));

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid gap-4" style={{ gridTemplateColumns: `140px repeat(${cols}, minmax(0,1fr))` }}>
            <div />
            {chosen.map((p) => (
              <div key={p.asin} className="relative rounded-2xl border border-border bg-card p-4 text-center">
                <button onClick={() => remove(p.asin)} aria-label="Supprimer" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-border"><X className="h-3.5 w-3.5" /></button>
                <Link href={`/produit/${p.asin}`} className="block">
                  <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-xl bg-white"><Image src={p.images[0]} alt={p.title} fill sizes="112px" className="object-contain p-2" /></div>
                  <h3 className="mt-3 line-clamp-2 font-serif text-base leading-snug">{p.title}</h3>
                </Link>
              </div>
            ))}
            {chosen.length < MAX && (
              <div className="relative">
                <button onClick={() => setPicker((v) => !v)} className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <Plus className="h-6 w-6" /> <span className="text-sm">Ajouter un produit</span>
                </button>
                <AnimatePresence>
                  {picker && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-2xl border border-border bg-surface p-2 shadow-xl">
                      {available.map((p) => (
                        <button key={p.asin} onClick={() => add(p.asin)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={p.images[0]} alt="" fill sizes="40px" className="object-contain p-1" /></div>
                          <div className="min-w-0"><p className="truncate text-sm font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p></div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {chosen.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              {rows.map((row, ri) => (
                <div key={row.label} className={cn("grid items-center gap-4 px-4 py-3 text-sm", ri % 2 === 0 ? "bg-card" : "bg-surface")} style={{ gridTemplateColumns: `140px repeat(${cols}, minmax(0,1fr))` }}>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</span>
                  {chosen.map((p) => (
                    <div key={p.asin} className={cn("flex justify-center text-center", row.best?.(p) && "font-semibold text-accent")}>{row.render(p)}</div>
                  ))}
                  {chosen.length < MAX && <div />}
                </div>
              ))}
              <div className="grid gap-4 bg-card px-4 py-4" style={{ gridTemplateColumns: `140px repeat(${cols}, minmax(0,1fr))` }}>
                <div />
                {chosen.map((p) => (<div key={p.asin}><AffiliateButton asin={p.asin} amazonUrl={p.amazonUrl} label="Voir" size="default" magnetic={false} /></div>))}
                {chosen.length < MAX && <div />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
