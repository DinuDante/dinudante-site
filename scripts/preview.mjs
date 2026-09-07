import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicFiles = new Set(['index.html','resume.html','privacy/index.html','404.html','favicon.svg','robots.txt','sitemap.xml']);
export function previewServer(directory = root) {
  return http.createServer(async (req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1); }
    catch { res.writeHead(400); res.end(); return; }
    if (!name || name.endsWith('/')) name += 'index.html';
    const allowed = publicFiles.has(name) || /^assets\/[\w.-]+$/.test(name);
    const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'};
    try {
      if (!allowed) throw new Error('Not public');
      const data = await readFile(path.join(directory, name));
      res.writeHead(200, {'Content-Type':types[path.extname(name)] || 'application/octet-stream','X-Robots-Tag':'noindex, nofollow'});
      res.end(data);
    } catch {
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow'});
      res.end(await readFile(path.join(root,'404.html')));
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  previewServer().listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173 (noindex, public files only)'));
}
