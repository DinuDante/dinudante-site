const fs = require('fs');

const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

// Re-map categories
master.forEach(p => {
  const t = p.title.toLowerCase();
  if (t.includes('tp-link eh210')) p.primaryCategory = 'STORAGE & CONNECTIVITY';
  if (t.includes('green soul') && t.includes('chair')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('kz edx pro')) p.primaryCategory = 'AUDIO';
  if (t.includes('benq gw2790q')) p.primaryCategory = 'DISPLAYS';
  if (t.includes('lg ultrawide')) p.primaryCategory = 'DISPLAYS';
  if (t.includes('xiaomi pad 7')) p.primaryCategory = 'COMPUTING & MOBILE';
  if (t.includes('sony mdr-zx310ap')) p.primaryCategory = 'AUDIO';
  if (t.includes('quntis monitor light')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('green soul') && t.includes('table')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('usb4') || t.includes('thunderbolt')) p.primaryCategory = 'STORAGE & CONNECTIVITY';
  // Fallbacks if not categorized
  if (!p.primaryCategory) p.primaryCategory = 'EVERYDAY & UTILITY';
});
fs.writeFileSync('master_dataset.json', JSON.stringify(master, null, 2));

const categories = [
  "COMPUTING & MOBILE", "DISPLAYS", "INPUT & CONTROL", "AUDIO", 
  "CREATOR GEAR", "STORAGE & CONNECTIVITY", "POWER & CHARGING", 
  "WORKSPACE", "MAKER & 3D PRINTING", "EVERYDAY & UTILITY"
];

let filtersHtml = '<button class="filter-btn active" data-filter="all">ALL GEAR</button>\n';
categories.forEach(cat => {
  const count = master.filter(i => i.primaryCategory === cat).length;
  if (count > 0) {
    filtersHtml += '<button class="filter-btn" data-filter="' + cat.replace(/ & | \/ | /g, '-').toLowerCase() + '">' + cat + '</button>\n';
  }
});

function createCard(item, isMustHave = false) {
  const filterCat = item.primaryCategory.replace(/ & | \/ | /g, '-').toLowerCase();
  const searchString = (item.title + ' ' + item.primaryCategory).toLowerCase().replace(/"/g, '&quot;');
  
  let href = item.url;
  let target = 'target="_blank" rel="sponsored noopener noreferrer"';
  let className = 'gear-card filter-item';
  let cta = 'View on Amazon &rarr;';
  
  if (isMustHave) {
    href = '#item-' + item.asin;
    target = '';
    className = 'gear-card must-have-spotlight';
    cta = 'View Canonical Product &darr;';
  }
  
  const idAttr = isMustHave ? '' : ' id="item-' + item.asin + '"';
  
  return '<a' + idAttr + ' class="' + className + '" ' + (isMustHave ? '' : 'data-category="' + filterCat + '" data-search="' + searchString + '" ') + 'href="' + href + '" ' + target + '>' +
      '<div class="gear-card__media">' +
        '<img src="' + (item.image || '/assets/gear-placeholder.svg') + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">' +
        (item.featured ? '<span class="must-have-badge">Must-Have</span>' : '') +
      '</div>' +
      '<div class="gear-card__body">' +
        '<span class="gear-cat">' + item.primaryCategory + '</span>' +
        '<h3 class="gear-card__title">' + item.title + '</h3>' +
        '<span class="tested-badge"><svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Personally tested</span>' +
        '<div class="gear-card__footer"><span class="gear-link">' + cta + '</span></div>' +
      '</div>' +
    '</a>';
}

const mustHaves = master.filter(i => i.featured);
const allGearHtml = master.map(item => createCard(item, false)).join('');

// Reconstruct setup.html safely
let html = fs.readFileSync('setup.html', 'utf8');

const mainStart = html.indexOf('<main');
const footerStart = html.indexOf('<footer>');

if (mainStart > -1 && footerStart > -1) {
  const newMain = `
  <main id="main-content" tabindex="-1">
    <section class="shell setup-hero" style="padding-bottom: 0;">
      <span class="eyebrow">MY SETUP</span>
      <h1>Hardware and tools behind my cloud engineering, coding, teaching, maker projects and content workflow.</h1>
      <div style="font-family: var(--font-mono); color: var(--muted); font-size: 0.8rem; border-top: 1px solid var(--line); padding-top: 16px; margin-top: 16px;">
        <strong>${master.length} PRODUCTS</strong> &nbsp;&middot;&nbsp; PERSONALLY PURCHASED &middot; USED &middot; TESTED
      </div>
    </section>

    <div class="catalogue-container">
      ${mustHaves.length > 0 ? `
      <div style="margin-top: 48px;">
        <h2 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 16px;">MY MUST-HAVE PICKS</h2>
        <div class="must-have-grid">
          ${mustHaves.map(item => createCard(item, true)).join('')}
        </div>
      </div>
      ` : ''}

      <div style="margin-top: 64px; margin-bottom: 60px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 16px; margin-bottom: 16px;">
          <h2 id="catalogue-title" style="font-size: 1.25rem; font-weight: 500; margin: 0;">ALL GEAR</h2>
          <span id="catalogue-count" style="font-family: var(--font-mono); color: var(--muted); font-size: 0.85rem;">${master.length} items</span>
        </div>
        
        <div class="search-wrap">
          <label for="gear-search" class="visually-hidden" style="position:absolute;left:-9999px;">Search my gear</label>
          <input type="text" id="gear-search" placeholder="Search my gear..." style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--text);outline:none;">
        </div>
        
        <div class="filters" id="gear-filters">
          ${filtersHtml}
        </div>
        
        <div class="gear-grid" id="gear-container">
          ${allGearHtml}
        </div>
        
        <div class="disclaimer" style="font-size:0.75rem;color:var(--muted);margin-top:40px;padding-top:20px;border-top:1px dashed var(--line);">
          * Some links may be affiliate links. Recommendations are based on products I've personally purchased and used.
        </div>
      </div>
    </div>
  </main>`;
  
  html = html.substring(0, mainStart) + newMain + "\n  " + html.substring(footerStart);
}

// Clean up styles
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
if (styleStart > -1 && styleEnd > -1) {
  html = html.substring(0, styleStart) + `
  <style>
      .setup-hero { padding: 60px 0 40px; }
      .catalogue-container { width: min(1320px, calc(100% - 40px)); margin-inline: auto; }
      .filters { display: flex; gap: 8px; margin-top: 16px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; flex-wrap: wrap; }
      .filters::-webkit-scrollbar { display: none; }
      .filter-btn { background: transparent; border: 1px solid var(--line); color: var(--muted); padding: 8px 16px; border-radius: 99px; font-size: 0.75rem; font-family: var(--font-body); cursor: pointer; transition: all 0.2s; white-space: nowrap; height: 38px; }
      .filter-btn:hover { border-color: var(--green); color: var(--text); }
      .filter-btn.active { background: var(--deep); border-color: var(--green); color: #fff; }
      .gear-grid, .must-have-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
      @media (max-width: 1199px) { .gear-grid, .must-have-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 899px) { .gear-grid, .must-have-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 599px) { .gear-grid, .must-have-grid { grid-template-columns: 1fr; } }
      .gear-card { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; margin: 0; transform: none; }
      .gear-card:hover { transform: translateY(-2px); border-color: var(--green); box-shadow: 0 12px 24px var(--shadow); }
      .gear-card__media { flex: 0 0 220px; height: 220px; width: 100%; padding: 20px; display: flex; align-items: center; justify-content: center; background: #fff; position: relative; border-bottom: 1px solid var(--line); overflow: hidden; box-sizing: border-box; }
      [data-theme="night"] .gear-card__media { background: #111; }
      .gear-card__media a, .gear-card__media picture { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
      .gear-card__media img { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; display: block; margin: 0; padding: 0; }
      [data-theme="night"] .gear-card__media img { mix-blend-mode: normal; filter: drop-shadow(0 0 8px rgba(255,255,255,0.05)); }
      .gear-card__body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 16px; margin: 0; transform: none; position: static; background: transparent; }
      .gear-cat { font-size: 0.65rem; color: var(--green); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-mono); margin: 0; }
      .gear-card__title { font-size: 0.95rem; line-height: 1.4; font-weight: 500; margin: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; min-height: 4.2em; }
      .tested-badge { font-size: 0.75rem; color: var(--muted); display: flex; align-items: center; gap: 6px; margin: 0; }
      .must-have-badge { position: absolute; top: 12px; left: 12px; background: var(--green); color: #fff; font-size: 0.65rem; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; z-index: 2; margin: 0; }
      .gear-card__footer { margin-top: auto; padding-top: 12px; }
      .gear-link { font-size: 0.75rem; color: var(--muted); font-family: var(--font-mono); }
      .gear-card:hover .gear-link { color: var(--text); }
  </style>` + html.substring(styleEnd + 8);
}

fs.writeFileSync('setup.html', html);
console.log('Build setup done.');
