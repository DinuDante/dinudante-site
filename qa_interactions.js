/* Behavioural regression tests for the defects this release had to fix:
   shared script loading, theme control state and persistence, mobile
   navigation, sticky header, no-JavaScript fallbacks and the whole setup
   search / filter / featured-link surface.

   Run: node qa_interactions.js
*/
const puppeteer = require('puppeteer');
const serve = require('./tools_serve');

const PORT = 8135;
const BASE = `http://127.0.0.1:${PORT}`;
const results = [];
let failures = 0;

function check(name, pass, detail) {
  results.push({ name, pass, detail });
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = await serve.start(process.cwd(), PORT);
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    /* ========================== shared script + theme ================== */
    console.log('\n--- shared script, theme control and persistence ---');
    {
      const page = await browser.newPage();
      const responses = [];
      page.on('response', r => responses.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] }));
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });

      const bad = responses.filter(r => r.status >= 400);
      check('home: no failing subresource', bad.length === 0, bad.map(b => `${b.status} ${b.url}`).join(', '));

      const js = responses.find(r => r.url.includes('site.v5.js'));
      check('site.v5.js served as JavaScript', !!js && js.status === 200 && /javascript/.test(js.type || ''), js && `${js.status} ${js.type}`);

      const init = await page.evaluate(() => document.documentElement.classList.contains('menu-ready'));
      check('shared script initialised (menu-ready applied)', init === true);

      // The label must describe the action, and the action must change the theme.
      const before = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        label: document.querySelector('.theme-toggle').getAttribute('aria-label'),
        pressed: document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
        text: document.querySelector('.theme-label').textContent
      }));
      check('theme label matches current theme',
        (before.theme === 'night' && /light/.test(before.label) && before.pressed === 'false' && before.text === 'dark') ||
        (before.theme === 'day' && /dark/.test(before.label) && before.pressed === 'true' && before.text === 'light'),
        JSON.stringify(before));

      await page.click('.theme-toggle');
      await sleep(120);
      const after = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        label: document.querySelector('.theme-toggle').getAttribute('aria-label'),
        pressed: document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
        text: document.querySelector('.theme-label').textContent,
        bg: getComputedStyle(document.body).backgroundColor,
        meta: document.querySelector('meta[name="theme-color"]').content,
        stored: localStorage.getItem('dinu-theme')
      }));
      check('toggle changes the theme', after.theme !== before.theme, `${before.theme} -> ${after.theme}`);
      check('toggle updates label, pressed state and theme-color',
        after.label !== before.label && after.pressed !== before.pressed && after.meta !== '#0c100e' === (after.theme === 'day'),
        JSON.stringify({ label: after.label, pressed: after.pressed, meta: after.meta }));
      check('choice persisted to localStorage', after.stored === after.theme, after.stored);

      await page.reload({ waitUntil: 'networkidle2' });
      const reloaded = await page.evaluate(() => document.documentElement.dataset.theme);
      check('theme survives reload', reloaded === after.theme, reloaded);

      await page.goto(BASE + '/resume.html', { waitUntil: 'networkidle2' });
      const onResume = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        label: document.querySelector('.theme-toggle').getAttribute('aria-label')
      }));
      check('theme persists across routes', onResume.theme === after.theme, JSON.stringify(onResume));

      await page.click('.theme-toggle');
      await sleep(120);
      const resumeToggled = await page.evaluate(() => document.documentElement.dataset.theme);
      check('theme toggle works on the résumé page', resumeToggled !== onResume.theme, `${onResume.theme} -> ${resumeToggled}`);

      await page.goto(BASE + '/setup.html', { waitUntil: 'networkidle2' });
      await page.click('.theme-toggle');
      await sleep(120);
      check('theme toggle works on the setup page',
        (await page.evaluate(() => document.documentElement.dataset.theme)) === resumeToggled === false ||
        (await page.evaluate(() => document.documentElement.dataset.theme)) !== resumeToggled);

      await page.close();
    }

    /* ===================== blocked storage fallback ==================== */
    {
      const page = await browser.newPage();
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(window, 'localStorage', {
          get() { throw new DOMException('blocked', 'SecurityError'); }
        });
      });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await page.click('.theme-toggle');
      await sleep(120);
      const themed = await page.evaluate(() => document.documentElement.dataset.theme);
      check('theme control still works when storage is blocked', errors.length === 0 && !!themed, errors.join('; '));
      await page.close();
    }

    /* =========================== sticky header ========================= */
    console.log('\n--- sticky navigation and anchors ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      const pos = await page.evaluate(() => getComputedStyle(document.querySelector('.site-nav')).position);
      check('header declares position:sticky', pos === 'sticky', pos);

      // An ancestor with overflow other than visible silently defeats sticky.
      const blockers = await page.evaluate(() => {
        const out = [];
        let el = document.querySelector('.site-nav').parentElement;
        while (el) {
          const cs = getComputedStyle(el);
          if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') out.push(`${el.tagName.toLowerCase()} overflow:${cs.overflowX}/${cs.overflowY}`);
          el = el.parentElement;
        }
        return out;
      });
      check('no ancestor overflow defeats sticky', blockers.length === 0, blockers.join(', '));

      await page.evaluate(() => window.scrollTo(0, 2000));
      await sleep(250);
      const stuck = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect().top);
      check('header stays visible after scrolling', Math.abs(stuck) < 2, `top=${stuck.toFixed(1)}`);

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('.nav-links a[href="#maker"]');
      await sleep(700);
      const anchor = await page.evaluate(() => {
        const t = document.getElementById('maker').getBoundingClientRect();
        const nav = document.querySelector('.site-nav').getBoundingClientRect();
        return { top: t.top, navBottom: nav.bottom };
      });
      check('anchor target is not hidden under the sticky header', anchor.top >= anchor.navBottom - 2,
        `target top ${anchor.top.toFixed(0)} vs nav bottom ${anchor.navBottom.toFixed(0)}`);
      await page.close();
    }

    /* ========================= mobile navigation ======================= */
    console.log('\n--- mobile navigation ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });

      const collapsed = await page.evaluate(() => ({
        menuVisible: getComputedStyle(document.querySelector('.menu-toggle')).display !== 'none',
        linksVisible: getComputedStyle(document.querySelector('#main-navigation')).display !== 'none',
        expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded')
      }));
      check('menu button visible and links collapsed at 390px',
        collapsed.menuVisible && !collapsed.linksVisible && collapsed.expanded === 'false', JSON.stringify(collapsed));

      await page.click('.menu-toggle');
      await sleep(150);
      const opened = await page.evaluate(() => {
        const l = document.querySelector('#main-navigation');
        const r = l.getBoundingClientRect();
        return {
          expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
          visible: getComputedStyle(l).display !== 'none',
          items: [...l.querySelectorAll('a')].filter(a => a.getBoundingClientRect().height > 0).length,
          withinViewport: r.right <= innerWidth + 1 && r.left >= -1
        };
      });
      check('menu opens with all links reachable',
        opened.expanded === 'true' && opened.visible && opened.items === 6 && opened.withinViewport, JSON.stringify(opened));

      await page.keyboard.press('Escape');
      await sleep(150);
      const afterEsc = await page.evaluate(() => ({
        expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
        focused: document.activeElement.className,
        inlineStyle: document.querySelector('#main-navigation').getAttribute('style')
      }));
      check('Escape closes the menu and returns focus to the button',
        afterEsc.expanded === 'false' && afterEsc.focused.includes('menu-toggle'), JSON.stringify(afterEsc));
      check('no inline styles leak after closing', !afterEsc.inlineStyle, afterEsc.inlineStyle || '');

      // Selecting an in-page link closes the menu and moves focus to the target.
      await page.click('.menu-toggle');
      await sleep(120);
      await page.click('#main-navigation a[href="#maker"]');
      await sleep(600);
      const afterNav = await page.evaluate(() => ({
        expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
        focusedId: document.activeElement.id
      }));
      check('selecting a link closes the menu and focuses the section',
        afterNav.expanded === 'false' && afterNav.focusedId === 'maker', JSON.stringify(afterNav));

      // Opening then widening must not leave a broken desktop header.
      await page.click('.menu-toggle');
      await sleep(120);
      await page.setViewport({ width: 1280, height: 900 });
      await sleep(250);
      const afterResize = await page.evaluate(() => {
        const l = document.querySelector('#main-navigation');
        return { display: getComputedStyle(l).display, position: getComputedStyle(l).position, style: l.getAttribute('style') };
      });
      check('menu state resets when widening to desktop',
        afterResize.display === 'flex' && afterResize.position === 'static' && !afterResize.style, JSON.stringify(afterResize));
      await page.close();
    }

    /* ===================== no-JavaScript fallback ===================== */
    console.log('\n--- no-JavaScript behaviour ---');
    {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setViewport({ width: 390, height: 780 });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      const noJs = await page.evaluate ? null : null;
      const links = await page.$$eval('#main-navigation a', els => els.filter(e => e.getBoundingClientRect().height > 0).length).catch(() => -1);
      check('navigation links remain usable without JavaScript', links === 6, `visible links: ${links}`);

      await page.goto(BASE + '/setup.html', { waitUntil: 'networkidle2' });
      const cards = await page.$$eval('#gear-container .gear-card', els => els.filter(e => e.getBoundingClientRect().height > 0).length).catch(() => -1);
      check('all products render without JavaScript', cards === 93, `visible cards: ${cards}`);
      await page.close();
    }

    /* ========================= setup catalogue ======================== */
    console.log('\n--- setup search, filters and featured links ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(BASE + '/setup.html', { waitUntil: 'networkidle2' });

      const visible = () => page.$$eval('#gear-container .gear-card', els => els.filter(e => !e.hidden).length);
      const countText = () => page.$eval('#catalogue-count', e => e.textContent.trim());

      check('initial catalogue shows every product', (await visible()) === 93 && (await countText()) === '93 items', await countText());

      // Every category button, checked against the dataset counts in the label.
      const cats = await page.$$eval('.filter-btn', els => els.map(e => ({
        filter: e.dataset.filter, declared: parseInt(e.querySelector('.filter-n').textContent, 10)
      })));
      let catOk = true; const catDetail = [];
      for (const c of cats) {
        await page.click(`.filter-btn[data-filter="${c.filter}"]`);
        await sleep(80);
        const v = await visible();
        const t = await countText();
        const pressed = await page.$eval(`.filter-btn[data-filter="${c.filter}"]`, e => e.getAttribute('aria-pressed'));
        const others = await page.$$eval('.filter-btn', els => els.filter(e => e.getAttribute('aria-pressed') === 'true').length);
        const ok = v === c.declared && pressed === 'true' && others === 1 && t === (v === 1 ? '1 item' : v + ' items');
        if (!ok) { catOk = false; catDetail.push(`${c.filter}: shown ${v}, declared ${c.declared}, count "${t}", pressed ${pressed}, selected ${others}`); }
      }
      check(`all ${cats.length} category filters match the dataset and expose aria-pressed`, catOk, catDetail.join(' | '));

      await page.click('.filter-btn[data-filter="all"]');
      await sleep(80);

      // Search: case-insensitive, whitespace-normalised, combined with category.
      await page.type('#gear-search', '  ARZOPA  ');
      await sleep(150);
      const searchOne = await visible();
      check('search is case-insensitive and trims whitespace', searchOne === 1, `${searchOne} result(s)`);
      check('a single result reads "1 item"', (await countText()) === '1 item', await countText());

      await page.click('#search-clear');
      await sleep(120);
      check('clear button empties the search', (await visible()) === 93 && (await page.$eval('#gear-search', e => e.value)) === '');

      await page.type('#gear-search', 'ugreen');
      await page.click('.filter-btn[data-filter="power-charging"]');
      await sleep(150);
      const combined = await visible();
      const combinedOk = await page.$$eval('#gear-container .gear-card', els => els.filter(e => !e.hidden)
        .every(e => e.dataset.category === 'power-charging' && e.dataset.search.includes('ugreen')));
      check('search combines predictably with a category', combined > 0 && combinedOk, `${combined} result(s)`);

      const summaryShown = await page.$eval('#reset-row', e => !e.hidden);
      check('reset control appears while filters are active', summaryShown);

      await page.click('#reset-filters');
      await sleep(150);
      check('reset restores the full catalogue', (await visible()) === 93 && (await page.$eval('#reset-row', e => e.hidden)));

      // Empty state.
      await page.type('#gear-search', 'zzzznotathing');
      await sleep(150);
      const empty = await page.evaluate(() => ({
        visible: [...document.querySelectorAll('#gear-container .gear-card')].filter(e => !e.hidden).length,
        stateShown: !document.getElementById('empty-state').hidden,
        count: document.getElementById('catalogue-count').textContent.trim(),
        hasReset: !!document.getElementById('empty-reset')
      }));
      check('empty search shows a useful empty state with recovery',
        empty.visible === 0 && empty.stateShown && empty.count === '0 items' && empty.hasReset, JSON.stringify(empty));
      await page.click('#empty-reset');
      await sleep(150);
      check('empty-state reset restores the catalogue', (await visible()) === 93);

      /* The original defect: search for ARZOPA, then activate a featured card
         whose target is hidden by that search. */
      await page.type('#gear-search', 'ARZOPA');
      await sleep(150);
      const hiddenBefore = await page.$eval('#item-B07DKZCZ89', e => e.hidden);
      /* Filtering shortens the document, so the browser can clamp the scroll offset and
         leave this link underneath the sticky header. Scroll it clear first (the root
         carries scroll-padding-top for exactly this) and click its first line box, so
         the click lands on the link a person would actually see. */
      await page.evaluate(() => document.querySelector('a[href="#item-B07DKZCZ89"]').scrollIntoView({ block: 'center' }));
      await sleep(250);
      const box = await page.evaluate(() => {
        const r = document.querySelector('a[href="#item-B07DKZCZ89"]').getClientRects()[0];
        return { x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2 };
      });
      await page.mouse.click(box.x, box.y);
      await sleep(900);
      const revealed = await page.evaluate(() => {
        const t = document.getElementById('item-B07DKZCZ89');
        const r = t.getBoundingClientRect();
        return {
          hidden: t.hidden,
          inViewport: r.top >= 0 && r.bottom <= innerHeight,
          focused: document.activeElement === t,
          hash: location.hash,
          highlighted: t.classList.contains('is-target')
        };
      });
      check('featured link reveals a filtered-out target, scrolls and focuses it',
        hiddenBefore === true && revealed.hidden === false && revealed.inViewport && revealed.focused && revealed.hash === '#item-B07DKZCZ89',
        JSON.stringify(revealed));

      // A direct hash link must do the same on a cold load.
      await page.goto(BASE + '/setup.html?category=audio#item-B0CRKGKZVX', { waitUntil: 'networkidle2' });
      await sleep(700);
      const direct = await page.evaluate(() => {
        const t = document.getElementById('item-B0CRKGKZVX');
        const r = t.getBoundingClientRect();
        return { hidden: t.hidden, focused: document.activeElement === t, inViewport: r.top >= 0 && r.bottom <= innerHeight };
      });
      check('direct hash on load reveals and focuses the item even against a category filter',
        !direct.hidden && direct.focused && direct.inViewport, JSON.stringify(direct));

      // Browser back/forward across filter state.
      await page.goto(BASE + '/setup.html', { waitUntil: 'networkidle2' });
      await page.click('.filter-btn[data-filter="audio"]');
      await sleep(120);
      await page.goto(BASE + '/setup.html?category=displays', { waitUntil: 'networkidle2' });
      await sleep(150);
      const restored = await page.evaluate(() => ({
        pressed: document.querySelector('.filter-btn[aria-pressed="true"]').dataset.filter,
        visible: [...document.querySelectorAll('#gear-container .gear-card')].filter(e => !e.hidden).length
      }));
      check('filter state restores from the URL', restored.pressed === 'displays' && restored.visible === 6, JSON.stringify(restored));

      await page.goBack({ waitUntil: 'networkidle2' });
      await sleep(250);
      const back = await page.evaluate(() => [...document.querySelectorAll('#gear-container .gear-card')].filter(e => !e.hidden).length);
      check('browser back returns to a coherent catalogue view', back > 0, `${back} visible`);

      /* Labels: internal references say "View item"; outbound say
         "View on Amazon" and carry sponsored rel attributes. */
      await page.goto(BASE + '/setup.html', { waitUntil: 'networkidle2' });
      const labels = await page.evaluate(() => {
        const internal = [...document.querySelectorAll('a[href^="#item-"].gear-cta')];
        const external = [...document.querySelectorAll('#gear-container .gear-cta')];
        return {
          internalCount: internal.length,
          internalAllViewItem: internal.every(a => a.textContent.trim().startsWith('View item')),
          externalCount: external.length,
          externalAllAmazon: external.every(a => a.textContent.trim().startsWith('View on Amazon')),
          externalAllSponsored: external.every(a => (a.rel || '').includes('sponsored') && (a.rel || '').includes('noopener') && a.target === '_blank'),
          externalAllAmazonHost: external.every(a => /(^https:\/\/link\.amazon\/)|(^https:\/\/www\.amazon\.)/.test(a.href)),
          jargon: document.body.innerHTML.includes('View Canonical Product') || document.body.innerText.includes('\\n\\n')
        };
      });
      check('featured cards use "View item" for internal references',
        labels.internalCount === 5 && labels.internalAllViewItem, JSON.stringify(labels));
      check('catalogue cards use "View on Amazon" with sponsored rel on an Amazon URL',
        labels.externalCount === 93 && labels.externalAllAmazon && labels.externalAllSponsored && labels.externalAllAmazonHost,
        JSON.stringify(labels));
      check('no implementation jargon or literal escape text on the page', labels.jargon === false);

      // Structured data must agree with what is rendered.
      const schema = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
        const list = blocks.find(b => b['@type'] === 'ItemList');
        return { declared: list.numberOfItems, entries: list.itemListElement.length };
      });
      const rendered = await page.$$eval('#gear-container .gear-card', e => e.length);
      check('JSON-LD item count matches the rendered catalogue',
        schema.declared === rendered && schema.entries === rendered, `schema ${schema.declared}/${schema.entries}, rendered ${rendered}`);

      await page.close();
    }

    /* ======================= résumé page controls ===================== */
    console.log('\n--- résumé page ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(BASE + '/resume.html', { waitUntil: 'networkidle2' });

      const dl = await page.$eval('a[download]', a => ({ href: a.getAttribute('href'), name: a.getAttribute('download') }));
      const res = await page.goto(BASE + dl.href, { waitUntil: 'networkidle0' });
      check('résumé download serves a PDF',
        res.status() === 200 && res.headers()['content-type'] === 'application/pdf' && dl.name === 'Dinesh_Behera_Resume.pdf',
        `${res.status()} ${res.headers()['content-type']} name=${dl.name}`);

      await page.goto(BASE + '/resume.html', { waitUntil: 'networkidle2' });
      await page.emulateMediaType('print');
      await sleep(150);
      const printHidden = await page.evaluate(() => ({
        nav: getComputedStyle(document.querySelector('.site-nav')).display,
        actions: getComputedStyle(document.querySelector('.resume-actions')).display,
        footer: getComputedStyle(document.querySelector('footer')).display,
        portraitPx: document.querySelector('.portrait-modest').getBoundingClientRect().width,
        maxIcon: Math.max(0, ...[...document.querySelectorAll('svg')].map(s => s.getBoundingClientRect().width))
      }));
      check('print view removes navigation, actions and footer',
        printHidden.nav === 'none' && printHidden.actions === 'none' && printHidden.footer === 'none', JSON.stringify(printHidden));
      check('print view keeps the portrait modest and icons small',
        printHidden.portraitPx > 0 && printHidden.portraitPx < 130 && printHidden.maxIcon < 20, JSON.stringify(printHidden));
      await page.emulateMediaType(null);

      // Web / PDF parity on the facts that matter.
      const web = await page.evaluate(() => document.querySelector('.resume-container').innerText.replace(/\s+/g, ' '));
      await page.close();

      const facts = ['Senior Technical Consultant', 'Prodevans Technologies', 'Jan 2021', 'ProLEAP Academy',
        'PDCloudEX', 'Odisha State Data Centre', 'B.Tech, Mechanical Engineering', 'HackerRank',
        'OpenShift', 'Kubernetes', 'OpenStack', 'Ansible / AAP', 'Terraform', 'Harbor', 'Basic networking',
        'dineshdante.ds@gmail.com'];
      const missingWeb = facts.filter(f => !web.includes(f));
      check('web résumé contains every expected fact', missingWeb.length === 0, missingWeb.join(', '));
      global.__resumeFacts = facts;
    }

    /* ============================== 404 =============================== */
    console.log('\n--- error page ---');
    {
      const page = await browser.newPage();
      const bad = [];
      page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/no-such-page')) bad.push(`${r.status()} ${r.url()}`); });
      const res = await page.goto(BASE + '/no-such-page', { waitUntil: 'networkidle2' });
      check('unknown route returns 404 with the error page', res.status() === 404);
      check('error page loads all of its own assets', bad.length === 0, bad.join(', '));
      const recovery = await page.$$eval('main a[href]', els => els.map(e => e.getAttribute('href')));
      check('error page offers working recovery links',
        recovery.includes('/') && recovery.includes('/resume.html') && recovery.includes('/setup.html'), recovery.join(', '));
      await page.close();
    }

    /* ====================== keyboard and reduced motion =============== */
    console.log('\n--- keyboard and reduced motion ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await page.keyboard.press('Tab');
      const skip = await page.evaluate(() => {
        const el = document.activeElement;
        const r = el.getBoundingClientRect();
        return { text: el.textContent.trim(), visible: r.left > -100 && r.width > 0, outline: getComputedStyle(el).outlineStyle };
      });
      check('first Tab reaches a visible skip link', /Skip to content/.test(skip.text) && skip.visible, JSON.stringify(skip));

      const focusable = await page.evaluate(() => {
        const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().height > 0).length;
      });
      check('page exposes a keyboard-reachable control set', focusable > 10, `${focusable} focusable elements`);

      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.reload({ waitUntil: 'networkidle2' });
      const motion = await page.evaluate(() => ({
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
        transition: getComputedStyle(document.querySelector('.button')).transitionDuration
      }));
      check('reduced motion disables smooth scrolling and transitions',
        motion.scroll === 'auto' && parseFloat(motion.transition) < 0.01, JSON.stringify(motion));
      await page.close();
    }

    console.log(`\n=== ${results.length - failures}/${results.length} checks passed, ${failures} failed ===`);
    require('fs').writeFileSync('screenshots/interactions.json', JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
