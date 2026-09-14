const fs = require('fs');
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

// Generate Filters
const categories = [...new Set(master.map(i => i.category))].sort();

let filtersHtml = `<button class="filter-btn active" data-filter="all">ALL <span>${master.length}</span></button>\n`;
categories.forEach(cat => {
  const count = master.filter(i => i.category === cat).length;
  filtersHtml += `<button class="filter-btn" data-filter="${cat.replace(/ & | \/ | /g, '-').toLowerCase()}">${cat} <span>${count}</span></button>\n`;
});

// Generate Cards HTML
function createCard(item) {
  const filterCat = item.category.replace(/ & | \/ | /g, '-').toLowerCase();
  return `
    <a class="gear-card filter-item" data-category="${filterCat}" href="${item.url}" target="_blank" rel="sponsored noopener noreferrer">
      <div class="gear-image-wrap">
        <img src="${item.image || '/assets/gear-placeholder.svg'}" alt="${item.title}" loading="lazy" decoding="async">
        <span class="tested-badge"><svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Personally Tested</span>
        ${item.featured ? '<span class="must-have-badge">Must-Have</span>' : ''}
      </div>
      <div class="gear-info">
        <span class="gear-cat">${item.category}</span>
        <h3>${item.title}</h3>
        ${item.personalNote ? `<p class="personal-note">"${item.personalNote}"</p>` : ''}
        <span class="gear-link">View on Amazon &rarr;</span>
      </div>
    </a>`;
}

const mustHaves = master.filter(i => i.featured);
const allGearHtml = master.map(createCard).join('');

// Read existing HTML
let html = fs.readFileSync('setup.html', 'utf8');

// Replace Script logic for rendering
const scriptRegex = /<script>.*?const gearData.*?<\/script>/s;
const newScript = `
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const filters = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.filter-item');
    
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        
        items.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });
</script>
`;
html = html.replace(scriptRegex, newScript);

// Replace Filters
const filtersRegex = /<div class="filters" id="gear-filters">.*?<\/div>/s;
html = html.replace(filtersRegex, `<div class="filters" id="gear-filters">\n${filtersHtml}\n</div>`);

// Replace Grid with static HTML and Must-Haves
const gridRegex = /<div class="gear-grid" id="gear-container">.*?<\/div>/s;
const newGrid = `
<div class="trust-block">
  <div class="trust-icons">
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> PURCHASED</span>
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> USED</span>
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> TESTED</span>
  </div>
  <p>Real gear from my actual workspace. No generic recommendation list.</p>
</div>

${mustHaves.length > 0 ? `
<div class="must-have-section">
  <div class="divider shell" style="margin: 40px auto 20px;"><span>MY MUST-HAVE PICKS</span></div>
  <p class="section-note" style="text-align: center; margin-bottom: 30px;">The gear I'd buy again first—personally purchased, used and tested in my own workflow.</p>
  <div class="gear-grid">
    ${mustHaves.map(createCard).join('')}
  </div>
</div>
` : ''}

<div class="divider shell" style="margin: 40px auto 20px;"><span>ALL GEAR</span></div>
<div class="gear-grid" id="gear-container">
${allGearHtml}
</div>
`;
html = html.replace(gridRegex, newGrid);

// Replace 38 items text
html = html.replace(/38 items/g, `${master.length} items`);

// Schema update
const schemaRegex = /<script type="application\/ld\+json">.*?<\/script>/s;
const schemaMatch = html.match(schemaRegex);
if (schemaMatch) {
  let schema = JSON.parse(schemaMatch[0].replace(/<\/?script.*?>/g, ''));
  schema.numberOfItems = master.length;
  schema.itemListElement = master.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": {
      "@type": "Product",
      "url": item.url,
      "name": item.title,
      "image": item.image
    }
  }));
  html = html.replace(schemaRegex, `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`);
}

// Write file
fs.writeFileSync('setup.html', html);
console.log('setup.html fully rebuilt!');
