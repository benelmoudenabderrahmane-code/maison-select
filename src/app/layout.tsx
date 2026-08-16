import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/products";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3006";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Maison.Select — The premium selection of Amazon's best products",
    template: "%s · Maison.Select",
  },
  description:
    "An editorial selection of Amazon products chosen by hand: electronics, home, sport and beauty. Comparisons, price history and verified reviews.",
  keywords: ["Amazon", "affiliate", "comparison", "deals", "premium"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Maison.Select",
    title: "Maison.Select — The premium selection of Amazon's best products",
    description: "Editorial selection, price history and verified reviews.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = getCategories();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <Header categories={categories} />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer categories={categories} />
        </ThemeProvider>
      </body>
    </html>
  );
}
