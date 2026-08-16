import type { Metadata } from "next";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";
import { getCategories, getCategoryCounts } from "@/lib/products";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  const categories = getCategories();
  const counts = getCategoryCounts();
  return <AdminCategoriesClient categories={categories} counts={counts} />;
}
