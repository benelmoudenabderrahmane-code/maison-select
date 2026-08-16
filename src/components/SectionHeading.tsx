import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, href, hrefLabel = "Voir tout", align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", align === "center" && "flex-col items-center text-center", className)}>
      <Reveal>
        <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
          {eyebrow && (
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              <span className="h-px w-6 bg-accent" /> {eyebrow}
            </span>
          )}
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-muted-foreground">{description}</p>}
        </div>
      </Reveal>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-accent">
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
