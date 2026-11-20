// Shared static server used by the QA/build tooling. Not part of the published site.
const fs = require('fs');
const path = require('path');
const http = require('http');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.map': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.bcmap': 'application/octet-stream'
};

function start(root, port) {
  const directory = fs.realpathSync(root);
  const server = http.createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(req.url.split('?')[0]);
      if (pathname.includes('\0')) throw new Error('Invalid path');
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    try {
      const file = await fs.promises.realpath(path.join(directory, pathname));
      const relative = path.relative(directory, file);
      if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
        res.writeHead(403).end();
        return;
      }
      const content = await fs.promises.readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(content);
    } catch {
      const body = await fs.promises.readFile(path.join(directory, '404.html')).catch(() => 'Not found');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

module.exports = { start };
