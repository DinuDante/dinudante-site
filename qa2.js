const fs = require('fs');
const html = fs.readFileSync('setup.html', 'utf8');
const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

const uniqueDatasetCount = master.length;

const actualCanonicalCardCount = (html.match(/class="gear-card filter-item"/g) || []).length;
const actualMustHaveCount = (html.match(/class="gear-card must-have-spotlight"/g) || []).length;

const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
let schemaItemListCount = 0;
if (schemaMatch) {
  const schema = JSON.parse(schemaMatch[1]);
  schemaItemListCount = schema.itemListElement.length;
}

const filterAllMatch = html.match(/id="catalogue-count".*?>(\d+)\s+items<\/span>/);
const filterAllCount = filterAllMatch ? parseInt(filterAllMatch[1]) : 0;

console.log('uniqueDatasetCount:', uniqueDatasetCount);
console.log('canonicalHtmlCardCount:', actualCanonicalCardCount);
console.log('mustHaveSpotlightCount:', actualMustHaveCount);
console.log('schemaItemListCount:', schemaItemListCount);
console.log('filterAllCount:', filterAllCount);

const isPass = 
  uniqueDatasetCount === 91 &&
  actualCanonicalCardCount === 91 &&
  actualMustHaveCount === 3 &&
  schemaItemListCount === 91 &&
  filterAllCount === 91;

if (isPass) {
  console.log('PASS');
} else {
  console.log('FAIL');
  process.exit(1);
}
