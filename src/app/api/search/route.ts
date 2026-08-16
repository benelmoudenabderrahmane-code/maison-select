import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { searchProducts, getAllProducts } from "@/lib/products";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 0);
  let results = q ? searchProducts(q) : getAllProducts();
  if (limit > 0) results = results.slice(0, limit);
  return NextResponse.json({ query: q, count: results.length, results });
}
