# Handoff — dinudante.in

Current owner of this document: whoever picks the work up next. Keep it accurate.

| Field | Value |
| --- | --- |
| Repository | `git@github.com:DinuDante/dinudante-site.git`, branch `main` |
| Hosting | GitHub Pages at https://dinudante.in |
| Authoritative brief | `AGY_dinudante_in_Production_Prompt.md` (Downloads) |
| Supporting audit | `DinuDante_Critical_Website_Audit_2026-09-15.md` (Downloads) |
| Long-lived project facts | `PROJECT_CONTEXT.md` |
| Inherited checkpoint | commit `a2dd77c` — the previous agent's uncommitted tree, committed verbatim before any new work |
| Current release | commit `68154bf`, deployed and verified live on 15 September 2026 |
| Superseded one-off scripts | removed from the tree in `68154bf`; recoverable from `a2dd77c` |

## Build and verify

```
node curate_dataset.js     # reviewed taxonomy + short display names -> master_dataset.json
node build_setup.js        # setup.html generated entirely from master_dataset.json
node build_images.js       # logo variants, icons, share card, print portrait
node build_pages.js        # shared head/header/footer/asset refs into every route
node generate_pdf.js       # assets/Dinesh_Behera_Resume.pdf from the final resume.html

node qa_run.js             # 12 widths x 2 themes x 5 routes: layout, axe, screenshots
node qa_interactions.js    # behavioural regression tests for every fixed defect
node check_links.js --external   # internal + external destination inventory
node render_pdf_pages.js   # renders each PDF page to screenshots/pdf-after/
node inspect_pdf.js        # PDF pages, size, links, metadata, extractable text
```

Always run `curate_dataset.js -> build_setup.js -> build_pages.js` in that order after touching
product data, and `build_pages.js` last after any page edit.

## Rules that are easy to break

- `master_dataset.json` is the only product source. Counts, filters, featured cards and JSON-LD
  are all derived from it; never hand-edit `setup.html`.
- Do not reintroduce `overflow-x: hidden` on `html`/`body`. It masks real overflow and it silently
  disabled `position: sticky` on the header.
- `site.v4.css` owns shared tokens and components; `home.css`, `resume.css` and `setup.css` must
  not redefine them.
- Write files as UTF-8. Two files in the inherited tree (`assets/home.css`, `.gitignore`) had been
  written as UTF-16 by a PowerShell redirect and were silently broken.
- The two Amazon short links `https://link.amazon/B02oIJdYW` (ARZOPA, catalogue ID `B0CRKGKZVX`)
  and `https://link.amazon/B057fmWSL` (Ambrane Powerlit Ultra, catalogue ID `B0BYVDM93V`) and their
  affiliate attribution must be preserved. Do not infer an ASIN from a short-link token.
- Never extend the "Bought and used by me" label to items where `personallyTested` is false.
