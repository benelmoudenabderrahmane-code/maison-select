import Image from "next/image";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/Countdown";
import { AffiliateButton } from "@/components/AffiliateButton";
import { PriceTag } from "@/components/PriceTag";
import { StarRating } from "@/components/StarRating";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/types";

export function DealOfDay({ product }: { product: Product }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid items-center gap-0 md:grid-cols-2">
          <div className="relative aspect-[4/3] bg-white md:aspect-auto md:h-full md:min-h-[420px]">
            <Image src={product.images[1] ?? product.images[0]} alt={product.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-contain p-8" />
          </div>
          <div className="p-6 sm:p-10">
            <Badge variant="promo" className="gap-1"><Flame className="h-3 w-3" /> Offre du Jour</Badge>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</p>
            <h3 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">{product.title}</h3>
            <StarRating rating={product.rating} count={product.reviewCount} size={15} className="mt-3" />
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{product.description}</p>
            <div className="mt-5"><PriceTag price={product.price} oldPrice={product.oldPrice} currency={product.currency} size="lg" /></div>
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Offre se termine dans</p>
              <Countdown />
            </div>
            <div className="mt-7 max-w-xs">
              <AffiliateButton asin={product.asin} amazonUrl={product.amazonUrl} />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
