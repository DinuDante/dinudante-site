const fs = require('fs');
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

// Exact required order
const categories = [
  "COMPUTING & MOBILE",
  "DISPLAYS",
  "INPUT & CONTROL",
  "AUDIO",
  "CREATOR GEAR",
  "STORAGE & CONNECTIVITY",
  "POWER & CHARGING",
  "WORKSPACE",
  "MAKER & 3D PRINTING"
];

let filtersHtml = `<button class="filter-btn active" data-filter="all">ALL GEAR <span>${master.length}</span></button>\n`;
categories.forEach(cat => {
  const count = master.filter(i => i.primaryCategory === cat).length;
  if (count > 0) {
    filtersHtml += `<button class="filter-btn" data-filter="${cat.replace(/ & | \/ | /g, '-').toLowerCase()}">${cat} <span>${count}</span></button>\n`;
  }
});

function createCard(item) {
  const filterCat = item.primaryCategory.replace(/ & | \/ | /g, '-').toLowerCase();
  // We attach data-search attribute for simple client-side search without DOM traversal
  const searchString = `${item.title} ${item.primaryCategory}`.toLowerCase().replace(/"/g, '&quot;');
  return \`
    <a class="gear-card filter-item" data-category="\${filterCat}" data-search="\${searchString}" href="\${item.url}" target="_blank" rel="sponsored noopener noreferrer">
      <div class="gear-image-wrap">
        <img src="\${item.image || '/assets/gear-placeholder.svg'}" alt="\${item.title}" loading="lazy" decoding="async">
        <span class="tested-badge"><svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Personally Tested</span>
        \${item.featured ? '<span class="must-have-badge">Must-Have</span>' : ''}
      </div>
      <div class="gear-info">
        <span class="gear-cat">\${item.primaryCategory}</span>
        <h3>\${item.title}</h3>
        \${item.personalNote ? \`<p class="personal-note">"\${item.personalNote}"</p>\` : ''}
        <span class="gear-link">View on Amazon &rarr;</span>
      </div>
    </a>\`;
}

const mustHaves = master.filter(i => i.featured);
const allGearHtml = master.map(createCard).join('');

let html = fs.readFileSync('setup.html', 'utf8');

const scriptRegex = /<script>.*?document\.addEventListener\("DOMContentLoaded".*?<\/script>/s;
const newScript = \`
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const filters = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.filter-item');
    const searchInput = document.getElementById('gear-search');
    
    function applyFilters() {
      const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
      const query = searchInput ? searchInput.value.toLowerCase() : '';
      
      let visibleCount = 0;
      
      items.forEach(item => {
        const matchesCategory = (activeFilter === 'all' || item.dataset.category === activeFilter);
        const matchesSearch = query === '' || item.dataset.search.includes(query);
        
        if (matchesCategory && matchesSearch) {
          item.style.display = 'flex';
          // Count only main gear items, not must-have clones
          if (item.closest('#gear-container')) visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });
      
      // Update count text or show empty state if needed
      // (Optional simple empty state)
    }
    
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
    
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
  });
</script>
\`;
html = html.replace(scriptRegex, newScript);

// Search and Filters HTML
const filtersRegex = /<div class="filters" id="gear-filters">.*?<\/div>/s;
const filtersAndSearchHtml = \`
<div class="search-wrap" style="max-width: 400px; margin: 0 auto 20px;">
  <input type="text" id="gear-search" placeholder="Search my gear..." style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--text); outline: none;">
</div>
<div class="filters" id="gear-filters">
\${filtersHtml}
</div>
\`;
html = html.replace(filtersRegex, filtersAndSearchHtml);

const gridRegex = /<div class="trust-block">.*?<div class="gear-grid" id="gear-container">\s*<\/div>/s;

// We need to inject the HTML into the setup.html properly
// Let's use a simpler marker or just manually build the inner sections
html = html.replace(/<div class="trust-block">.*?(?=<section class="shell")/s, 
\`<div class="trust-block">
  <div class="trust-icons">
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> PURCHASED</span>
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> USED</span>
    <span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> TESTED</span>
  </div>
  <p>Every product here is something I've personally bought, used and tested in my own workflow.</p>
</div>

\${mustHaves.length > 0 ? \`
<div class="must-have-section">
  <div class="divider shell" style="margin: 40px auto 20px;"><span>MY MUST-HAVE PICKS</span></div>
  <p class="section-note" style="text-align: center; margin-bottom: 30px;">The gear I'd buy again first—personally purchased, used and tested in my own workflow.</p>
  <div class="gear-grid">
    \${mustHaves.map(createCard).join('')}
  </div>
</div>
\` : ''}

<div class="divider shell" style="margin: 40px auto 20px;"><span>COMPLETE SETUP</span></div>
<div class="gear-grid" id="gear-container">
\${allGearHtml}
</div>
\`);

// Update Schema
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
  html = html.replace(schemaRegex, \`<script type="application/ld+json">\n\${JSON.stringify(schema, null, 2)}\n</script>\`);
}

fs.writeFileSync('setup.html', html);
console.log('setup.html updated with perfect taxonomy and search!');
