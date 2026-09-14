const fs = require('fs');

const content = fs.readFileSync('setup.html', 'utf8');
const itemsMatch = content.match(/const gearData = (\[.*?\]);/s);
let existingItems = [];
if (itemsMatch) {
  existingItems = JSON.parse(itemsMatch[1]);
} else {
  console.error("Could not find existing items");
}

let scrapedItems = [];
if (fs.existsSync('scraped_data.json')) {
  scrapedItems = JSON.parse(fs.readFileSync('scraped_data.json', 'utf8'));
}

function cleanTitle(title) {
  if (!title) return "Unknown Product";
  return title.replace(/ : Amazon\.in:.*/, '').replace(/ - Amazon.*/, '').trim();
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('laptop') || t.includes('macbook') || t.includes('desktop') || t.includes('mini pc') || t.includes('ipad')) return 'COMPUTE & DEVICES';
  if (t.includes('monitor') || t.includes('display')) return 'DISPLAYS';
  if (t.includes('keyboard') || t.includes('mouse') || t.includes('controller')) return 'INPUT & CONTROL';
  if (t.includes('earphone') || t.includes('headphone') || t.includes('mic') || t.includes('speaker') || t.includes('earbuds')) return 'AUDIO';
  if (t.includes('camera') || t.includes('webcam') || t.includes('light') || t.includes('tripod')) return 'CONTENT CREATION';
  if (t.includes('ssd') || t.includes('drive') || t.includes('hub') || t.includes('router') || t.includes('ethernet') || t.includes('adapter') || t.includes('switch')) return 'STORAGE & CONNECTIVITY';
  if (t.includes('charger') || t.includes('power') || t.includes('ups') || t.includes('battery')) return 'POWER';
  if (t.includes('desk') || t.includes('chair') || t.includes('arm') || t.includes('stand') || t.includes('mount')) return 'WORKSPACE';
  if (t.includes('printer') || t.includes('filament') || t.includes('pla')) return 'MAKER / 3D PRINTING';
  if (t.includes('phone') || t.includes('mobile')) return 'MOBILE ACCESSORIES';
  if (t.includes('cable')) return 'CABLES & ADAPTERS';
  return 'OTHER / ACCESSORIES';
}

const master = [...existingItems];

// deduplicate
const seenAsins = new Set(master.map(i => i.asin));

scrapedItems.forEach(item => {
  if (!item.error && item.asin && !seenAsins.has(item.asin)) {
    const cleanedTitle = cleanTitle(item.title);
    master.push({
      url: item.finalUrl || item.url,
      asin: item.asin,
      image: item.image,
      title: cleanedTitle,
      category: guessCategory(cleanedTitle),
      personallyTested: true,
      featured: false
    });
    seenAsins.add(item.asin);
  }
});

// Update all existing items to match new schema
master.forEach(item => {
  item.personallyTested = true;
  // Normalize old categories
  if (item.category.includes('Tech & Networking')) item.category = 'STORAGE & CONNECTIVITY';
  else if (item.category.includes('Peripherals')) item.category = 'INPUT & CONTROL';
  else if (item.category.includes('Workspace')) item.category = 'WORKSPACE';
  else if (item.category.includes('Maker')) item.category = 'MAKER / 3D PRINTING';
  else if (item.category.includes('Content')) item.category = 'CONTENT CREATION';
  else if (item.category.includes('Lifestyle')) item.category = 'OTHER / ACCESSORIES';
});

// Mark some items as MUST HAVE
const mustHaves = ['B0DKF24CYS', 'B07DKZCZ89', 'B00HFPIIOI', 'B0FQN7QDFC']; // random selection of strong items
master.forEach(item => {
  if (mustHaves.includes(item.asin)) item.featured = true;
});

// Calculate categories
const cats = [...new Set(master.map(i => i.category))].sort();

fs.writeFileSync('master_dataset.json', JSON.stringify(master, null, 2));

console.log('Master dataset size:', master.length);
console.log('Categories:', cats);
