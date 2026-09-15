# Asset manifest — dinudante.in

Generated for the 15 September 2026 release. Every delivered image was inspected
at its rendered size, not judged by filename. Masters are kept in the repository
but are not referenced by any page.

## Identity and brand

| Delivered file | Dimensions | Size | Source / provenance | Used for | Notes |
| --- | --- | ---: | --- | --- | --- |
| `masters/logo.png` | 1254 × 1254 | 1.79 MB | Owner-supplied portrait logo master | **Master only — excluded from the published site by `_config.yml`** | Kept for regeneration. Previously served as the 38 px header mark and as every social preview. |
| `assets/logo-nav.png` | 88 × 88 | 5.7 KB | Derived from `logo.png` | Header mark (`.mark-symbol`, rendered 38 × 38, 2× for retina) | Replaces a 1.79 MB request with 5.7 KB — a 99.7% reduction on the header image. |
| `assets/share-card.png` | 1200 × 630 | 208 KB | Purpose-built: SVG typography composited over the professional portrait | `og:image` / `twitter:image` on all five routes | Correct 1.91:1 ratio for `summary_large_image`. Name, role, teaching/maker lines and location are rendered as real text, spell-checked before shipping. Replaces the square logo, which cropped badly in large-image cards. |
| `assets/apple-touch-icon.png` | 180 × 180 | 56 KB | Derived from `logo.png` | iOS home screen | |
| `assets/icon-192.png` | 192 × 192 | 18 KB | Derived from `logo.png` | Android / PWA icon | Was 64 KB. |
| `assets/icon-512.png` | 512 × 512 | 93 KB | Derived from `logo.png` | Android / PWA icon | Was 396 KB. |
| `assets/favicon-32x32.png` | 32 × 32 | 2.9 KB | Derived from `logo.png` | Browser tab | |
| `assets/favicon-16x16.png` | 16 × 16 | 1.0 KB | Derived from `logo.png` | Browser tab | |
| `favicon.svg` | vector | 283 B | Existing owner asset | Browser tab (vector-capable browsers) | Unchanged. |

## Portraits

| Delivered file | Dimensions | Size | Provenance | Used for | Crop / focal point |
| --- | --- | ---: | --- | --- | --- |
| `assets/dinesh-professional.webp` | 720 × 960 | 36 KB | Owner-approved professional portrait | Homepage hero, résumé header, share card, `Person.image` | `object-position: center 18%` keeps the face centred in the 3:4 hero frame and in the résumé's 150 × 200 box at every width. Loaded with `fetchpriority="high"` as the LCP candidate. |
| `assets/dinesh-professional-300.webp` | 300 × 400 | 8.1 KB | Derived from the portrait master | Print / PDF résumé (`srcset` candidate) | The PDF box is 24 × 31 mm. Serving the 720 px master there was a large part of the old 672 KB PDF; the file is now 202 KB. |
| `assets/dinesh-maker.webp` | 720 × 926 | 82 KB | Owner-approved maker portrait | DDPrinterZ section | Deliberate compact crop: 170 × 213 on desktop, 140 × 175 on phones, `object-position: center top`. Lazy-loaded (below the fold). |

No portrait was retouched, recomposed or relocated to a fabricated setting.

## Product imagery — setup catalogue

All 93 product photographs are the marketplace's own images for that exact
listing, served from `m.media-amazon.com` and referenced from
`master_dataset.json`. Each record pairs one image URL with one catalogue ASIN,
one display name and one outbound URL, so an image cannot drift away from the
product it belongs to.

- Presentation is uniform: a fixed 4:3 frame, `object-fit: contain`, consistent
  padding, and a light plate behind every product in both themes so silhouettes
  read the same way.
- Explicit `width`/`height` are set on every image, so the grid does not shift
  as photographs arrive.
- All 93 are lazy-loaded; `<link rel="preconnect">` to the image host removes
  the connection cost from the first one.
- Third-party image loading is disclosed on the privacy page.

**Limitation, stated honestly:** matching each image to the exact *model and
variant* was verified from the marketplace listing each record links to — the
image and the URL come from the same listing. Independent physical verification
of colour/size variants against the items the owner actually owns is an
owner-dependent check and is not claimed here.

## What was deliberately not added

No stock photography, no invented project screenshots, no fabricated client
logos, no generated "server room" imagery, and no illustration presented as
evidence of work. Where authentic material does not exist, the section is
typographic instead.
