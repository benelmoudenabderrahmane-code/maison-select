import Link from "next/link";
import { Cpu, Lamp, Activity, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Cpu,
  Lamp,
  Activity,
  Sparkles,
};

interface CategoryNavProps {
  categories: Category[];
  counts?: Record<string, number>;
  className?: string;
  active?: string;
}

export function CategoryNav({ categories, counts, className, active }: CategoryNavProps) {
  return (
    <nav className={cn("flex flex-wrap gap-3", className)} aria-label="Categories">
      {categories.map((c) => {
        const Icon = ICONS[c.icon] ?? Sparkles;
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            href={`/categorie/${c.slug}`}
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm transition-all duration-300",
              isActive
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-card hover:border-foreground/25 hover:bg-muted",
            )}
          >
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", isActive ? "bg-accent text-accent-foreground" : "bg-muted text-accent group-hover:bg-accent/15")}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="font-medium">{c.name}</span>
            {counts?.[c.slug] != null && (
              <span className="text-xs text-muted-foreground tabular-nums">{counts[c.slug]}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
