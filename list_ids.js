const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/id=\"([a-zA-Z0-9_-]+)\"/g)].map(m => m[1]);
console.log('IDs in index.html:', ids);
