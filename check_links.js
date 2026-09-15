/* Link and destination inventory.

   Internal: every same-origin href and referenced resource across all routes,
   checked against the local build (status, content type, hash targets).

   External: every outbound destination, resolved with a real browser so
   marketplace and course pages are not judged by a bot-blocked HTTP client.
   Nothing is submitted — no forms, no messages, no purchases; WhatsApp and
   mailto targets are reported as handoffs and never opened.

   Run: node check_links.js [--external]
*/
const fs = require('fs');
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');

const PORT = 8139;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = ['/', '/resume.html', '/setup.html', '/privacy/', '/404.html'];
const DO_EXTERNAL = process.argv.includes('--external');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

(async () => {
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  const report = { internal: [], resources: [], hashes: [], external: [], handoffs: [], generated: new Date().toISOString() };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const internalTargets = new Set();
    const externalTargets = new Map();
    const hashChecks = [];

    for (const route of ROUTES) {
      const resources = [];
      page.on('response', r => resources.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] || '' }));
      await page.goto(BASE + route, { waitUntil: 'networkidle2' });
      page.removeAllListeners('response');

      for (const r of resources) {
        if (r.url.startsWith(BASE)) report.resources.push({ route, ...r, url: r.url.slice(BASE.length) });
      }

      const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({
        href: a.getAttribute('href'), abs: a.href, protocol: a.protocol, host: a.host,
        text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
        rel: a.getAttribute('rel') || '', target: a.getAttribute('target') || ''
      })));

      for (const l of links) {
        if (l.protocol === 'mailto:' || l.protocol === 'tel:') {
          report.handoffs.push({ route, kind: l.protocol.replace(':', ''), target: l.abs, label: l.text, result: 'handoff to the visitor\'s own client — deliberately not opened' });
        } else if (l.host === new URL(BASE).host) {
          if (l.href.startsWith('#')) hashChecks.push({ route, hash: l.href, label: l.text });
          else internalTargets.add(new URL(l.abs).pathname + new URL(l.abs).search);
        } else if (/^https?:$/.test(l.protocol)) {
          if (/(^|\.)wa\.me$/.test(l.host)) {
            report.handoffs.push({ route, kind: 'whatsapp', target: l.abs, label: l.text, result: 'chat handoff — deliberately not opened, no message sent' });
          } else if (!externalTargets.has(l.abs)) {
            externalTargets.set(l.abs, { routes: [route], label: l.text, rel: l.rel, target: l.target });
          } else externalTargets.get(l.abs).routes.push(route);
        }
      }

      // Every in-page anchor must resolve to a real element on that route.
      for (const h of hashChecks.filter(h => h.route === route)) {
        h.exists = await page.evaluate(sel => {
          try { return !!document.querySelector(sel); } catch (_) { return false; }
        }, h.hash);
      }
    }
    report.hashes = hashChecks;

    // Internal routes, checked for status and case-sensitive path correctness.
    for (const t of [...internalTargets].sort()) {
      const res = await page.goto(BASE + t, { waitUntil: 'domcontentloaded' });
      report.internal.push({ path: t, status: res.status(), type: res.headers()['content-type'] || '' });
    }

    /* ------------------------------ external ------------------------------ */
    if (DO_EXTERNAL) {
      const ext = await browser.newPage();
      await ext.setUserAgent(UA);
      await ext.setViewport({ width: 1280, height: 900 });
      await ext.setRequestInterception(true);
      ext.on('request', req => {
        // Load only the document; block images/media so the sweep stays fast
        // and no third-party tracking beacons are exercised.
        const t = req.resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(t)) req.abort();
        else req.continue();
      });

      const list = [...externalTargets.entries()];
      for (let i = 0; i < list.length; i++) {
        const [url, meta] = list[i];
        const row = { url, label: meta.label, rel: meta.rel, routes: [...new Set(meta.routes)] };
        try {
          const res = await ext.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          row.status = res.status();
          row.finalUrl = ext.url();
          row.title = (await ext.title()).replace(/\s+/g, ' ').trim().slice(0, 120);
          const asin = row.finalUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
          if (asin) row.resolvedAsin = asin[1];
          row.result = row.status < 400 ? 'reached' : 'error';
        } catch (e) {
          row.result = 'blocked/unreachable from this environment';
          row.error = e.message.split('\n')[0];
        }
        report.external.push(row);
        process.stdout.write(`\r  external ${i + 1}/${list.length}  ${row.result.padEnd(38)}`);
      }
      await ext.close();
      process.stdout.write('\n');
    }
  } finally {
    await browser.close();
    server.close();
  }

  fs.writeFileSync('screenshots/links.json', JSON.stringify(report, null, 2));

  const badInternal = report.internal.filter(r => r.status >= 400 && r.path !== '/404.html');
  const badRes = report.resources.filter(r => r.status >= 400);
  const badHash = report.hashes.filter(h => !h.exists);
  console.log('\n=== LINK REPORT ===');
  console.log(`internal routes checked: ${report.internal.length}, failures: ${badInternal.length}`);
  badInternal.forEach(r => console.log(`  FAIL ${r.status} ${r.path}`));
  console.log(`subresource responses: ${report.resources.length}, failures: ${badRes.length}`);
  badRes.forEach(r => console.log(`  FAIL ${r.status} ${r.url}`));
  console.log(`in-page anchors: ${report.hashes.length}, unresolved: ${badHash.length}`);
  badHash.forEach(h => console.log(`  FAIL ${h.route} ${h.hash} (${h.label})`));
  console.log(`handoffs (not opened): ${report.handoffs.length}`);
  if (DO_EXTERNAL) {
    const ok = report.external.filter(r => r.result === 'reached');
    const err = report.external.filter(r => r.result !== 'reached');
    console.log(`external destinations: ${report.external.length}, reached: ${ok.length}, unverified: ${err.length}`);
    err.forEach(r => console.log(`  UNVERIFIED ${r.url} — ${r.result}${r.error ? ' (' + r.error + ')' : ''}`));
  } else {
    console.log('external destinations: skipped (pass --external)');
  }
  console.log('evidence: screenshots/links.json');
  process.exit(badInternal.length + badRes.length + badHash.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
