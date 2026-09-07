import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const live=process.argv.includes('--live');
const result={date:new Date().toISOString(),external:[],deployment:null,live:[]};
const get=url=>fetch(url,{signal:AbortSignal.timeout(20000)});
const hash=data=>createHash('sha256').update(data).digest('hex');
if(!live){
  const urls=JSON.parse(await readFile('/tmp/dinudante-qa/external-links.json','utf8'));
  result.external=await Promise.all(urls.map(async url=>{
    try {const r=await get(url);return {url,status:r.status,final:r.url};}
    catch(e){return {url,error:e.message};}
  }));
}else{
  const files=['index.html','resume.html','privacy/index.html','404.html','assets/home.css','assets/resume.css','assets/site.css','assets/site.js','assets/theme-init.js','assets/Dinesh_Behera_Resume.pdf','sitemap.xml','robots.txt'];
  for(const file of files){
    const route=file==='index.html'?'/':file==='privacy/index.html'?'/privacy/':'/'+file;
    const response=await get('https://dinudante.in'+route+'?qa=20260907-clean');
    const bytes=Buffer.from(await response.arrayBuffer());
    const equal=hash(bytes)===hash(await readFile(file));
    result.live.push({route,status:response.status,equal,sha256:hash(bytes),type:response.headers.get('content-type')});
    assert.equal(response.status,200,route);assert.ok(equal,`${route}: live bytes differ`);
    assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag') || ''),route);
    if(file.endsWith('.pdf'))assert.match(response.headers.get('content-type'),/application\/pdf/);
  }
  for(const route of ['/missing-qa-20260907','/Sources/','/PROJECT_CONTEXT.md','/IMPLEMENTATION_STATUS.md','/scripts/audit.mjs']){
    const response=await get('https://dinudante.in'+route);result.live.push({route,status:response.status});assert.equal(response.status,404,route);
  }
}
const api=await get('https://api.github.com/repos/DinuDante/dinudante-site/actions/runs?per_page=1');
const data=await api.json();const run=data.workflow_runs?.[0];
result.deployment=run?{sha:run.head_sha,status:run.status,conclusion:run.conclusion,url:run.html_url}:data;
await writeFile(`/tmp/dinudante-qa/results/${live?'live':'external'}-checks.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
