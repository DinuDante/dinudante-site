/* Regenerates assets/Dinesh_Behera_Resume.pdf from the final resume.html.

   It serves the real site locally, forces the light theme, waits for every
   stylesheet, web font and image to finish loading, prints A4 with the print
   stylesheet applied, then writes document metadata.

   Run: node generate_pdf.js   (then: node render_pdf_pages.js to inspect it)
*/
const fs = require('fs');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const serve = require('./tools_serve');

const PORT = 8125;
const OUT = 'assets/Dinesh_Behera_Resume.pdf';

const META = {
  title: 'Dinesh Behera — Senior Technical Consultant, Cloud, Platform & DevOps Engineer',
  author: 'Dinesh Behera',
  subject: 'Résumé — cloud, platform and DevOps engineering, automation and technical documentation',
  keywords: ['OpenShift', 'Kubernetes', 'OpenStack', 'DevOps', 'Ansible', 'Python', 'Terraform',
    'Linux', 'RHEL', 'Prometheus', 'Grafana', 'Cloud', 'Platform engineering', 'Technical documentation'],
  creator: 'dinudante.in'
};

(async () => {
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    const failures = [];
    page.on('requestfailed', r => failures.push(r.url()));
    page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });

    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.setViewport({ width: 1100, height: 1400 });

    await page.goto(`http://127.0.0.1:${PORT}/resume.html`, { waitUntil: 'networkidle0', timeout: 60000 });

    // The printed résumé is always the light theme, whatever a visitor saved.
    await page.evaluate(() => { document.documentElement.dataset.theme = 'day'; });

    // Print media changes which image candidate is used; settle it before printing.
    await page.emulateMediaType('print');
    await page.evaluate(async () => {
      await document.fonts.ready;
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img => img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); })));
    });

    const state = await page.evaluate(() => ({
      sheets: document.styleSheets.length,
      printRules: Array.from(document.styleSheets).reduce((n, s) => {
        try { return n + Array.from(s.cssRules).filter(r => r.type === CSSRule.MEDIA_RULE && r.conditionText.includes('print')).length; }
        catch (_) { return n; }
      }, 0),
      images: Array.from(document.images).map(i => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })),
      fonts: document.fonts.status
    }));

    if (failures.length) throw new Error('resource failures before print:\n  ' + failures.join('\n  '));
    const brokenImages = state.images.filter(i => !i.ok);
    if (brokenImages.length) throw new Error('images did not load: ' + JSON.stringify(brokenImages));
    if (state.printRules === 0) throw new Error('no @media print rules reached the page — print stylesheet missing');

    console.log(`stylesheets: ${state.sheets}, print blocks: ${state.printRules}, fonts: ${state.fonts}`);
    state.images.forEach(i => console.log(`  image ok: ${i.src}`));

    const bytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,   // honour the @page size/margins in resume.css
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    const doc = await PDFDocument.load(bytes);
    doc.setTitle(META.title);
    doc.setAuthor(META.author);
    doc.setSubject(META.subject);
    doc.setKeywords(META.keywords);
    doc.setCreator(META.creator);
    doc.setProducer('dinudante.in resume pipeline');
    doc.setModificationDate(new Date());
    fs.writeFileSync(OUT, await doc.save());

    const size = fs.statSync(OUT).size;
    console.log(`\nWrote ${OUT}: ${doc.getPageCount()} page(s), ${(size / 1024).toFixed(1)} KB`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error('PDF generation failed:', e.message); process.exit(1); });
