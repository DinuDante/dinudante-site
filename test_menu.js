const puppeteer = require('puppeteer');
const path = require('path');

async function testMenu() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`file://${path.join(__dirname, 'index_test.html')}`);

  // Wait for JS to load
  await new Promise(r => setTimeout(r, 500));

  const isOpenBefore = await page.$eval('#main-navigation', el => el.classList.contains('is-open'));
  console.log('Is open before click?', isOpenBefore);

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.evaluate(() => {
    const btn = document.querySelector('.menu-toggle');
    console.log('Button visible?', getComputedStyle(btn).display);
    
    // add debug listeners
    document.addEventListener('click', e => console.log('Doc click target:', e.target.className));
    btn.addEventListener('click', () => console.log('Button clicked! aria is now', btn.getAttribute('aria-expanded')));
    
    btn.click();
    
    const links = document.querySelector('#main-navigation');
    console.log('Is open class present?', links.classList.contains('is-open'));
  });

  await browser.close();
}

testMenu().catch(console.error);
