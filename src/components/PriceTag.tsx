import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  oldPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({ price, oldPrice, currency = "EUR", size = "md", className }: PriceTagProps) {
  const off = discountPercent(price, oldPrice);
  const priceClass =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span className={cn("font-serif font-semibold tabular-nums tracking-tight", priceClass)}>
        {formatPrice(price, currency)}
      </span>
      {!!oldPrice && oldPrice > price && (
        <span className="text-sm text-muted-foreground line-through tabular-nums">
          {formatPrice(oldPrice, currency)}
        </span>
      )}
      {off > 0 && <Badge variant="promo">-{off}%</Badge>}
    </div>
  );
}
