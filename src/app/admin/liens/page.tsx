import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { AdminLiensClient } from "@/components/admin/AdminLiensClient";
import { getAllProducts } from "@/lib/products";
import type { AffiliateLinkMap } from "@/lib/types";

export const metadata: Metadata = { title: "Affiliate Links" };

export default function AdminLiensPage() {
  const products = getAllProducts();
  let links: AffiliateLinkMap = {};
  try {
    const raw = readFileSync(join(process.cwd(), "src/data/affiliateLinks.json"), "utf-8");
    links = JSON.parse(raw);
  } catch {
    links = {};
  }
  return <AdminLiensClient products={products} links={links} />;
}
