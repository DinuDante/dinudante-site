const fs = require('fs');
const files = ['index.html', 'setup.html', 'resume.html'];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const matches = [...html.matchAll(/menu-toggle/g)];
  console.log(`${f}: found ${matches.length} matches`);
}
