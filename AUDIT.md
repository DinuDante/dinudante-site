# Audit reproduction — dinudante.in

Every numbered finding from `AGY_dinudante_in_Production_Prompt.md` ("Evidence to
reproduce first") and the prioritised table in
`DinuDante_Critical_Website_Audit_2026-09-15.md`, rechecked against the
repository and the live deployment on 15 September 2026, then classified.

Status vocabulary: **Reproduced** (still present when this session started),
**Already fixed** (the previous session had fixed it before its quota
interruption), **Partly fixed** (change existed but was incomplete or wrong),
**Unable to verify** (outside what this environment can test).

## P1 — release blocking

### 1. Missing shared JavaScript (`/assets/site.v3.js` → 404)

**Already fixed on the deployed site, with a residue.** `https://dinudante.in/assets/site.v5.js`
returns `200 application/javascript; charset=utf-8`; `site.v3.js` is no longer
referenced by `/`, `/resume.html`, `/setup.html` or `/privacy/`.

**Residue reproduced:** `404.html` still referenced `/assets/site.css?v=bba3dc48c36e`,
which 404s in production, and loaded no shared script at all. With the design
tokens missing, the error page rendered with undefined custom properties — which
is why it was also the only route with a failing colour-contrast check.

Fixed by rebuilding the error page from the shared shell. Verified: `site.v5.js`
served as JavaScript, `menu-ready` applied on load, zero failing subresources on
all five routes (`qa_interactions.js`, `check_links.js`).

### 2. Theme control advertises the wrong mode / does nothing

**Already fixed in the inherited script**, and now covered by regression tests so
it cannot silently return: label, `aria-pressed`, the visible `LIGHT`/`DARK`
state and `<meta name="theme-color">` all follow the applied theme; the choice
persists to `localStorage` across reload and across routes; the control still
works when storage throws. 12 assertions in `qa_interactions.js`.

### 3. Mobile navigation depends on the missing script

**Partly fixed — two real defects found and repaired.**

- The `.menu-ready` gate was correct: without JavaScript the links stay visible
  and usable (verified with JavaScript disabled — 6 visible links at 390 px).
- **Defect:** the inherited script opened the menu by writing ten inline styles
  and closed it by clearing only `display`. `position: absolute`, `top`,
  `background`, `box-shadow` and the rest survived, so a phone-to-desktop
  resize left a broken header. Now the menu is driven by a class and
  `removeAttribute('style')` clears everything.
- **Defect:** `matchMedia(...).addEventListener` was called without the legacy
  `addListener` fallback that the same file used for theme changes; on an older
  WebKit that throws and kills the remaining initialisation.

Verified: opens, exposes `aria-expanded`, closes on Escape with focus returned
to the button, closes on selection and moves focus to the target section,
closes on outside pointer/focus, and resets cleanly on resize.

### 4. Downloadable résumé PDF badly composed (4 pages)

**Already fixed, then improved.** The inherited PDF was already 2 pages with
navigation and the oversized download icon excluded and skills separated. Two
problems remained: page 2 carried one orphan bullet plus the education block on
an otherwise empty sheet, and the file was 672 KB because the print layout
embedded the 720 × 960 portrait inside a 26 mm box. It also carried no document
metadata.

Now: **one A4 page** (595 × 841.9 pt), **202 KB**, 2,666 characters of selectable
text, four working hyperlinks, a 24 × 31 mm portrait, four separated skill
groups, and populated Title/Author/Subject/Keywords. `generate_pdf.js` now fails
loudly if any stylesheet, font or image has not loaded, or if no `@media print`
block reached the page. Rendered and inspected page by page in
`screenshots/pdf-after/`.

## P2 — quality and consistency

### 5. Homepage hero leaves a large blank area

**Reproduced, root cause identified.** `.hero` used `align-items: end` with a
portrait taller than the text column, so the copy was pushed to the bottom of
the grid row. Changed to `align-items: center` and the vertical padding reduced
to `clamp(40px, 6vw, 72px)`.

### 6. About heading repeats all aliases across four tall lines

**Partly fixed** — the previous session had patched it with an inline `style`
attribute. Moved into a real `.alias` class; the primary name leads and the
aliases sit underneath in a secondary role, consistently on the homepage and
the résumé.

### 7. Navigation scrolls away despite `position: sticky`

**Reproduced, root cause identified.** `home.css` set `overflow-x: hidden` on
both `html` and `body`. That makes the root a scroll container, which silently
disables `position: sticky` for the header — and the production prompt
separately forbids using it as an overflow fix.

Removed. Overflow is now prevented at the source (`min-width: 0` on grid
children, `minmax(0, 1fr)` tracks, bounded media). `qa_interactions.js` asserts
that the header declares `sticky`, that **no ancestor has a non-visible
overflow**, and that the header is still at `top: 0` after scrolling 2,000 px.
`qa_run.js` confirms zero horizontal overflow across 130 viewport/theme checks
now that the mask is gone.

### 8. Résumé header differs from the site; browser-default print button

**Reproduced and fixed.** The résumé now uses the same generated header as every
other route, and the print control is a real `.button` beside the download
action. Both are excluded from print.

### 9. Setup: literal `\n\n`, overlong headline, misaligned container

**Reproduced and fixed** by regenerating the page. Heading is “My setup” with the
explanation as supporting text; the catalogue uses the same `.shell` container
as the hero. A test asserts the page contains no `\n\n` text and no
implementation jargon.

### 10. Featured link does not reveal a filtered-out target

**Reproduced and fixed.** Searching `ARZOPA` then activating the featured GIZGA
card changed the hash while the target stayed hidden. Featured and direct hash
links now clear conflicting filters, scroll the item into view, move keyboard
focus to it and highlight it briefly. Tested both from a click after filtering
and from a cold load of `/setup.html?category=audio#item-B0CRKGKZVX`.

### 11. “1 items”, bare “0 items”, missing `aria-pressed`

**Partly fixed** — pluralisation and `aria-pressed` had been repaired; the empty
state and reset control had not been fully built out. Now: correct singular and
plural, a live-region count, an always-available clear button in the search
field, a “Clear filters” control that appears whenever anything is filtered, and
an empty state with a “Show all 93 items” recovery action.

### 12. 93 visible products vs 91 in JSON-LD

**Already fixed** (both 93), and now structurally impossible to drift: cards,
featured references, filter labels, counts and both JSON-LD blocks are all
generated from `master_dataset.json` by `build_setup.js`, and a test compares
the schema's `numberOfItems` against the rendered card count.

### 13. Weak categorisation

**Partly fixed, then fully reviewed.** The inherited `remap_categories.js` had
moved the specific items named in the audit but introduced worse errors
elsewhere — an office chair and microfiber cloths under **Audio**, two desktop
monitors under **Maker & 3D printing**, wired headphones under **Computing &
mobile**, a study table under **Computing & mobile**, a data cable under **Power
& charging**.

All 93 products were reviewed individually in `curate_dataset.js`, which fails
the build if any product lacks a review entry or any review entry matches no
product. No product was dropped: 93 in, 93 out.

| Category | Products |
| --- | ---: |
| Computing & mobile | 9 |
| Displays | 6 |
| Input & control | 6 |
| Audio | 9 |
| Creator gear | 6 |
| Storage & connectivity | 15 |
| Power & charging | 7 |
| Workspace | 16 |
| Maker & 3D printing | 5 |
| Everyday & utility | 14 |
| **Total** | **93** |

### 14. Long marketplace titles and “View Canonical Product”

**Reproduced and fixed.** 37 products still carried titles of up to 200
characters. Each now has a concise display name (longest: 55 characters) that
keeps brand, model and the distinguishing variant, while the untouched
marketplace listing title is preserved in the data and exposed through a “Full
product name” disclosure on the card. Internal references read **“View item”**;
outbound actions read **“View on Amazon”**.

### 15. Header logo is 1.79 MB for a 38 px element

**Already fixed, then completed.** The previous session generated `logo-nav.png`
(88 × 88, 5.7 KB) and `logo-social.png` (512 × 512) but had not deployed them —
production was still serving the 1.79 MB master, and both new files returned 404
live. The square social image was also wrong for `summary_large_image` cards, so
it was replaced by a purpose-built 1200 × 630 `share-card.png`. See
`ASSET_MANIFEST.md`.

## Defects found in this session that were not in the audit

| Finding | Impact | Resolution |
| --- | --- | --- |
| `assets/home.css` had 2,831 bytes of UTF-16LE text appended (1,407 NUL bytes), including a `.tested-badge` rule that conflicted with the setup page's own. | Corrupt, unparseable CSS shipped to every page; wasted bytes. | Stylesheet rewritten as clean UTF-8. |
| `.gitignore` was itself written as UTF-16, so `node_modules/` was never actually ignored. | 100+ MB of dependencies at risk of being committed. | Rewritten as UTF-8. |
| `home.css` and `site.v4.css` each defined `.shell`, `.site-nav`, `.theme-toggle`, `.button` and `.nav-link` with different values; load order decided the winner. | Unpredictable component sizing; the résumé page (which does not load `home.css`) got a different header. | `site.v4.css` is now the single source for shared components; page stylesheets only add page layout. |
| No `:focus-visible` style existed in `site.v4.css`, and `prefers-reduced-motion` was unhandled there. | Keyboard users had no visible focus on résumé/setup controls; `scroll-behavior: smooth` ignored the motion preference. | Shared focus ring and a reduced-motion block; smooth scrolling is now opt-in. |
| Controls below 44 px: theme toggle (32 px), menu button (40 px), filter chips (38 px), footer links (32 px), contact links (23 px). | Below this project's stated 44 × 44 touch-target preference. | All raised to a shared `--control-height: 44px`. |
| `personallyTested` is `false` for the two newest products, but every card claimed “Personally tested” and the hero claimed all 93 were tested. | An unverified claim attached to items the owner has not yet tested. | The card note is driven by the data; the two recent additions read “Recently added — not yet long-term tested”, and the hero states the tested count (91 of 93). |
| The privacy page did not mention affiliate links or the third-party product images the setup page loads from Amazon's CDN. | Incomplete disclosure for the page that carries commercial links. | Both documented, plus an affiliate disclosure at the top of the setup catalogue. |

## Unable to verify in this environment

| Item | Why | What is needed |
| --- | --- | --- |
| Physical iOS Safari and Android Chrome | No device or device cloud available here. | A real-device pass, especially the mobile menu and iOS print. |
| Firefox and WebKit engines | Only Chromium (Puppeteer 25 / Chrome 141) is installed. | Cross-engine run of `qa_run.js`. |
| Screen-reader behaviour | Automated axe checks are not a screen-reader audit. | NVDA/VoiceOver pass over the menu, filters and empty state. |
| Field Core Web Vitals (LCP/INP/CLS at p75) | Requires real traffic; no CrUX data is claimed. | Field data once the release has traffic. |
| Exact leadership dates for the two “Concurrent” roles | Owner-dependent fact. The prompt notes “Concurrent” is not a substitute for verified dates; inventing them is not an option. | Owner confirmation of start dates. |
| Current/ongoing education | Owner-dependent fact. | Owner confirmation. |
| Product colour/size variant matching against physical items | The image and URL come from the same marketplace listing, but physical verification is owner-dependent. | Owner spot-check. |
