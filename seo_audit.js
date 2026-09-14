const fs = require('fs');

const files = ['404.html', 'index.html', 'privacy/index.html', 'resume.html', 'setup.html'];
const inventory = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/);
  const h1Match = content.match(/<h1.*?>(.*?)<\/h1>/s);
  const schemaMatch = content.match(/<script type=["']application\/ld\+json["']>/);
  const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/);
  
  inventory.push({
    file: f,
    title: titleMatch ? titleMatch[1] : 'MISSING',
    desc: descMatch ? descMatch[1] : 'MISSING',
    canonical: canonMatch ? canonMatch[1] : 'MISSING',
    h1: h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'MISSING',
    hasSchema: !!schemaMatch,
    hasOG: !!ogTitleMatch
  });
});

console.table(inventory);
