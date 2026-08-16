import Link from "next/link";
import type { Category } from "@/lib/types";

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="relative z-10 mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <span className="font-serif text-2xl font-semibold tracking-tight">Maison<span className="text-accent">.</span>Select</span>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The editorial selection of Amazon&apos;s best products. Hand-picked and rigorously tested.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Catégories</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug}><Link href={`/categorie/${c.slug}`} className="text-foreground/80 transition-colors hover:text-accent">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Explorer</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/recherche" className="text-foreground/80 transition-colors hover:text-accent">Rechercher</Link></li>
              <li><Link href="/comparer" className="text-foreground/80 transition-colors hover:text-accent">Comparer</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">À propos</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              En tant que partenaire Amazon, nous percevons une commission sur les achats qualifiants.
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Maison.Select — Tous droits réservés.</p>
          <p>Les prix et disponibilités sont indicatifs et peuvent varier sur Amazon.</p>
        </div>
      </div>
    </footer>
  );
}
