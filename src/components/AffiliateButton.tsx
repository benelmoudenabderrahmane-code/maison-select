"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { MagneticButton } from "@/components/MagneticButton";
import { buildAffiliateUrl } from "@/lib/affiliate";
import { cn } from "@/lib/utils";

interface AffiliateButtonProps {
  asin: string;
  amazonUrl: string;
  label?: string;
  className?: string;
  size?: ButtonProps["size"];
  magnetic?: boolean;
}

const CLICK_KEY = "amazon-store-clicks";

function recordClick(asin: string) {
  try {
    const raw = localStorage.getItem(CLICK_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[asin] = (map[asin] ?? 0) + 1;
    localStorage.setItem(CLICK_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage errors */
  }
}

export function AffiliateButton({
  asin,
  amazonUrl,
  label = "Acheter sur Amazon",
  className,
  size = "lg",
  magnetic = true,
}: AffiliateButtonProps) {
  const href = buildAffiliateUrl(amazonUrl, asin);
  const btn = (
    <Button
      asChild
      variant="accent"
      size={size}
      className={cn("group w-full", className)}
    >
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => recordClick(asin)}
      >
        {label}
        <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </Button>
  );
  return magnetic ? <MagneticButton className="w-full">{btn}</MagneticButton> : btn;
}
