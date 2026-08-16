"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AffiliateButton } from "@/components/AffiliateButton";
import { PriceTag } from "@/components/PriceTag";
import type { Product } from "@/lib/types";

export function StickyMobileCTA({ product }: { product: Product }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="glass fixed inset-x-0 bottom-0 z-50 border-t border-border p-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">{product.title}</p>
              <PriceTag price={product.price} oldPrice={product.oldPrice} currency={product.currency} size="sm" />
            </div>
            <div className="w-40 shrink-0">
              <AffiliateButton asin={product.asin} amazonUrl={product.amazonUrl} label="Acheter" size="default" magnetic={false} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
