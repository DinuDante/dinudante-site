/* Lighthouse mobile lab runs against the local build.

   These are LABORATORY measurements on this machine under Lighthouse's
   simulated mobile throttling. They are not field Core Web Vitals; no CrUX or
   INP percentile is claimed anywhere from this script.

   Run: node measure_perf.js [runs]
*/
const fs = require('fs');
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');

const PORT = 8143;
const RUNS = parseInt(process.argv[2] || '3', 10);
const ROUTES = [
  { name: 'home', url: '/' },
  { name: 'resume', url: '/resume.html' },
  { name: 'setup', url: '/setup.html' },
  { name: 'privacy', url: '/privacy/' }
];

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

(async () => {
  const lighthouse = (await import('lighthouse')).default;
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--remote-debugging-port=9222'] });
  const port = new URL(browser.wsEndpoint()).port;
  const out = { environment: {}, routes: [], note: 'Lighthouse lab runs with simulated mobile throttling on the local build. Not field data.' };
  out.environment.chrome = await browser.version();
  out.environment.node = process.version;
  out.environment.lighthouse = JSON.parse(fs.readFileSync('node_modules/lighthouse/package.json', 'utf8')).version;
  out.environment.when = new Date().toISOString();

  try {
    for (const route of ROUTES) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const res = await lighthouse(`http://127.0.0.1:${PORT}${route.url}`, {
          port, output: 'json', logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
        });
        const r = res.lhr;
        runs.push({
          performance: Math.round(r.categories.performance.score * 100),
          accessibility: Math.round(r.categories.accessibility.score * 100),
          bestPractices: Math.round(r.categories['best-practices'].score * 100),
          seo: Math.round(r.categories.seo.score * 100),
          lcp: r.audits['largest-contentful-paint'].numericValue,
          cls: r.audits['cumulative-layout-shift'].numericValue,
          tbt: r.audits['total-blocking-time'].numericValue,
          fcp: r.audits['first-contentful-paint'].numericValue,
          si: r.audits['speed-index'].numericValue,
          bytes: r.audits['total-byte-weight'] ? r.audits['total-byte-weight'].numericValue : null
        });
      }
      const summary = {
        route: route.name, url: route.url, runs: RUNS,
        performance: median(runs.map(r => r.performance)),
        accessibility: median(runs.map(r => r.accessibility)),
        bestPractices: median(runs.map(r => r.bestPractices)),
        seo: median(runs.map(r => r.seo)),
        lcpMs: Math.round(median(runs.map(r => r.lcp))),
        clsMedian: +median(runs.map(r => r.cls)).toFixed(3),
        tbtMs: Math.round(median(runs.map(r => r.tbt))),
        fcpMs: Math.round(median(runs.map(r => r.fcp))),
        speedIndexMs: Math.round(median(runs.map(r => r.si))),
        totalBytes: Math.round(median(runs.map(r => r.bytes || 0))),
        all: runs
      };
      out.routes.push(summary);
      console.log(`${route.name.padEnd(8)} perf ${summary.performance}  a11y ${summary.accessibility}  BP ${summary.bestPractices}  SEO ${summary.seo}` +
        `  | LCP ${summary.lcpMs}ms  CLS ${summary.clsMedian}  TBT ${summary.tbtMs}ms  FCP ${summary.fcpMs}ms  ${(summary.totalBytes / 1024).toFixed(0)}KB`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync('screenshots/performance.json', JSON.stringify(out, null, 2));
  console.log('\nevidence: screenshots/performance.json');
  console.log(`environment: Chrome ${out.environment.chrome}, Lighthouse ${out.environment.lighthouse}, ${RUNS} run(s) per route, median reported`);
})().catch(e => { console.error(e); process.exit(1); });
