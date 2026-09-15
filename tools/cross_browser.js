// Cross-engine verification. The project's main harness is Chromium/Puppeteer; this
// re-runs the layout, theme, menu, catalogue and print checks in Firefox and WebKit so
// the release is not evidenced on a single engine.
// Usage: node tools/cross_browser.js
const fs = require('fs');
const serve = require('../tools_serve');
const { firefox, webkit, chromium } = require('playwright');

const PORT = 8137;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = ['/', '/resume.html', '/setup.html', '/privacy/', '/404.html'];
const WIDTHS = [320, 360, 390, 430, 768, 820, 1024, 1280, 1440, 1920, 2560];

const results = [];
const record = (engine, name, ok, detail) => {
  results.push({ engine, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${engine}] ${name}${detail ? '  - ' + detail : ''}`);
};

async function overflowAt(page, url, width, theme) {
  await page.setViewportSize({ width, height: width < 700 ? 780 : 900 });
  await page.goto(BASE + url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(120);
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
      if (r.right > doc.clientWidth + 1.5 || r.left < -1.5) {
        offenders.push(el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 40));
      }
    });
    return { over: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth, offenders: offenders.slice(0, 6) };
  });
}

async function runEngine(engineName, launcher) {
  let browser;
  try {
    browser = await launcher.launch();
  } catch (e) {
    record(engineName, 'engine launches', false, e.message.split('\n')[0]);
    return;
  }
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    record(engineName, 'engine launches', true, browser.version());

    // 1. Layout containment across the release width matrix, both themes.
    const bad = [];
    for (const url of ROUTES) {
      for (const theme of ['day', 'night']) {
        for (const w of WIDTHS) {
          const r = await overflowAt(page, url, w, theme);
          if (r.over) bad.push(`${url}@${w}/${theme} ${r.scrollW}>${r.clientW} ${r.offenders.join(',')}`);
        }
      }
    }
    record(engineName, `no horizontal overflow (${ROUTES.length * 2 * WIDTHS.length} combinations)`, bad.length === 0, bad.slice(0, 4).join(' | '));

    // 2. Shared script initialises.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    const ready = await page.evaluate(() => document.documentElement.classList.contains('js') && document.documentElement.classList.contains('menu-ready'));
    record(engineName, 'shared script initialises (js + menu-ready)', ready);

    // 3. Theme toggle changes theme, label and pressed state, and persists.
    const before = await page.getAttribute('html', 'data-theme');
    await page.click('.theme-toggle');
    await page.waitForTimeout(150);
    const after = await page.getAttribute('html', 'data-theme');
    const label = await page.getAttribute('.theme-toggle', 'aria-label');
    record(engineName, 'theme toggle changes the theme', before !== after, `${before} -> ${after}`);
    const opposite = after === 'day' ? 'dark' : 'light';
    record(engineName, 'label describes the action it will perform', !!label && label.toLowerCase().includes(opposite), label);
    await page.reload({ waitUntil: 'load' });
    const persisted = await page.getAttribute('html', 'data-theme');
    record(engineName, 'theme survives a reload', persisted === after, persisted);
    await page.goto(BASE + '/setup.html', { waitUntil: 'load' });
    record(engineName, 'theme carries across routes', (await page.getAttribute('html', 'data-theme')) === after);

    // 4. Sticky header survives a long scroll, with no ancestor overflow defeating it.
    await page.goto(BASE + '/', { waitUntil: 'load' });
    const sticky = await page.evaluate(() => {
      const h = document.querySelector('.site-nav');
      if (!h) return { pos: 'missing' };
      let blocked = null;
      for (let p = h.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        const bad = v => ['hidden', 'clip', 'auto', 'scroll'].includes(v);
        if (bad(cs.overflowX) || bad(cs.overflowY)) blocked = p.tagName + '.' + p.className;
      }
      return { pos: getComputedStyle(h).position, blocked };
    });
    record(engineName, 'header is sticky with no defeating ancestor overflow', sticky.pos === 'sticky' && !sticky.blocked, `${sticky.pos}${sticky.blocked ? ' blocked by ' + sticky.blocked : ''}`);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(250);
    const top = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect().top);
    record(engineName, 'header still at top after scrolling 2000px', Math.abs(top) < 2, `top=${top.toFixed(1)}`);

    // 5. Mobile menu opens, exposes state, closes on Escape and restores focus.
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.click('.menu-toggle');
    await page.waitForTimeout(250);
    const open = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.nav-links a')];
      return {
        expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
        count: links.length,
        allInViewport: links.every(a => {
          const r = a.getBoundingClientRect();
          return r.width > 0 && r.left >= -1 && r.right <= window.innerWidth + 1;
        })
      };
    });
    record(engineName, 'mobile menu opens with every link inside the viewport', open.expanded === 'true' && open.count === 6 && open.allInViewport, JSON.stringify(open));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const closed = await page.evaluate(() => ({
      expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
      focusRestored: document.activeElement === document.querySelector('.menu-toggle'),
      inline: document.querySelector('.nav-links').getAttribute('style')
    }));
    record(engineName, 'Escape closes the menu, restores focus, leaves no inline style', closed.expanded === 'false' && closed.focusRestored && !closed.inline, JSON.stringify(closed));

    // 6. Catalogue: count, search normalisation, featured reveal past a filter, empty state.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/setup.html', { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const shown = () => page.evaluate(() => [...document.querySelectorAll('#gear-container .gear-card')].filter(c => c.offsetParent !== null).length);
    const all = await shown();
    record(engineName, 'catalogue renders all 93 products', all === 93, String(all));
    await page.fill('#gear-search', '  ARZOPA  ');
    await page.waitForTimeout(400);
    const one = await shown();
    record(engineName, 'search is case and whitespace normalised', one === 1, `${one} result(s)`);
    const featured = await page.getAttribute('.must-have-section a.gear-cta[href^="#item-"]', 'href');
    await page.click('.must-have-section a.gear-cta[href^="#item-"]');
    await page.waitForTimeout(700);
    const reveal = await page.evaluate(h => {
      const el = document.querySelector(h);
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      return {
        revealed: el.offsetParent !== null,
        inViewport: r.top > -50 && r.top < window.innerHeight,
        focused: document.activeElement === el || el.contains(document.activeElement)
      };
    }, featured);
    record(engineName, 'featured link reveals, scrolls to and focuses a filtered-out target', !!(reveal.revealed && reveal.inViewport && reveal.focused), JSON.stringify(reveal));
    await page.goto(BASE + '/setup.html', { waitUntil: 'load' });
    await page.fill('#gear-search', 'zzzznotaproduct');
    await page.waitForTimeout(400);
    const empty = await page.evaluate(() => {
      const es = document.querySelector('#empty-state');
      const rc = document.querySelector('#catalogue-count');
      return { visible: !!es && !es.hasAttribute('hidden') && es.offsetParent !== null, hasRecovery: !!(es && es.querySelector('button, a')), count: rc ? rc.textContent.trim() : null };
    });
    record(engineName, 'empty state explains and offers recovery', empty.visible && empty.hasRecovery, JSON.stringify(empty));

    // 7. CTA labels match their destinations.
    await page.goto(BASE + '/setup.html', { waitUntil: 'load' });
    const ctas = await page.evaluate(() => {
      const internal = [...document.querySelectorAll('.must-have-section a.gear-cta[href^="#item-"]')];
      const external = [...document.querySelectorAll('#gear-container a.gear-cta[href^="http"]')];
      return {
        internal: internal.length,
        internalOk: internal.every(a => a.textContent.trim().startsWith('View item')),
        external: external.length,
        externalOk: external.every(a => a.textContent.trim().startsWith('View on Amazon')
          && /(^|\.)(amazon\.[a-z.]+|amzn\.to|link\.amazon)$/.test(new URL(a.href).hostname)
          && (a.rel || '').includes('sponsored'))
      };
    });
    record(engineName, 'CTA labels match their destinations', ctas.internalOk && ctas.externalOk && ctas.internal === 5 && ctas.external === 93, JSON.stringify(ctas));

    // 8. Resume print rules resolve in this engine.
    await page.goto(BASE + '/resume.html', { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(250);
    const print = await page.evaluate(() => {
      const gone = sel => { const el = document.querySelector(sel); return !el || getComputedStyle(el).display === 'none'; };
      const portrait = document.querySelector('.portrait-modest');
      let maxIcon = 0;
      document.querySelectorAll('svg').forEach(s => {
        if (getComputedStyle(s).display === 'none') return;
        maxIcon = Math.max(maxIcon, s.getBoundingClientRect().width);
      });
      return { nav: gone('.site-nav'), actions: gone('.resume-actions'), footer: gone('footer'), portraitPx: portrait ? Math.round(portrait.getBoundingClientRect().width) : 0, maxIcon: Math.round(maxIcon) };
    });
    record(engineName, 'print media hides chrome and bounds media', print.nav && print.actions && print.footer && print.portraitPx < 130 && print.maxIcon < 30, JSON.stringify(print));
    await page.emulateMedia({ media: 'screen' });

    // 9. No-JavaScript fallback.
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const np = await noJs.newPage();
    await np.setViewportSize({ width: 390, height: 780 });
    await np.goto(BASE + '/', { waitUntil: 'load' });
    const links = await np.evaluate(() => [...document.querySelectorAll('.nav-links a')].filter(a => a.getBoundingClientRect().width > 0).length);
    record(engineName, 'navigation usable without JavaScript', links === 6, `${links} visible links`);
    await np.goto(BASE + '/setup.html', { waitUntil: 'load' });
    const cards = await np.evaluate(() => [...document.querySelectorAll('#gear-container .gear-card')].filter(c => c.getBoundingClientRect().height > 0).length);
    record(engineName, 'all 93 products render without JavaScript', cards === 93, String(cards));
    await noJs.close();
  } catch (e) {
    record(engineName, 'suite completed without an unexpected error', false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
  }
}

(async () => {
  const server = await serve.start(process.cwd(), PORT);
  try {
    for (const [name, launcher] of [['firefox', firefox], ['webkit', webkit], ['chromium', chromium]]) {
      console.log(`\n--- ${name} ---`);
      await runEngine(name, launcher);
    }
  } finally {
    server.close();
  }
  fs.writeFileSync('screenshots/cross-browser.json', JSON.stringify(results, null, 2));
  const failed = results.filter(r => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed, ${failed.length} failed ===`);
  failed.forEach(f => console.log(`  FAIL [${f.engine}] ${f.name} - ${f.detail || ''}`));
})().catch(e => { console.error(e); process.exit(1); });
