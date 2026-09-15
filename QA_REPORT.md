# QA report — dinudante.in, 15 September 2026 release

Scope: complete the implementation described in
`AGY_dinudante_in_Production_Prompt.md`, taking over from an agent session that
was interrupted by a quota error with uncommitted work in the tree.

Everything below was measured on this machine. Where something could not be
tested, it is listed as **blocked** or **untested**, not as a pass.

## Environment

| | |
| --- | --- |
| Engine | Chromium via Puppeteer 25.11.0 — Chrome 153.0.8010.36 |
| Lighthouse | 13.4.1, mobile form factor, simulated throttling, 3 runs per route, median reported |
| Accessibility engine | axe-core, tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa` |
| Host | Windows 11, local static server mirroring GitHub Pages (unknown paths serve `404.html` with status 404) |
| Evidence | `screenshots/` — `qa-final/results.json`, `interactions.json`, `links.json`, `performance.json`, `pdf-after/`, `evidence/` |

## Result summary

| Check | Result |
| --- | --- |
| Layout / overflow: 5 routes × 12 widths × 2 themes | **130 checks, 0 horizontal-overflow failures** |
| axe WCAG A/AA: 5 routes × 2 themes | **10 scans, 0 violations** (was 6) |
| Console errors / failed requests across all routes | **0** (was 1 route with a 404 stylesheet) |
| Behavioural regression suite | **52 / 52 passed** |
| Internal routes | 5 checked, 0 failures |
| Subresource responses | 36 checked, 0 failures |
| In-page anchors | 21 checked, 0 unresolved |
| External destinations | **102 checked, 102 reached, 0 unverified** |
| Controls below the project's 44 × 44 px preference | **0** (was 38 distinct controls) |
| Downloadable PDF | 1 A4 page, 202 KB, 4 working links, 2,666 chars of selectable text, full metadata |

## Viewport matrix

Every route tested at **320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440,
1920 and 2560 CSS px**, in both `night` and `day`, with short (780 px) heights
on phone widths. No page-level horizontal overflow at any combination.
Screenshots captured and visually inspected at 390 (phone), 768 (tablet) and
1440 (desktop, full page) in both themes, plus 320 and 2560 extremes.

`overflow-x: hidden` was **removed** from `html`/`body`. The zero-overflow
result above is therefore real containment — grid children carry `min-width: 0`,
tracks use `minmax(0, 1fr)`, and media is bounded — not a hidden scrollbar.

## Performance (laboratory, not field)

Lighthouse mobile, median of 3 runs per route, against the local build.

| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | Transferred |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | **100** | 100 | 100 | 100 | 1,653 ms | 0 | 6 ms | 91 KB |
| `/resume.html` | **100** | 100 | 100 | 100 | 1,371 ms | 0 | 24 ms | 67 KB |
| `/setup.html` | **97** | 100 | 100 | 100 | 2,211 ms | 0.002 | 0 ms | 442 KB |
| `/privacy/` | **100** | 100 | 100 | 100 | 1,128 ms | 0 | 0 ms | 46 KB |

Targets from the brief: Performance ≥ 90, other categories ≥ 95, LCP ≤ 2.5 s,
CLS ≤ 0.1. **All met on all four routes.**

`/setup.html` carries 93 lazy-loaded third-party product photographs, which is
why it transfers more and reaches LCP later than the others; it is still inside
the target.

**CLS regression found and fixed during this pass.** The first measured run
showed CLS 0.108 / 0.109 / 0.102 on résumé, setup and privacy — above target.
Lighthouse's `layout-shift-elements` audit attributed the shift to `<main>`.
Cause: the navigation only collapsed behind the menu button once the deferred
script added `menu-ready`, so on narrow screens the header was briefly two rows
tall and the whole page moved up when the script ran. The collapse now keys off
a `js` class set by the render-blocking head script, before first paint. The
no-JavaScript fallback is unchanged — without scripting the class is never set
and the links stay visible. Re-measured: 0 / 0 / 0.002.

**Not claimed:** no field Core Web Vitals, no CrUX percentiles, no real-user INP.
These are laboratory numbers from one machine.

## Behavioural tests — 52 / 52

`node qa_interactions.js`. Full output in `screenshots/interactions.json`.

**Shared script, theme, persistence (12)** — `site.v5.js` returns 200 as
`text/javascript`; no failing subresource on any route; the script initialises;
the control's label always describes the action it will perform; activating it
changes `data-theme`, the rendered background, `aria-pressed`, the visible
LIGHT/DARK state and `<meta name="theme-color">`; the choice is written to
`localStorage`, survives a reload and carries across routes; the control works
on home, résumé and setup; it still works when `localStorage` throws.

**Sticky header and anchors (4)** — header computes to `position: sticky`; **no
ancestor has a non-visible overflow** (the original root cause); the header is
still at `top: 0` after scrolling 2,000 px; an activated anchor lands below the
header rather than under it.

**Mobile navigation at 390 px (6)** — menu button visible and links collapsed;
opening exposes `aria-expanded="true"` and all 6 links inside the viewport;
Escape closes it and returns focus to the button; **no inline styles survive a
close**; selecting an in-page link closes the menu and moves focus to the target
section; widening to 1,280 px leaves a clean static header.

**Without JavaScript (2)** — all 6 navigation links remain visible and usable;
all 93 products render.

**Setup catalogue (18)** — 93 items on load with the count reading "93 items";
**all 11 category buttons** match the dataset counts shown in their own labels,
expose `aria-pressed`, and leave exactly one selected; search is
case-insensitive and whitespace-normalised (`"  ARZOPA  "` → 1 result, reading
"1 item", not "1 items"); the clear button empties the field; search combines
predictably with a category (every visible card satisfies both); a reset control
appears whenever anything is filtered and restores all 93; an unmatched query
shows an explanatory empty state with a "Show all 93 items" action; **the
original featured-link defect is fixed** — searching `ARZOPA` then activating
the featured GIZGA card clears the conflicting filter, reveals the target,
scrolls it into view, focuses it and highlights it; a cold load of
`/setup.html?category=audio#item-B0CRKGKZVX` does the same; filter state
restores from the URL and browser Back returns a coherent view; all 5 featured
references say **"View item"**, all 93 catalogue actions say **"View on
Amazon"**, carry `rel="sponsored noopener noreferrer"` and point at an Amazon
host; no implementation jargon or literal `\n\n` remains; JSON-LD
`numberOfItems` equals the rendered card count.

**Résumé (4)** — the download serves `application/pdf` with the expected
filename; print media removes navigation, actions and footer; the portrait stays
under 130 px and no icon exceeds 20 px in print; the web résumé contains all 16
checked facts.

**Error page (3)** — an unknown route returns 404 with the error page, which now
loads every one of its own assets and offers working recovery links.

**Keyboard and motion (3)** — the first Tab reaches a visible, outlined skip
link; 29 focusable controls; `prefers-reduced-motion: reduce` disables smooth
scrolling and transitions.

## Accessibility

- **0 axe violations** across 5 routes × 2 themes (previously 6: light-theme
  `.eyebrow`/`.company` contrast, the dark-theme must-have badge, and the 404
  page's primary button, which failed because its stylesheet 404'd and left the
  design tokens undefined).
- Contrast repaired at the token level: light-theme `--accent` `#4f6d55` →
  `#3f5a45` (4.47:1 → 5.91:1 on the page background) and `--muted` `#56625b` →
  `#4c574f` (4.95:1 → 5.86:1). New `--on-accent` / `--on-deep` tokens give any
  accent-filled surface contrast-checked ink per theme — the must-have badge was
  white on light green at 2.96:1 and is now dark ink at 6.27:1.
- **Every interactive control is at least 44 px tall**, from a shared
  `--control-height`. Previously the theme toggle was 32 px, the menu button
  40 px, filter chips 38 px, footer links 32 px and résumé contact links 23 px.
- Shared `:focus-visible` ring; previously the résumé and setup pages had none,
  because the only focus style lived in `home.css`, which the résumé does not load.
- One `<h1>` per route; `lang="en"`; `aria-current="page"` on the active
  navigation item; `aria-pressed` on category filters; a polite live region for
  the result count; icons marked `aria-hidden` and `focusable="false"`; visually
  hidden text tells screen-reader users which product an action belongs to and
  that it opens in a new tab.
- **Not claimed:** no screen-reader audit was performed. Automated checks do not
  establish WCAG conformance.

## Downloadable résumé PDF

Regenerated by `generate_pdf.js`, which now refuses to produce a file if any
stylesheet, web font or image failed to load, or if no `@media print` block
reached the page. Verified by `inspect_pdf.js` and by rendering every page to an
image (`screenshots/pdf-after/page-1.png`) and inspecting it.

| Property | Before | After |
| --- | --- | --- |
| Pages | 2 (page 2 held one orphan bullet plus education on an otherwise empty sheet) | **1** |
| Page size | A4 | A4 — 595 × 841.9 pt |
| File size | 672 KB | **202 KB** |
| Portrait | 720 × 960 embedded into a 26 mm box | 300 × 400 variant in a 24 × 31 mm box |
| Metadata | none | Title, Author, Subject, 14 keywords, Creator |
| Hyperlinks | 4 | 4 — email, dinudante.in, ProLEAP Academy, DDPrinterZ |
| Selectable text | yes | yes — 2,666 characters extracted |
| Navigation / download icon | excluded | excluded; no SVG exceeds 9 pt in print |
| Skills | separated | four separated groups, one tag per list item |

Content parity with the web résumé was checked on 16 specific facts (employer,
dates, role titles, the Odisha State Data Centre engagement, education,
credentials, `Ansible / AAP`, `Harbor`, `Basic networking`, contact address).
The PDF is generated *from* `resume.html`, so parity is structural rather than
hand-maintained.

## Link and destination inventory

`node check_links.js --external`. Full matrix in `screenshots/links.json`.

| Class | Count | Result |
| --- | ---: | --- |
| Internal routes | 5 | all 200 (404 route returns 404 by design) |
| Subresources (CSS, JS, images, PDF) | 36 | all 200, correct content types |
| In-page anchors | 21 | all resolve to a real element on their route |
| Amazon product destinations | 93 | **all reached; every resolved ASIN matches its catalogue ID** |
| ProLEAP Academy (site + 3 course pages) | 4 | all 200 with the expected course titles |
| DDPrinterZ, Instagram, YouTube, GitHub policy, dinudante.in | 5 | all 200 |
| mailto / WhatsApp handoffs | 15 | **deliberately not opened — no message was sent** |

**The two audit-flagged short links are verified, not assumed.** The audit
received HTTP 500 from its client and could not confirm them; resolved in a real
browser they are:

| Short link | Resolves to | Catalogue ID | Match |
| --- | --- | --- | --- |
| `https://link.amazon/B02oIJdYW` | `amazon.in/…/dp/B0CRKGKZVX` — ARZOPA 16.1'' 144Hz portable monitor | `B0CRKGKZVX` | ✔ |
| `https://link.amazon/B057fmWSL` | `amazon.in/…/dp/B0BYVDM93V` — Ambrane 100W Powerlit Ultra 25,000mAh | `B0BYVDM93V` | ✔ |

The three ProLEAP course links that timed out for the audit's HTTP client all
return 200 here. Both sets of audit failures were client artifacts, so no link
was changed on the strength of them — exactly as the brief required.

As a curation cross-check, each of the 93 shortened display names was compared
against the live listing title fetched from its own destination. **None fell
below 50% overlap on distinguishing tokens**, so no product was renamed into
something the listing does not support.

## Catalogue reconciliation

One canonical source: `master_dataset.json`. `build_setup.js` generates the
cards, the featured references, the filter buttons and their counts, the visible
totals and both JSON-LD blocks from it, so drift of the kind the audit found
(93 visible vs 91 in JSON-LD) cannot recur. A test asserts schema count equals
rendered count.

- 93 products in, 93 out. `curate_dataset.js` fails the build if any product
  lacks a review entry or any review entry matches no product.
- 5 featured picks are **references** to catalogue records (`#item-<ASIN>`), not
  duplicate definitions.
- 91 of 93 are marked as owner-tested. The 2 recent additions are labelled
  "Recently added — not yet long-term tested", and the hero states 91 rather
  than implying all 93 were tested.
- Affiliate attribution, `rel="sponsored noopener noreferrer"` and the exact
  outbound URLs are untouched by the curation step.

## Deployment

Publication is authorised (carried over from the 7 September release and
reaffirmed by the current brief's "honour existing deployment authorization").

| | |
| --- | --- |
| Release commit | `68154bff1c56502dda6812ab582cfd0018bd2a45` |
| Inherited checkpoint | `a2dd77c` — the previous session's uncommitted tree, committed verbatim first |
| Branch | `main`, pushed `160ffa9..68154bf` |
| Published | GitHub Pages, https://dinudante.in |

**Live verification, performed after the deployment, against the deployed site —
not the local build:**

- All 4 public routes plus `/404.html` return 200 with `text/html`.
- All 12 published assets return 200 with the right content type, including
  `site.v5.js` as `application/javascript` and the résumé as `application/pdf`.
- **All 14 published files are byte-identical to the local build** (SHA-256).
- Files that should no longer be served are gone: `/assets/logo.png` (the 1.79 MB
  master, now under `masters/` and excluded by `_config.yml`),
  `/assets/logo-social.png` and `/assets/site.css` all return 404, as does an
  unknown route — each rendering the real error page.
- 13 behavioural checks re-run against the live origin all pass: shared script
  initialises, the pre-paint `js` class is applied, the theme toggle changes and
  persists, the header stays stuck after scrolling, the mobile menu opens with
  6 links and closes on Escape with focus restored, the catalogue shows 93 items
  with working category filters and a working featured reveal, the PDF is served
  as `application/pdf`, and the 404 route loads every one of its own assets.
- The **live** PDF was downloaded and inspected independently: 1 A4 page,
  4 hyperlinks, 2,666 characters of selectable text, rendered to
  `screenshots/pdf-live/page-1.png` and looked at.

## Blocked and untested

| Item | Status | Why |
| --- | --- | --- |
| Physical iOS Safari / Android Chrome | **Blocked** | No device or device cloud in this environment. The mobile layout, menu and touch targets were tested in Chromium mobile emulation at 6 phone widths only. |
| Firefox and WebKit engines | **Blocked** | Both engines downloaded successfully, but this machine refuses to run them: `An Application Control policy has blocked this file`. That is a machine policy, not a missing install, and not something to bypass. `tools/cross_browser.js` is written against all three engines and passes 19/19 on Chromium; the Firefox and WebKit arms record a launch failure. |
| iOS Safari printing | **Blocked** | Needs a physical device. Note: the previous iOS-specific print workaround (a fixed 281 mm canvas at 96% scale) is **not** carried over — the PDF is now generated by the build rather than by the visitor's browser, and the print stylesheet was rewritten. The in-browser "Print this page" path on iOS is therefore **untested**. |
| Screen-reader audit | **Untested** | Automated axe passes are not a screen-reader test. |
| Field Core Web Vitals (p75 LCP/INP/CLS) | **Not available** | Requires real traffic. No CrUX data is claimed. |
| Product colour/size variant against physical items | **Owner-dependent** | Image and URL come from the same listing, and every ASIN was confirmed, but only the owner can confirm the exact variant owned. |
| Exact dates for the two "Concurrent" leadership roles | **Owner-dependent** | The brief says "Concurrent" is not a substitute for verified dates; inventing them was not an option. |
| Current/ongoing education | **Owner-dependent** | Not added without a supported source. |
| WhatsApp and email delivery | **Deliberately not tested** | Testing would mean sending a production message. Both were verified as correctly formed handoff URLs. |


---

# Continuation session — 16 September 2026

The 15 September release was re-verified from scratch rather than taken on trust,
then three real defects were found and fixed. Everything below was measured on
this machine after those fixes.

## What was re-verified before any new work

| Check | Result |
| --- | --- |
| Deployed files vs local build at `34b35f8` | **14 of 14 byte-identical** (SHA-256) |
| Live routes and assets | 13 URLs, all 200 with the expected content type |
| Layout matrix (5 routes × 12 widths × 2 themes) | 130 checks, **0 overflow failures** |
| axe WCAG A/AA | 10 scans, **0 violations** |
| Behavioural suite | **52 / 52** |
| Live résumé PDF re-downloaded, re-rendered, re-inspected | 1 A4 page, 4 links, 2,666 characters of selectable text |

The previous session's claims held up. The gaps were in what it had not measured.

## Defects found and fixed

### 1. Tablets scrolled further than phones

The catalogue track minimum of 250 px could not fit a third column until about
900 px, so every width from 600 px to 820 px rendered two stretched cards
(380 × 610 px at 820 px).

| Width | Columns before | Height before | Columns after | Height after |
| ---: | ---: | ---: | ---: | ---: |
| 320 | 1 | 43,925 px | 2 | **19,669 px** |
| 390 | 2 | 19,733 px | 2 | 19,733 px |
| 768 | 2 | 27,021 px | 3 | **15,602 px** |
| 820 | 2 | 27,833 px | 3 | **15,912 px** |
| 1280 | 4 | 13,659 px | 5 | **10,028 px** |
| 2560 | 6 | 9,232 px | 7 | **7,929 px** |

Page depth is now monotonic — it never grows as the viewport widens, which was
the actual symptom. 320 px, the width the brief names for reflow, improved most:
a single column had put 93 products on a 43,925 px page, which is precisely the
overwhelming mobile scroll the brief rules out.

### 2. Cards were not aligned within a row

`.gear-card__media` declared `aspect-ratio: 4 / 3`, but as a flex item its
automatic minimum size let a tall product photograph force the box open. Measured
across all 93 cards, media heights ranged **164 px to 281 px**, so the category
label, title, ownership note and "Full product name" summary began at different
heights across a row.

Placing the image absolutely inside the ratio box makes the box authoritative.
After: **all 93 media boxes are exactly 164 px** and **0 of 19 rows** have
misaligned titles. Verified by measurement and by inspecting the rendered grid at
320, 768 and 1280 px.

### 3. Every engineering file on the site was publicly downloadable

`_config.yml` opens with "keep engineering notes, build tooling and QA evidence
out of the published site", and has listed them since the cleanup release. That
list had never taken effect: a `.nojekyll` file in the repository root disables
Jekyll entirely, and with Jekyll disabled GitHub Pages serves every tracked file
verbatim.

Measured against the live site before the fix — all **200**:

```
/qa_run.js          /build_setup.js     /build_pages.js     /build_images.js
/curate_dataset.js  /check_links.js     /generate_pdf.js    /inspect_pdf.js
/measure_perf.js    /render_pdf_pages.js /site_shell.js     /tools_serve.js
/master_dataset.json  /package.json  /package-lock.json
/QA_REPORT.md  /AUDIT.md  /HANDOFF.md  /PROJECT_CONTEXT.md  /ASSET_MANIFEST.md
/masters/logo.png   -> 1,833,082 bytes
```

The last one matters most: audit finding 11 was "do not serve the master image as
every small icon or social preview". The master stopped being *referenced*, and
the previous pass verified that `/assets/logo.png` now 404s — but the file had
only moved to `/masters/`, where it was still downloadable in full. Checking that
the old path 404s is not the same as checking the master is not served.

`measure_perf.js` was additionally missing from the exclude list altogether.

**Fix:** `.nojekyll` removed so `_config.yml` applies, and `measure_perf.js`
added to the list. None of the five routes uses front matter or Liquid syntax, so
Jekyll copies them verbatim — this changes what is *published*, not what is
*rendered*. Confirmed after deployment in the live verification below.

### 4. A harness fragility, not a product defect

Fixing the grid broke `qa_interactions.js`. The cause was the test, not the site:
it clicked the centre of the featured link's bounding box, and because filtering
shortens the document the browser clamps the scroll offset, which could leave that
centre under the sticky header. Hit-testing the click point returned the brand
mark, so the click navigated home. The test now scrolls the link clear — the root
already carries `scroll-padding-top` — and clicks its first line box. **52 / 52
again.**

## New coverage added this session

### Keyboard focus audit — WCAG 2.2 SC 2.4.11

`node tools/focus_audit.js`. Tabs through every focusable control on all 5 routes,
in both themes, at 390 / 768 / 1440 px, and for each stop records whether it is
visible, has a focus indicator, and is genuinely clear of sticky chrome.

**650 focus stops examined. No findings.** Every stop was visible, carried an
outline or box-shadow, and hit-tested as the topmost element at its own sample
points.

This matters because a sticky header failing SC 2.4.11 is invisible to axe — no
automated rule catches it, and the previous pass had only checked that the first
Tab reached the skip link.

One correction: the audit's first version compared bounding boxes and reported the
skip link as obscured on all 30 combinations. The skip link does sit inside the
header's box, but it paints above it (`z-index: 100` against the header's `50`).
Hit-testing and a screenshot both confirm it renders correctly with its focus ring
intact. The audit was rewritten to hit-test sample points. No defect existed.

### Zoom and reflow on every route

Previously only the homepage had zoom evidence. `tools/visual_evidence.js` now
captures, for all 5 routes, a 320 px reflow rendering and a 200 % zoom rendering
(640 × 512 CSS at `deviceScaleFactor: 2`, as SC 1.4.10 defines it), and measures
overflow at both.

**10 renderings, 0 horizontal-overflow failures.** Full-page screenshots for every
route × 3 widths × 2 themes are in `screenshots/visual/`.

### A second, independent harness

`node tools/cross_browser.js` re-runs layout containment (110 route/width/theme
combinations), shared-script initialisation, theme toggle and persistence, sticky
header, mobile menu, catalogue count, search normalisation, featured reveal, empty
state, CTA-label-to-destination matching, print rules and the no-JavaScript
fallback — on Playwright rather than Puppeteer.

**19 / 19 pass on Chromium.** The Firefox and WebKit arms are written and wired up
but cannot launch on this machine (see the blocked table).

## CTA labels against destinations

Re-verified on the shipped build by two independent harnesses:

| Class | Count | Label | Destination check |
| --- | ---: | --- | --- |
| Featured references | 5 | **"View item"** | `#item-<ASIN>` resolving to a real catalogue card on the same page |
| Catalogue actions | 93 | **"View on Amazon"** | Amazon host, `rel="sponsored noopener noreferrer"`, opens in a new tab |

No internal anchor claims Amazon and no external link is labelled as internal.
Both protected short links still carry their catalogue identity:
`link.amazon/B02oIJdYW` → `item-B0CRKGKZVX` (ARZOPA 16.1" 144Hz) and
`link.amazon/B057fmWSL` → `item-B0BYVDM93V` (Ambrane Powerlit Ultra 100W).

## Catalogue and structured data after the change

| | |
| --- | --- |
| Products in `master_dataset.json` | 93 |
| `id="item-…"` cards rendered | 93 |
| JSON-LD `ItemList` | `numberOfItems` 93, 93 elements |
| Ownership labels | 91 "Bought and used by me", 2 "Recently added — not yet long-term tested" |

## Performance after the change

Lighthouse mobile, median of 3 runs, local build.

| Route | Perf | A11y | BP | SEO | LCP | CLS | Transferred |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 100 | 100 | 100 | 100 | 1,653 ms | 0 | 91 KB |
| `/resume.html` | 100 | 100 | 100 | 100 | 1,277 ms | 0 | 67 KB |
| `/setup.html` | **96** | 100 | 100 | 100 | 2,328 ms | 0 | 478 KB |
| `/privacy/` | 100 | 100 | 100 | 100 | 1,202 ms | 0 | 46 KB |

`/setup.html` moved 97 → 96 and 442 KB → 478 KB: five columns instead of four put
more product photographs above the fold, so more of them load eagerly. All targets
are still met (Perf ≥ 90, others ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1) and it buys a 35 %
shorter page. Laboratory numbers, not field data.

## Images re-inspected at render size

Measured on a 390 px viewport at `deviceScaleFactor: 2`, reading each image's
`currentSrc`, intrinsic size and computed `object-fit` / `object-position`:

| Image | Intrinsic | Rendered | Treatment |
| --- | --- | --- | --- |
| `logo-nav.png` | 88 × 88 | 38 × 38 | The 1.79 MB master is not served; this variant is 5.9 KB |
| `dinesh-professional.webp` | 720 × 960 | 238 × 318 | `cover`, focal point `50% 18%` |
| `dinesh-maker.webp` | 720 × 926 | **140 × 175** | `cover`, `50% 0%` — the compact centred mobile crop the project requires |

The authentic portraits are unchanged. Neither portrait uses `srcset`: at 36 KB
and 84 KB, a 720 w source already covers a 2× phone and a 2× desktop rendering,
and Lighthouse reports no image-sizing opportunity on any route. That is a
deliberate decision, not an omission.
