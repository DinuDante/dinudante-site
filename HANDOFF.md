# Handoff — dinudante.in

Current owner of this document: whoever picks the work up next. Keep it accurate.

| Field | Value |
| --- | --- |
| Repository | `git@github.com:DinuDante/dinudante-site.git`, branch `main` |
| Hosting | GitHub Pages at https://dinudante.in |
| Authoritative brief | `AGY_dinudante_in_Production_Prompt.md` (Downloads) |
| Supporting audit | `DinuDante_Critical_Website_Audit_2026-09-15.md` (Downloads) |
| Long-lived project facts | `PROJECT_CONTEXT.md` |
| Inherited checkpoint | commit `0822406` (16 September 2026) — verified release |
| Current release | commit `c4734fb` (tools/photos.js added) — pending push |
| Previous release | commit `0822406`, deployed and verified live on 16 September 2026 |
| Current state | **Technical scope complete. Blocked on owner content (Instagram exports, exact dates, education updates).** |

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

node tools/visual_evidence.js   # full-page shots per route x 3 widths x 2 themes,
                                # plus 320px reflow and 200% zoom with overflow checks
node tools/focus_audit.js       # tabs every control on every route: visible? indicated?
                                # clear of sticky chrome? (WCAG 2.2 SC 2.4.11)
node tools/cross_browser.js     # the same behavioural contract on Playwright instead of
                                # Puppeteer; Firefox/WebKit arms included but blocked here
```

`tools/*` are engineering scripts. `_config.yml` keeps them out of the published
site — check that before adding another one.

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

## Things this session learned the hard way

- **A zero-overflow result is not a responsive layout.** The catalogue passed 130
  overflow checks while tablets scrolled further than phones (27,833 px at 820 px
  against 19,733 px at 390 px) and 320 px reached 43,925 px. Measure *page depth
  and column count across widths*, not just whether something pokes out sideways.
  `node tools/cross_browser.js` and the sweep in the QA report cover this now.
- **`aspect-ratio` does not bind a flex item.** `.gear-card__media` had
  `aspect-ratio: 4 / 3` and still rendered anywhere from 164 px to 281 px tall,
  because a flex item's automatic minimum size lets tall content force it open.
  The image is now placed absolutely inside the ratio box. If you touch that rule,
  re-measure all 93 media boxes — they should all be identical.
- **Bounding boxes do not tell you what is on top.** Checking SC 2.4.11 by
  intersecting rectangles reported the skip link as obscured on all 30
  route/theme/width combinations; it actually paints above the header. Use
  `elementFromPoint`, and confirm with a screenshot before believing a finding.
- **Clicking the centre of a wrapped inline link is unreliable.** Puppeteer's
  `page.click` targets the bounding-box centre, which for a two-line link can sit
  between the line boxes — or, after filtering shortens the document, underneath
  the sticky header. `qa_interactions.js` now scrolls the target clear and clicks
  its first line box.
- **Firefox and WebKit cannot run on this machine.** They download fine, but
  Windows Application Control blocks the binaries
  (`An Application Control policy has blocked this file`). Do not spend time on
  `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS` or reinstalling — the policy is the
  blocker, and it is not ours to work around. Run `tools/cross_browser.js`
  elsewhere to get those two engines.
