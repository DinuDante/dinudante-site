// Temporary QA dependencies: npm install --prefix /tmp/dinudante-qa playwright axe-core
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {previewServer} from './preview.mjs';
const require = createRequire('/tmp/dinudante-qa/package.json');
const {chromium} = require('playwright');
const server = previewServer();
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const output = '/tmp/dinudante-qa/results';
await mkdir(output, {recursive:true});
const report = {browser:browser.version(), date:new Date().toISOString(), layouts:[], accessibility:[], journeys:[], errors:[]};
const base = 'http://127.0.0.1:4173';
try {
  for (const route of ['/', '/resume.html', '/privacy/', '/404.html']) {
    for (const colorScheme of ['dark','light']) {
      const context = await browser.newContext({colorScheme});
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(`${route}: ${e.message}`));
      for (const width of [320,360,390,768,1024,1440,2560,3840]) {
        await page.setViewportSize({width,height:900});
        const response = await page.goto(base+route);
        assert.equal(response.status(),200);
        const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => {
          const r=e.getBoundingClientRect(), s=getComputedStyle(e);
          return s.display!=='none' && s.position!=='fixed' && r.width && (r.right>innerWidth+1 || r.left < -1);
        }).map(e => ({tag:e.tagName, class:e.className, text:e.textContent.slice(0,60)})));
        report.layouts.push({route,colorScheme,width,overflow});
        if ([390,1440].includes(width)) {
          for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(e=>e.decode()); }
          await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
          await page.screenshot({path:`${output}/${route.replaceAll('/','_') || 'home'}-${colorScheme}-${width}.png`,fullPage:true});
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const a = await page.evaluate(async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
          report.accessibility.push({route,colorScheme,width,violations:a});
        }
      }
      await context.close();
    }
  }
  const context = await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark',acceptDownloads:true});
  const page = await context.newPage();
  await page.goto(base);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(),'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'),'main-content');
  for (const hash of ['#professional','#academy','#maker','#about']) {
    await page.locator('.menu-toggle').click();
    await page.locator(`.nav-link[href="${hash}"]`).click();
    assert.equal(new URL(page.url()).hash,hash);
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  }
  await page.locator('.menu-toggle').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator(':focus').textContent(),'Menu');
  await page.locator('.theme-toggle').click(); await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'day');
  await page.locator('.menu-toggle').click(); await page.locator('.nav-link[href="resume.html"]').click();
  assert.ok(page.url().endsWith('/resume.html'));
  assert.equal(await page.locator('html').getAttribute('data-theme'),'day');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.pdf-download').click(); const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'Dinesh_Behera_Resume.pdf');
  await download.saveAs(`${output}/downloaded-resume.pdf`);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('nav').isVisible(),false);
  await page.pdf({path:`${output}/web-resume-print.pdf`,preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});
  await page.goBack(); assert.ok(!page.url().includes('resume.html'));
  report.journeys.push('Keyboard skip, mobile anchor navigation, Escape, theme persistence across routes, résumé download and browser back passed; print controls hidden.');
  await context.close();
  for (const mode of ['no-js','storage-blocked','media-failed']) {
    const ctx=await browser.newContext({javaScriptEnabled:mode!=='no-js',viewport:{width:390,height:844}});
    if(mode==='storage-blocked') await ctx.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}));
    const p=await ctx.newPage();
    p.on('pageerror', e=>report.errors.push(`${mode}: ${e.message}`));
    if(mode==='media-failed') await p.route('**/*.webp',route=>route.abort());
    await p.goto(base);
    assert.ok(await p.locator('h1').isVisible());
    if(mode==='no-js') assert.ok(await p.locator('.nav-link[href="#academy"]').isVisible());
    else {await p.locator('.menu-toggle').click(); assert.ok(await p.locator('.nav-link[href="#academy"]').isVisible());}
    report.journeys.push(`${mode}: content and navigation usable`);
    await ctx.close();
  }
  const missing=await fetch(base+'/definitely-missing');assert.equal(missing.status,404);
  assert.equal((await fetch(base+'/Sources/')).status,404);
  assert.match((await fetch(base+'/assets/Dinesh_Behera_Resume.pdf')).headers.get('content-type'),/application\/pdf/);
  report.journeys.push('Missing/private routes return 404; PDF uses application/pdf.');
} finally {
  await writeFile(`${output}/audit.json`,JSON.stringify(report,null,2));
  await browser.close();server.close();
}
const failures=report.layouts.filter(x=>x.overflow.length).length+report.accessibility.filter(x=>x.violations.length).length+report.errors.length;
console.log(JSON.stringify({layouts:report.layouts.length,accessibility:report.accessibility.length,journeys:report.journeys,failures,report:`${output}/audit.json`},null,2));
if(failures) process.exitCode=1;
