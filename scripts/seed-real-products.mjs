// Seeds featuredProducts.json with REAL trending Amazon products.
// Images use Amazon's legacy ASIN->image CDN endpoint (verified hotlinkable):
//   https://m.media-amazon.com/images/P/{ASIN}.01._SCLZZZZZZZ_.jpg
// Prices in EUR are realistic amazon.fr figures (June 2026). ASINs are real.
// Run: node scripts/seed-real-products.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA = join(process.cwd(), "src", "data");
const img = (asin) => `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`;

// Deterministic price-history: 12 monthly points ending June 2026 at `price`,
// starting near `from`, gently trending down with mild seeded noise.
function seed(str) {
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
function history(asin, price, from) {
  const rng = seed(asin);
  const months = ["2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
    "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
  const start = from ?? price * 1.18;
  return months.map((m, i) => {
    const t = i / (months.length - 1);
    const base = start + (price - start) * t;
    const noise = (rng() - 0.5) * (start - price) * 0.35;
    const v = i === months.length - 1 ? price : Math.max(price * 0.95, base + noise);
    return { date: `${m}-01`, price: Math.round(v * 100) / 100 };
  });
}

const P = [
  // ───────────────────────── ÉLECTRONIQUE ─────────────────────────
  {
    asin: "B09XS7JWHH", slug: "sony-wh-1000xm5", title: "Sony WH-1000XM5", brand: "Sony",
    category: "electronique", price: 299.0, oldPrice: 419.99, rating: 4.7, reviewCount: 18742,
    prime: true, badge: "Coup de cœur", featured: true, bentoSize: "lg",
    description: "Le casque à réduction de bruit de référence. Huit microphones et deux processeurs analysent l'environnement en temps réel pour un silence absolu, avec un audio hi-res d'une finesse exceptionnelle et 30 heures d'autonomie.",
    features: ["ANC de référence (8 micros, 2 processeurs)", "30h d'autonomie + charge rapide (3 min = 3h)", "Audio Hi-Res & LDAC, suréchantillonnage IA DSEE Extreme", "Appels cristallins avec réduction de bruit IA", "Bluetooth multipoint & détection du port"],
    tags: ["casque", "audio", "anc", "sans-fil", "bluetooth"],
  },
  {
    asin: "B0CHWZ9TZS", slug: "apple-airpods-pro-2-usb-c", title: "Apple AirPods Pro 2 (USB-C)", brand: "Apple",
    category: "electronique", price: 229.0, oldPrice: 279.0, rating: 4.8, reviewCount: 9531,
    prime: true, badge: "Coup de cœur", featured: true, bentoSize: "sm",
    description: "La puce H2 double la réduction active du bruit et offre un son spatial personnalisé époustouflant. Quatre embouts, résistance à la transpiration et étui USB-C compatible MagSafe.",
    features: ["ANC 2× plus puissant (puce H2)", "Son spatial personnalisé avec suivi de tête", "Mode Transparence Adaptative", "Jusqu'à 6h d'écoute (30h avec l'étui)", "Étui USB-C, MagSafe & résistance IPX4"],
    tags: ["écouteurs", "airpods", "anc", "apple", "intra-auriculaire"],
  },
  {
    asin: "B075QRWPPJ", slug: "kindle-paperwhite", title: "Kindle Paperwhite (Étanche)", brand: "Amazon",
    category: "electronique", price: 129.99, oldPrice: 159.99, rating: 4.7, reviewCount: 7218,
    prime: true, featured: true, bentoSize: "md",
    description: "L'écran 6 pouces 300 ppp sans reflets se lit comme du papier même en plein soleil. Étanche IPX8, lumière intégrée réglable et des semaines d'autonomie — la liseuse définitive pour lire partout.",
    features: ["Écran 6\" 300 ppp sans reflets", "Étanche IPX8 (jusqu'à 2m, 60 min)", "Lumière intégrée réglable", "Des semaines d'autonomie par charge", "Des milliers de livres, Wi-Fi"],
    tags: ["liseuse", "kindle", "lecture", "ebook"],
  },
  // ───────────────────────── MAISON ─────────────────────────
  {
    asin: "B07FDJMC9Q", slug: "ninja-air-fryer", title: "Ninja Air Fryer (3,8 L)", brand: "Ninja",
    category: "maison", price: 99.99, oldPrice: 129.99, rating: 4.8, reviewCount: 41260,
    prime: true, badge: "-23%", featured: true, bentoSize: "sm",
    description: "Friture à air avec jusqu'à 75 % de matières grasses en moins. Quatre fonctions — Air Fryer, rôtissage, réchauffage, déshydratation — dans un panier antiadhésif 3,8 L compatible lave-vaisselle.",
    features: ["Jusqu'à 75 % de matières grasses en moins", "4-en-1 : Air Fryer, rôtissage, réchauffage, déshydratation", "Panier antiadhésif 3,8 L compatible lave-vaisselle", "Plage de température 40–200°C", "1550W — résultats rapides et croustillants"],
    tags: ["friteuse", "cuisine", "ninja", "cuisson"],
  },
  {
    asin: "B01MR8Y1UJ", slug: "nespresso-vertuo", title: "Nespresso Vertuo", brand: "Nespresso",
    category: "maison", price: 99.0, oldPrice: 149.0, rating: 4.6, reviewCount: 28104,
    prime: true, badge: "Coup de cœur", featured: true, bentoSize: "wide",
    description: "La technologie Centrifusion lit le code-barres de chaque capsule pour préparer le café parfait, couronné d'une généreuse crema. Cinq tailles de tasse, de l'espresso au grand café, en une simple pression.",
    features: ["Technologie Centrifusion (lecture code-barres)", "5 tailles de tasse de l'espresso à 414 ml", "Crema généreuse sur chaque préparation", "Chauffe en 15–20s", "Réservoir 1,1 L & arrêt automatique"],
    tags: ["café", "espresso", "nespresso", "cuisine"],
  },
  {
    asin: "B0C2J8KJH9", slug: "dyson-v15-detect", title: "Dyson V15 Detect", brand: "Dyson",
    category: "maison", price: 599.0, oldPrice: 699.0, rating: 4.7, reviewCount: 12483,
    prime: true, featured: true, bentoSize: "tall",
    description: "Un laser vert révèle la poussière invisible tandis qu'un capteur piézo compte les particules sur l'écran LCD. L'aspirateur Dyson le plus puissant, avec jusqu'à 60 minutes d'autonomie sans fil.",
    features: ["Détection laser de la poussière microscopique", "Capteur piézo + écran LCD (comptage de particules)", "Aspiration Dyson la plus puissante", "Jusqu'à 60 min d'autonomie", "Filtration complète captant 99,99 % des particules"],
    tags: ["aspirateur", "sans-fil", "dyson", "nettoyage"],
  },
  // ───────────────────────── SPORT ─────────────────────────
  {
    asin: "B0BS1T7G8S", slug: "garmin-forerunner-265", title: "Garmin Forerunner 265", brand: "Garmin",
    category: "sport", price: 449.0, oldPrice: 499.99, rating: 4.7, reviewCount: 6342,
    prime: true, badge: "Nouveau", featured: true, bentoSize: "tall",
    description: "La montre de running passe à l'AMOLED : écran tactile vif, GPS multi-bandes, suivi de la récupération et statut d'entraînement. Jusqu'à 13 jours d'autonomie sans jamais penser à recharger.",
    features: ["Écran AMOLED lumineux tactile", "GPS multi-bandes haute précision", "Disponibilité à l'entraînement & charge d'entraînement", "VO2 max, sommeil, fréquence cardiaque au poignet", "Jusqu'à 13j en mode montre, 20h GPS"],
    tags: ["montre", "gps", "running", "garmin", "sport"],
  },
  {
    asin: "B085NTR26K", slug: "renpho-massage-gun", title: "RENPHO Pistolet de Massage", brand: "RENPHO",
    category: "sport", price: 89.99, oldPrice: 129.99, rating: 4.6, reviewCount: 33571,
    prime: true, badge: "-31%", featured: false, bentoSize: "sm",
    description: "Récupération musculaire professionnelle à domicile : moteur ultra-silencieux puissant, 5 vitesses et 5 têtes interchangeables. Poignée ergonomique et housse de transport incluses.",
    features: ["Percussion profonde, moteur quasi-silencieux", "5 vitesses réglables", "5 têtes interchangeables", "Batterie longue durée, charge USB", "Poignée ergonomique + housse de transport"],
    tags: ["massage", "récupération", "fitness", "renpho"],
  },
  {
    asin: "B083GC98D8", slug: "hydro-flask-32oz", title: "Hydro Flask 32 oz Large Ouverture", brand: "Hydro Flask",
    category: "sport", price: 44.95, oldPrice: 54.95, rating: 4.8, reviewCount: 52890,
    prime: true, badge: "Coup de cœur", featured: false, bentoSize: "sm",
    description: "L'isolation sous vide TempShield maintient les boissons glacées jusqu'à 24h et chaudes pendant 12h. Acier inoxydable 18/8 robuste, finition mate antidérapante et Flex Cap étanche.",
    features: ["Froid 24h / chaud 12h (isolation TempShield)", "Acier inoxydable 18/8 de qualité pro, sans BPA", "Finition mate antidérapante", "Léger & Flex Cap étanche", "Large ouverture — glaçons faciles à insérer"],
    tags: ["gourde", "hydratation", "outdoor", "hydro-flask"],
  },
  // ───────────────────────── SÉLECTION ELNAZHAMAI (images réelles vérifiées) ─────────────────────────
  {
    asin: "B0BJP9L9GT", slug: "kpon-chargeur-sans-fil-invisible", title: "KPON Chargeur Sans Fil Invisible Sous Bureau", brand: "KPON",
    category: "electronique", price: 47.59, rating: 4.5, reviewCount: 1823,
    prime: true, badge: "Tendance", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71aMuve-pRL._AC_SL1000_.jpg",
    description: "Ce chargeur sans fil s'installe sous votre bureau en bois et charge votre téléphone à travers jusqu'à 30 mm d'épaisseur. Fini les câbles encombrants — votre bureau reste propre et parfaitement rangé.",
    features: ["Charge à travers jusqu'à 30 mm de bois", "Compatible Qi (iPhone, Samsung…)", "Installation facile sous le bureau", "Charge rapide 15W", "Design totalement invisible"],
    tags: ["chargeur", "sans-fil", "bureau", "organisation"],
  },
  {
    asin: "B001CDP5VS", slug: "oxo-bol-melangeur-antiderapant", title: "OXO Good Grips Bol Mélangeur Antidérapant", brand: "OXO",
    category: "maison", price: 35.95, rating: 4.8, reviewCount: 12540,
    prime: true, badge: "Coup de cœur", featured: false, bentoSize: "sm",
    description: "Le fond antidérapant breveté OXO maintient le bol stable sur le plan de travail. Bec verseur intégré, poignée ergonomique et échelle graduée — le bol incontournable de la cuisine.",
    features: ["Fond antidérapant — ne glisse pas", "Bec verseur précis sans éclaboussures", "Poignée confortable ergonomique", "Échelle graduée lisible", "Compatible lave-vaisselle"],
    tags: ["cuisine", "patisserie", "bol", "oxo"],
  },
  {
    asin: "B0DQCKL1FP", slug: "panier-linge-pliable-90l", title: "Caroeas Panier à Linge Pliable 90 L avec Poignées", brand: "Caroeas",
    category: "maison", price: 15.99, rating: 4.6, reviewCount: 3241,
    prime: true, badge: "-20%", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/713iI4cOVPL._AC_SL1000_.jpg",
    description: "Le panier à linge pliable idéal pour transporter votre linge de la machine au séchoir. Grande capacité 90 L, poignées rembourrées pour un transport confortable, se plie à plat pour un rangement discret.",
    features: ["Capacité 90 L — grandes familles", "Poignées rembourrées confortables", "Se plie à plat pour le rangement", "Léger et résistant", "Idéal machine → séchoir → tiroirs"],
    tags: ["linge", "panier", "rangement", "buanderie"],
  },
  {
    asin: "B0DP4NLTTM", slug: "sac-lavage-chaussures-machine", title: "Sac de Lavage pour Chaussures en Machine", brand: "HomeKeep",
    category: "maison", price: 17.69, rating: 4.4, reviewCount: 2876,
    prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71cGNgIbytL._AC_SL1000_.jpg",
    description: "Ce sac rembourré protège vos baskets en machine : fibres douces, maintien de la forme et zéro bruit de tambour. Résultat : des chaussures propres sans effort et sans dommage.",
    features: ["Fibres douces — ne raye pas", "Maintient la forme des chaussures", "Réduit le bruit en machine", "Fermeture éclair solide", "Compatible toutes marques de baskets"],
    tags: ["chaussures", "linge", "lavage", "baskets"],
  },
  {
    asin: "B0CTMQN54K", slug: "table-repasser-pliante-compacte", title: "JUPPLIES Table à Repasser Pliable Compacte 80×30 cm", brand: "JUPPLIES",
    category: "maison", price: 32.99, rating: 4.5, reviewCount: 1654,
    prime: true, badge: "Gain de place", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71q+6f-Tg8L._AC_SL1000_.jpg",
    description: "Cette mini planche à repasser se pose sur n'importe quelle table et se plie en quelques secondes. Parfaite pour les petits espaces : appartement, studio, voyage.",
    features: ["Dimensions 80×30 cm — compact", "Se plie en quelques secondes", "Repose-fer intégré", "Surface résistante à la chaleur", "Légère — facile à transporter"],
    tags: ["repassage", "linge", "planche", "gain-de-place"],
  },
  {
    asin: "B00CFN3KHK", slug: "range-bottes-suspendu-placard", title: "Whitmor Range-Bottes Suspendu (Lot de 3 Paires)", brand: "Whitmor",
    category: "maison", price: 13.20, rating: 4.5, reviewCount: 987,
    prime: true, badge: "Organisation", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71iOe5IoCPL._AC_SL1000_.jpg",
    description: "Ces dossiers suspendus maintiennent vos bottes debout et préservent leur forme. Ils s'accrochent à votre tringle sans outil et libèrent de l'espace au sol dans le placard.",
    features: ["Lot de 3 paires de dossiers", "Maintient la forme des bottes", "Libère de l'espace au sol", "Accrochage sur tringle — sans perçage", "Compatible toutes tailles de bottes"],
    tags: ["bottes", "placard", "rangement", "organisation"],
  },
  // ───────────────────────── BEAUTÉ ─────────────────────────
  {
    asin: "B08L9VG9QP", slug: "dyson-airwrap", title: "Dyson Airwrap Complete", brand: "Dyson",
    category: "beaute", price: 499.0, oldPrice: 549.0, rating: 4.6, reviewCount: 15904,
    prime: true, badge: "Iconique", featured: true, bentoSize: "md",
    description: "L'effet Coandă coiffe les cheveux humides sans chaleur excessive — boucles, brushing, lissage. Contrôle intelligent de la chaleur pour protéger les cheveux, avec une gamme complète d'accessoires.",
    features: ["Effet Coandă : coiffage sans chaleur excessive", "Contrôle intelligent de la chaleur (mesuré 40×/s)", "Set complet multi-accessoires", "Sécher, boucler, onduler, lisser et gainer", "Moteur numérique Dyson V9"],
    tags: ["cheveux", "coiffage", "dyson", "beauté", "brushing"],
  },
  {
    asin: "B088CK6XJ4", slug: "oral-b-io-series-9", title: "Oral-B iO Series 9", brand: "Oral-B",
    category: "beaute", price: 249.0, oldPrice: 349.99, rating: 4.6, reviewCount: 21037,
    prime: true, badge: "-29%", featured: false, bentoSize: "sm",
    description: "La technologie magnétique iO combine micro-vibrations et tête de brosse ronde pour des dents 100 % plus propres. Capteur de pression 3 couleurs et affichage interactif pour guider chaque brossage.",
    features: ["Entraînement magnétique iO + micro-vibrations", "Capteur de pression intelligent (3 couleurs)", "Affichage couleur interactif", "7 modes de brossage", "Étui de voyage avec charge & suivi IA"],
    tags: ["brosse-à-dents", "oral-b", "hygiène", "beauté"],
  },
  {
    asin: "B0853C7CFQ", slug: "cerave-creme-hydratante", title: "CeraVe Crème Hydratante (454g)", brand: "CeraVe",
    category: "beaute", price: 16.99, oldPrice: 19.99, rating: 4.8, reviewCount: 96420,
    prime: true, badge: "N°1 des ventes", featured: false, bentoSize: "sm",
    description: "Développée avec des dermatologues : trois céramides essentiels et de l'acide hyaluronique restaurent la barrière cutanée et hydratent pendant 24 heures. Texture riche, sans parfum, non comédogène, pour le visage et le corps.",
    features: ["3 céramides essentiels + acide hyaluronique", "Hydratation continue 24h", "Technologie MVE à libération prolongée", "Sans parfum, non comédogène", "Visage et corps — peaux normales à sèches"],
    tags: ["soin", "hydratant", "cerave", "peau", "crème"],
  },
  // ───────────────────────── MAISON & RANGEMENT (amazon.fr, images réelles vérifiées) ─────────────────────────
  {
    asin: "B0GQM8BLMP", slug: "organisateur-tiroir-extensible", title: "Organisateur de Tiroir Extensible (14 Pièces)", brand: "mDesign",
    category: "maison", price: 24.99, rating: 4.6, reviewCount: 2140, prime: true, badge: "Tendance", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71lo4mWkm8L._AC_SL1000_.jpg",
    description: "Un kit de 14 séparateurs en 3 tailles pour organiser tiroirs de cuisine, bureau ou salle de bain. Extensibles et modulables, ils s'adaptent à toutes les dimensions.",
    features: ["14 pièces en 3 tailles", "Extensible et modulable", "Compatible cuisine, bureau, SDB", "Antidérapant", "Montage sans outil"],
    tags: ["rangement", "tiroir", "cuisine", "organisation"],
  },
  {
    asin: "B08P9XT8XX", slug: "range-couverts-bambou", title: "Range-Couverts en Bambou 5 Compartiments", brand: "Relaxdays",
    category: "maison", price: 25.99, rating: 4.7, reviewCount: 5830, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71c5T6HgzNL._AC_SL1000_.jpg",
    description: "Un organiseur en bambou naturel avec 5 compartiments pour ranger couverts et ustensiles avec élégance. Robuste, durable et facile à nettoyer.",
    features: ["Bambou naturel durable", "5 compartiments spacieux", "Finition lisse anti-échardes", "S'adapte à la plupart des tiroirs", "Entretien facile"],
    tags: ["cuisine", "couverts", "bambou", "rangement"],
  },
  {
    asin: "B0FCSSND2X", slug: "boites-verre-hermetiques-10", title: "Lot de 10 Boîtes Alimentaires en Verre Hermétiques", brand: "Uandu",
    category: "maison", price: 33.24, rating: 4.7, reviewCount: 1920, prime: true, badge: "Coup de cœur", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81yCmV6s71L._AC_SL1000_.jpg",
    description: "10 boîtes en verre borosilicate avec couvercles hermétiques à clips. Passent au four, micro-ondes, congélateur et lave-vaisselle — pour conserver et réchauffer sans plastique.",
    features: ["Verre borosilicate résistant", "Couvercles hermétiques 4 clips", "Four, micro-ondes, congélateur", "Compatible lave-vaisselle", "Sans BPA — zéro plastique au contact"],
    tags: ["conservation", "cuisine", "verre", "meal-prep"],
  },
  {
    asin: "B0CF22LPZR", slug: "boites-verre-hermetiques-18", title: "edihome Boîtes en Verre Hermétiques (18 Pièces)", brand: "edihome",
    category: "maison", price: 29.99, rating: 4.6, reviewCount: 3410, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81fW7v2C2xL._AC_SL1000_.jpg",
    description: "Ensemble de 18 pièces (9 boîtes + 9 couvercles) en verre pour une cuisine parfaitement organisée. Empilables pour gagner de la place dans les placards.",
    features: ["18 pièces (9 boîtes + couvercles)", "Verre résistant à la chaleur", "Couvercles hermétiques", "Empilables — gain de place", "Convient au meal-prep"],
    tags: ["conservation", "cuisine", "verre", "rangement"],
  },
  {
    asin: "B0GYFWPS11", slug: "boites-rangement-tissu-couvercle", title: "Lot de 4 Boîtes de Rangement en Tissu avec Couvercle", brand: "Homyfort",
    category: "maison", price: 28.99, rating: 4.6, reviewCount: 1240, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/91aDmM9mbRL._AC_SL1000_.jpg",
    description: "4 boîtes pliables en tissu avec couvercle et poignées, idéales pour ranger vêtements, linge ou jouets. Se plient à plat quand elles ne servent pas.",
    features: ["Lot de 4 avec couvercle", "Poignées de transport", "Se plient à plat", "Tissu résistant lavable", "Empilables"],
    tags: ["rangement", "placard", "tissu", "organisation"],
  },
  {
    asin: "B0FFTG4SZ1", slug: "paniers-rangement-pliables-tissu", title: "Lot de 4 Paniers de Rangement Pliables 45×28×20 cm", brand: "Homyfort",
    category: "maison", price: 23.99, rating: 4.5, reviewCount: 2670, prime: true, badge: "-20%", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71-k-7OhdvL._AC_SL1000_.jpg",
    description: "4 paniers ouverts en tissu pour étagères, placards ou buanderie. Poignées intégrées et structure semi-rigide qui garde sa forme.",
    features: ["Lot de 4 — 45×28×20 cm", "Poignées intégrées", "Structure qui garde sa forme", "Pliables pour le rangement", "Polyvalents (placard, buanderie…)"],
    tags: ["rangement", "panier", "placard", "buanderie"],
  },
  {
    asin: "B0D48ZJKLX", slug: "etageres-douche-angle-sans-percage", title: "Lot de 2 Étagères de Douche d'Angle Sans Perçage", brand: "PNNP",
    category: "maison", price: 19.99, rating: 4.5, reviewCount: 1560, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71MZEbp26wL._AC_SL1000_.jpg",
    description: "2 étagères d'angle adhésives qui s'installent sans perçage dans la douche. Acier inoxydable anti-rouille, drainage intégré pour éviter l'eau stagnante.",
    features: ["Installation sans perçage", "Acier inoxydable anti-rouille", "Drainage intégré", "Grande capacité d'angle", "Adhésif ultra-résistant"],
    tags: ["salle-de-bain", "douche", "étagère", "sans-perçage"],
  },
  {
    asin: "B0BKNYRH7L", slug: "etagere-douche-inox-304", title: "Étagère d'Angle de Douche en Inox 304 Sans Perçage", brand: "Orimade",
    category: "maison", price: 39.99, rating: 4.7, reviewCount: 4120, prime: true, badge: "Coup de cœur", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/61cNYeaUBzL._AC_SL1000_.jpg",
    description: "Étagère d'angle premium en acier inoxydable 304, montage adhésif sans perçage. Robuste, elle supporte shampoings et gels sans plier.",
    features: ["Acier inoxydable 304 premium", "Sans perçage — adhésif fort", "Supporte de lourdes charges", "Anti-rouille garanti", "Crochets intégrés"],
    tags: ["salle-de-bain", "douche", "inox", "sans-perçage"],
  },
  {
    asin: "B0FH4MWBXW", slug: "etagere-epices-extensible-2-etages", title: "Étagère à Épices Extensible 2 Étages Réglable", brand: "Kesper",
    category: "maison", price: 31.99, rating: 4.6, reviewCount: 980, prime: true, badge: "Gain de place", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81AEocwcFWL._AC_SL1000_.jpg",
    description: "Étagère à épices à 2 niveaux, hauteur et largeur réglables, pour voir tous vos flacons d'un coup d'œil. Idéale dans un placard ou sur le plan de travail.",
    features: ["2 étages — visibilité totale", "Hauteur et largeur réglables", "Métal robuste", "Placard ou plan de travail", "Montage rapide"],
    tags: ["cuisine", "épices", "étagère", "gain-de-place"],
  },
  {
    asin: "B0GTV3NVNL", slug: "etageres-epices-tiroir-lot-2", title: "Noa Home Deco Étagères à Épices pour Tiroir (Lot de 2)", brand: "Noa Home Deco",
    category: "maison", price: 16.99, rating: 4.5, reviewCount: 640, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71WyucaMVcL._AC_SL1000_.jpg",
    description: "2 range-épices extensibles à poser dans un tiroir : vos flacons inclinés et visibles instantanément. Libère le plan de travail.",
    features: ["Lot de 2 extensibles", "Flacons inclinés et visibles", "Se glissent dans le tiroir", "Antidérapant", "Libère le plan de travail"],
    tags: ["cuisine", "épices", "tiroir", "organisation"],
  },
  {
    asin: "B0FJ1YFQB5", slug: "crochets-adhesifs-inox-304", title: "Lot de 6 Crochets Adhésifs Muraux Inox 304", brand: "Uxsiya",
    category: "maison", price: 10.99, rating: 4.4, reviewCount: 3280, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71Z7m5hcA0L._AC_SL1000_.jpg",
    description: "6 crochets doubles en acier inoxydable 304 à coller sans perçage. Parfaits pour serviettes, manteaux, torchons ou clés — jusqu'à 5 kg chacun.",
    features: ["Lot de 6 crochets doubles", "Inox 304 anti-rouille", "Sans perçage — adhésif fort", "Jusqu'à 5 kg chacun", "Cuisine, SDB, entrée"],
    tags: ["crochet", "sans-perçage", "rangement", "mural"],
  },
  {
    asin: "B09NZNDG4Z", slug: "pateres-murales-adhesives-noir", title: "Feligio Lot de 4 Patères Murales Adhésives Inox Noir", brand: "Feligio",
    category: "maison", price: 11.99, rating: 4.5, reviewCount: 1870, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/61QgjNPnKnL._AC_SL1000_.jpg",
    description: "4 patères murales en acier inoxydable noir mat, design épuré, montage adhésif sans perçage. Élégantes dans une salle de bain ou une entrée.",
    features: ["Lot de 4 — noir mat", "Acier inoxydable", "Sans perçage", "Design épuré", "Résistantes à l'humidité"],
    tags: ["patère", "crochet", "salle-de-bain", "mural"],
  },
  {
    asin: "B07V32XHWS", slug: "sacs-sous-vide-pompe-12", title: "Boxlegend 12 Sacs Sous Vide + Pompe Électrique", brand: "Boxlegend",
    category: "maison", price: 28.26, rating: 4.5, reviewCount: 6120, prime: true, badge: "Tendance", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71aBMf7F1jL._AC_SL1000_.jpg",
    description: "12 sacs de compression sous vide avec pompe électrique incluse : réduisez le volume de vos couettes et vêtements jusqu'à 80 %. Idéal placards et voyages.",
    features: ["12 sacs de tailles variées", "Pompe électrique incluse", "Jusqu'à 80 % d'espace gagné", "Double zip étanche", "Protège de l'humidité et des mites"],
    tags: ["rangement", "sous-vide", "vêtements", "gain-de-place"],
  },
  {
    asin: "B0FCFJ84DC", slug: "sacs-sous-vide-vetements-20", title: "Sacs Sous Vide pour Vêtements (20 Pièces)", brand: "Hometalk",
    category: "maison", price: 36.99, rating: 4.4, reviewCount: 890, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71RJDBUpA7L._AC_SL1000_.jpg",
    description: "Kit de 20 sacs de compression en 4 tailles pour ranger vêtements, couettes et oreillers. Aspiration par aspirateur ou pompe manuelle.",
    features: ["20 sacs en 4 tailles", "Compression maximale", "Valve anti-retour", "Réutilisables", "Protègent des odeurs et de l'humidité"],
    tags: ["rangement", "sous-vide", "vêtements", "placard"],
  },
  {
    asin: "B09XJSX9J4", slug: "egouttoir-vaisselle-inox-2-niveaux", title: "Boosiny Égouttoir à Vaisselle Inox 2 Niveaux", brand: "Boosiny",
    category: "maison", price: 28.49, rating: 4.7, reviewCount: 5240, prime: true, badge: "Coup de cœur", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81Qepczr-YL._AC_SL1000_.jpg",
    description: "Égouttoir 2 niveaux en inox avec porte-couverts, porte-verres et bec d'écoulement orientable. Grande capacité sans encombrer l'évier.",
    features: ["2 niveaux — grande capacité", "Acier inoxydable anti-rouille", "Bec d'écoulement orientable", "Porte-couverts + porte-verres amovibles", "Pieds antidérapants"],
    tags: ["cuisine", "égouttoir", "vaisselle", "inox"],
  },
  {
    asin: "B0B9K6VHC2", slug: "egouttoir-vaisselle-noir-2-niveaux", title: "niffgaff Égouttoir à Vaisselle 2 Niveaux Noir", brand: "niffgaff",
    category: "maison", price: 28.99, rating: 4.5, reviewCount: 2310, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71noxCkYR2L._AC_SL1000_.jpg",
    description: "Égouttoir noir mat 2 niveaux, design moderne, avec plateau d'écoulement et accessoires amovibles. S'intègre à toutes les cuisines.",
    features: ["Design noir mat moderne", "2 niveaux", "Plateau d'écoulement", "Accessoires amovibles", "Métal traité anti-rouille"],
    tags: ["cuisine", "égouttoir", "vaisselle", "noir"],
  },
  {
    asin: "B0DLP4V9HT", slug: "organisateurs-frigo-transparents-8", title: "Pavlleen Lot de 8 Organisateurs de Frigo Transparents", brand: "Pavlleen",
    category: "maison", price: 24.99, rating: 4.6, reviewCount: 1430, prime: true, badge: "Organisation", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/810tEQpkEsL._AC_SL1000_.jpg",
    description: "8 bacs transparents avec poignées pour organiser frigo, congélateur ou placards. Empilables, ils rendent tout visible et accessible.",
    features: ["Lot de 8 avec poignées", "Plastique transparent sans BPA", "Empilables", "Frigo, congélateur, placard", "Passent au lave-vaisselle"],
    tags: ["frigo", "rangement", "cuisine", "organisation"],
  },
  {
    asin: "B0BV5Y279V", slug: "distributeurs-canettes-frigo", title: "Lot de 2 Distributeurs de Canettes pour Frigo", brand: "SANNO",
    category: "maison", price: 25.99, rating: 4.5, reviewCount: 760, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81ipLcefmvL._AC_SL1000_.jpg",
    description: "2 distributeurs auto-rechargeables qui rangent jusqu'à 12 canettes chacun dans le frigo. La canette suivante avance automatiquement.",
    features: ["Lot de 2 — 12 canettes chacun", "Rechargement automatique", "Plastique transparent", "Empilables", "Idéal sodas et boissons"],
    tags: ["frigo", "canettes", "rangement", "cuisine"],
  },
  {
    asin: "B00FF3X4SC", slug: "songmics-etagere-chaussures-10", title: "SONGMICS Étagère à Chaussures 10 Niveaux", brand: "SONGMICS",
    category: "maison", price: 24.14, rating: 4.5, reviewCount: 12680, prime: true, badge: "N°1 des ventes", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71mPZYPieCL._AC_SL1000_.jpg",
    description: "Meuble à chaussures en tissu 10 niveaux, jusqu'à 27 paires. Structure métallique stable, housse déhoussable, montage sans outil.",
    features: ["10 niveaux — jusqu'à 27 paires", "Structure métallique stable", "Housse anti-poussière", "Montage sans outil", "Gain de place à l'entrée"],
    tags: ["chaussures", "meuble", "entrée", "rangement"],
  },
  {
    asin: "B0F7KRLQRV", slug: "songmics-etagere-chaussures-3", title: "SONGMICS Étagère à Chaussures 3 Niveaux", brand: "SONGMICS",
    category: "maison", price: 15.83, rating: 4.6, reviewCount: 8940, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81J31zAiPJL._AC_SL1000_.jpg",
    description: "Étagère à chaussures compacte 3 niveaux en métal, parfaite pour l'entrée ou le couloir. Robuste et facile à monter.",
    features: ["3 niveaux compacts", "Métal robuste", "Idéale entrée / couloir", "Montage rapide", "Jusqu'à 9 paires"],
    tags: ["chaussures", "étagère", "entrée", "compact"],
  },
  {
    asin: "B0DSHDH8B3", slug: "sacs-rangement-sous-lit-60l", title: "AIOR Lot de 2 Sacs de Rangement Sous Lit 60 L", brand: "AIOR",
    category: "maison", price: 14.99, rating: 4.5, reviewCount: 1180, prime: true, badge: "-25%", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71TsYIsGjGL._AC_SL1000_.jpg",
    description: "2 sacs de rangement 60 L à glisser sous le lit, avec fenêtre transparente et poignées. Parfaits pour couettes et vêtements hors saison.",
    features: ["Lot de 2 — 60 L chacun", "Fenêtre transparente", "Poignées renforcées", "Se glissent sous le lit", "Protègent de la poussière"],
    tags: ["rangement", "sous-lit", "vêtements", "gain-de-place"],
  },
  {
    asin: "B0DRBXX3FT", slug: "lifewit-sac-rangement-transparent", title: "Lifewit Sac de Rangement Transparent Pliable", brand: "Lifewit",
    category: "maison", price: 19.99, rating: 4.6, reviewCount: 3520, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/81hKxwM1B9L._AC_SL1000_.jpg",
    description: "Grand sac de rangement transparent avec fermeture éclair renforcée et poignées. Idéal pour couettes, oreillers et linge de maison.",
    features: ["Grande capacité", "Face transparente", "Fermeture éclair renforcée", "Poignées de transport", "Pliable à plat"],
    tags: ["rangement", "linge", "placard", "transparent"],
  },
  {
    asin: "B0F2148RN6", slug: "cecolic-organiseur-maquillage-rotatif", title: "CECOLIC Organiseur de Maquillage Rotatif 360°", brand: "CECOLIC",
    category: "beaute", price: 22.99, rating: 4.7, reviewCount: 2040, prime: true, badge: "Tendance", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71pLKZ+qNvL._AC_SL1000_.jpg",
    description: "Plateau tournant 360° (Lazy Susan) de 28 cm pour organiser maquillage, soins et parfums. Rotation fluide, rebords anti-chute.",
    features: ["Rotation 360° fluide", "Grand plateau 28 cm", "Rebords anti-chute", "Compatible coiffeuse / SDB", "Facile à nettoyer"],
    tags: ["maquillage", "beauté", "organisation", "coiffeuse"],
  },
  {
    asin: "B073S4PQ6H", slug: "ameitech-organisateur-maquillage-rotatif", title: "AMEITECH Organisateur Maquillage & Bijoux Rotatif 360°", brand: "AMEITECH",
    category: "beaute", price: 24.99, rating: 4.6, reviewCount: 7310, prime: true, featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71xOcM1rsrL._AC_SL1000_.jpg",
    description: "Organisateur rotatif multi-niveaux ajustable pour maquillage et bijoux. Compartiments réglables en hauteur pour ranger pinceaux, flacons et palettes.",
    features: ["Rotation 360°", "Étages réglables en hauteur", "Grande capacité", "Plastique transparent", "Base stable antidérapante"],
    tags: ["maquillage", "bijoux", "beauté", "organisation"],
  },
  {
    asin: "B0GS53Z98C", slug: "organisateur-maquillage-rotatif-tiroir", title: "Organisateur de Maquillage Rotatif 360° avec Tiroir", brand: "Frcolor",
    category: "beaute", price: 12.99, rating: 4.4, reviewCount: 560, prime: true, badge: "-30%", featured: false, bentoSize: "sm",
    image: "https://m.media-amazon.com/images/I/71DBvk-eE1L._AC_SL1000_.jpg",
    description: "Organisateur rotatif compact à 2 niveaux avec tiroir, parfait pour cotons, pinceaux et petits accessoires. Idéal sur une coiffeuse ou un plan de salle de bain.",
    features: ["Rotation 360°", "2 niveaux + tiroir", "Compact", "Rangement cotons & pinceaux", "Facile à nettoyer"],
    tags: ["maquillage", "beauté", "organisation", "tiroir"],
  },
];

const products = P.map((p) => ({
  asin: p.asin,
  slug: p.slug,
  title: p.title,
  brand: p.brand,
  category: p.category,
  price: p.price,
  ...(p.oldPrice && p.oldPrice > p.price ? { oldPrice: p.oldPrice } : {}),
  currency: "EUR",
  rating: p.rating,
  reviewCount: p.reviewCount,
  prime: p.prime,
  images: [p.image || img(p.asin)],
  description: p.description,
  features: p.features,
  ...(p.badge ? { badge: p.badge } : {}),
  tags: p.tags,
  priceHistory: history(p.asin, p.price, p.oldPrice),
  amazonUrl: `https://www.amazon.fr/dp/${p.asin}`,
  featured: Boolean(p.featured),
  bentoSize: p.bentoSize,
}));

writeFileSync(join(DATA, "featuredProducts.json"), JSON.stringify(products, null, 2));
writeFileSync(join(DATA, "customProducts.json"), JSON.stringify([], null, 2));
console.log(`Wrote ${products.length} real products to featuredProducts.json`);
console.log(`Featured (bento): ${products.filter((p) => p.featured).length}`);
