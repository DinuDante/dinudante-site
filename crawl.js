const fs = require('fs');
const path = require('path');

const files = ['index.html', 'resume.html', 'setup.html', 'privacy/index.html', '404.html'];

let errors = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`);
    errors++;
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  
  // check for broken internal links
  const matches = content.match(/href="([^"]+)"/g) || [];
  matches.forEach(match => {
    let url = match.replace('href="', '').replace('"', '');
    if (url.startsWith('/') && !url.startsWith('//') && !url.includes('.')) {
      if (url === '/') return;
      const targetPath = path.join(__dirname, url, 'index.html');
      const targetHtml = path.join(__dirname, url + '.html');
      if (!fs.existsSync(targetPath) && !fs.existsSync(targetHtml)) {
        console.error(`Broken internal link in ${file}: ${url}`);
        errors++;
      }
    } else if (url.endsWith('.html') && !url.startsWith('http')) {
      const targetFile = url.startsWith('/') ? path.join(__dirname, url) : path.join(path.dirname(path.join(__dirname, file)), url);
      if (!fs.existsSync(targetFile)) {
        console.error(`Broken internal HTML link in ${file}: ${url}`);
        errors++;
      }
    }
  });
});

if (errors === 0) {
  console.log('PASS: No broken internal links found.');
} else {
  console.error(`FAIL: ${errors} broken links found.`);
}
