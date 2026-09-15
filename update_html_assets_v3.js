const fs = require('fs');
['index.html', 'setup.html', 'resume.html', 'privacy/index.html', 'build_setup_new.js'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/site\.v2\.css/g, 'site.v3.css');
    content = content.replace(/site\.v2\.js/g, 'site.v3.js');
    fs.writeFileSync(f, content);
  }
});
