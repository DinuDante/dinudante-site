const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  
  const pages = [
    { name: 'local_index', url: `file://${__dirname}/index.html` },
    { name: 'local_resume', url: `file://${__dirname}/resume.html` },
    { name: 'local_setup', url: `file://${__dirname}/setup.html` },
    { name: 'prod_index', url: 'https://dinudante.in/' },
    { name: 'prod_resume', url: 'https://dinudante.in/resume.html' }
  ];

  const viewports = [
    { width: 390, height: 844 },
    { width: 1440, height: 900 }
  ];

  for (const p of pages) {
    const page = await browser.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'networkidle0' });
      for (const vp of viewports) {
        await page.setViewport(vp);
        await page.screenshot({ path: `screenshots/after_${p.name}_${vp.width}.png`, fullPage: true });
        console.log(`Saved screenshots/after_${p.name}_${vp.width}.png`);
      }
    } catch (e) {
      console.error(`Error on ${p.url}: ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
}

run();
