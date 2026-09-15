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
| Firefox and WebKit engines | **Blocked** | Only Chromium is installed. |
| iOS Safari printing | **Blocked** | Needs a physical device. Note: the previous iOS-specific print workaround (a fixed 281 mm canvas at 96% scale) is **not** carried over — the PDF is now generated by the build rather than by the visitor's browser, and the print stylesheet was rewritten. The in-browser "Print this page" path on iOS is therefore **untested**. |
| Screen-reader audit | **Untested** | Automated axe passes are not a screen-reader test. |
| Field Core Web Vitals (p75 LCP/INP/CLS) | **Not available** | Requires real traffic. No CrUX data is claimed. |
| Product colour/size variant against physical items | **Owner-dependent** | Image and URL come from the same listing, and every ASIN was confirmed, but only the owner can confirm the exact variant owned. |
| Exact dates for the two "Concurrent" leadership roles | **Owner-dependent** | The brief says "Concurrent" is not a substitute for verified dates; inventing them was not an option. |
| Current/ongoing education | **Owner-dependent** | Not added without a supported source. |
| WhatsApp and email delivery | **Deliberately not tested** | Testing would mean sending a production message. Both were verified as correctly formed handoff URLs. |
