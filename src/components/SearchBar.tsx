"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface SearchBarProps {
  variant?: "header" | "hero";
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ variant = "header", className, autoFocus }: SearchBarProps) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Product[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(id);
  }, [q]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/recherche?q=${encodeURIComponent(q.trim())}`);
  }

  const big = variant === "hero";

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      <form onSubmit={submit} className="relative">
        <Search className={cn("pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground", big ? "h-5 w-5" : "h-4 w-4")} />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={big ? "Rechercher un casque, une montre, une enceinte…" : "Rechercher…"}
          aria-label="Rechercher un produit"
          className={cn(
            "w-full rounded-full border border-border bg-surface/80 pl-11 pr-12 outline-none transition-all placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/40",
            big ? "h-14 text-base shadow-[0_8px_40px_-12px_rgba(10,10,11,0.25)]" : "h-10 text-sm",
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : big ? <CornerDownLeft className="h-4 w-4" /> : null}
        </div>
      </form>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-12px_rgba(10,10,11,0.3)]"
          >
            <ul className="max-h-[60vh] overflow-auto p-2">
              {results.map((p) => (
                <li key={p.asin}>
                  <Link href={`/produit/${p.asin}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </div>
                    <span className="font-serif text-sm tabular-nums">{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <button onClick={submit} className="w-full border-t border-border bg-muted/50 p-3 text-left text-xs font-medium text-accent hover:bg-muted">
              Voir tous les résultats pour &ldquo;{q}&rdquo;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
