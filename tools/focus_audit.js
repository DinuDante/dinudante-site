// Keyboard focus audit. Tabs through every focusable control on every route, in both
// themes and at phone/tablet/desktop widths, and records for each stop whether the
// focused element is visible, has a visible focus indicator, and is clear of the sticky
// header. That last one is WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), which a
// sticky header can fail without any automated rule catching it.
// Usage: node tools/focus_audit.js
const fs = require('fs');
const puppeteer = require('puppeteer');
const serve = require('../tools_serve');

const PORT = 8151;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = [
  { name: 'home', url: '/' },
  { name: 'resume', url: '/resume.html' },
  { name: 'setup', url: '/setup.html' },
  { name: 'privacy', url: '/privacy/' },
  { name: '404', url: '/404.html' }
];
const WIDTHS = [390, 768, 1440];
const MAX_TABS = 80;

(async () => {
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  const findings = [];
  let stops = 0;
  try {
    for (const route of ROUTES) {
      for (const theme of ['day', 'night']) {
        for (const width of WIDTHS) {
          const page = await browser.newPage();
          await page.setViewport({ width, height: width < 700 ? 780 : 900 });
          await page.evaluateOnNewDocument(t => {
            try { localStorage.setItem('dinu-theme', t); } catch (_) {}
          }, theme);
          await page.goto(BASE + route.url, { waitUntil: 'networkidle2', timeout: 60000 });
          await new Promise(r => setTimeout(r, 300));

          const seen = new Set();
          for (let i = 0; i < MAX_TABS; i++) {
            await page.keyboard.press('Tab');
            const stop = await page.evaluate(() => {
              const el = document.activeElement;
              if (!el || el === document.body || el === document.documentElement) return null;
              const r = el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              /* SC 2.4.11 is about what is actually painted over the control, not about
                 boxes that merely intersect: the skip link sits inside the header's box but
                 paints above it. Hit-test sample points instead, and only count a point as
                 obscured when the element on top is sticky or fixed chrome. */
              const sample = [
                [r.left + Math.min(6, r.width / 2), r.top + Math.min(6, r.height / 2)],
                [r.left + r.width / 2, r.top + r.height / 2],
                [r.right - Math.min(6, r.width / 2), r.bottom - Math.min(6, r.height / 2)]
              ].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
              let blockedPoints = 0; let blocker = null;
              sample.forEach(([x, y]) => {
                const hit = document.elementFromPoint(x, y);
                if (!hit || hit === el || el.contains(hit) || hit.contains(el)) return;
                for (let n = hit; n && n !== document.documentElement; n = n.parentElement) {
                  const ncs = getComputedStyle(n);
                  if (ncs.position === 'sticky' || ncs.position === 'fixed') {
                    blockedPoints++;
                    blocker = n.tagName.toLowerCase() + '.' + String(n.className || '').slice(0, 30);
                    return;
                  }
                }
              });
              const covered = sample.length && blockedPoints === sample.length
                ? { by: blocker, points: blockedPoints + '/' + sample.length }
                : null;
              return {
                tag: el.tagName.toLowerCase(),
                label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
                id: el.id || null,
                cls: String(el.className || '').slice(0, 40),
                w: Math.round(r.width), h: Math.round(r.height),
                top: Math.round(r.top), bottom: Math.round(r.bottom),
                inViewport: r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0,
                outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
                boxShadow: cs.boxShadow !== 'none',
                covered
              };
            });
            if (!stop) break;
            const key = `${stop.tag}#${stop.id}.${stop.cls}|${stop.label}`;
            if (seen.has(key)) break;
            seen.add(key);
            stops++;
            const where = `${route.name} ${width}px ${theme}`;
            if (stop.covered && stop.inViewport) {
              findings.push({ type: 'focus-obscured', where, control: stop.label || stop.tag, detail: stop.covered });
            }
            if (!stop.outline && !stop.boxShadow) {
              findings.push({ type: 'no-focus-indicator', where, control: stop.label || stop.tag });
            }
            if (stop.inViewport && (stop.w < 44 || stop.h < 44) && stop.tag === 'button') {
              findings.push({ type: 'small-target', where, control: stop.label || stop.tag, detail: `${stop.w}x${stop.h}` });
            }
          }
          await page.close();
        }
      }
      console.log('audited', route.name);
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync('screenshots/focus-audit.json', JSON.stringify({ stops, findings }, null, 2));
  console.log(`\n${stops} focus stops examined across ${ROUTES.length} routes x 2 themes x ${WIDTHS.length} widths`);
  const byType = {};
  findings.forEach(f => { (byType[f.type] = byType[f.type] || []).push(f); });
  if (!findings.length) console.log('no findings: every focus stop was visible, indicated and clear of sticky chrome');
  Object.entries(byType).forEach(([t, list]) => {
    console.log(`\n${t}: ${list.length}`);
    list.slice(0, 8).forEach(f => console.log(`  ${f.where} — ${f.control} ${f.detail ? JSON.stringify(f.detail) : ''}`));
  });
})().catch(e => { console.error(e); process.exit(1); });
