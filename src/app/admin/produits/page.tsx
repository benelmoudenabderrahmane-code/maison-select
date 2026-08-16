import type { Metadata } from "next";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";
import { getAllProducts, getCategories } from "@/lib/products";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  const products = getAllProducts();
  const categories = getCategories();
  return <AdminProductsClient products={products} categories={categories} />;
}
