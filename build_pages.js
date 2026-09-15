/* Injects the canonical shell (head metadata, header, footer, asset refs)
   from site_shell.js into every HTML route. Run after editing page content:
       node build_pages.js
   Page bodies are left untouched apart from the regions it owns. */
const fs = require('fs');
const shell = require('./site_shell');

// Bump when a stylesheet or script changes so returning visitors are not
// served a cached mixture of old CSS and new markup.
const ASSET_VERSION = '20260915';

const PAGES = [
  { file: 'index.html', page: 'home', url: '/',
    title: 'Dinesh Behera | Dinu | DinuDante — Cloud, Platform & DevOps Engineer',
    description: 'Dinesh Behera — cloud, platform and DevOps engineer in Bhubaneswar, CEO of ProLEAP Academy and founder of the DDPrinterZ 3D printing studio.',
    css: ['home.css'] },
  { file: 'resume.html', page: 'resume', url: '/resume.html',
    title: 'Résumé — Dinesh Behera | Dinu | DinuDante',
    description: 'Résumé of Dinesh Behera, Senior Technical Consultant for cloud, platform and DevOps engineering. Read online or download the PDF.',
    css: ['home.css', 'resume.css'] },
  { file: 'setup.html', page: 'setup', url: '/setup.html',
    title: 'My setup — Dinesh Behera | Dinu | DinuDante',
    description: 'The hardware Dinesh Behera actually uses for cloud engineering, teaching, making and content work. Search and filter the full gear list.',
    css: ['home.css', 'setup.css'] },
  { file: 'privacy/index.html', page: 'privacy', url: '/privacy/',
    title: 'Privacy — Dinesh Behera | Dinu | DinuDante',
    description: 'How dinudante.in uses browser storage, external links, affiliate links and third-party product images.',
    css: ['home.css'] },
  { file: '404.html', page: '404', url: '/404.html',
    title: 'Page not found — Dinesh Behera | Dinu | DinuDante',
    description: 'This address could not be found. Return to the portfolio, résumé or setup catalogue.',
    css: ['home.css'] }
];

const v = s => `/assets/${s}?v=${ASSET_VERSION}`;

function replaceRegion(html, marker, content) {
  const open = `<!--${marker}:start-->`;
  const close = `<!--${marker}:end-->`;
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a === -1 || b === -1) throw new Error(`missing ${marker} markers`);
  return html.slice(0, a + open.length) + '\n' + content + '\n  ' + html.slice(b);
}

let changed = 0;
for (const p of PAGES) {
  let html = fs.readFileSync(p.file, 'utf8');
  const before = html;

  // Shared tokens and components load first; page stylesheets refine them.
  const assets = [
    `<script src="${v('theme-init.js')}"></script>`,
    `<link rel="stylesheet" href="${v('site.v4.css')}">`,
    ...p.css.map(c => `<link rel="stylesheet" href="${v(c)}">`)
  ].join('\n  ');

  html = replaceRegion(html, 'assets', '  ' + assets);
  html = replaceRegion(html, 'head', '  ' + shell.head(p));
  html = replaceRegion(html, 'nav', '  ' + shell.nav(p.page));
  html = replaceRegion(html, 'footer', '  ' + shell.footer());
  html = replaceRegion(html, 'script', '  <script src="' + v('site.v5.js') + '" defer></script>');

  if (html !== before) { fs.writeFileSync(p.file, html); changed++; }
  console.log(`${html !== before ? 'updated' : 'unchanged'}  ${p.file}`);
}
console.log(`\nShell build complete (${changed} file(s) rewritten, asset version ${ASSET_VERSION}).`);
