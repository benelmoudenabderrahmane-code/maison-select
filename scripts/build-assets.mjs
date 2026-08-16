// Deterministic seed generator: writes data JSON + branded SVG product art.
// Run: node scripts/build-assets.mjs
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DATA = join(ROOT, "src", "data");
const PUB = join(ROOT, "public");
mkdirSync(join(PUB, "products"), { recursive: true });
mkdirSync(join(PUB, "categories"), { recursive: true });
mkdirSync(DATA, { recursive: true });

function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const categories = [
  {
    slug: "electronique",
    name: "Électronique",
    icon: "Cpu",
    tagline: "Le son, l'image et la mesure — sans compromis.",
    description:
      "Casques, montres connectées et enceintes sélectionnés pour leur ingénierie et leur finition.",
    order: 1,
  },
  {
    slug: "maison",
    name: "Maison",
    icon: "Lamp",
    tagline: "Des objets qui transforment le quotidien en rituel.",
    description:
      "Café, lumière et ambiance — des pièces durables, pensées pour durer une décennie.",
    order: 2,
  },
  {
    slug: "sport",
    name: "Sport",
    icon: "Activity",
    tagline: "L'équipement qui suit votre rythme, pas l'inverse.",
    description:
      "Performance, précision et matériaux nobles pour l'entraînement et le plein air.",
    order: 3,
  },
  {
    slug: "beaute",
    name: "Beauté",
    icon: "Sparkles",
    tagline: "Le geste juste, la technologie en plus.",
    description:
      "Soins et appareils haut de gamme pour une routine éclatante au quotidien.",
    order: 4,
  },
];

const THEME = {
  electronique: { a: "#1b2740", b: "#0c1220", glyph: "device" },
  maison: { a: "#3a2c1f", b: "#1c140d", glyph: "cup" },
  sport: { a: "#15322a", b: "#0a1a15", glyph: "ring" },
  beaute: { a: "#341f33", b: "#1a0f1a", glyph: "bottle" },
};

const specs = [
  { asin: "B0AURORA01", slug: "casque-aurora-anc-pro", title: "Casque Aurora ANC Pro", brand: "Sonelle", category: "electronique", price: 249.99, oldPrice: 329.99, rating: 4.8, reviews: 2143, prime: true, badge: "Best-seller", featured: true, bento: "lg", desc: "Réduction de bruit adaptative, 40 h d'autonomie et transducteurs 40 mm en titane. L'Aurora ANC Pro isole sans fatigue et restitue chaque détail.", features: ["Réduction de bruit adaptative 3 micros", "Autonomie 40 h (USB-C, charge rapide)", "Transducteurs titane 40 mm", "Bluetooth 5.3 multipoint", "Coussinets mémoire de forme"], tags: ["casque", "audio", "anc", "sans-fil"] },
  { asin: "B0PULSE702", slug: "montre-pulse-7", title: "Montre connectée Pulse 7", brand: "Nordik", category: "electronique", price: 189.0, oldPrice: 229.0, rating: 4.6, reviews: 1287, prime: true, badge: "Coup de cœur", featured: true, bento: "tall", desc: "Écran AMOLED 1,4 pouce, suivi santé continu et GPS double fréquence dans un boîtier acier brossé. 9 jours d'autonomie réelle.", features: ["Écran AMOLED 1,4 pouce always-on", "GPS double fréquence", "ECG + SpO2 + sommeil", "Autonomie 9 jours", "Étanche 5 ATM"], tags: ["montre", "connectee", "sport", "sante"] },
  { asin: "B0ECHOMINI", slug: "enceinte-echo-mini", title: "Enceinte portable Écho Mini", brand: "Sonelle", category: "electronique", price: 79.99, oldPrice: 99.99, rating: 4.5, reviews: 856, prime: true, featured: true, bento: "sm", desc: "Un son 360 degrés étonnant pour sa taille, étanche IP67 et 18 h d'autonomie. La compagne idéale, du salon au sac de plage.", features: ["Son 360 degrés immersif", "Étanche IP67", "Autonomie 18 h", "Appairage stéréo", "USB-C"], tags: ["enceinte", "bluetooth", "portable"] },
  { asin: "B0BARISTA1", slug: "machine-cafe-barista-touch", title: "Machine à café Barista Touch", brand: "Maison Lumen", category: "maison", price: 429.0, oldPrice: 549.0, rating: 4.7, reviews: 932, prime: true, badge: "-22%", featured: true, bento: "wide", desc: "Expresso de niveau barista à la maison : broyeur conique intégré, buse vapeur pro et écran tactile. Le rituel du matin, sublimé.", features: ["Broyeur conique 18 réglages", "Buse vapeur professionnelle", "Écran tactile intuitif", "Pression 15 bars", "Réservoir 2 L amovible"], tags: ["cafe", "expresso", "cuisine"] },
  { asin: "B0HALOLAMP", slug: "lampe-halo", title: "Lampe d'ambiance Halo", brand: "Lumen", category: "maison", price: 119.0, oldPrice: 149.0, rating: 4.4, reviews: 412, prime: false, featured: true, bento: "sm", desc: "Une lumière chaude et graduable diffusée par un anneau opalin. Pilotable à l'app, pour des ambiances sur mesure.", features: ["Gradation 1 % à 100 %", "Température 2200 à 4000 K", "Pilotage app + tactile", "Diffuseur opalin", "Aluminium anodisé"], tags: ["lampe", "deco", "lumiere"] },
  { asin: "B0BRUMEDIF", slug: "diffuseur-brume", title: "Diffuseur d'arômes Brume", brand: "Maison Lumen", category: "maison", price: 64.9, rating: 4.3, reviews: 318, prime: true, bento: "sm", desc: "Brume ultrasonique silencieuse et halo lumineux apaisant. Jusqu'à 12 h de diffusion pour parfumer délicatement la pièce.", features: ["Diffusion ultrasonique silencieuse", "Réservoir 300 ml", "Arrêt automatique", "Halo lumineux 7 teintes", "Minuterie 1 à 12 h"], tags: ["diffuseur", "aromatherapie", "bien-etre"] },
  { asin: "B0ZENGRIP1", slug: "tapis-yoga-zen-grip", title: "Tapis de yoga Zen Grip", brand: "Alto", category: "sport", price: 59.0, oldPrice: 79.0, rating: 4.6, reviews: 1502, prime: true, badge: "Nouveau", featured: true, bento: "md", desc: "Adhérence parfaite même en transpiration, 6 mm d'amorti et caoutchouc naturel. Repères d'alignement gravés au laser.", features: ["Caoutchouc naturel antidérapant", "Amorti 6 mm", "Repères d'alignement", "Sangle de transport incluse", "Sans PVC ni latex"], tags: ["yoga", "fitness", "tapis"] },
  { asin: "B0TRAILRUN", slug: "montre-gps-trailrunner-x", title: "Montre GPS TrailRunner X", brand: "Alto", category: "sport", price: 299.0, oldPrice: 359.0, rating: 4.7, reviews: 689, prime: true, featured: true, bento: "tall", desc: "Conçue pour le trail : GPS multibande, cartographie hors-ligne et 30 h en mode GPS. Lunette titane, verre saphir.", features: ["GPS multibande + cartes hors-ligne", "Autonomie 30 h GPS", "Lunette titane, verre saphir", "Oxymètre d'altitude", "Étanche 10 ATM"], tags: ["montre", "gps", "trail", "running"] },
  { asin: "B0HYDRA750", slug: "gourde-hydra-750", title: "Gourde isotherme Hydra 750", brand: "Flask", category: "sport", price: 34.9, oldPrice: 44.9, rating: 4.8, reviews: 3201, prime: true, badge: "Best-seller", featured: true, bento: "sm", desc: "Inox double paroi : 24 h au froid, 12 h au chaud. Bouchon anti-fuite et finition mate qui ne glisse pas.", features: ["Isolation 24 h froid / 12 h chaud", "Inox 18/8 double paroi", "Bouchon anti-fuite", "Sans BPA", "Finition mate grip"], tags: ["gourde", "hydratation", "outdoor"] },
  { asin: "B0AIRSILK1", slug: "seche-cheveux-airsilk-pro", title: "Sèche-cheveux ionique AirSilk Pro", brand: "Lueur", category: "beaute", price: 149.0, oldPrice: 199.0, rating: 4.5, reviews: 1043, prime: true, badge: "-25%", featured: true, bento: "md", desc: "Moteur brushless ultra-rapide, technologie ionique anti-frisottis et contrôle thermique intelligent pour préserver la fibre.", features: ["Moteur brushless 110 000 tr/min", "Technologie ionique", "Contrôle thermique intelligent", "3 embouts magnétiques", "Léger 380 g"], tags: ["seche-cheveux", "coiffure", "soin"] },
  { asin: "B0RITUEL01", slug: "coffret-rituel-eclat", title: "Coffret soin Rituel Éclat", brand: "Lueur", category: "beaute", price: 89.0, rating: 4.6, reviews: 521, prime: true, bento: "sm", desc: "Sérum vitaminé, crème hydratante et masque nuit dans un coffret élégant. Une routine éclat clé en main.", features: ["Sérum vitamine C 15 %", "Crème hydratante acide hyaluronique", "Masque nuit régénérant", "Formules clean", "Coffret rechargeable"], tags: ["soin", "visage", "coffret"] },
  { asin: "B0GLOWBRSH", slug: "brosse-glowbrush", title: "Brosse nettoyante GlowBrush", brand: "Lueur", category: "beaute", price: 49.9, oldPrice: 69.9, rating: 4.4, reviews: 744, prime: false, bento: "sm", desc: "Nettoyage sonique en silicone médical, 15 intensités et étanche. Pour une peau nette en 60 secondes.", features: ["Nettoyage sonique", "Silicone médical doux", "15 intensités", "Étanche IPX7", "Charge USB longue durée"], tags: ["brosse", "nettoyage", "peau"] },
];

function buildHistory(s) {
  const rng = seedFrom(s.asin);
  const points = [];
  const start = s.oldPrice && s.oldPrice > s.price ? s.oldPrice : s.price * 1.18;
  const months = 12;
  for (let i = 0; i < months; i++) {
    const t = i / (months - 1);
    const base = start + (s.price - start) * t;
    const noise = (rng() - 0.5) * (start * 0.05);
    const p = i === months - 1 ? s.price : Math.max(s.price * 0.9, base + noise);
    const month = 7 + i;
    const yy = month > 12 ? 2026 : 2025;
    const mm = ((month - 1) % 12) + 1;
    points.push({ date: `${yy}-${String(mm).padStart(2, "0")}-01`, price: Math.round(p * 100) / 100 });
  }
  return points;
}

const products = specs.map((s) => ({
  asin: s.asin, slug: s.slug, title: s.title, brand: s.brand, category: s.category,
  price: s.price, ...(s.oldPrice ? { oldPrice: s.oldPrice } : {}), currency: "EUR",
  rating: s.rating, reviewCount: s.reviews, prime: s.prime,
  images: [1, 2, 3].map((n) => `/products/${s.asin}-${n}.svg`),
  description: s.desc, features: s.features, ...(s.badge ? { badge: s.badge } : {}), tags: s.tags,
  priceHistory: buildHistory(s), amazonUrl: `https://www.amazon.fr/dp/${s.asin}`,
  ...(s.featured ? { featured: true } : {}), ...(s.bento ? { bentoSize: s.bento } : {}),
}));

const reviewSeed = [
  ["Camille D.", 5, "Qualité bluffante", "Emballage soigné, finition irréprochable. On sent le produit pensé dans les moindres détails.", "Lyon", "2026-05-12"],
  ["Thomas R.", 5, "Livraison ultra rapide", "Commandé le soir, reçu le lendemain. Le rapport qualité-prix est excellent.", "Bordeaux", "2026-05-28"],
  ["Inès B.", 4, "Très satisfaite", "Exactement comme décrit. Je retire une étoile pour la notice un peu courte.", "Lille", "2026-04-19"],
  ["Mehdi K.", 5, "Je recommande les yeux fermés", "Troisième achat sur la boutique, jamais déçu. Sélection vraiment haut de gamme.", "Paris", "2026-06-02"],
  ["Sophie L.", 5, "Un cran au-dessus", "On change de catégorie par rapport à mon ancien modèle. Aucun regret.", "Nantes", "2026-03-30"],
  ["Antoine V.", 4, "Solide et élégant", "Matériaux premium, design sobre. Parfait au quotidien.", "Toulouse", "2026-05-07"],
  ["Léa M.", 5, "Coup de cœur", "Le design est magnifique et l'usage encore meilleur. Bravo.", "Strasbourg", "2026-06-09"],
  ["Karim S.", 5, "Service client réactif", "Une question avant achat, réponse en 10 minutes. Confiance totale.", "Marseille", "2026-04-25"],
];
const reviews = reviewSeed.map((r, i) => ({
  id: `r${i + 1}`, author: r[0], rating: r[1], title: r[2], body: r[3], location: r[4], date: r[5], verified: true,
}));

function objectShapes(glyph, rng) {
  const o = (rng() - 0.5) * 40;
  switch (glyph) {
    case "device":
      return `<rect x="${250 + o}" y="220" width="300" height="360" rx="40" fill="url(#obj)"/><rect x="${290 + o}" y="270" width="220" height="220" rx="20" fill="#0a0a0b" opacity="0.35"/><circle cx="${400 + o}" cy="540" r="22" fill="#0a0a0b" opacity="0.4"/><path d="M${250 + o} 300 Q${180 + o} 400 ${250 + o} 500" stroke="url(#obj)" stroke-width="26" fill="none" stroke-linecap="round"/>`;
    case "cup":
      return `<path d="M${300 + o} 300 h200 l-22 230 a40 40 0 0 1 -40 36 h-36 a40 40 0 0 1 -40 -36 z" fill="url(#obj)"/><path d="M${500 + o} 340 a60 60 0 0 1 0 120" stroke="url(#obj)" stroke-width="26" fill="none" stroke-linecap="round"/><ellipse cx="${400 + o}" cy="300" rx="100" ry="26" fill="#0a0a0b" opacity="0.3"/>`;
    case "ring":
      return `<circle cx="${400 + o}" cy="400" r="150" fill="none" stroke="url(#obj)" stroke-width="56"/><circle cx="${400 + o}" cy="400" r="150" fill="none" stroke="#0a0a0b" stroke-width="10" opacity="0.25"/><path d="M${300 + o} 400 a100 100 0 0 1 200 0" stroke="#fafaf8" stroke-width="8" fill="none" opacity="0.5"/>`;
    case "bottle":
      return `<rect x="${345 + o}" y="240" width="110" height="60" rx="14" fill="url(#obj)"/><path d="M${330 + o} 300 h140 a30 30 0 0 1 30 30 v210 a40 40 0 0 1 -40 40 h-120 a40 40 0 0 1 -40 -40 v-210 a30 30 0 0 1 30 -30 z" fill="url(#obj)"/><rect x="${360 + o}" y="380" width="80" height="120" rx="12" fill="#0a0a0b" opacity="0.28"/>`;
    default:
      return "";
  }
}

function svgFor(theme, key, variant) {
  const rng = seedFrom(key + variant);
  const rot = variant * 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.a}"/><stop offset="1" stop-color="${theme.b}"/></linearGradient><radialGradient id="glow" cx="0.5" cy="0.3" r="0.7"><stop offset="0" stop-color="#e8a33d" stop-opacity="0.55"/><stop offset="1" stop-color="#e8a33d" stop-opacity="0"/></radialGradient><linearGradient id="obj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d9a8"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b9741a"/></linearGradient><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000" flood-opacity="0.45"/></filter><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs><rect width="800" height="800" fill="url(#bg)"/><g transform="rotate(${rot} 400 400)"><rect width="800" height="800" fill="url(#glow)"/></g><g><circle cx="400" cy="400" r="300" fill="none" stroke="#fafaf8" stroke-opacity="0.06" stroke-width="2"/><circle cx="400" cy="400" r="220" fill="none" stroke="#fafaf8" stroke-opacity="0.06" stroke-width="2"/></g><g filter="url(#soft)">${objectShapes(theme.glyph, rng)}</g><rect width="800" height="800" filter="url(#grain)" opacity="0.05"/></svg>`;
}

let imgCount = 0;
for (const s of specs) {
  const theme = THEME[s.category];
  for (let v = 1; v <= 3; v++) {
    writeFileSync(join(PUB, "products", `${s.asin}-${v}.svg`), svgFor(theme, s.asin, v));
    imgCount++;
  }
}
for (const c of categories) {
  writeFileSync(join(PUB, "categories", `${c.slug}.svg`), svgFor(THEME[c.slug], c.slug, 1));
  imgCount++;
}

writeFileSync(join(DATA, "categories.json"), JSON.stringify(categories.map((c) => ({ ...c, image: `/categories/${c.slug}.svg` })), null, 2));
writeFileSync(join(DATA, "featuredProducts.json"), JSON.stringify(products, null, 2));
writeFileSync(join(DATA, "reviews.json"), JSON.stringify(reviews, null, 2));
if (!existsSync(join(DATA, "customProducts.json"))) writeFileSync(join(DATA, "customProducts.json"), "[]\n");
if (!existsSync(join(DATA, "affiliateLinks.json"))) writeFileSync(join(DATA, "affiliateLinks.json"), "{}\n");

console.log(`OK ${products.length} products, ${categories.length} categories, ${reviews.length} reviews, ${imgCount} SVGs`);
