import { StarRating } from "@/components/StarRating";
import type { Review } from "@/lib/types";

function Card({ review }: { review: Review }) {
  return (
    <figure className="flex w-[340px] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <StarRating rating={review.rating} size={14} />
      <blockquote className="text-sm leading-relaxed text-foreground/90">“{review.body}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
          {review.author.charAt(0)}
        </span>
        <span className="font-medium text-foreground">{review.author}</span>
        {review.location && <span>· {review.location}</span>}
        {review.verified && <span className="text-success">· Achat vérifié</span>}
      </figcaption>
    </figure>
  );
}

export function TestimonialMarquee({ reviews }: { reviews: Review[] }) {
  const row = [...reviews, ...reviews];
  return (
    <div className="marquee-mask relative overflow-hidden py-2">
      <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
        {row.map((r, i) => (
          <Card key={`${r.id}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}
