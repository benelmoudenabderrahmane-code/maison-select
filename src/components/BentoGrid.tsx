import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { Reveal } from "@/components/Reveal";
import { formatPrice, discountPercent, cn } from "@/lib/utils";
import type { BentoSize, Product } from "@/lib/types";

const SPAN: Record<BentoSize, string> = {
  lg: "col-span-2 row-span-2",
  wide: "col-span-2 row-span-1",
  tall: "col-span-1 row-span-2 md:row-span-2",
  md: "col-span-2 row-span-1 md:col-span-1 md:row-span-1",
  sm: "col-span-1 row-span-1",
};

export function BentoGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-4", className)}>
      {products.map((p, i) => {
        const size = p.bentoSize ?? "sm";
        const big = size === "lg" || size === "wide";
        const off = discountPercent(p.price, p.oldPrice);
        return (
          <Reveal key={p.asin} delay={i * 0.05} className={SPAN[size]}>
            <Link
              href={`/produit/${p.asin}`}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow duration-500 hover:shadow-[0_2px_6px_rgba(10,10,11,0.06),0_24px_60px_-16px_rgba(10,10,11,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative flex-1 overflow-hidden bg-white">
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  sizes={big ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"}
                  priority={i < 2}
                  className="object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {p.badge && <Badge variant="accent">{p.badge}</Badge>}
                  {off > 0 && !p.badge && <Badge variant="promo">-{off}%</Badge>}
                </div>
                {p.prime && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="accent" className="gap-1 bg-[#0a0a0b] text-white">
                      <Zap className="h-3 w-3 fill-current text-accent" /> Prime
                    </Badge>
                  </div>
                )}
                <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-[#0a0a0b] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <div className="border-t border-border p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.brand}</p>
                <h3 className={cn("mt-1 font-serif leading-tight line-clamp-2", big ? "text-xl sm:text-2xl" : "text-base")}>{p.title}</h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-serif text-lg tabular-nums">{formatPrice(p.price, p.currency)}</span>
                  <StarRating rating={p.rating} size={14} />
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
