// Project QA harness. Serves the site locally and exercises every route across the
// release viewport matrix in both themes, recording layout, a11y and interaction
// evidence plus screenshots. Usage: node qa_run.js [outDir]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');

const PORT = 8129;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.argv[2] || 'screenshots/qa';
const ROUTES = [
  { name: 'home', url: '/' },
  { name: 'resume', url: '/resume.html' },
  { name: 'setup', url: '/setup.html' },
  { name: 'privacy', url: '/privacy/' },
  { name: '404', url: '/404.html' }
];
const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920, 2560];
const SHOT_WIDTHS = [390, 768, 1440];
const results = { layout: [], a11y: [], links: [], console: [] };

const log = (...a) => console.log(...a);

async function checkPage(page, route, width, theme) {
  await page.setViewport({ width, height: width < 700 ? 780 : 900, deviceScaleFactor: 1 });
  await page.goto(BASE + route.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(t => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('dinu-theme', t); } catch (_) {}
  }, theme);
  await new Promise(r => setTimeout(r, 250));

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];
    const vw = doc.clientWidth;
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right > vw + 1.5 || r.left < -1.5) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
        offenders.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 60), left: Math.round(r.left), right: Math.round(r.right) });
      }
    });
    const small = [];
    document.querySelectorAll('a[href], button, input, select').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.tagName === 'A' && cs.display.startsWith('inline') && el.closest('p, li')) return;
      if (r.height < 44) small.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    });
    return {
      scrollW: doc.scrollWidth, clientW: doc.clientWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 1,
      offenders: offenders.slice(0, 12),
      smallTargets: small.slice(0, 12),
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      lang: doc.lang,
      themeApplied: doc.dataset.theme,
      bodyBg: getComputedStyle(document.body).backgroundColor
    };
  });
  results.layout.push({ route: route.name, width, theme, ...metrics });
  if (metrics.overflow) log(`  ! OVERFLOW ${route.name} @${width} ${theme}: ${metrics.scrollW} > ${metrics.clientW} ${JSON.stringify(metrics.offenders)}`);
  return metrics;
}

async function axeScan(page, route, theme) {
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axeSrc);
  const out = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
  });
  results.a11y.push({ route: route.name, theme, violations: out });
  if (out.length) log(`  ! A11Y ${route.name} ${theme}: ` + out.map(v => `${v.id}(${v.nodes}) ${v.targets[0]}`).join(' | '));
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--font-render-hinting=none'] });
  try {
    for (const route of ROUTES) {
      log(`\n== ${route.name} (${route.url})`);
      const page = await browser.newPage();
      const msgs = [];
      page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(`${m.type()}: ${m.text()}`); });
      page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
      page.on('requestfailed', r => msgs.push('requestfailed: ' + r.url()));
      page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) msgs.push(`http ${r.status()}: ${r.url()}`); });

      for (const theme of ['night', 'day']) {
        for (const width of WIDTHS) {
          await checkPage(page, route, width, theme);
          if (SHOT_WIDTHS.includes(width)) {
            // Lazy images never enter the viewport during a full-page capture,
            // so force them to load or the evidence shows empty frames.
            await page.evaluate(async () => {
              document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
              await Promise.all(Array.from(document.images).map(img =>
                img.complete ? null : new Promise(res => {
                  img.addEventListener('load', res, { once: true });
                  img.addEventListener('error', res, { once: true });
                  setTimeout(res, 4000);
                })));
            });
            await new Promise(r => setTimeout(r, 400));
            await page.screenshot({ path: path.join(OUT, `${route.name}-${width}-${theme}.png`), fullPage: width === 1440 });
          }
        }
        await checkPage(page, route, 1280, theme);
        await axeScan(page, route, theme);
      }
      results.console.push({ route: route.name, messages: [...new Set(msgs)] });
      if (msgs.length) log('  ! CONSOLE: ' + [...new Set(msgs)].slice(0, 8).join(' | '));
      await page.close();
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const allLinks = new Map();
    for (const route of ROUTES) {
      await page.goto(BASE + route.url, { waitUntil: 'networkidle2' });
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({
        href: a.getAttribute('href'), abs: a.href, text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        rel: a.getAttribute('rel') || '', target: a.getAttribute('target') || ''
      })));
      for (const l of links) {
        const k = route.name + '|' + l.href;
        if (!allLinks.has(k)) allLinks.set(k, { route: route.name, ...l });
      }
    }
    results.links = [...allLinks.values()];
    await page.close();

    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
    const overflows = results.layout.filter(r => r.overflow);
    const viol = results.a11y.reduce((n, r) => n + r.violations.length, 0);
    log('\n=== SUMMARY ===');
    log(`layout checks: ${results.layout.length}, overflow failures: ${overflows.length}`);
    log(`axe violations total: ${viol}`);
    log(`links catalogued: ${results.links.length}`);
    log(`routes with console/network problems: ${results.console.filter(c => c.messages.length).length}`);
    log(`evidence: ${path.join(OUT, 'results.json')}`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
