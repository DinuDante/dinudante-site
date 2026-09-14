const fs = require('fs');

const html = fs.readFileSync('setup.html', 'utf8');
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

const uniqueDatasetCount = master.length;

// Count HTML cards
const htmlCardMatches = html.match(/class="gear-card filter-item"/g);
const htmlCardCount = htmlCardMatches ? htmlCardMatches.length : 0;

// Count MUST-HAVE cards (they appear twice in HTML: once in Must-Have section, once in All Gear)
const mustHaveCount = master.filter(i => i.featured).length;
const expectedHtmlCardCount = uniqueDatasetCount + mustHaveCount; // Because must-haves are rendered in two places based on my build script

// Schema count
const schemaMatch = html.match(/<script type="application\/ld\+json">.*?<\/script>/s);
let schemaItemListCount = 0;
if (schemaMatch) {
  const schema = JSON.parse(schemaMatch[0].replace(/<\/?script.*?>/g, ''));
  if (schema.itemListElement) {
    schemaItemListCount = schema.itemListElement.length;
  }
}

// "ALL" filter count
const filterAllMatch = html.match(/data-filter="all">ALL GEAR <span>(\d+)<\/span>/);
const filterAllCount = filterAllMatch ? parseInt(filterAllMatch[1]) : 0;

console.log('uniqueDatasetCount:', uniqueDatasetCount);
console.log('expectedHtmlCardCount:', expectedHtmlCardCount);
console.log('actualHtmlCardCount:', htmlCardCount);
console.log('schemaItemListCount:', schemaItemListCount);
console.log('filterAllCount:', filterAllCount);
console.log('personallyTestedCount:', master.filter(i => i.personallyTested).length);

if (uniqueDatasetCount === schemaItemListCount && 
    filterAllCount === uniqueDatasetCount && 
    expectedHtmlCardCount === htmlCardCount && 
    master.filter(i => i.personallyTested).length === uniqueDatasetCount) {
  console.log('PASS');
} else {
  console.error('FAIL');
  process.exit(1);
}
