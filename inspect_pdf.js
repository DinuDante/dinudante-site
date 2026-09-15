// Reports page count, page size, embedded fonts, extractable text volume and
// every hyperlink annotation in the downloadable resume.
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');
const PORT = 8133;
const file = process.argv[2] || '/assets/Dinesh_Behera_Resume.pdf';
(async () => {
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/tools/pdf-inspect.html?file=${encodeURIComponent(file)}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__result || window.__error', { timeout: 60000 });
    const err = await page.evaluate(() => window.__error);
    if (err) throw new Error(err);
    console.log(JSON.stringify(await page.evaluate(() => window.__result), null, 2));
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
