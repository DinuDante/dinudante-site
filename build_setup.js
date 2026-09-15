/* Generates setup.html entirely from master_dataset.json — catalogue cards,
   featured references, category filters with counts, the visible totals and
   the ItemList structured data all come from that one file, so they cannot
   drift apart.

   Run: node curate_dataset.js && node build_setup.js && node build_pages.js
*/
const fs = require('fs');
const { ICONS } = require('./site_shell');

const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

const CATEGORY_ORDER = [
  'COMPUTING & MOBILE', 'DISPLAYS', 'INPUT & CONTROL', 'AUDIO', 'CREATOR GEAR',
  'STORAGE & CONNECTIVITY', 'POWER & CHARGING', 'WORKSPACE', 'MAKER & 3D PRINTING', 'EVERYDAY & UTILITY'
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Sentence case for display, but "3D" stays an acronym rather than becoming "3d".
const title = c => (c.charAt(0) + c.slice(1).toLowerCase()).replace(/\b3d\b/g, '3D');

const counts = {};
for (const item of master) counts[item.primaryCategory] = (counts[item.primaryCategory] || 0) + 1;
const used = CATEGORY_ORDER.filter(c => counts[c]);
const total = master.length;
const tested = master.filter(i => i.personallyTested).length;
const featured = master.filter(i => i.featured);

/* ------------------------------------------------------------- cards */

function note(item) {
  return item.personallyTested
    ? `<p class="gear-note">${ICONS.check} Bought and used by me</p>`
    : `<p class="gear-note is-new"><svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2 9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6L12 2Z"/></svg> Recently added — not yet long-term tested</p>`;
}

/* Catalogue card: the outbound action is the verified Amazon destination. */
function card(item) {
  const full = item.exactListingTitle && item.exactListingTitle !== item.title ? item.exactListingTitle : null;
  const search = [item.title, item.exactListingTitle || '', item.primaryCategory, item.asin]
    .join(' ').toLowerCase().replace(/\s+/g, ' ').trim();

  return `<li class="gear-card" id="item-${item.asin}" data-category="${slug(item.primaryCategory)}" data-search="${esc(search)}" tabindex="-1">
      <div class="gear-card__media">
        <img src="${esc(item.image || '/assets/gear-placeholder.svg')}" alt="${esc(item.title)}" loading="lazy" decoding="async" width="400" height="300">
        ${item.featured ? '<span class="must-have-badge">Must-have</span>' : ''}
      </div>
      <div class="gear-card__body">
        <span class="gear-cat">${esc(title(item.primaryCategory))}</span>
        <h3 class="gear-card__title"><a href="${esc(item.url)}" target="_blank" rel="sponsored noopener noreferrer">${esc(item.title)}</a></h3>
        ${note(item)}
        ${full ? `<details class="gear-details"><summary>Full product name</summary><p>${esc(full)}</p></details>` : ''}
        <div class="gear-card__footer">
          <a class="gear-cta" href="${esc(item.url)}" target="_blank" rel="sponsored noopener noreferrer">View on Amazon <span aria-hidden="true">↗</span><span class="visually-hidden"> — ${esc(item.title)}, opens in a new tab</span></a>
        </div>
      </div>
    </li>`;
}

/* Featured card: an internal reference to the same catalogue record, never a
   duplicate product definition, so its action is "View item". */
function featuredCard(item) {
  return `<li class="gear-card">
      <div class="gear-card__media">
        <img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async" width="400" height="300">
        <span class="must-have-badge">Must-have</span>
      </div>
      <div class="gear-card__body">
        <span class="gear-cat">${esc(title(item.primaryCategory))}</span>
        <h3 class="gear-card__title"><a href="#item-${item.asin}">${esc(item.title)}</a></h3>
        ${note(item)}
        <div class="gear-card__footer">
          <a class="gear-cta" href="#item-${item.asin}">View item <span aria-hidden="true">↓</span><span class="visually-hidden"> — ${esc(item.title)}, in the list below</span></a>
        </div>
      </div>
    </li>`;
}

const filters = [
  `<li><button class="filter-btn" type="button" data-filter="all" aria-pressed="true">All gear <span class="filter-n">${total}</span></button></li>`,
  ...used.map(c => `<li><button class="filter-btn" type="button" data-filter="${slug(c)}" aria-pressed="false">${esc(title(c))} <span class="filter-n">${counts[c]}</span></button></li>`)
].join('\n            ');

/* -------------------------------------------------------- structured data */

const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': 'https://dinudante.in/setup.html#catalogue',
  name: 'My setup — hardware Dinesh Behera uses',
  numberOfItems: total,
  itemListOrder: 'https://schema.org/ItemListUnordered',
  itemListElement: master.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      '@id': `https://dinudante.in/setup.html#item-${item.asin}`,
      name: item.exactListingTitle || item.title,
      alternateName: item.title,
      category: title(item.primaryCategory),
      image: item.image,
      url: item.url
    }
  }))
};

const collectionPage = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  url: 'https://dinudante.in/setup.html',
  name: 'My setup — Dinesh Behera',
  description: `The ${total} pieces of hardware Dinesh Behera uses for cloud engineering, teaching, making and content work.`,
  about: { '@id': 'https://dinudante.in/#person' },
  mainEntity: { '@id': 'https://dinudante.in/setup.html#catalogue' }
};

/* ------------------------------------------------------------------ page */

const html = `<!doctype html>
<html lang="en" data-theme="night">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0d1512">
  <link rel="canonical" href="https://dinudante.in/setup.html">
  <title>My setup — Dinesh Behera | Dinu | DinuDante</title>
  <meta name="description" content="The hardware Dinesh Behera actually uses for cloud engineering, teaching, making and content work. Search and filter the full gear list.">
  <link rel="preconnect" href="https://m.media-amazon.com" crossorigin>
  <!--assets:start-->
  <!--assets:end-->
  <!--head:start-->
  <!--head:end-->
  <script type="application/ld+json">
${JSON.stringify(collectionPage, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(itemList, null, 2)}
  </script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <!--nav:start-->
  <!--nav:end-->
  <main id="main-content" tabindex="-1">

    <header class="setup-hero shell">
      <span class="eyebrow">Gear · workspace · tools</span>
      <h1>My setup</h1>
      <p class="intro">The hardware behind my cloud engineering, coding, teaching, maker projects and content work — the whole list, not a highlight reel.</p>
      <ul class="setup-facts">
        <li><strong>${total}</strong> products</li>
        <li><strong>${used.length}</strong> categories</li>
        <li><strong>${tested}</strong> bought, used and tested by me</li>
      </ul>
      <p class="affiliate-note"><strong>Affiliate disclosure.</strong> Product links below are Amazon affiliate links, so a purchase may earn me a commission at no extra cost to you. That does not change what is listed: this is the hardware I actually own. ${total - tested > 0 ? `${total - tested} recently added items are marked as not yet long-term tested.` : ''} See the <a href="/privacy/">privacy page</a> for details.</p>
    </header>

    <section class="shell catalogue-section must-have-section" aria-labelledby="must-have-heading">
      <div class="catalogue-head">
        <h2 id="must-have-heading">Must-have picks</h2>
        <span class="catalogue-count">${featured.length} of ${total}</span>
      </div>
      <ul class="gear-grid">
        ${featured.map(featuredCard).join('\n        ')}
      </ul>
    </section>

    <section class="shell catalogue-section" aria-labelledby="catalogue-heading">
      <div class="catalogue-head">
        <h2 id="catalogue-heading">All gear</h2>
        <span class="catalogue-count" id="catalogue-count" role="status" aria-live="polite">${total} items</span>
      </div>

      <div class="discovery">
        <div class="search-field" id="search-field">
          <label class="visually-hidden" for="gear-search">Search my gear by name, brand or category</label>
          <input type="search" id="gear-search" name="q" placeholder="Search my gear…" autocomplete="off" spellcheck="false">
          <button class="search-clear" type="button" id="search-clear" aria-label="Clear search"><span aria-hidden="true">✕</span></button>
        </div>

        <ul class="filters" id="gear-filters" aria-label="Filter by category">
            ${filters}
        </ul>

        <div class="reset-row" id="reset-row" hidden>
          <span class="active-filter-summary" id="filter-summary"></span>
          <button class="button" type="button" id="reset-filters">Clear filters</button>
        </div>
      </div>

      <ul class="gear-grid" id="gear-container">
        ${master.map(card).join('\n        ')}
      </ul>

      <div class="empty-state" id="empty-state" hidden>
        <h3>No gear matches that.</h3>
        <p>Try a shorter search term, a different spelling, or browse a category instead.</p>
        <button class="button button-primary" type="button" id="empty-reset">Show all ${total} items</button>
      </div>

      <p class="catalogue-foot">Every product above links to its Amazon listing. Prices, availability and listing variants are Amazon's and can change at any time.<br>
        <a class="back-to-top" href="#catalogue-heading">↑ Back to the search and filters</a></p>
    </section>

  </main>
  <!--footer:start-->
  <!--footer:end-->
  <!--script:start-->
  <!--script:end-->
  <script src="/assets/setup.js?v=20260915" defer></script>
</body>
</html>
`;

fs.writeFileSync('setup.html', html);
console.log(`setup.html generated from master_dataset.json`);
console.log(`  products: ${total}   featured: ${featured.length}   categories: ${used.length}   owner-tested: ${tested}`);
console.log(`  JSON-LD numberOfItems: ${itemList.numberOfItems}  (list length ${itemList.itemListElement.length})`);
