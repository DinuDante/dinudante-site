const sharp = require('sharp');
const fs = require('fs');

async function generateFavicons() {
  const input = 'assets/logo.png';
  if (!fs.existsSync(input)) {
    console.error('Logo missing!');
    return;
  }
  
  // favicon-16x16.png
  await sharp(input).resize(16, 16).toFile('assets/favicon-16x16.png');
  // favicon-32x32.png
  await sharp(input).resize(32, 32).toFile('assets/favicon-32x32.png');
  // apple-touch-icon.png
  await sharp(input).resize(180, 180).toFile('assets/apple-touch-icon.png');
  // icon-192.png
  await sharp(input).resize(192, 192).toFile('assets/icon-192.png');
  // icon-512.png
  await sharp(input).resize(512, 512).toFile('assets/icon-512.png');
  
  // favicon.ico (just copy the 32x32 as a hack, or we can just use svg/png instead in HTML)
  await sharp(input).resize(32, 32).toFile('favicon.ico');
  
  console.log('Favicons generated');
}

generateFavicons();
