const fs = require('fs');
const files = ['index.html', 'resume.html', 'setup.html', 'privacy/index.html', '404.html'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<img src="\/assets\/logo\.png" alt="Logo" class="mark-symbol"/g, '<img src="/assets/logo-nav.png" alt="Logo" class="mark-symbol"');
    content = content.replace(/content="https:\/\/dinudante\.in\/assets\/logo\.png"/g, 'content="https://dinudante.in/assets/logo-social.png"');
    fs.writeFileSync(f, content);
  }
});
console.log('Logos replaced in HTML.');
