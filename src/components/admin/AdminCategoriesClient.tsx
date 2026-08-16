"use client";

import * as React from "react";
import Link from "next/link";
import { GripVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  counts: Record<string, number>;
}

export function AdminCategoriesClient({ categories, counts }: Props) {
  const [items, setItems] = React.useState(categories);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const dragging = React.useRef<number | null>(null);

  function onDragStart(i: number) { dragging.current = i; }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    const from = dragging.current;
    if (from === null || from === i) return;
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(i, 0, removed);
    dragging.current = i;
    setItems(next.map((c, idx) => ({ ...c, order: idx + 1 })));
  }

  function onDrop() { dragging.current = null; }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Catégories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Glisser pour réordonner, puis enregistrer.</p>
        </div>
        <Button onClick={save} disabled={saving} variant="accent">
          {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer l'ordre"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((c, i) => (
          <div
            key={c.slug}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={onDrop}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 cursor-grab active:cursor-grabbing select-none"
          >
            <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{c.order}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{c.tagline}</p>
            </div>
            <span className="text-sm text-muted-foreground">{counts[c.slug] ?? 0} produit{(counts[c.slug] ?? 0) > 1 ? "s" : ""}</span>
            <Link href={`/categorie/${c.slug}`} target="_blank">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
