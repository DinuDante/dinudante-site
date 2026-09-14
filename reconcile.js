const fs = require('fs');
const urls = JSON.parse(fs.readFileSync('urls_92.json', 'utf8'));
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

let scraped = [];
if (fs.existsSync('scraped_data.json')) {
  scraped = JSON.parse(fs.readFileSync('scraped_data.json', 'utf8'));
}

// Build dictionaries
const masterByAsin = {};
master.forEach(m => {
  masterByAsin[m.asin] = m;
});

const scrapedByUrl = {};
scraped.forEach(s => {
  scrapedByUrl[s.url] = s;
});

const missingFromDataset = [];
const unexpectedInDataset = [];
const exactSourceDuplicates = [];
const resolvedProductDuplicates = [];

const seenUrls = new Set();
const seenAsins = new Set();

const finalProducts = [];

urls.forEach((sourceUrl, inputIndex) => {
  if (seenUrls.has(sourceUrl)) {
    exactSourceDuplicates.push(sourceUrl);
  } else {
    seenUrls.add(sourceUrl);
  }

  let product = null;
  let asin = null;

  // Try to find ASIN
  if (scrapedByUrl[sourceUrl]) {
    asin = scrapedByUrl[sourceUrl].asin;
  } else if (sourceUrl.includes('/dp/')) {
    const m = sourceUrl.match(/\/dp\/([A-Z0-9]{10})/);
    if (m) asin = m[1];
  } else {
    // maybe it's in the master directly?
    const mMatch = master.find(m => m.url === sourceUrl);
    if (mMatch) asin = mMatch.asin;
  }

  if (asin && masterByAsin[asin]) {
    product = masterByAsin[asin];
  }

  if (!product) {
    missingFromDataset.push(sourceUrl);
  } else {
    if (seenAsins.has(product.asin)) {
      resolvedProductDuplicates.push(product);
      const existing = finalProducts.find(p => p.asin === product.asin);
      if (existing) {
        if (!existing.sourceUrls) existing.sourceUrls = [existing.sourceUrl];
        existing.sourceUrls.push(sourceUrl);
        if (sourceUrl.includes('tag=dinudanteweb-21') && !existing.outboundUrl.includes('tag=')) {
          existing.outboundUrl = sourceUrl;
        }
      }
    } else {
      seenAsins.add(product.asin);
      let outboundUrl = sourceUrl;
      const newProduct = {
        inputIndex: inputIndex + 1,
        sourceUrl: sourceUrl,
        outboundUrl: outboundUrl,
        canonicalProductUrl: `https://www.amazon.in/dp/${product.asin}`,
        asin: product.asin,
        title: product.title,
        image: product.image,
        primaryCategory: product.primaryCategory,
        tags: product.tags || [],
        personallyTested: true,
        featured: product.featured || false,
      };
      if (product.personalNote) newProduct.personalNote = product.personalNote;
      finalProducts.push(newProduct);
    }
  }
});

console.log('--- RECONCILIATION ---');
console.log('Submitted URLs:', urls.length);
console.log('Missing from dataset:', missingFromDataset.length);
console.log('Exact source duplicates:', exactSourceDuplicates.length);
console.log('Resolved product duplicates:', resolvedProductDuplicates.length);
console.log('Final unique products:', finalProducts.length);

fs.writeFileSync('reconciled_dataset.json', JSON.stringify(finalProducts, null, 2));
