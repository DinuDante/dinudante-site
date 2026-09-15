/* Applies the reviewed catalogue taxonomy and short display names to
   master_dataset.json, which is the single source for setup.html, its counts,
   its featured references and its structured data.

   Every entry below was reviewed against the product's actual identity.
   `category` is the reviewed primary category; `name` is a concise display
   name that keeps brand, model and the distinguishing variant. The full
   marketplace listing title is preserved untouched in `exactListingTitle`,
   and URLs, ASINs, images and affiliate attribution are never rewritten here.

   Run: node curate_dataset.js
*/
const fs = require('fs');

const CATEGORIES = [
  'COMPUTING & MOBILE',
  'DISPLAYS',
  'INPUT & CONTROL',
  'AUDIO',
  'CREATOR GEAR',
  'STORAGE & CONNECTIVITY',
  'POWER & CHARGING',
  'WORKSPACE',
  'MAKER & 3D PRINTING',
  'EVERYDAY & UTILITY'
];

// asin -> { category, name }
const REVIEW = {
  // --- Audio: headphones, earphones, microphones and their cases -----------
  B07DKZCZ89: { category: 'AUDIO', name: 'GIZGA Essentials earphone carrying case' },
  B0DK979YJ7: { category: 'AUDIO', name: 'Noise Master Buds wireless earbuds' },
  B0CRB1HP5H: { category: 'AUDIO', name: 'KZ EDX Pro dual-driver IEM earphones' },
  B0B8YMQRFV: { category: 'AUDIO', name: 'Samsung Galaxy Buds2 Pro' },
  B0D3NY4SCH: { category: 'AUDIO', name: 'Spigen Rugged Armor case for Galaxy Buds 3' },
  B00K0AMYFO: { category: 'AUDIO', name: 'Sony MDR-ZX310AP on-ear headset' },
  B084X7Y51M: { category: 'AUDIO', name: 'Sennheiser CX 80S wired earphones' },
  B0FBRGKXHG: { category: 'AUDIO', name: 'OnePlus Bullets Wireless Z3 neckband' },
  B0DH8BVS6Z: { category: 'AUDIO', name: 'Digitek DWM-116 wireless microphone (USB-C / Lightning)' },

  // --- Computing & mobile: the machines and what protects them -------------
  B0DW4GMZ9W: { category: 'COMPUTING & MOBILE', name: 'Xiaomi Pad 7 (nano-texture display)' },
  B0DSJ192XN: { category: 'COMPUTING & MOBILE', name: 'Xiaomi Pad 7 cover' },
  B0DSC444ZS: { category: 'COMPUTING & MOBILE', name: 'Xiaomi Focus Pen for Pad 7 / Pad 8' },
  B0DN1SN9NM: { category: 'COMPUTING & MOBILE', name: 'ProElite flip case for Kindle Paperwhite 12th gen 7"' },
  B084RQ8PYF: { category: 'COMPUTING & MOBILE', name: 'MOCA 360 laptop sleeve (15.4–16")' },
  B0FLHKFSGF: { category: 'COMPUTING & MOBILE', name: 'Kreo Arctik Pro RGB laptop cooling pad' },
  B0FJXK5882: { category: 'COMPUTING & MOBILE', name: 'ZORBES 3-in-1 MagSafe grip, stand and ring holder' },
  B0DLWSYPPV: { category: 'COMPUTING & MOBILE', name: 'Spigen Dual Pop MagSafe ring holder (black)' },
  B0GVPYX2K9: { category: 'COMPUTING & MOBILE', name: 'VANAMALI MagSafe phone grip holder' },

  // --- Displays: screens, projectors and screen lighting -------------------
  B0CRKGKZVX: { category: 'DISPLAYS', name: 'ARZOPA 16.1" 144Hz FHD portable monitor' },
  B0DPCNCFGJ: { category: 'DISPLAYS', name: 'BenQ GW2790Q 27" QHD 100Hz IPS monitor' },
  B0BRQVQJW2: { category: 'DISPLAYS', name: 'LG 29" UltraWide FHD 100Hz IPS monitor' },
  B0GJHXN7LJ: { category: 'DISPLAYS', name: 'Quntis 40 cm monitor light bar (black)' },
  B00HFRRQUS: { category: 'DISPLAYS', name: 'Inlight 6 × 4 ft map-type projector screen' },
  B0GTQXM485: { category: 'DISPLAYS', name: 'WZATCO Yuva Bolt smart home projector' },

  // --- Input & control: keyboards, mice, controllers and their cases -------
  B0F66JWD47: { category: 'INPUT & CONTROL', name: 'EvoFox Ronin 75% wireless mechanical keyboard' },
  B0GLH6M7DL: { category: 'INPUT & CONTROL', name: 'AULA F75 75% wireless mechanical keyboard' },
  B071YZJ1G1: { category: 'INPUT & CONTROL', name: 'Logitech MX Master 2S wireless mouse' },
  B09KH6NFXG: { category: 'INPUT & CONTROL', name: 'Razer DeathAdder V2 X HyperSpeed wireless mouse' },
  B08CGWCRBP: { category: 'INPUT & CONTROL', name: 'ELEPHANTBOAT hard case for MX Master mice' },
  B07P397J9Z: { category: 'INPUT & CONTROL', name: 'Stealodeal EVA game-controller travel case' },

  // --- Creator gear: capture, lighting and rigging -------------------------
  B0CYQ5P6T7: { category: 'CREATOR GEAR', name: 'eMeet S600 4K streaming webcam' },
  B09DPQNLQ7: { category: 'CREATOR GEAR', name: 'Ulanzi 360° RGB LED handheld light wand' },
  B087CX8M2B: { category: 'CREATOR GEAR', name: 'ULANZI MT-08 mini tripod and selfie stick' },
  B0DGY46DXC: { category: 'CREATOR GEAR', name: 'ADOFYS 3-in-1 magnetic neck POV mount' },
  B0912XTYLZ: { category: 'CREATOR GEAR', name: 'POPIO Bluetooth remote shutter' },
  B0FNRV6X18: { category: 'CREATOR GEAR', name: 'CP PLUS 2MP Full HD Wi-Fi camera' },

  // --- Storage & connectivity: data, video and network paths --------------
  B0FQN7QDFC: { category: 'STORAGE & CONNECTIVITY', name: 'TP-Link EH210 gigabit ethernet splitter' },
  B0DJH27B1Q: { category: 'STORAGE & CONNECTIVITY', name: 'TP-Link UH9120C 9-in-1 USB-C hub' },
  B0DTT9NHQP: { category: 'STORAGE & CONNECTIVITY', name: 'Portronics mPort View One 5-in-1 USB-C hub' },
  B09HLZLPRW: { category: 'STORAGE & CONNECTIVITY', name: 'BlueRigger Cat 8 ethernet cable' },
  B0DNYZQ5GS: { category: 'STORAGE & CONNECTIVITY', name: 'TP-Link UE302C USB-C ethernet adapter' },
  B09FDRMZ73: { category: 'STORAGE & CONNECTIVITY', name: 'TP-Link UE306 USB 3.0 ethernet adapter' },
  B078L5J7G1: { category: 'STORAGE & CONNECTIVITY', name: 'D-Link DIR-825 dual-band Wi-Fi router' },
  B0CJNXWVWT: { category: 'STORAGE & CONNECTIVITY', name: 'pibox India NVMe M.2 SSD enclosure (USB 3.2)' },
  B07D1J88CF: { category: 'STORAGE & CONNECTIVITY', name: 'UGREEN USB-C / USB 3.0 SD card reader' },
  B09X7CFXSX: { category: 'STORAGE & CONNECTIVITY', name: 'SanDisk Extreme Pro SD UHS-I card' },
  B0CC8V1Y5F: { category: 'STORAGE & CONNECTIVITY', name: 'UGREEN USB-C to HDMI 2.0 cable, 1 m (4K 60Hz)' },
  B0CTSVNR4C: { category: 'STORAGE & CONNECTIVITY', name: 'Hagibis USB4 240W cable (40Gbps, 8K 60Hz)' },
  B0D5YH1HJV: { category: 'STORAGE & CONNECTIVITY', name: 'FEDUS Thunderbolt 4 / USB4 cable (40Gbps, 240W)' },
  B0D1FZQLYD: { category: 'STORAGE & CONNECTIVITY', name: 'Ambrane USB-C female to USB-A male OTG adapter' },
  B0FZVV6693: { category: 'STORAGE & CONNECTIVITY', name: 'Techie Mini DisplayPort to HDMI converter' },

  // --- Power & charging ----------------------------------------------------
  B0BYVDM93V: { category: 'POWER & CHARGING', name: 'Ambrane Powerlit Ultra 100W 25,000mAh power bank' },
  B0DSC6PBV8: { category: 'POWER & CHARGING', name: 'Ambrane 100W GaN charger (4 ports)' },
  B0FCFGLP7B: { category: 'POWER & CHARGING', name: 'Ambrane 70W GaN charger (3 ports)' },
  B0CNLS5M7L: { category: 'POWER & CHARGING', name: 'Portronics Adapto Volt 65 — 65W 5-in-1 power strip' },
  B07ZKD8T1Q: { category: 'POWER & CHARGING', name: 'Cuzor 12V mini UPS for router' },
  B0FHDQSFN4: { category: 'POWER & CHARGING', name: 'Verilux 240W USB-C cable with LED display' },
  B083Q4SHPT: { category: 'POWER & CHARGING', name: 'UGREEN 100W right-angle USB-C cable, 1 m' },

  // --- Workspace: desk, seating, air, cleaning and desk mounts -------------
  B0CW6F2RMS: { category: 'WORKSPACE', name: 'Green Soul Pebble mid-back mesh office chair' },
  B0DV5HWDY7: { category: 'WORKSPACE', name: 'Green Soul Zodiac Superb office chair' },
  B0BQ3K251H: { category: 'WORKSPACE', name: 'Green Soul Vermont study table with bookshelf' },
  B0854KQBD5: { category: 'WORKSPACE', name: 'Rife vented metal monitor stand riser' },
  B0CST4CYVH: { category: 'WORKSPACE', name: 'LISEN adjustable tablet and monitor stand' },
  B0H7N3YKZY: { category: 'WORKSPACE', name: 'EDNITA mini laptop stand (2 pcs)' },
  B0G6XLSZLH: { category: 'WORKSPACE', name: 'Wayona height-adjustable aluminium laptop stand' },
  B0FQHGG943: { category: 'WORKSPACE', name: 'ZORBES 360° magnetic desk phone stand' },
  B0DQK87RJG: { category: 'WORKSPACE', name: 'TechMaven overhead desk phone mount' },
  B076VF43GG: { category: 'WORKSPACE', name: 'Solimo 12-inch analog wall clock' },
  B08GJ57MKL: { category: 'WORKSPACE', name: 'Coway Airmega 150 air purifier' },
  B09ML1JMLV: { category: 'WORKSPACE', name: 'KEYORA sunset projector LED desk lamp' },
  B0C1GY4Q2N: { category: 'WORKSPACE', name: 'AGARO 48,000 RPM compressed air duster' },
  B0CQM2L6DQ: { category: 'WORKSPACE', name: 'Ambrane 20-in-1 device cleaning kit' },
  B07GBZ132F: { category: 'WORKSPACE', name: 'SOFTSPUN microfiber cleaning cloths' },
  B08NYSP2FX: { category: 'WORKSPACE', name: 'DailyObjects Wrap-Lock silicone cable ties (set of 7)' },

  // --- Maker & 3D printing -------------------------------------------------
  B0D1G6J7DD: { category: 'MAKER & 3D PRINTING', name: 'Serplex vacuum filament storage bags (10 pcs)' },
  B07V1GJFK5: { category: 'MAKER & 3D PRINTING', name: 'ApTechDeals HTC-1 digital hygrometer and thermometer' },
  B0DXLCF467: { category: 'MAKER & 3D PRINTING', name: 'QUARANT 99.9% isopropyl alcohol spray (2 × 100 ml)' },
  B0DXLCDJ8L: { category: 'MAKER & 3D PRINTING', name: 'QUARANT 99.9% isopropyl alcohol (bottle)' },
  B09C64KW3S: { category: 'MAKER & 3D PRINTING', name: 'REDCOP 99.9% isopropyl alcohol, 300 ml' },

  // --- Everyday & utility --------------------------------------------------
  B00HFPIIOI: { category: 'EVERYDAY & UTILITY', name: 'Casio F-91W-1Q digital watch' },
  B0CSSPQ8QJ: { category: 'EVERYDAY & UTILITY', name: 'Glow-in-the-dark Arc Reactor keychain (blue)' },
  B0BXGY76GX: { category: 'EVERYDAY & UTILITY', name: 'HEAVY DRIVER belt-clip phone holster' },
  B09HVD9C45: { category: 'EVERYDAY & UTILITY', name: 'AllSett Health migraine relief ice head wrap' },
  B0F4KS1NWP: { category: 'EVERYDAY & UTILITY', name: 'NUUK BFF rechargeable personal hand fan' },
  B0BTJ3WTMV: { category: 'EVERYDAY & UTILITY', name: 'Buy Gear 31L anti-theft laptop backpack' },
  B0BGSV19KZ: { category: 'EVERYDAY & UTILITY', name: 'Red Lemon Swiss Cut 15.6" laptop backpack' },
  B0CKBND48X: { category: 'EVERYDAY & UTILITY', name: 'Boldfit doorway pull-up bar' },
  B09GBF7BDL: { category: 'EVERYDAY & UTILITY', name: 'Boldfit 2.5 L gym water bottle' },
  B0FSY2R459: { category: 'EVERYDAY & UTILITY', name: 'Frido Cloud Comfort lace-up shoes' },
  B0DT6G93YX: { category: 'EVERYDAY & UTILITY', name: 'GCA kitchen utility knife' },
  B08HDK65K8: { category: 'EVERYDAY & UTILITY', name: 'Skyshop C240 Prime car TPMS' },
  B0D37XX7W6: { category: 'EVERYDAY & UTILITY', name: 'Qubo digital tyre inflator (Hero Group)' },
  B09TQT5GVM: { category: 'EVERYDAY & UTILITY', name: 'Tantra scooter mobile holder' }
};

const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

const seen = new Set();
const problems = [];

for (const item of master) {
  const review = REVIEW[item.asin];
  if (!review) { problems.push(`no review entry for ${item.asin} — ${item.title}`); continue; }
  seen.add(item.asin);
  if (!CATEGORIES.includes(review.category)) problems.push(`unknown category for ${item.asin}: ${review.category}`);

  // Keep the untouched marketplace listing title as the full identity.
  if (!item.exactListingTitle) item.exactListingTitle = item.title;
  item.title = review.name;
  item.primaryCategory = review.category;
  item.category = review.category;
}

for (const asin of Object.keys(REVIEW)) {
  if (!seen.has(asin)) problems.push(`review entry ${asin} matches no catalogue product`);
}

if (problems.length) {
  console.error('Curation problems:\n - ' + problems.join('\n - '));
  process.exit(1);
}

fs.writeFileSync('master_dataset.json', JSON.stringify(master, null, 2) + '\n');

const counts = {};
for (const item of master) counts[item.primaryCategory] = (counts[item.primaryCategory] || 0) + 1;
console.log(`Curated ${master.length} products.`);
console.log(`Featured: ${master.filter(i => i.featured).length}  ·  owner-tested: ${master.filter(i => i.personallyTested).length}`);
for (const c of CATEGORIES) console.log(`  ${String(counts[c] || 0).padStart(3)}  ${c}`);
const longest = master.reduce((a, b) => (a.title.length > b.title.length ? a : b));
console.log(`Longest display name: ${longest.title.length} chars — ${longest.title}`);
