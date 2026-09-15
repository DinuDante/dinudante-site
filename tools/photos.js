/* Ingests photographs from an Instagram "Download your information" export and
   builds them into optimized, responsive site assets.

   The export is the agreed delivery route for the @ddprinterz account, because
   Instagram serves no post data to logged-out clients. Request it with
   Format: JSON and Media quality: High, or the archive contains display-sized
   re-encodes rather than the originals.

   Two commands, deliberately separate so that nothing is published without a
   human looking at the inventory first:

     node tools/photos.js inventory <export-dir>
         Walks the export, reads real pixel dimensions (never filenames), joins
         each image to its post metadata where the export provides it, and says
         which of the site's slots each file is large enough to fill.

     node tools/photos.js build --src <file> --slot <slot> [--focal <x%,y%>]
                                [--post <url>] [--alt "..."]
         Writes the responsive WebP set for that slot into assets/ and appends a
         provenance record to screenshots/photo-build.json.

   Slot specs come from measured rendered sizes at 390/768/1440/2560 viewports;
   see ASSET_MANIFEST.md. Minimum source = 2x the largest rendered size.
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SLOTS = {
  'ddprinterz-workshop': { aspect: [4, 3], widths: [480, 960, 1440, 1920], minSource: [2400, 1800], section: 'DDPrinterZ — replaces the studio headshot' },
  'ddprinterz-print': { aspect: [1, 1], widths: [400, 800, 1200, 1600], minSource: [1600, 1600], section: 'DDPrinterZ — a finished print' },
  'proleap-teaching': { aspect: [3, 2], widths: [480, 960, 1440, 1920], minSource: [2400, 1600], section: 'ProLEAP Academy — teaching or lab moment' },
  'workspace': { aspect: [3, 2], widths: [480, 960, 1440, 1920], minSource: [2400, 1600], section: 'Professional — a real workspace' },
  'portrait-hero': { aspect: [3, 4], widths: [360, 720, 1080, 1440], minSource: [1440, 1920], section: 'Homepage hero — only if clearly better than the current portrait' }
};
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

const walk = dir => {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
};

/* Instagram has shipped several export layouts. Try the known metadata
   locations, and carry on with pixel data alone if none is present. */
function readPostMetadata(exportDir) {
  const candidates = [
    'content/posts_1.json',
    'your_instagram_activity/content/posts_1.json',
    'your_instagram_activity/media/posts_1.json',
    'media/posts_1.json'
  ].map(p => path.join(exportDir, p));

  const byUri = new Map();
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { continue; }
    const posts = Array.isArray(data) ? data : (data.posts || data.ig_posts || []);
    for (const post of posts) {
      const caption = post.title || (post.media && post.media[0] && post.media[0].title) || '';
      for (const m of post.media || []) {
        if (!m.uri) continue;
        byUri.set(path.normalize(m.uri).replace(/\\/g, '/'), {
          caption: (m.title || caption || '').replace(/\s+/g, ' ').trim(),
          timestamp: m.creation_timestamp || post.creation_timestamp || null,
          metadataFile: path.relative(exportDir, file).replace(/\\/g, '/')
        });
      }
    }
  }
  return byUri;
}

async function inventory(exportDir) {
  if (!exportDir || !fs.existsSync(exportDir)) {
    console.error(`Export directory not found: ${exportDir || '(none given)'}`);
    console.error('Usage: node tools/photos.js inventory <unzipped-export-dir>');
    process.exit(1);
  }
  const files = walk(exportDir);
  if (!files.length) {
    console.error(`No image files under ${exportDir}. Is this the unzipped export root?`);
    process.exit(1);
  }
  const meta = readPostMetadata(exportDir);
  console.log(`${files.length} image file(s) found; post metadata for ${meta.size} media entr(ies).\n`);

  const rows = [];
  for (const file of files) {
    const rel = path.relative(exportDir, file).replace(/\\/g, '/');
    let m;
    try { m = await sharp(file).metadata(); } catch (e) { rows.push({ rel, error: e.message.split('\n')[0] }); continue; }
    const info = meta.get(rel) || meta.get(rel.replace(/^media\//, '')) || null;
    /* Judge eligibility on the size that survives the slot's aspect crop, which is
       what the build command enforces. Raw dimensions flatter landscape files into
       looking usable for portrait slots. */
    const fits = Object.entries(SLOTS).filter(([, s]) => {
      const target = s.aspect[0] / s.aspect[1];
      const cropW = Math.min(m.width, Math.round(m.height * target));
      const cropH = Math.min(m.height, Math.round(m.width / target));
      return cropW >= s.minSource[0] && cropH >= s.minSource[1];
    }).map(([name]) => name);
    rows.push({
      rel, width: m.width, height: m.height, format: m.format,
      bytes: fs.statSync(file).size,
      aspect: (m.width / m.height).toFixed(2),
      caption: info ? info.caption.slice(0, 70) : '',
      taken: info && info.timestamp ? new Date(info.timestamp * 1000).toISOString().slice(0, 10) : '',
      fits
    });
  }

  rows.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
  for (const r of rows) {
    if (r.error) { console.log(`  !! ${r.rel} — ${r.error}`); continue; }
    const usable = r.fits.length ? 'fits after crop: ' + r.fits.join(', ') : 'too small for any slot';
    console.log(`${String(r.width).padStart(5)}x${String(r.height).toString().padEnd(5)} ${r.format.padEnd(5)} ${(r.bytes / 1024).toFixed(0).padStart(6)}KB  ${r.taken.padEnd(11)} ${usable}`);
    console.log(`      ${r.rel}`);
    if (r.caption) console.log(`      "${r.caption}"`);
  }

  const outFile = path.join(ROOT, 'screenshots', 'photo-inventory.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ exportDir, generated: new Date().toISOString(), slots: SLOTS, rows }, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, outFile)}`);
  console.log('\nInstagram exports do not carry the post permalink, so the source post URL for');
  console.log('each chosen file has to be matched by date/caption and passed to `build --post`.');
}

async function build(args) {
  const src = args['--src'];
  const slotName = args['--slot'];
  const slot = SLOTS[slotName];
  if (!src || !slot) {
    console.error('Usage: node tools/photos.js build --src <file> --slot <slot> [--focal 50%,30%] [--post <url>] [--alt "..."]');
    console.error('Slots: ' + Object.keys(SLOTS).join(', '));
    process.exit(1);
  }
  if (!fs.existsSync(src)) { console.error(`Source not found: ${src}`); process.exit(1); }

  const m = await sharp(src).metadata();
  const [aw, ah] = slot.aspect;
  const target = aw / ah;
  const cropW = Math.min(m.width, Math.round(m.height * target));
  const cropH = Math.min(m.height, Math.round(m.width / target));
  if (cropW < slot.minSource[0] || cropH < slot.minSource[1]) {
    console.error(`Refusing to build: ${src} yields ${cropW}x${cropH} after the ${aw}:${ah} crop, below the ${slot.minSource[0]}x${slot.minSource[1]} minimum for "${slotName}".`);
    console.error('Supply a larger original rather than upscaling — upscaling would look worse than the current typographic section.');
    process.exit(1);
  }

  const written = [];
  for (const w of slot.widths) {
    const h = Math.round(w / target);
    const out = path.join(ROOT, 'assets', `${slotName}-${w}.webp`);
    await sharp(src)
      .resize(w, h, { fit: 'cover', position: args['--focal'] ? sharp.strategy.attention : 'centre' })
      .webp({ quality: 82, effort: 6 })
      .toFile(out);
    written.push({ file: path.relative(ROOT, out).replace(/\\/g, '/'), width: w, height: h, bytes: fs.statSync(out).size });
    console.log(`${path.relative(ROOT, out)}  ${w}x${h}  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
  }

  const record = {
    slot: slotName, section: slot.section,
    source: path.basename(src),
    sourceDimensions: `${m.width}x${m.height}`,
    postUrl: args['--post'] || null,
    alt: args['--alt'] || null,
    focal: args['--focal'] || 'centre',
    built: written, generated: new Date().toISOString()
  };
  const logFile = path.join(ROOT, 'screenshots', 'photo-build.json');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
  log.push(record);
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

  console.log(`\nsrcset: ${written.map(w => `/assets/${path.basename(w.file)} ${w.width}w`).join(', ')}`);
  if (!record.postUrl) console.log('NOTE: no --post given. ASSET_MANIFEST.md needs the source post URL before this ships.');
  if (!record.alt) console.log('NOTE: no --alt given. The image needs real alt text before this ships.');
}

const [, , cmd, ...rest] = process.argv;
const args = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) args[rest[i]] = rest[i + 1];

if (cmd === 'inventory') inventory(rest[0]);
else if (cmd === 'build') build(args);
else {
  console.log('Usage:');
  console.log('  node tools/photos.js inventory <unzipped-export-dir>');
  console.log('  node tools/photos.js build --src <file> --slot <slot> [--focal 50%,30%] [--post <url>] [--alt "..."]');
  console.log('\nSlots and their minimum source sizes:');
  for (const [n, s] of Object.entries(SLOTS)) {
    console.log(`  ${n.padEnd(22)} ${s.aspect.join(':').padEnd(5)} min ${s.minSource.join('x').padEnd(11)} ${s.section}`);
  }
  process.exit(cmd ? 1 : 0);
}
