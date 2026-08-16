"use client";

import * as React from "react";
import { Save, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AFFILIATE_TAG } from "@/lib/affiliate";
import type { Product, AffiliateLinkMap } from "@/lib/types";

interface Props {
  products: Product[];
  links: AffiliateLinkMap;
}

export function AdminLiensClient({ products, links }: Props) {
  const [overrides, setOverrides] = React.useState<AffiliateLinkMap>(links);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  function set(asin: string, url: string) {
    setOverrides((prev) => ({ ...prev, [asin]: url }));
  }

  function clear(asin: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[asin];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/liens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overrides),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function defaultUrl(p: Product) {
    return `${p.amazonUrl}${p.amazonUrl.includes("?") ? "&" : "?"}tag=${AFFILIATE_TAG}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Liens affiliés</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Laisser vide pour utiliser le tag par défaut <code className="rounded bg-muted px-1 text-xs">{AFFILIATE_TAG}</code>.
          </p>
        </div>
        <Button onClick={save} disabled={saving} variant="accent" className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {products.map((p) => {
          const override = overrides[p.asin] ?? "";
          const hasOverride = Boolean(overrides[p.asin]);
          return (
            <div key={p.asin} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.brand} · {p.asin}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasOverride && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clear(p.asin)} title="Supprimer le lien personnalisé">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <a href={override || defaultUrl(p)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
              <input
                value={override}
                onChange={(e) => set(p.asin, e.target.value)}
                placeholder={defaultUrl(p)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {hasOverride && (
                <p className="mt-1 text-[11px] text-success">Lien personnalisé actif</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
