import {previewServer} from './preview.mjs';
import {writeFile} from 'node:fs/promises';
import lighthouse from '/tmp/dinudante-qa/node_modules/lighthouse/core/index.js';
import {launch} from '/tmp/dinudante-qa/node_modules/chrome-launcher/dist/index.js';
const current=previewServer(),baseline=previewServer('/tmp/dinudante-baseline-restore');
await new Promise(r=>current.listen(4173,'127.0.0.1',r));
await new Promise(r=>baseline.listen(4174,'127.0.0.1',r));
const chrome=await launch({chromePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try {
  for(const version of ['baseline','current']) for(const route of (version==='baseline'?['/','/resume.html']:['/','/resume.html','/privacy/'])) for(let run=1;run<=3;run++){
    const {lhr}=await lighthouse(`http://127.0.0.1:${version==='baseline'?4174:4173}${route}`,{port:chrome.port,output:'json',onlyCategories:['performance'],logLevel:'error'});
    const a=lhr.audits;
    const row={version,route,run,lighthouse:lhr.lighthouseVersion,score:lhr.categories.performance.score,lcp:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbt:a['total-blocking-time'].numericValue};
    results.push(row);console.log(JSON.stringify(row));
  }
} finally {await writeFile('/tmp/dinudante-qa/results/performance.json',JSON.stringify(results,null,2));await chrome.kill();current.close();baseline.close();}
