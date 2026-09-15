const puppeteer = require('puppeteer');

async function scrapeAmazon() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  // Bypass bot detection lightly
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const links = [
    'https://www.amazon.in/dp/B0CRKGKZVX',
    'https://www.amazon.in/dp/B0BYVDM93V'
  ];

  for (let link of links) {
    await page.goto(link, { waitUntil: 'domcontentloaded' });
    const title = await page.$eval('#productTitle', el => el.innerText.trim()).catch(() => 'Title Not Found');
    const image = await page.$eval('#landingImage', el => el.getAttribute('src')).catch(() => 'Image Not Found');
    console.log(`\nURL: ${link}\nTitle: ${title}\nImage: ${image}`);
  }
  
  await browser.close();
}

scrapeAmazon().catch(console.error);
