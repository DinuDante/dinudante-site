const puppeteer=require('puppeteer');const serve=require('../tools_serve');
(async()=>{
 const lighthouse=(await import('lighthouse')).default;
 const s=await serve.start(process.cwd(),8147);
 const b=await puppeteer.launch({headless:'new'});
 const port=new URL(b.wsEndpoint()).port;
 for(const u of ['/resume.html','/privacy/','/setup.html']){
   const res=await lighthouse('http://127.0.0.1:8147'+u,{port,output:'json',logLevel:'error',onlyCategories:['performance'],formFactor:'mobile',screenEmulation:{mobile:true,width:412,height:823,deviceScaleFactor:1.75,disabled:false}});
   const a=res.lhr.audits['layout-shift-elements']||res.lhr.audits['layout-shifts'];
   console.log('==',u,'CLS',res.lhr.audits['cumulative-layout-shift'].numericValue);
   if(a&&a.details&&a.details.items) a.details.items.forEach(i=>console.log('   ',JSON.stringify({node:i.node&&i.node.snippet&&i.node.snippet.slice(0,110),score:i.score})));
 }
 await b.close();s.close();
})();
