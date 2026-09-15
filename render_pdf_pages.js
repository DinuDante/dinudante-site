// Renders every page of the downloadable resume PDF to a PNG so the output can be
// inspected visually. Usage: node render_pdf_pages.js [pdfUrlPath] [outDir]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');

const PDF_PATH = process.argv[2] || '/assets/Dinesh_Behera_Resume.pdf';
const OUT_DIR = process.argv[3] || 'screenshots/pdf';
const PORT = 8127;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('pageerror:', e.message));
    await page.goto(`http://127.0.0.1:${PORT}/tools/pdf-viewer.html?file=${encodeURIComponent(PDF_PATH)}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__pdfReady === true || window.__pdfError', { timeout: 60000 });
    const err = await page.evaluate(() => window.__pdfError);
    if (err) throw new Error(err);
    const count = await page.evaluate(() => window.__pdfPages);
    console.log(`PDF pages: ${count}`);
    for (let i = 1; i <= count; i++) {
      const el = await page.$(`#page-${i}`);
      const file = path.join(OUT_DIR, `page-${i}.png`);
      await el.screenshot({ path: file });
      console.log('wrote', file);
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
