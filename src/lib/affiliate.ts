import affiliateLinks from "@/data/affiliateLinks.json";
import type { AffiliateLinkMap } from "@/lib/types";

/** Default Amazon Associates tag injected into every outbound link. */
export const AFFILIATE_TAG = "maisonselect-21";

export function getAffiliateOverride(asin: string): string | undefined {
  return (affiliateLinks as AffiliateLinkMap)[asin];
}

/**
 * Build the outbound Amazon URL for a product. A per-ASIN override (managed in
 * /admin/liens) wins; otherwise the default affiliate tag is appended.
 */
export function buildAffiliateUrl(baseUrl: string, asin: string): string {
  const override = getAffiliateOverride(asin);
  const target = override || baseUrl;
  try {
    const url = new URL(target);
    if (!url.searchParams.has("tag")) url.searchParams.set("tag", AFFILIATE_TAG);
    return url.toString();
  } catch {
    const sep = target.includes("?") ? "&" : "?";
    return target.includes("tag=") ? target : `${target}${sep}tag=${AFFILIATE_TAG}`;
  }
}
