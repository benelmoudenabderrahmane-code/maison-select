"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, GitCompareArrows } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function Header({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("glass sticky top-0 z-50 border-b transition-colors duration-300", scrolled ? "border-border" : "border-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Home Maison Select">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <span className="font-serif text-lg font-semibold">M</span>
          </span>
          <span className="hidden font-serif text-xl font-semibold tracking-tight sm:block">Maison<span className="text-accent">.</span>Select</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorie/${c.slug}`}
              className={cn("rounded-full px-3 py-2 text-sm transition-colors hover:bg-muted", pathname === `/categorie/${c.slug}` ? "text-accent" : "text-foreground/80")}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <SearchBar variant="header" />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/comparer" className="hidden h-9 items-center gap-2 rounded-full border border-border px-3 text-sm transition-colors hover:bg-muted sm:inline-flex" aria-label="Comparer">
            <GitCompareArrows className="h-4 w-4" /> <span className="hidden lg:inline">Comparer</span>
          </Link>
          <ThemeToggle />
          <button onClick={() => setOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden" aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-surface lg:hidden"
          >
            <div className="space-y-4 px-4 py-4 sm:px-6">
              <SearchBar variant="header" />
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/categorie/${c.slug}`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium">
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link href="/comparer" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium">
                <GitCompareArrows className="h-4 w-4 text-accent" /> Comparer des produits
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
