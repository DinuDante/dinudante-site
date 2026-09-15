// Confirms the third-party product images actually render on the deployed site.
const puppeteer=require('puppeteer');
(async()=>{
 const b=await puppeteer.launch({headless:'new'});
 const p=await b.newPage();await p.setViewport({width:1440,height:1000});
 const failed=[];p.on('requestfailed',r=>failed.push(r.url()));
 p.on('response',r=>{if(r.status()>=400&&/media-amazon/.test(r.url()))failed.push(r.status()+' '+r.url())});
 await p.goto('https://dinudante.in/setup.html',{waitUntil:'networkidle2'});
 await p.evaluate(async()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');
   await Promise.all([...document.images].map(i=>i.complete?null:new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,8000)})));});
 await new Promise(r=>setTimeout(r,2500));
 const s=await p.evaluate(()=>{const im=[...document.images];return{total:im.length,ok:im.filter(i=>i.complete&&i.naturalWidth>0).length,
   broken:im.filter(i=>!(i.complete&&i.naturalWidth>0)).map(i=>i.currentSrc||i.src).slice(0,10)}});
 console.log('live setup images:',JSON.stringify(s,null,1));
 console.log('failed requests:',failed.length,failed.slice(0,5).join(' | '));
 await p.screenshot({path:'screenshots/evidence/live-setup-1440.png'});
 await b.close();
})();
