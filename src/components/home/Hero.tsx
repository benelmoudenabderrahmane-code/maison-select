"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

const words = ["Le", "meilleur", "d'Amazon,", "choisi", "à", "la", "main."];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="amber-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
            Sélection premium · mise à jour quotidienne
          </motion.span>

          <h1 className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="mr-[0.25em] inline-block"
              >
                {w === "main." ? <em className="text-accent not-italic">{w}</em> : w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            Produits triés sur le volet — testés, comparés, notés. L'élégance d'une boutique premium, la fiabilité d'Amazon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="mx-auto mt-9 max-w-xl"
          >
            <SearchBar variant="hero" />
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent-bright text-accent-bright" />
                ))}
              </span>
              <span className="font-medium text-foreground">4,7/5</span> · plus de 8 000 avis vérifiés
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
