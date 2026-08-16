import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}

export function StarRating({ rating, size = 16, className, showValue, count }: StarRatingProps) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="relative inline-block" style={{ width: size * 5 + 8, height: size }} aria-hidden>
        <Stars size={size} className="text-border" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <Stars size={size} className="text-accent-bright" />
        </div>
      </div>
      {showValue && <span className="text-sm font-medium tabular-nums">{rating.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground tabular-nums">({count.toLocaleString("fr-FR")})</span>
      )}
      <span className="sr-only">{rating} sur 5</span>
    </div>
  );
}

function Stars({ size, className }: { size: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z" />
        </svg>
      ))}
    </div>
  );
}
