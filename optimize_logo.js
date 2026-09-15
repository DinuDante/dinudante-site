const sharp = require('sharp');
const fs = require('fs');

async function optimizeLogo() {
  const masterLogo = 'assets/logo.png';
  if (!fs.existsSync(masterLogo)) {
    console.error('Logo not found.');
    return;
  }

  // Create optimized nav logo (e.g., 88x88 for high-res retina)
  await sharp(masterLogo)
    .resize(88, 88)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile('assets/logo-nav.png');

  // Create optimized social preview logo
  await sharp(masterLogo)
    .resize(512, 512)
    .png({ quality: 80 })
    .toFile('assets/logo-social.png');

  console.log('Logos optimized.');
}

optimizeLogo().catch(console.error);
