const fs = require('fs');
['index.html', 'setup.html', 'resume.html', 'privacy/index.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/site\.css\?v=[a-z0-9\.]+\"/g, 'site.css?v=1.4"');
    fs.writeFileSync(f, content);
  }
});
