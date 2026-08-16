import type { Metadata } from "next";
import Link from "next/link";
import { Package, Tag, Link2, TrendingUp, Star, ShoppingBag } from "lucide-react";
import { getAllProducts, getCategories } from "@/lib/products";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboard() {
  const products = getAllProducts();
  const categories = getCategories();
  const featured = products.filter((p) => p.featured).length;
  const prime = products.filter((p) => p.prime).length;
  const avgRating = (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1);

  const stats = [
    { label: "Produits", value: products.length, icon: Package, href: "/admin/produits", color: "text-accent" },
    { label: "Catégories", value: categories.length, icon: Tag, href: "/admin/categories", color: "text-success" },
    { label: "En vedette", value: featured, icon: Star, href: "/admin/produits", color: "text-accent-bright" },
    { label: "Note moy.", value: avgRating, icon: TrendingUp, href: "/admin/produits", color: "text-success" },
    { label: "Prime", value: prime, icon: ShoppingBag, href: "/admin/produits", color: "text-accent" },
    { label: "Liens affiliés", value: "—", icon: Link2, href: "/admin/liens", color: "text-muted-foreground" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble de votre catalogue affilié.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className={`rounded-xl bg-muted p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-serif text-xl">Derniers produits</h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Prix</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.slice(0, 8).map((p) => (
                <tr key={p.asin} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/produit/${p.asin}`} className="font-medium hover:text-accent" target="_blank">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right font-medium">{p.price.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right text-accent">{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
