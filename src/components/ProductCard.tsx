"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
import { discountPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  layout?: "card" | "list";
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, layout = "card", priority, className }: ProductCardProps) {
  if (layout === "list") return <ProductRow product={product} className={className} />;
  return <ProductTile product={product} priority={priority} className={className} />;
}

function ProductTile({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  const imgX = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 150, damping: 18 });
  const imgY = useSpring(useTransform(my, [0, 1], [-12, 12]), { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    mx.set(0.5);
    my.set(0.5);
  }

  const off = discountPercent(product.price, product.oldPrice);

  return (
    <motion.div
      style={{ perspective: 1000 }}
      whileHover={reduce ? undefined : { y: -4 }}
      className={cn("group h-full", className)}
    >
      <Link
        ref={ref}
        href={`/produit/${product.asin}`}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-500 hover:shadow-[0_2px_6px_rgba(10,10,11,0.06),0_24px_60px_-12px_rgba(10,10,11,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <motion.div style={{ rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformStyle: "preserve-3d" }} className="relative aspect-square overflow-hidden bg-white">
          <motion.div style={{ x: reduce ? 0 : imgX, y: reduce ? 0 : imgY }} className="absolute inset-0">
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={priority}
              className="object-contain p-5 transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badge && <Badge variant="accent">{product.badge}</Badge>}
            {off > 0 && !product.badge && <Badge variant="promo">-{off}%</Badge>}
          </div>
          {product.prime && (
            <div className="absolute right-3 top-3">
              <Badge variant="accent" className="gap-1 bg-[#0a0a0b] text-white">
                <Zap className="h-3 w-3 fill-current text-accent" /> Prime
              </Badge>
            </div>
          )}
        </motion.div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{product.brand}</p>
          <h3 className="line-clamp-2 font-serif text-lg leading-snug">{product.title}</h3>
          <StarRating rating={product.rating} count={product.reviewCount} size={13} />
          <div className="mt-auto pt-2">
            <PriceTag price={product.price} oldPrice={product.oldPrice} currency={product.currency} size="md" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProductRow({ product, className }: { product: Product; className?: string }) {
  const off = discountPercent(product.price, product.oldPrice);
  return (
    <Link
      href={`/produit/${product.asin}`}
      className={cn(
        "group flex gap-4 rounded-2xl border border-border bg-card p-3 transition-shadow duration-300 hover:shadow-[0_12px_40px_-16px_rgba(10,10,11,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-6 sm:p-4",
        className,
      )}
    >
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-white sm:w-40">
        <Image src={product.images[0]} alt={product.title} fill sizes="160px" className="object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
        {product.badge && <Badge variant="accent" className="absolute left-2 top-2">{product.badge}</Badge>}
      </div>
      <div className="flex flex-1 flex-col py-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 font-serif text-xl leading-snug">{product.title}</h3>
        <p className="mt-1 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{product.description}</p>
        <StarRating rating={product.rating} count={product.reviewCount} size={14} className="mt-2" />
        <div className="mt-auto flex items-end justify-between pt-3">
          <PriceTag price={product.price} oldPrice={product.oldPrice} currency={product.currency} size="md" />
          {off > 0 && <span className="text-xs font-medium text-success">Économisez {off}%</span>}
        </div>
      </div>
    </Link>
  );
}
