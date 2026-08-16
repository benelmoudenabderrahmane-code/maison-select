"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, ExternalLink, Trash2, Star, Zap,
  Pencil, Upload, Link2, X, Check, Loader2, ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";

interface Props {
  products: Product[];
  categories: Category[];
}

interface EditState {
  product: Product;
  imageUrl: string;
  affiliateUrl: string;
  file: File | null;
  preview: string | null;
  saving: boolean;
  error: string | null;
}

export function AdminProductsClient({ products, categories }: Props) {
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState<EditState | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.asin.toLowerCase().includes(q);
    const matchC = cat === "all" || p.category === cat;
    return matchQ && matchC;
  });

  function openEdit(p: Product) {
    setEdit({
      product: p,
      imageUrl: p.images[0] ?? "",
      affiliateUrl: p.amazonUrl,
      file: null,
      preview: null,
      saving: false,
      error: null,
    });
  }

  function closeEdit() {
    if (edit?.preview) URL.revokeObjectURL(edit.preview);
    setEdit(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !edit) return;
    if (!file.type.startsWith("image/")) {
      setEdit({ ...edit, error: "Image file required (jpg, png, webp)" });
      return;
    }
    const preview = URL.createObjectURL(file);
    setEdit({ ...edit, file, preview, imageUrl: "", error: null });
  }

  async function handleSave() {
    if (!edit) return;
    setEdit({ ...edit, saving: true, error: null });

    try {
      let finalImageUrl = edit.imageUrl.trim();

      if (edit.file) {
        const fd = new FormData();
        fd.append("file", edit.file);
        fd.append("asin", edit.product.asin);
        const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload error");
        finalImageUrl = data.url;
      }

      const payload: Record<string, unknown> = { asin: edit.product.asin };
      if (finalImageUrl) payload.images = [finalImageUrl];
      if (edit.affiliateUrl.trim() !== edit.product.amazonUrl) {
        payload.amazonUrl = edit.affiliateUrl.trim();
      }

      const res = await fetch("/api/admin/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save error");

      closeEdit();
      window.location.reload();
    } catch (err) {
      setEdit((s) => s ? { ...s, saving: false, error: (err as Error).message } : null);
    }
  }

  async function handleDelete(asin: string) {
    if (!confirm("Supprimer ce produit du catalogue personnalisé ?")) return;
    setDeleting(asin);
    await fetch("/api/admin/produits", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asin }) });
    setDeleting(null);
    window.location.reload();
  }

  const currentImage = edit?.preview ?? edit?.imageUrl ?? edit?.product.images[0] ?? "";

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl">Produits</h1>
            <p className="mt-1 text-sm text-muted-foreground">{products.length} produit{products.length > 1 ? "s" : ""} dans le catalogue</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre, marque, ASIN…"
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16"></th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Prix</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Note</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.asin} className={cn("hover:bg-muted/30 transition-colors", deleting === p.asin && "opacity-40")}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-white">
                        <Image src={p.images[0]} alt={p.title} fill className="object-contain p-1" />
                      </div>
                      <button
                        onClick={() => openEdit(p)}
                        title="Modifier l'image & le lien affilié"
                        className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Modifier
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium line-clamp-1">{p.title}</span>
                      {p.prime && <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />}
                      {p.featured && <Star className="h-3.5 w-3.5 shrink-0 text-accent fill-accent" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.brand} · {p.asin}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    {p.price.toFixed(2)} €
                    {p.oldPrice && <span className="ml-1.5 text-xs line-through text-muted-foreground">{p.oldPrice.toFixed(2)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <Badge variant="glass">{p.rating} ★</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/produit/${p.asin}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger hover:text-danger"
                        onClick={() => handleDelete(p.asin)}
                        disabled={deleting === p.asin}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">Aucun produit trouvé.</div>
          )}
        </div>
      </div>

      {/* ── Modal édition image & lien affilié ── */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-semibold leading-tight">{edit.product.title}</h2>
                <p className="text-xs text-muted-foreground">{edit.product.asin}</p>
              </div>
              <button onClick={closeEdit} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Image preview + upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border bg-white shadow-inner">
                  {currentImage ? (
                    <Image
                      src={currentImage}
                      alt={edit.product.title}
                      fill
                      className="object-contain p-3"
                      unoptimized={!!edit.preview}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImagePlus className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Télécharger une image
                </Button>
                {edit.file && (
                  <p className="text-xs text-green-500 text-center">
                    ✓ {edit.file.name} · {(edit.file.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Ou coller une URL d'image
                </label>
                <input
                  type="url"
                  value={edit.imageUrl}
                  onChange={(e) => setEdit({ ...edit, imageUrl: e.target.value, file: null, preview: null })}
                  placeholder="https://m.media-amazon.com/images/P/…"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Affiliate link */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Link2 className="h-3.5 w-3.5" />
                  Lien affilié Amazon
                </label>
                <input
                  type="url"
                  value={edit.affiliateUrl}
                  onChange={(e) => setEdit({ ...edit, affiliateUrl: e.target.value })}
                  placeholder="https://www.amazon.fr/dp/ASIN?tag=maisonselect-21"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {edit.error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{edit.error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <Button variant="ghost" size="sm" onClick={closeEdit} disabled={edit.saving}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={edit.saving || (!edit.file && !edit.imageUrl.trim() && edit.affiliateUrl.trim() === edit.product.amazonUrl)}
              >
                {edit.saving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Check className="h-3.5 w-3.5" />}
                {edit.saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
