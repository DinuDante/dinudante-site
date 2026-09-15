const puppeteer=require('puppeteer');const serve=require('../tools_serve');
(async()=>{const s=await serve.start(process.cwd(),8137);const b=await puppeteer.launch({headless:'new'});
const p=await b.newPage();await p.setViewport({width:1440,height:900});
p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});
await p.goto('http://127.0.0.1:8137/',{waitUntil:'networkidle2'});
await p.evaluate(async()=>{ for(const i of document.images){ i.loading='eager'; } await new Promise(r=>setTimeout(r,1500)); });
console.log(JSON.stringify(await p.evaluate(()=>[...document.images].map(i=>({src:i.currentSrc.split('/').pop(),ok:i.complete&&i.naturalWidth>0,nat:i.naturalWidth+'x'+i.naturalHeight,box:Math.round(i.getBoundingClientRect().width)+'x'+Math.round(i.getBoundingClientRect().height)}))),null,1));
await b.close();s.close();})();
