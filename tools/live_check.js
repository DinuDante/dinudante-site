// Verifies the DEPLOYED site, not the local build.
const puppeteer=require('puppeteer');
const BASE='https://dinudante.in';
let fail=0;
const ck=(n,p,d)=>{console.log(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);if(!p)fail++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({headless:'new'});
 // desktop: script init, theme, sticky, no failed requests
 let p=await b.newPage();await p.setViewport({width:1280,height:900});
 const bad=[];p.on('response',r=>{if(r.status()>=400&&r.url().includes('dinudante.in'))bad.push(r.status()+' '+r.url())});
 p.on('pageerror',e=>bad.push('pageerror: '+e.message));
 await p.goto(BASE+'/',{waitUntil:'networkidle2'});
 ck('live home: no failing first-party request or script error',bad.length===0,bad.join(' | '));
 ck('live home: shared script initialised',await p.evaluate(()=>document.documentElement.classList.contains('menu-ready')));
 ck('live home: pre-paint js class applied',await p.evaluate(()=>document.documentElement.classList.contains('js')));
 const t0=await p.evaluate(()=>document.documentElement.dataset.theme);
 await p.click('.theme-toggle');await sleep(200);
 const t1=await p.evaluate(()=>({t:document.documentElement.dataset.theme,l:document.querySelector('.theme-toggle').getAttribute('aria-label'),s:localStorage.getItem('dinu-theme')}));
 ck('live home: theme toggle changes and persists',t1.t!==t0&&t1.s===t1.t,`${t0} -> ${t1.t} (${t1.l})`);
 await p.evaluate(()=>window.scrollTo(0,2000));await sleep(300);
 ck('live home: header stays stuck',Math.abs(await p.evaluate(()=>document.querySelector('.site-nav').getBoundingClientRect().top))<2);
 await p.close();

 // mobile menu
 p=await b.newPage();await p.setViewport({width:390,height:780,isMobile:true,hasTouch:true});
 await p.goto(BASE+'/',{waitUntil:'networkidle2'});
 await p.click('.menu-toggle');await sleep(250);
 ck('live mobile: menu opens with 6 links',await p.evaluate(()=>{const l=document.querySelector('#main-navigation');return getComputedStyle(l).display!=='none'&&[...l.querySelectorAll('a')].filter(a=>a.getBoundingClientRect().height>0).length===6}));
 await p.keyboard.press('Escape');await sleep(200);
 ck('live mobile: Escape closes and restores focus',await p.evaluate(()=>document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'&&document.activeElement.classList.contains('menu-toggle')));
 await p.close();

 // setup catalogue on the live site
 p=await b.newPage();await p.setViewport({width:1280,height:900});
 const sbad=[];p.on('pageerror',e=>sbad.push(e.message));
 await p.goto(BASE+'/setup.html',{waitUntil:'networkidle2'});
 const vis=()=>p.$$eval('#gear-container .gear-card',e=>e.filter(x=>!x.hidden).length);
 ck('live setup: 93 products, no script error',(await vis())===93&&sbad.length===0,sbad.join(' | '));
 ck('live setup: count reads "93 items"',(await p.$eval('#catalogue-count',e=>e.textContent.trim()))==='93 items');
 await p.click('.filter-btn[data-filter="displays"]');await sleep(200);
 ck('live setup: category filter works with aria-pressed',(await vis())===6&&await p.$eval('.filter-btn[data-filter="displays"]',e=>e.getAttribute('aria-pressed'))==='true',`${await vis()} visible`);
 await p.click('.filter-btn[data-filter="all"]');await sleep(150);
 await p.type('#gear-search','ARZOPA');await sleep(300);
 await p.click('a[href="#item-B07DKZCZ89"]');await sleep(2000);
 ck('live setup: featured link reveals a filtered-out target',await p.evaluate(()=>{const t=document.getElementById('item-B07DKZCZ89');return !t.hidden&&document.activeElement===t}));
 await p.close();

 // résumé + PDF on the live site
 p=await b.newPage();
 const res=await p.goto(BASE+'/assets/Dinesh_Behera_Resume.pdf',{waitUntil:'networkidle0'});
 ck('live PDF: served as application/pdf',res.status()===200&&res.headers()['content-type']==='application/pdf',res.headers()['content-type']);
 await p.close();

 // 404
 p=await b.newPage();const nbad=[];
 p.on('response',r=>{if(r.status()>=400&&r.url().includes('dinudante.in')&&!r.url().endsWith('/no-such-page'))nbad.push(r.status()+' '+r.url())});
 const r404=await p.goto(BASE+'/no-such-page',{waitUntil:'networkidle2'});
 ck('live 404: returns 404 and loads all its own assets',r404.status()===404&&nbad.length===0,nbad.join(' | '));
 await p.close();

 await b.close();
 console.log(`\n=== live verification: ${fail?fail+' FAILED':'all checks passed'} ===`);
 process.exit(fail?1:0);
})();
