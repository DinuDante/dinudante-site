// Captures full-page screenshots for every route at phone/tablet/desktop in both
// themes, plus 200% zoom and 320px reflow evidence, so the output can be inspected
// visually. Usage: node tools/visual_evidence.js [outDir]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const serve = require('../tools_serve');

const PORT = 8133;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.argv[2] || 'screenshots/visual';
const ROUTES = [
  { name: 'home', url: '/' },
  { name: 'resume', url: '/resume.html' },
  { name: 'setup', url: '/setup.html' },
  { name: 'privacy', url: '/privacy/' },
  { name: '404', url: '/404.html' }
];

async function load(page, url, theme) {
  await page.evaluateOnNewDocument(t => {
    try { localStorage.setItem('dinu-theme', t); } catch (_) {}
  }, theme);
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Force every lazy image to decode so full-page captures are not blank below the fold.
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo(0, 0);
    await Promise.all([...document.images].filter(i => !i.complete)
      .map(i => new Promise(r => { i.onload = i.onerror = r; })));
  });
  await new Promise(r => setTimeout(r, 400));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  const report = [];
  try {
    for (const route of ROUTES) {
      for (const theme of ['day', 'night']) {
        for (const w of [390, 768, 1440]) {
          const page = await browser.newPage();
          await page.setViewport({ width: w, height: w < 700 ? 780 : 900, deviceScaleFactor: 1 });
          await load(page, route.url, theme);
          const file = path.join(OUT, `${route.name}-${w}-${theme}.png`);
          await page.screenshot({ path: file, fullPage: true });
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          report.push({ route: route.name, width: w, theme, fullHeight: h, file });
          await page.close();
        }
      }
      // 320px reflow and 200% zoom, per WCAG 2.2 1.4.10. 200% zoom is emulated the way
      // the success criterion defines it: half the CSS viewport at double the scale.
      for (const mode of ['reflow320', 'zoom200']) {
        const page = await browser.newPage();
        if (mode === 'reflow320') {
          await page.setViewport({ width: 320, height: 640, deviceScaleFactor: 1 });
        } else {
          await page.setViewport({ width: 640, height: 512, deviceScaleFactor: 2 });
        }
        await load(page, route.url, 'day');
        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const offenders = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
            if (r.right > doc.clientWidth + 1.5 || r.left < -1.5) {
              offenders.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 50) });
            }
          });
          return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, offenders: offenders.slice(0, 10) };
        });
        const file = path.join(OUT, `${route.name}-${mode}.png`);
        await page.screenshot({ path: file, fullPage: true });
        report.push({ route: route.name, mode, ...metrics, overflow: metrics.scrollW > metrics.clientW + 1, file });
        await page.close();
      }
      console.log('captured', route.name);
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const bad = report.filter(r => r.overflow);
  console.log(`\n${report.length} captures; zoom/reflow overflow failures: ${bad.length}`);
  bad.forEach(b => console.log('  FAIL', b.route, b.mode, JSON.stringify(b.offenders)));
})().catch(e => { console.error(e); process.exit(1); });
