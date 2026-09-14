const puppeteer = require('puppeteer');

async function testPage(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log(`\nTesting ${url}`);
  const response = await page.goto(url, { waitUntil: 'networkidle0' });
  const status = response.status();
  
  if (status !== 200) {
    console.log(`FAIL: HTTP ${status}`);
    await browser.close();
    return { url, status, h1: 0, errors: 1 };
  }

  const h1 = await page.$$eval('h1', els => els.length);
  const links = await page.$$eval('a', els => els.length);
  const schema = await page.$$eval('script[type="application/ld+json"]', els => els.length);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);

  console.log(`HTTP ${status}, H1: ${h1}, Links: ${links}, Schema: ${schema}, Overflow: ${overflow}`);
  console.log(`Errors: ${consoleErrors.length}`);
  
  await browser.close();
  return { url, status, h1, errors: consoleErrors.length, schema, overflow };
}

async function run() {
  const pages = [
    'http://127.0.0.1:8080/',
    'http://127.0.0.1:8080/setup.html',
    'http://127.0.0.1:8080/resume.html',
    'http://127.0.0.1:8080/privacy/',
    'http://127.0.0.1:8080/404.html'
  ];
  
  for (const p of pages) {
    await testPage(p);
  }
}
run();
