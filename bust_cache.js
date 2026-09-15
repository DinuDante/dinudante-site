const fs = require('fs');
['index.html', 'setup.html', 'resume.html', 'privacy/index.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/site\.js(\?v=[0-9\.]+)?\"/g, 'site.js?v=1.2"');
    fs.writeFileSync(f, content);
  }
});
