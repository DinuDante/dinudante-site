const fs = require('fs');
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

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

let filtersHtml = '<button class="filter-btn active" data-filter="all">ALL GEAR <span>' + master.length + '</span></button>\n';
categories.forEach(cat => {
  const count = master.filter(i => i.primaryCategory === cat).length;
  if (count > 0) {
    filtersHtml += '<button class="filter-btn" data-filter="' + cat.replace(/ & | \/ | /g, '-').toLowerCase() + '">' + cat + ' <span>' + count + '</span></button>\n';
  }
});

function createCard(item) {
  const filterCat = item.primaryCategory.replace(/ & | \/ | /g, '-').toLowerCase();
  const searchString = (item.title + ' ' + item.primaryCategory).toLowerCase().replace(/"/g, '&quot;');
  return '<a id="item-' + item.asin + '" class="gear-card filter-item" data-category="' + filterCat + '" data-search="' + searchString + '" href="' + item.url + '" target="_blank" rel="sponsored noopener noreferrer">' +
      '<div class="gear-image-wrap">' +
        '<img src="' + (item.image || '/assets/gear-placeholder.svg') + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">' +
        '<span class="tested-badge"><svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Personally Tested</span>' +
        (item.featured ? '<span class="must-have-badge">Must-Have</span>' : '') +
      '</div>' +
      '<div class="gear-info">' +
        '<span class="gear-cat">' + item.primaryCategory + '</span>' +
        '<h3>' + item.title + '</h3>' +
        (item.personalNote ? '<p class="personal-note">"' + item.personalNote + '"</p>' : '') +
        '<span class="gear-link">View on Amazon &rarr;</span>' +
      '</div>' +
    '</a>';
}

function createMustHaveCard(item) {
  return '<a class="gear-card must-have-spotlight" href="#item-' + item.asin + '">' +
      '<div class="gear-image-wrap">' +
        '<img src="' + (item.image || '/assets/gear-placeholder.svg') + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">' +
        '<span class="must-have-badge">Must-Have</span>' +
      '</div>' +
      '<div class="gear-info">' +
        '<span class="gear-cat">' + item.primaryCategory + '</span>' +
        '<h3>' + item.title + '</h3>' +
        '<span class="gear-link">View Canonical Product &darr;</span>' +
      '</div>' +
    '</a>';
}

const mustHaves = master.filter(i => i.featured);
const allGearHtml = master.map(createCard).join('');

let html = fs.readFileSync('setup.html', 'utf8');

// Replace Script
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart) + 9;

const newScript = '<script>\n' +
  'document.addEventListener("DOMContentLoaded", () => {\n' +
    'const filters = document.querySelectorAll(".filter-btn");\n' +
    'const items = document.querySelectorAll(".filter-item");\n' +
    'const searchInput = document.getElementById("gear-search");\n' +
    'function applyFilters() {\n' +
      'const activeFilter = document.querySelector(".filter-btn.active").dataset.filter;\n' +
      'const query = searchInput ? searchInput.value.toLowerCase() : "";\n' +
      'let visibleCount = 0;\n' +
      'items.forEach(item => {\n' +
        'const matchesCategory = (activeFilter === "all" || item.dataset.category === activeFilter);\n' +
        'const matchesSearch = query === "" || item.dataset.search.includes(query);\n' +
        'if (matchesCategory && matchesSearch) {\n' +
          'item.style.display = "flex";\n' +
          'visibleCount++;\n' +
        '} else {\n' +
          'item.style.display = "none";\n' +
        '}\n' +
      '});\n' +
    '}\n' +
    'filters.forEach(btn => {\n' +
      'btn.addEventListener("click", () => {\n' +
        'filters.forEach(f => f.classList.remove("active"));\n' +
        'btn.classList.add("active");\n' +
        'applyFilters();\n' +
      '});\n' +
    '});\n' +
    'if (searchInput) {\n' +
      'searchInput.addEventListener("input", applyFilters);\n' +
    '}\n' +
  '});\n' +
'</script>';

html = html.substring(0, scriptStart) + newScript + html.substring(scriptEnd);

// Replace Filters and Search
const filtersStart = html.indexOf('<div class="search-wrap"');
const searchWrapStart = filtersStart !== -1 ? filtersStart : html.indexOf('<div class="filters" id="gear-filters">');
const filtersEnd = html.indexOf('</div>', html.indexOf('<div class="filters" id="gear-filters">')) + 6;

const filtersAndSearchHtml = '<div class="search-wrap" style="max-width: 400px; margin: 0 auto 20px;">\n' +
  '<label for="gear-search" class="visually-hidden">Search my gear</label>\n' +
  '<input type="text" id="gear-search" placeholder="Search my gear..." style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--text); outline: none;">\n' +
'</div>\n' +
'<div class="filters" id="gear-filters">\n' +
filtersHtml +
'</div>';

html = html.substring(0, searchWrapStart) + filtersAndSearchHtml + html.substring(filtersEnd);

// Replace Grid
const trustBlockStart = html.indexOf('<div class="trust-block">');
const disclaimerStart = html.indexOf('<div class="disclaimer">');

const newGrid = '<div class="trust-block">\n' +
  '<div class="trust-icons">\n' +
    '<span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> PURCHASED</span>\n' +
    '<span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> USED</span>\n' +
    '<span><svg class="brand-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg> TESTED</span>\n' +
  '</div>\n' +
  '<p>Every product here is something I\'ve personally bought, used and tested in my own workflow. These are real recommendations from my setup—not a generic affiliate catalogue.</p>\n' +
'</div>\n' +
(mustHaves.length > 0 ? 
'<div class="must-have-section">\n' +
  '<div class="divider shell" style="margin: 40px auto 20px;"><span>MY MUST-HAVE PICKS</span></div>\n' +
  '<p class="section-note" style="text-align: center; margin-bottom: 30px;">The gear I\'d buy again first—personally purchased, used and tested in my own workflow.</p>\n' +
  '<div class="gear-grid">\n' +
    mustHaves.map(createMustHaveCard).join('') +
  '</div>\n' +
'</div>\n' : '') +
'<div class="divider shell" style="margin: 40px auto 20px;"><span>COMPLETE SETUP</span></div>\n' +
'<div class="gear-grid" id="gear-container">\n' +
allGearHtml +
'</div>\n';

html = html.substring(0, trustBlockStart) + newGrid + html.substring(disclaimerStart);

// Update Schema
const schemaStart = html.indexOf('<script type="application/ld+json">');
const schemaEnd = html.indexOf('</script>', schemaStart) + 9;
if (schemaStart !== -1) {
  let schemaText = html.substring(schemaStart, schemaEnd);
  let schema = JSON.parse(schemaText.replace(/<\/?script.*?>/g, ''));
  schema.numberOfItems = master.length;
  schema.itemListElement = master.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": {
      "@type": "Product",
      "url": item.canonicalProductUrl,
      "name": item.title,
      "image": item.image
    }
  }));
  html = html.substring(0, schemaStart) + '<script type="application/ld+json">\n' + JSON.stringify(schema, null, 2) + '\n</script>' + html.substring(schemaEnd);
}

fs.writeFileSync('setup.html', html);
console.log('setup.html updated perfectly!');
