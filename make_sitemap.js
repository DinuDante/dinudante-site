const fs = require('fs');

const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://dinudante.in/sitemap.xml
`;

fs.writeFileSync('robots.txt', robotsTxt);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dinudante.in/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://dinudante.in/resume.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://dinudante.in/setup.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://dinudante.in/privacy/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

fs.writeFileSync('sitemap.xml', sitemapXml);
console.log('robots.txt and sitemap.xml generated.');
