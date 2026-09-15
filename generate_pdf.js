const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function generatePDF() {
  console.log('Starting local server...');
  const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath == './') filePath = './index.html';
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm',
      '.webp': 'image/webp'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404);
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(8123, '127.0.0.1');

  try {
    console.log('Generating PDF...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set to light theme explicitly
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    
    const resumeUrl = 'http://127.0.0.1:8123/resume.html';
    
    await page.goto(resumeUrl, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: 'assets/Dinesh_Behera_Resume.pdf',
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' } 
      // margins handled by CSS @page
    });
    
    await browser.close();
    console.log('PDF Generated successfully at assets/Dinesh_Behera_Resume.pdf');
  } finally {
    server.close();
  }
}

generatePDF().catch(console.error);
