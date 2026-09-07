# Cleanup release QA — 7 September 2026

Scope: end-to-end check and cleanup of the existing public site, followed by publication as requested. This release does not complete every proposed feature in the engineering brief.

## Changes

- Mobile navigation now has a labeled menu, closes after selection, supports Escape and remains available without JavaScript. Skip links, visible keyboard focus and 44 px controls improve navigation.
- Shared theme scripts handle blocked storage, follow system changes until an explicit choice, and preserve the existing `dinu-theme` preference across pages. Styles were extracted into local CSS while retaining the existing visual system and résumé print rules.
- Removed decorative counters; changed “Explore my work” to “Explore my profile” to describe its actual destination. Relabeled résumé capability lists accurately.
- Moved Harbor out of observability in web and ATS résumés. Retained the standalone A4 ATS layout, selectable text, metadata and three links. Both résumés show a content update date; the stable PDF filename has a new cache query.
- Existing teaching copy describes subjects; current academy programs have their exact public names and direct links. No historical course-equivalence or new career-date claim was added.
- Business social links explicitly say DDPrinterZ. Added a copyable email fallback, canonical and sharing metadata, sitemap, robots.txt, a privacy page and a useful 404 page.
- GitHub Pages excludes engineering notes, scripts and Sources. Local preview serves only public files with noindex response headers.

## Evidence

- Chrome 152.0.7977.76 / Playwright, macOS. Exact timestamp: `/tmp/dinudante-qa/results/audit.json`.
- 64 viewport/theme checks: home, résumé, privacy and 404 at 320, 360, 390, 768, 1024, 1440, 2560 and 3840 px in light/dark. No overflowing elements detected. Screenshots captured at 390/1440 with images decoded; homepage and ATS output visually inspected.
- 16 axe-core scans against WCAG A/AA tags: zero remaining violations. Two measured light-theme contrast failures were corrected. Automated checks do not establish complete WCAG conformance.
- Passed: keyboard skip link, menu selections, Escape/focus return, theme persistence across reload/routes, browser Back, résumé download filename, print controls hidden, no-JavaScript navigation, blocked-storage behavior and failed-media usability. All local references, fragment targets, IDs and H1 counts checked.
- ATS PDF and Chrome-printed web résumé each contain one A4 page and selectable text; text bounding boxes fit the page. Download filename and `application/pdf` tested. Identity, contacts, employer, existing dates, education, credentials and Harbor classification agree; the ATS PDF intentionally retains more project detail.
- All 10 external URLs returned HTTP 200, including exact academy courses, DDPrinterZ, Instagram, YouTube and WhatsApp redirects. This verifies HTTP destinations; social feed visibility and native app handoff were not independently certified.
- Lighthouse 13.4.1: three default mobile lab runs per current template; same environment used for baseline home/résumé. Baseline home 99–100 and résumé 100, LCP approximately 1.20 s, CLS 0. Current home 99–100, LCP 1.50–1.65 s, CLS 0–0.058; résumé 100, LCP 1.50 s, CLS 0; privacy 100, LCP 1.05–1.20 s, CLS 0. TBT 0 ms throughout. External CSS adds request cost; this is not a measured performance improvement. Lab results do not establish field INP or traffic percentiles.
- Diff whitespace and JavaScript syntax checks pass.

## Limits and deferred work

- Physical iOS Safari printing, screen-reader testing, browser-native 200% zoom and social feed verification remain manual checks. Existing WebKit 281 mm / 96% print workaround is preserved.
- Dedicated Work/index/detail templates, three approved studies, shared factual content records, draft editing workflow and custom social card design remain outside this cleanup release. No empty Work archive is published.
- Exact promotion/leadership dates, ongoing education, personal social account confirmation and approved evidence/attribution still need owner input. Existing factual dates are retained.
- No new analytics service or click tracking was enabled.

## Reproduce and recover

`node scripts/preview.mjs` starts a local noindex preview at http://127.0.0.1:4173. QA scripts use temporary dependencies in `/tmp/dinudante-qa`; see their headers. `node scripts/audit.mjs`, `node scripts/performance.mjs` and `node scripts/check-live.mjs --live` record JSON evidence under `/tmp/dinudante-qa/results/`. Stop a standalone preview before running audit/performance scripts because they own the same port.

The release commit is the commit introducing this report (`git log -1 --format=%H -- QA_REPORT.md`). Previous known successful Pages revision: `6ccd57294dab1bd30836e50e76066fb9684bebdf`. Backup archive `/tmp/dinudante-baseline-6ccd572.tar` was restored in a separate directory and checked against the original home/PDF. Git history is the durable backup. Roll back by reverting the release commit in a clean checkout, pushing the revert, waiting for Pages success, and rechecking homepage, résumé and PDF; preserve unrelated local changes. Do not force-reset this workspace.

Publication is authorized by the user. After push, verify that Pages success references the release SHA, compare live HTML/CSS/JS/PDF bytes to local files, confirm excluded files and missing routes return 404, and record results in `/tmp/dinudante-qa/results/live-checks.json`.
