import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Package, Tag, Link2 } from "lucide-react";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin" } };

const nav = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: Tag },
  { href: "/admin/liens", label: "Liens affiliés", icon: Link2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <span className="font-serif text-lg">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 fixed top-0 z-30 w-full lg:hidden">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:block">{label}</span>
          </Link>
        ))}
      </div>

      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
