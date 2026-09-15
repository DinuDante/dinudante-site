# Maintenance — dinudante.in

Static HTML on GitHub Pages. No framework, no runtime dependencies; everything
under `node_modules/` is build and QA tooling and is never shipped.

## Source of truth

| What | Where |
| --- | --- |
| Products | `master_dataset.json` — the only product source |
| Reviewed categories and display names | `curate_dataset.js` |
| Header, footer, shared head metadata, navigation | `site_shell.js` |
| Design tokens and shared components | `assets/site.v4.css` |
| Page layout | `assets/home.css`, `assets/resume.css`, `assets/setup.css` |
| Shared behaviour | `assets/theme-init.js` (pre-paint), `assets/site.v5.js` (deferred) |
| Catalogue behaviour | `assets/setup.js` |

`setup.html` is generated. Never edit it by hand — the next build overwrites it.

## Changing products

1. Edit `master_dataset.json` (add, remove or correct a record). Keep `asin`,
   `title`, `image`, `url` and `primaryCategory` populated, and set
   `personallyTested` honestly.
2. Add or update the matching entry in `curate_dataset.js` — it refuses to run
   if a product has no review entry, or a review entry has no product.
3. Rebuild:

```
node curate_dataset.js
node build_setup.js
node build_pages.js
```

Card counts, filter labels, the hero totals and both JSON-LD blocks all follow
from the dataset, so they cannot disagree with what is rendered.

## Changing a page

Edit the page body between the shell markers, then run `node build_pages.js` so
the header, footer, head metadata and asset URLs stay identical everywhere.
Bump `ASSET_VERSION` in `build_pages.js` whenever a stylesheet or script changes.

## Regenerating the résumé PDF

```
node generate_pdf.js          # renders resume.html to assets/Dinesh_Behera_Resume.pdf
node render_pdf_pages.js      # every page to screenshots/pdf-after/ — look at them
node inspect_pdf.js           # pages, size, links, metadata, extractable text
```

`generate_pdf.js` aborts if a stylesheet, font or image failed to load, or if no
`@media print` block reached the page, so a silently unstyled PDF cannot ship.
Always look at the rendered pages before committing.

## Images

```
node build_images.js
```

Regenerates the header mark, icons, the print portrait variant and the 1200 × 630
share card from the masters in `assets/`. See `ASSET_MANIFEST.md`.

## Verifying before release

```
node qa_run.js                # 5 routes x 12 widths x 2 themes: overflow, axe, screenshots
node qa_interactions.js       # 52 behavioural checks; exits non-zero on failure
node check_links.js --external # internal + external destination inventory
node measure_perf.js 3        # Lighthouse mobile, median of 3
```

Evidence lands in `screenshots/` (git-ignored). Inspect the screenshots and the
PDF pages — do not release on a green summary line alone.

## Deploying

Commit the HTML, CSS, JS, `master_dataset.json`, `assets/` and the docs, push
`main`, wait for the Pages deployment to report success against that commit,
then verify the live HTML, the shared script's content type, the assets and the
PDF rather than trusting the local build.

## Gotchas

- Write files as UTF-8. A PowerShell redirect once wrote `assets/home.css` and
  `.gitignore` as UTF-16, which corrupted both silently.
- Do not add `overflow-x: hidden` to `html` or `body`. It hides real overflow
  and disables `position: sticky` on the header.
- Do not redefine shared components in a page stylesheet.
- Keep the two preserved Amazon short links and their affiliate attribution
  intact; see `HANDOFF.md`.
