// Captures targeted interaction-state screenshots for the QA report.
const puppeteer=require('puppeteer');const serve=require('../tools_serve');
const OUT='screenshots/evidence';
(async()=>{
 require('fs').mkdirSync(OUT,{recursive:true});
 const s=await serve.start(process.cwd(),8141);const b=await puppeteer.launch({headless:'new'});
 const eager=async p=>{await p.evaluate(async()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');await new Promise(r=>setTimeout(r,1200));});};

 // mobile menu open
 let p=await b.newPage();await p.setViewport({width:390,height:780});
 await p.goto('http://127.0.0.1:8141/',{waitUntil:'networkidle2'});
 await p.click('.menu-toggle');await new Promise(r=>setTimeout(r,300));
 await p.screenshot({path:OUT+'/mobile-menu-open-night.png'});
 await p.evaluate(()=>{document.documentElement.dataset.theme='day'});await new Promise(r=>setTimeout(r,300));
 await p.screenshot({path:OUT+'/mobile-menu-open-day.png'});await p.close();

 // setup: sticky discovery mid-scroll + a category filter applied
 p=await b.newPage();await p.setViewport({width:390,height:780});
 await p.goto('http://127.0.0.1:8141/setup.html',{waitUntil:'networkidle2'});
 await eager(p);
 await p.evaluate(()=>window.scrollTo(0,2600));await new Promise(r=>setTimeout(r,600));
 await p.screenshot({path:OUT+'/setup-sticky-discovery-390.png'});
 await p.click('.filter-btn[data-filter="displays"]');await new Promise(r=>setTimeout(r,400));
 await p.screenshot({path:OUT+'/setup-filtered-displays-390.png'});await p.close();

 // setup desktop: filter + search combined, and the empty state
 p=await b.newPage();await p.setViewport({width:1280,height:900});
 await p.goto('http://127.0.0.1:8141/setup.html',{waitUntil:'networkidle2'});
 await eager(p);
 await p.type('#gear-search','ugreen');await new Promise(r=>setTimeout(r,400));
 await p.screenshot({path:OUT+'/setup-search-1280.png'});
 await p.evaluate(()=>{document.getElementById('gear-search').value='';});
 await p.type('#gear-search','zzzz');await p.evaluate(()=>document.getElementById('gear-search').dispatchEvent(new Event('input')));
 await new Promise(r=>setTimeout(r,400));
 await p.screenshot({path:OUT+'/setup-empty-state-1280.png'});
 // featured reveal from a conflicting search
 await p.goto('http://127.0.0.1:8141/setup.html',{waitUntil:'networkidle2'});
 await eager(p);
 await p.type('#gear-search','ARZOPA');await new Promise(r=>setTimeout(r,300));
 await p.click('a[href="#item-B07DKZCZ89"]');await new Promise(r=>setTimeout(r,2500));
 await p.screenshot({path:OUT+'/setup-featured-reveal-1280.png'});await p.close();

 // 2560 and 320 extremes
 for(const w of [320,2560]){
   const q=await b.newPage();await q.setViewport({width:w,height:w<700?700:1200});
   await q.goto('http://127.0.0.1:8141/',{waitUntil:'networkidle2'});await eager(q);
   await q.screenshot({path:`${OUT}/home-${w}.png`});await q.close();
 }

 // 200% zoom reflow at 1280 logical (= 640 CSS px)
 p=await b.newPage();await p.setViewport({width:640,height:800,deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:8141/',{waitUntil:'networkidle2'});await eager(p);
 await p.screenshot({path:OUT+'/home-200pct-zoom.png'});
 console.log('zoom overflow:',await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1));
 await p.close();

 await b.close();s.close();console.log('evidence written to '+OUT);
})();
