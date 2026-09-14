const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

const urls = require('./new_urls.js');

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = [];
  
  // Create 5 pages to run concurrently
  const concurrency = 5;
  const pages = await Promise.all(Array.from({ length: concurrency }).map(() => browser.newPage()));
  
  let i = 0;
  while (i < urls.length) {
    const batch = urls.slice(i, i + concurrency);
    const promises = batch.map(async (url, idx) => {
      const page = pages[idx];
      console.log(`Fetching: ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const finalUrl = page.url();
        const title = await page.title();
        
        // Extract ASIN
        let asin = '';
        const match = finalUrl.match(/\/dp\/([A-Z0-9]{10})/);
        if (match) {
          asin = match[1];
        } else {
           // fallback to checking URL path
           const split = finalUrl.split('/');
           const idx = split.indexOf('dp');
           if (idx !== -1 && split[idx+1]) asin = split[idx+1].substring(0, 10);
        }
        
        if (!asin) {
           // Check if it's in the original url
           const origMatch = url.match(/B0[a-zA-Z0-9]{7,8}/i);
           if (origMatch) asin = origMatch[0].toUpperCase();
        }

        let image = await page.evaluate(() => {
          let img = document.querySelector('#landingImage');
          if (img) return img.src;
          img = document.querySelector('img#imgBlkFront');
          if (img) return img.src;
          const og = document.querySelector('meta[property="og:image"]');
          if (og) return og.content;
          return '';
        });

        results.push({ url, finalUrl, asin, title, image });
      } catch (e) {
        console.error(`Failed ${url}:`, e.message);
        results.push({ url, error: e.message });
      }
    });
    
    await Promise.all(promises);
    i += concurrency;
    
    // Save partial results just in case
    fs.writeFileSync('scraped_data.json', JSON.stringify(results, null, 2));
  }

  await browser.close();
  console.log('Done!');
}

scrapeData();
