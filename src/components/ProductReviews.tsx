import { StarRating } from "@/components/StarRating";
import { Reveal } from "@/components/Reveal";
import type { Product, Review } from "@/lib/types";

export function ProductReviews({ product, reviews }: { product: Product; reviews: Review[] }) {
  const dist = [5, 4, 3, 2, 1].map((stars) => {
    const base = stars === 5 ? 0.68 : stars === 4 ? 0.22 : stars === 3 ? 0.07 : stars === 2 ? 0.02 : 0.01;
    return { stars, pct: Math.round(base * 100) };
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div>
        <div className="flex items-end gap-3">
          <span className="font-serif text-5xl">{product.rating.toFixed(1)}</span>
          <div className="pb-1">
            <StarRating rating={product.rating} size={16} />
            <p className="mt-1 text-sm text-muted-foreground">{product.reviewCount.toLocaleString("en-US")} reviews</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {dist.map((d) => (
            <div key={d.stars} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-muted-foreground">{d.stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-9 text-right text-muted-foreground tabular-nums">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 4).map((r, i) => (
          <Reveal key={r.id} delay={i * 0.05}>
            <figure className="h-full rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <StarRating rating={r.rating} size={13} />
                {r.verified && <span className="text-xs text-success">Verified Purchase</span>}
              </div>
              <h4 className="mt-3 font-medium">{r.title}</h4>
              <blockquote className="mt-1.5 text-sm text-muted-foreground">“{r.body}”</blockquote>
              <figcaption className="mt-3 text-xs text-muted-foreground">{r.author} · {r.location}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
