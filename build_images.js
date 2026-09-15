/* Produces the delivered image variants from the owner's masters:
   - logo-nav.png     small crisp header mark. The 1.79 MB master lives in masters/,
                      which _config.yml excludes, so it is never served.
   - favicon / touch icons
   - share-card.png   purpose-built 1200x630 social preview with legible text
   Masters stay in the repository but off the delivery path entirely.

   Run: node build_images.js
*/
const fs = require('fs');
const sharp = require('sharp');

const MASTER_LOGO = 'masters/logo.png';
const PORTRAIT = 'assets/dinesh-professional.webp';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  if (!fs.existsSync(MASTER_LOGO)) throw new Error('missing ' + MASTER_LOGO);

  // --- header mark and icons -------------------------------------------
  await sharp(MASTER_LOGO).resize(88, 88, { fit: 'cover' }).png({ compressionLevel: 9, palette: true }).toFile('assets/logo-nav.png');
  await sharp(MASTER_LOGO).resize(180, 180, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile('assets/apple-touch-icon.png');
  await sharp(MASTER_LOGO).resize(192, 192, { fit: 'cover' }).png({ compressionLevel: 9, palette: true }).toFile('assets/icon-192.png');
  await sharp(MASTER_LOGO).resize(512, 512, { fit: 'cover' }).png({ compressionLevel: 9, palette: true }).toFile('assets/icon-512.png');
  await sharp(MASTER_LOGO).resize(32, 32, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile('assets/favicon-32x32.png');
  await sharp(MASTER_LOGO).resize(16, 16, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile('assets/favicon-16x16.png');
  await sharp(MASTER_LOGO).resize(32, 32, { fit: 'cover' }).toFile('favicon.ico');

  // Small portrait variant for the print/PDF layout, so the downloadable
  // résumé does not embed a 720x960 image inside a 26 mm box.
  await sharp(PORTRAIT).resize(300, 400, { fit: 'cover', position: 'top' }).webp({ quality: 82 }).toFile('assets/dinesh-professional-300.webp');

  // --- 1200x630 share card ---------------------------------------------
  // Text is drawn as SVG so it stays sharp and correctly spelled; only the
  // portrait and the mark are raster.
  const W = 1200, H = 630;
  const name = 'Dinesh Behera';
  const role = 'Cloud, Platform &amp; DevOps Engineer';
  const line3 = 'Educator at ProLEAP Academy&#160;&#183; Maker at DDPrinterZ';

  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#101a16"/>
        <stop offset="55%" stop-color="#0d1512"/>
        <stop offset="100%" stop-color="#16231c"/>
      </linearGradient>
      <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#a85f59"/>
        <stop offset="40%" stop-color="#80719a"/>
        <stop offset="100%" stop-color="#859d7b"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="6" fill="url(#rule)"/>
    <text x="80" y="196" font-family="Consolas, monospace" font-size="24" letter-spacing="6" fill="#859d7b">DINUDANTE.IN</text>
    <text x="80" y="290" font-family="Georgia, serif" font-size="76" fill="#e2e3d8">${esc(name)}</text>
    <text x="80" y="352" font-family="Georgia, serif" font-size="38" fill="#c0c5bf">${role}</text>
    <text x="80" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#98a098">${line3}</text>
    <rect x="80" y="468" width="120" height="3" fill="#859d7b"/>
    <text x="80" y="528" font-family="Consolas, monospace" font-size="22" letter-spacing="3" fill="#98a098">BHUBANESWAR &#183; ODISHA &#183; INDIA</text>
  </svg>`);

  const portrait = await sharp(PORTRAIT)
    .resize(320, 427, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

  // Rounded mask for the portrait so it matches the site's card language.
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="427"><rect width="320" height="427" rx="14" ry="14" fill="#fff"/></svg>`);
  const roundedPortrait = await sharp(portrait)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: roundedPortrait, left: W - 320 - 80, top: (H - 427) / 2 | 0 }])
    .png({ compressionLevel: 9 })
    .toFile('assets/share-card.png');

  const report = ['dinesh-professional-300.webp', 'logo-nav.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
    'favicon-32x32.png', 'favicon-16x16.png', 'share-card.png'];
  for (const f of report) {
    const p = 'assets/' + f;
    const m = await sharp(p).metadata();
    console.log(`${f.padEnd(24)} ${m.width}x${m.height}  ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
