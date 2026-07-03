# Catalogue Image Assets — What to Gather

## TL;DR
Gather **8–10 real orchid photos** (one strong hero shot per variety, square crop) to cover the visible catalogue. That's enough to make the storefront look real for demo/screenshot purposes — you don't need all 520 seeded products photographed, just the ones a viewer will actually scroll past.

## Why 8–10 and not 30 or 520
- `scripts/seed.js` creates **520 products**: 30 "real" named orchids + 490 faker-generated filler products.
- Only the 30 real orchids currently get a `product_images` row at all (seed.js lines 445–459), and even those point to a Cloudinary account that doesn't exist (`res.cloudinary.com/orchids/...` — the seed script's own log literally calls them "placeholder images").
- The 490 faker products have **zero** image references and fall back to a 🌿 emoji — fine to leave as-is, nobody demos those individually.
- A catalogue grid typically shows the first 8–12 items above the fold. If those look real (actual orchid photos, consistent square crop), the whole page reads as populated. Buyers/reviewers rarely scroll to product #400.

If you want more headroom (e.g. for the detail-page gallery, see below), aim for **10 images** — one per the most visually distinct varieties — rather than spreading effort thin across all 30 named types.

## Where images are required in the code

| Location | File | What it needs |
|---|---|---|
| Product grid card | [ProductCard.jsx](apps/web/src/components/domain/ProductCard.jsx) | `product.imageUrl`, square crop, `object-cover` |
| Cart line item | [ProductCard.jsx](apps/web/src/components/domain/ProductCard.jsx) (`CartItem`) | 64×64 thumbnail |
| Admin/inventory table row | [ProductCard.jsx](apps/web/src/components/domain/ProductCard.jsx) (`ProductTable`) | 40×40 thumbnail |
| Product detail page | [apps/web/app/(buyer)/buyer/catalogue/[id]/page.js](<apps/web/app/(buyer)/buyer/catalogue/[id]/page.js>) (lines 45, 56–71) | Gallery: hero image + row of 64×64 thumbnails, reads `product.images[]` |
| DB schema | [apps/api/migrations/0004_trade_catalogue.sql](apps/api/migrations/0004_trade_catalogue.sql) (lines 123–131) | `product_images` table: `product_id`, `cloudinary_public_id`, `url`, `is_primary`, `sort_order` |
| Seed data (broken today) | [scripts/seed.js](scripts/seed.js) (lines 445–459) | Points to non-existent Cloudinary URLs — needs updating once real images exist |

## Image spec
- **Aspect ratio:** square (1:1) — every card, thumbnail, and gallery hero uses `aspect-square` + `object-cover`.
- **Minimum useful resolution:** ~800×800px (safely covers hero display and downsizes cleanly for thumbnails).
- **Style:** clean/neutral background works best since cards crop tightly to square — avoid busy backgrounds that get cut off.

## What to shoot / source (suggested 10)
Pick the most visually distinct varieties from the 30 seeded names so the grid doesn't look repetitive:
1. Phalaenopsis 'Moth Orchid White'
2. Phalaenopsis 'Pink Fairy'
3. Dendrobium 'Sonia Red'
4. Cattleya 'Purple Queen'
5. Vanda 'Blue Magic'
6. Vanda 'Miss Joaquim'
7. Oncidium 'Golden Shower'
8. Paphiopedilum 'Venus Slipper'
9. Cymbidium 'Ruby Red'
10. Zygopetalum 'Blue Nectar'

## Wiring them in
Once you have the files:
1. Drop them in `apps/web/public/products/` (simplest — no external account needed) or upload to a real Cloudinary account and update `apps/api/src/config/cloudinary.js`.
2. Update `scripts/seed.js` (lines 445–459) to point `product_images.url` at the real paths instead of the dead `res.cloudinary.com/orchids/...` URLs.
3. Re-run the seed script.

No product image files or working `/uploads` folder exist in the repo today — every current reference is a dead remote URL (0 of 520 seeded products have a working image), so any real photo you drop in is a strict improvement.
