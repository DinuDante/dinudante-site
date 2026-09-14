const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://link.amazon/B00cfvIN8', { waitUntil: 'networkidle2' });
  console.log('Final URL:', page.url());
  const title = await page.title();
  console.log('Title:', title);
  
  await browser.close();
}
run();
