const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png'};
const s = http.createServer((req, res) => {
  let p = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (fs.existsSync(p)) {
    res.writeHead(200, {'Content-Type': mime[path.extname(p)] || 'text/plain'});
    res.end(fs.readFileSync(p));
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

s.listen(3000, async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true});
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const btn = document.querySelector('.menu-toggle');
    const btnRect = btn.getBoundingClientRect();
    console.log('Button rect:', JSON.stringify(btnRect));
    
    const nav = document.querySelector('.site-nav');
    console.log('Nav rect:', JSON.stringify(nav.getBoundingClientRect()));
    
    // Simulate touch
    const touch = new Touch({
      identifier: Date.now(),
      target: btn,
      clientX: btnRect.x + 10,
      clientY: btnRect.y + 10,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 10,
      force: 0.5,
    });
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    console.log('Dispatching click...');
    btn.dispatchEvent(clickEvent);
    
    const links = document.querySelector('#main-navigation');
    console.log('Links classes:', links.className);
    console.log('Links display:', getComputedStyle(links).display);
    console.log('Links rect:', JSON.stringify(links.getBoundingClientRect()));
  });
  
  await browser.close();
  s.close();
});
