# Guide vendeur — Lumi Budget sur Etsy

Ce dossier contient tout ce qu'il faut pour vendre l'application : l'app elle-même, une démo gratuite, 8 images d'annonce, le PDF à livrer à l'acheteur et le texte de l'annonce.

## 1. Ce que tu as

| Fichier | À quoi ça sert |
|---|---|
| `dist/Lumi-Budget-Planner.html` | **L'app complète**, version hors ligne. C'est le fichier que l'acheteur télécharge. |
| `dist/Lumi-Budget-Demo.html` | La **démo gratuite** (données d'exemple, remise à zéro à la fermeture de l'onglet, sans sauvegarde). |
| `../public/lumi/planner-…/` | La version **en ligne** (même app + installation sur téléphone). Le lien privé de l'acheteur. |
| `../public/lumi/planner-…/demo/` | La démo en ligne, à mettre en lien dans l'annonce. |
| `etsy/images/*.jpg` | 8 images d'annonce en 2000×2000. |
| `etsy/Lumi-Budget-Buyer-Guide.pdf` | Le PDF « Start here » livré à l'acheteur (contient son lien). |
| `etsy/LISTING.md` | Titre, 13 tags, description, FAQ et message aux acheteurs, prêts à copier. |

## 2. Personnaliser (5 minutes)

Ouvre `budget-planner/config.json` :

```json
{
  "appName": "Lumi Budget",
  "shopUrl": "https://www.etsy.com/shop/YOUR-SHOP-NAME",
  "hostedDir": "lumi/planner-ec98eebc3064",
  "publicUrl": "https://YOUR-DOMAIN.com"
}
```

- `appName` : le nom de l'app. **Vérifie qu'il n'est pas déjà une marque déposée** avant de vendre.
- `shopUrl` : le lien de ta boutique Etsy (utilisé dans la démo et le PDF).
- `publicUrl` : l'adresse de ton site une fois en ligne (voir étape 3).
- `hostedDir` : le chemin « secret » de l'app en ligne. Change-le si tu veux un autre lien.

Puis régénère tout :

```bash
npm run planner:etsy      # app + démo + images + PDF
# ou seulement l'app :
npm run planner:build
```

Le rendu des images a besoin de Playwright : `npm i -D playwright` si ce n'est pas installé.

## 3. Mettre l'app en ligne (gratuit)

Le plus simple : **Netlify Drop** ou **Cloudflare Pages** (offres gratuites, vérifie leurs conditions pour un usage commercial).

1. Va sur <https://app.netlify.com/drop>.
2. Glisse-dépose le dossier **`public`** du projet.
3. Netlify te donne une adresse, par exemple `https://lumi-budget.netlify.app`.
4. Mets cette adresse dans `publicUrl` (config.json), puis relance `npm run planner:etsy` pour que le PDF contienne le bon lien.

Le lien de l'acheteur sera : `https://lumi-budget.netlify.app/lumi/planner-ec98eebc3064/`
La démo : `https://lumi-budget.netlify.app/lumi/planner-ec98eebc3064/demo/`

Tu peux aussi déployer tout le site Next.js : le dossier `public/` est servi au même chemin. Attention, l'offre gratuite de Vercel (Hobby) est réservée à un usage non commercial.

> Le lien « secret » n'est pas une vraie protection : quelqu'un qui le partage le partage. C'est pareil pour tous les produits numériques sur Etsy.

## 4. Créer l'annonce Etsy

1. **Ajouter une annonce** → type **Numérique**.
2. Photos : importe `etsy/images/01-hero.jpg` en premier (c'est la miniature), puis les autres dans l'ordre.
3. Titre, tags, description : copie-les depuis `etsy/LISTING.md`.
4. Fichiers numériques : `Lumi-Budget-Buyer-Guide.pdf` et `Lumi-Budget-Planner.html` (zippe le HTML si Etsy le refuse).
5. Prix conseillé au lancement : **12,99 $** avec une promo affichée. Remonte vers 17,99–24,99 $ après tes 10 premiers avis.
6. Colle le lien de la **démo** dans la description (ligne « TRY THE FREE DEMO FIRST »).

## 5. Astuces pour vendre plus

- **Vidéo** : enregistre 10 secondes d'écran (Today → ajouter une dépense → confettis). Les annonces avec vidéo attirent plus de clics.
- **Démo gratuite** : c'est ton meilleur argument (le concurrent le met en avant aussi).
- **Avis** : propose une petite remise aux 10 premiers acheteurs en échange d'un avis honnête (respecte les règles d'Etsy : pas d'avis contre récompense obligatoire).
- **Tags** : après 30 jours, regarde les statistiques Etsy et remplace les tags qui ne rapportent rien (alternatives dans `LISTING.md`).
- **Couleurs** : tu peux refaire les images dans une autre palette (sauge, lavande…) pour une 2ᵉ annonce « Sage Budget Planner ».

## 6. Ce qui rend ton app meilleure que celle du concurrent

- Safe to spend **du jour** et du mois, avec le détail du calcul affiché.
- **Plan par paie** : quelles factures payer avec chaque salaire.
- **Simulateur de dettes** boule de neige / avalanche, avec date de fin et intérêts économisés.
- **Impulse Pause**, défi no-spend, séries, 15 badges et confettis : des récompenses pensées pour le TDAH.
- **Mode Focus**, **flou des montants**, police **Lexend** lisible, grand texte.
- 8 thèmes et une couleur libre, mode jour / nuit / auto.
- Import et export CSV, sauvegarde, impression, 24 devises.
- Installable sur téléphone et utilisable hors ligne, sans abonnement.
