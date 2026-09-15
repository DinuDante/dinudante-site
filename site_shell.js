/* Canonical header / footer / shared head markup for every route.
   build_pages.js injects these into the HTML files so the four public pages
   plus the 404 page cannot drift apart. */

const SITE = 'https://dinudante.in';
const FULL_NAME = 'Dinesh Behera | Dinu | DinuDante';
const EMAIL = 'dineshdante.ds@gmail.com';
const WHATSAPP = 'https://wa.me/919040632014';
const INSTAGRAM = 'https://www.instagram.com/ddprinterz/';
const YOUTUBE = 'https://www.youtube.com/@DDPrinterZ';

const ICONS = {
  mail: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Zm16 10V9.8l-8 5-8-5V17h16Z"/></svg>',
  whatsapp: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3 .8.8-2.9-.2-.4A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.5-3.3-3-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.4 0-.6l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1.1 1.5-1 2.5.1 1.2.8 2.5 1 2.7.1.2 2 3.2 5 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.2-.2-.4-.3l-1.8-.8Z"/></svg>',
  instagram: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11.5 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>',
  youtube: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.3 3.7-6.3 3.7Z"/></svg>',
  doc: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 2h9l5 5v15H6V2Zm2 2v16h10V8h-4V4H8Zm2 8h6v2h-6v-2Zm0 4h6v2h-6v-2Z"/></svg>',
  download: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 3h2v10l3.5-3.5 1.4 1.4-5.9 5.9-5.9-5.9 1.4-1.4L11 13V3ZM4 19h16v2H4v-2Z"/></svg>',
  print: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h10v4H7V3Zm-3 6h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2v4H6v-4H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Zm4 8v3h8v-3H8Zm9-4.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>',
  check: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
};

// Primary navigation. `hash` entries resolve against the homepage.
const NAV = [
  { id: 'professional', label: 'Profile', hash: '#professional' },
  { id: 'experience', label: 'Experience', hash: '#experience' },
  { id: 'academy', label: 'Learn', hash: '#academy' },
  { id: 'maker', label: 'Maker', hash: '#maker' },
  { id: 'setup', label: 'Setup', path: '/setup.html' },
  { id: 'resume', label: 'Résumé', path: '/resume.html' }
];

function nav(page) {
  const links = NAV.map(item => {
    const href = item.path ? item.path : (page === 'home' ? item.hash : '/' + item.hash);
    const current = item.id === page ? ' aria-current="page"' : '';
    return `<a class="nav-link" href="${href}"${current}>${item.label}</a>`;
  }).join('');

  return `<nav class="site-nav" aria-label="Main">
    <a class="mark" href="/" aria-label="DinuDante home"><img class="mark-symbol" src="/assets/logo-nav.png" alt="" width="38" height="38" decoding="async"><span class="mark-name">Dinu<b>Dante</b></span></a>
    <div class="nav-actions">
      <button class="menu-toggle" type="button" aria-controls="main-navigation" aria-expanded="false">Menu</button>
      <div class="nav-links" id="main-navigation">${links}</div>
      <div class="theme-control">
        <span class="theme-label" aria-hidden="true">dark</span>
        <button class="theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false"></button>
      </div>
    </div>
  </nav>`;
}

function footer() {
  return `<footer>
    <div class="footer-row shell">
      <span>© 2026 ${FULL_NAME} · Bhubaneswar, India</span>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/resume.html">Résumé</a>
        <a href="/setup.html">Setup</a>
        <a href="/privacy/">Privacy</a>
        <a href="${INSTAGRAM}" target="_blank" rel="noopener">${ICONS.instagram} DDPrinterZ on Instagram</a>
        <a href="${YOUTUBE}" target="_blank" rel="noopener">${ICONS.youtube} DDPrinterZ on YouTube</a>
        <a href="${WHATSAPP}" target="_blank" rel="noopener">${ICONS.whatsapp} WhatsApp</a>
        <a href="mailto:${EMAIL}">${ICONS.mail} Email</a>
      </div>
    </div>
  </footer>`;
}

/* Shared head block: icons plus sharing metadata. `page` supplies title,
   description and canonical path; the share card is the purpose-built
   1200x630 graphic, not the square logo master. */
function head({ title, description, url }) {
  return `<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <meta property="og:site_name" content="DinuDante">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${SITE}${url}">
  <meta property="og:image" content="${SITE}/assets/share-card.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="DinuDante — Dinesh Behera, cloud, platform and DevOps engineer">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${SITE}/assets/share-card.png">`;
}

module.exports = { SITE, FULL_NAME, EMAIL, WHATSAPP, INSTAGRAM, YOUTUBE, ICONS, NAV, nav, footer, head };
