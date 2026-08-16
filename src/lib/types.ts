export type BentoSize = "sm" | "md" | "lg" | "wide" | "tall";

export interface PricePoint {
  /** ISO date yyyy-mm-dd */
  date: string;
  price: number;
}

export interface Product {
  asin: string;
  slug: string;
  title: string;
  brand: string;
  /** category slug */
  category: string;
  price: number;
  oldPrice?: number;
  currency: string;
  /** 0 - 5, one decimal */
  rating: number;
  reviewCount: number;
  prime: boolean;
  images: string[];
  description: string;
  features: string[];
  badge?: string;
  tags?: string[];
  priceHistory: PricePoint[];
  /** base Amazon product URL (affiliate tag injected at render time) */
  amazonUrl: string;
  featured?: boolean;
  bentoSize?: BentoSize;
  /** ISO date — set for admin-created products */
  createdAt?: string;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** lucide-react icon name */
  icon: string;
  image: string;
  order: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  verified: boolean;
  location?: string;
  productAsin?: string;
}

/** ASIN -> overridden affiliate URL (managed in /admin/liens) */
export type AffiliateLinkMap = Record<string, string>;
