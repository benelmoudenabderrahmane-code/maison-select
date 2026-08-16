import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Category, Product, AffiliateLinkMap } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
export const UPLOAD_DIR = path.join(process.cwd(), "public", "products", "uploads");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2) + "\n", "utf8");
}

export const getFeatured = () => readJson<Product[]>("featuredProducts.json", []);
export const getCustom = () => readJson<Product[]>("customProducts.json", []);
export const saveCustom = (p: Product[]) => writeJson("customProducts.json", p);

export const getCategoriesFile = () => readJson<Category[]>("categories.json", []);
export const saveCategories = (c: Category[]) => writeJson("categories.json", c);

export const getLinks = () => readJson<AffiliateLinkMap>("affiliateLinks.json", {});
export const saveLinks = (l: AffiliateLinkMap) => writeJson("affiliateLinks.json", l);

/** Dev-only guard for admin write APIs. */
export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function saveUpload(file: File): Promise<string> {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) throw new Error("Format non supporté (jpg, png, webp uniquement).");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (5 Mo maximum).");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/products/uploads/${name}`;
}
