import { Truck, ShieldCheck, RotateCcw, BadgeCheck } from "lucide-react";

const items = [
  { icon: Truck, title: "Livraison 24h", sub: "Sur les articles Prime" },
  { icon: ShieldCheck, title: "Paiement sécurisé", sub: "Via Amazon, chiffré" },
  { icon: BadgeCheck, title: "100% Authentique", sub: "Vendeurs vérifiés" },
  { icon: RotateCcw, title: "Retours 30 jours", sub: "Satisfait ou remboursé" },
];

export function TrustBar({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 bg-card p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
