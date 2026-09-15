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


---

# Instagram photography request — 16 September 2026

Requested: use authentic photographs from the owner's verified personal Instagram
account wherever they strengthen the portfolio, with source post URLs recorded here.

**Outcome: retrieval is blocked, and no photograph was added or changed.** No
placeholder, stock or generated image was substituted. Everything below is what
was actually attempted and what is actually needed.

## The handle, taken from the repository rather than guessed

Searching every tracked and untracked file for an Instagram URL or handle returns
exactly one account, in 42 places:

| Handle | Link text on the site | Where |
| --- | --- | --- |
| `https://www.instagram.com/ddprinterz/` | "DDPrinterZ on Instagram" | `index.html`, `resume.html`, `setup.html`, `404.html`, `privacy/index.html`, `site_shell.js` |

**No personal account handle exists anywhere in the repository.** `ddprinterz` is
the DDPrinterZ *studio* account — the maker identity, per `PROJECT_CONTEXT.md` —
not a personal profile. The instruction was not to guess the handle, so none was
guessed and no other account was contacted. If a separate personal account should
be used, its handle has to be supplied; it is not derivable from this repository.

## Retrieval attempts and their exact results

All against the one verified handle, on 16 September 2026:

| Method | Result |
| --- | --- |
| `WebFetch https://www.instagram.com/ddprinterz/` | Returned the page title only. No posts, captions, image URLs or bio. |
| `curl` the profile with a current desktop browser user-agent | HTTP 200, 629,386 bytes — but it is the logged-out JavaScript shell. Markers `PolarisLoggedOut` / `LoggedOut` present. **Zero** `cdninstagram`/`fbcdn` image URLs, **zero** `/p/<shortcode>/` post links, and none of `biography`, `profile_pic_url_hd` or `edge_owner_to_timeline_media`. `<title>` is the generic `Instagram`. |
| `GET /?__a=1&__d=dis` | HTTP 201, 0 bytes. |
| `GET i.instagram.com/api/v1/users/web_profile_info/?username=ddprinterz` with the public web app id | HTTP 401 — `{"require_login":true,"status":"fail"}`. |
| Browser automation against the owner's own signed-in Chrome | Unavailable: "Claude in Chrome is turned off in your settings." |

Instagram serves no post data to logged-out clients. This is a platform access
control, not a site defect, and it is not something to work around.

## Photographic originals that do exist locally

The complete inventory, verified by decoding each file rather than reading names:

| File | Dimensions | Type | Assessment |
| --- | --- | --- | --- |
| `assets/dinesh-professional.webp` | 720 × 960 | Photograph — studio headshot, suit, grey backdrop | In use: homepage hero, résumé header, share card |
| `assets/dinesh-maker.webp` | 720 × 926 | Photograph — studio headshot, olive polo, **white backdrop** | In use: DDPrinterZ section |
| `masters/logo.png` | 1254 × 1254 | **Not a photograph** — stylised illustrated avatar in a gold ring | Brand mark only; source for the nav mark and icons |

There is no workshop, 3D-print, teaching, classroom, desk or project photograph
anywhere in the repository. Both photographs are plain studio headshots.

**The existing hero portrait is not a resolution compromise.** The largest it ever
renders is 358 × 478 CSS px, at 2560 px viewport; a 2× device needs 716 × 956, and
the original is 720 × 960. It is correctly sized, and was left unchanged as
instructed — no better authentic photograph is available to replace it.

Product photography was not touched: all 93 remain the marketplace's own image for
the exact listing each record links to.

## Exact missing exports

Supply these as original-quality files (straight from the camera or the Instagram
"Download your information" export — not screenshots, not re-saved from the feed at
display size). For each, the post URL is needed so it can be recorded here.

Minimum pixel sizes are 2× the largest size the slot ever renders, measured on the
built page at 390 / 768 / 1440 / 2560 px viewports.

| # | Placement | Why it strengthens the section | Aspect | Minimum source | Deliberate mobile crop |
| ---: | --- | --- | --- | --- | --- |
| 1 | DDPrinterZ section — replace the studio headshot | The brief asks for "an actual DDPrinterZ creation or a real workshop image that explains the work". A white-backdrop headshot shows nothing about the making. | 4:3 landscape | **2400 × 1800** | Subject in the central 60% so a 1:1 phone crop still reads |
| 2 | DDPrinterZ section — a finished print, shot plainly | Evidence of output, matching the Design / Engineering / Storytelling trio | 1:1 | **1600 × 1600** | Object centred, even margin |
| 3 | ProLEAP Academy section — a genuine teaching or lab moment | That section is currently typographic with no image at all | 3:2 landscape | **2400 × 1600** | **Faces of students must not be identifiable without their consent** — prefer over-the-shoulder, hands-on-keyboard or whiteboard framing |
| 4 | Professional / engineering section — a real workspace | The brief forbids stock server-room imagery as proof; a genuine desk is the honest alternative | 3:2 landscape | **2400 × 1600** | **No client names, hostnames, IPs, dashboards or ticket IDs legible on any screen** |
| 5 | Optional: an alternative hero portrait | Only if a clearly better authentic photograph exists; otherwise the current one stays | 3:4 portrait | **1440 × 1920** | Eyeline in the upper third, matching `object-position: center 18%` |

Naming when they arrive: `assets/ddprinterz-workshop.webp`,
`assets/ddprinterz-print.webp`, `assets/proleap-teaching.webp`,
`assets/workspace.webp`. Each gets `srcset` variants at 1×/2× for its slot,
explicit `width`/`height`, `loading="lazy"` below the fold, and a row in the
Portraits/Imagery table above with its source post URL, capture context and alt
text.

## Treatment the new photographs will get

Defined now so the work is mechanical once the files exist, and so the result stays
consistent with the catalogue's existing discipline:

- One fixed aspect box per slot with the image placed absolutely inside it, the same
  technique the product cards use — a tall or wide photograph cannot then stretch its
  container or shift the row. (See the 16 September fix in `QA_REPORT.md`.)
- A single neutral plate behind every photograph in both themes, so images do not
  glow in dark mode or wash out in light mode.
- `object-position` set per image from its real focal point, not left at `center`.
- No filters, no colour grading, no vignettes, no text baked into any image.
- Contrast re-checked with axe in both themes after each image lands, because
  captions and badges over photography are where contrast regressions appear.

## What was deliberately not done

No stock photograph, no AI-generated "workshop" or "server room" image, no
illustration presented as project evidence, and no image pulled from an account
other than the one verified link in this repository. Where authentic material does
not exist, the section stays typographic — which is what it does today.
