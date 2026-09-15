const fs = require('fs');

// 1. Refactor site.css to include all shared components (nav, footer, shell, basic tokens)
const siteCss = `
:root {
  color-scheme: dark;
  --bg: #0d1512;
  --surface: #151d19;
  --raised: #1b2520;
  --text: #e2e3d8;
  --text-secondary: #c0c5bf;
  --muted: #98a098;
  --line: #303b35;
  --border-strong: #4a564f;
  --green: #859d7b;
  --accent: #859d7b;
  --deep: #53695a;
  --navy: #1b2a35;
  --navy2: #253744;
  --red: #a85f59;
  --purple: #80719a;
  --paper: #d8d5c5;
  --shadow: rgba(0,0,0,0.25);
  
  --font-display: Georgia, serif;
  --font-body: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 3rem;
}

[data-theme="day"] {
  color-scheme: light;
  --bg: #e5e3d8;
  --surface: #f1efe6;
  --raised: #d9ddd3;
  --text: #17231e;
  --text-secondary: #3a4740;
  --muted: #56625b;
  --line: #adb6ad;
  --border-strong: #8c978f;
  --green: #4f6d55;
  --accent: #4f6d55;
  --deep: #3e5b49;
  --navy: #344b58;
  --navy2: #405966;
  --red: #98534e;
  --purple: #6f6085;
  --paper: #faf8ef;
  --shadow: rgba(38, 52, 44, 0.1);
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; overflow-x: hidden; scroll-padding-top: 92px; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; font-synthesis: none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body { font-family: var(--font-body); font-size: var(--text-base); color: var(--text); line-height: 1.65; background: var(--bg); margin: 0; padding: 0; transition: background-color 0.25s, color 0.25s; overflow-x: hidden; }

h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); font-weight: 400; color: var(--text); }
h1 { font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.1; }
h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); line-height: 1.2; }
h3 { font-size: clamp(1.4rem, 2vw, 1.8rem); line-height: 1.3; }

a { color: inherit; text-decoration: none; transition: color 0.15s ease; }
a:hover { color: var(--accent); }

img { max-width: 100%; height: auto; display: block; }
svg { max-width: 100%; }

.shell { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }

/* Navigation Shared Components */
.site-nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; min-height: 76px; padding: 10px 20px; background: color-mix(in srgb, var(--bg) 86%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--line) 82%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); width: 100%; }
.site-nav::after { content: ""; position: absolute; inset: auto 0 -1px; height: 1px; background: linear-gradient(90deg, transparent, var(--red), var(--paper), var(--purple), var(--green), transparent); opacity: 0.45; }

.mark { display: flex; align-items: center; gap: 11px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; white-space: nowrap; }
.mark-symbol { display: block; width: 44px; height: 44px; flex: 0 0 auto; border-radius: 50%; object-fit: cover; }
.mark:hover .mark-symbol { transform: rotate(12deg); }

.nav-actions { display: flex; align-items: center; gap: 20px; }
.nav-links { display: flex; gap: 20px; align-items: center; }
.nav-link { font-size: 0.85rem; color: var(--muted); position: relative; padding: 4px 0; }
.nav-link:hover { color: var(--text); }
.nav-link::after { content: ""; position: absolute; right: 0; bottom: 0; left: 0; height: 1px; background: linear-gradient(90deg, var(--red), var(--purple), var(--green)); transform: scaleX(0); transition: transform 0.2s; }
.nav-link:hover::after { transform: scaleX(1); }

.theme-control { display: flex; align-items: center; gap: 8px; }
.theme-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); min-width: 3.5em; text-align: right; }
.theme-toggle { position: relative; width: 62px; height: 32px; padding: 0; border: 1px solid var(--line); border-radius: 999px; background: #102536; cursor: pointer; transition: all 0.25s; flex-shrink: 0; }
.theme-toggle::before { content: ""; position: absolute; z-index: 2; top: 3px; left: 4px; width: 24px; height: 24px; border-radius: 50%; background: #e9e3ca; transform: translateX(28px); transition: transform 0.3s; }
[data-theme="day"] .theme-toggle { background: #78a9ae; }
[data-theme="day"] .theme-toggle::before { background: #e6d528; transform: translateX(0); }

.menu-toggle { display: none; }
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 12px; top: 12px; z-index: 100; background: var(--surface); color: var(--text); padding: 12px; border: 2px solid var(--green); }

/* Buttons & UI */
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 5px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; gap: 8px; background: color-mix(in srgb, var(--surface) 82%, transparent); }
.button:hover { border-color: var(--green); transform: translateY(-2px); box-shadow: 0 8px 16px var(--shadow); }
.button-primary { background: var(--deep); color: #fff; border-color: var(--deep); }
.button-primary:hover { background: color-mix(in srgb, var(--deep) 80%, var(--surface)); border-color: var(--green); }
.brand-icon { width: 18px; height: 18px; fill: currentColor; display: inline-block; flex-shrink: 0; }

/* Footers */
footer { padding: 40px 0; border-top: 1px solid var(--line); margin-top: 60px; }
.footer-row { display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 0.8rem; flex-wrap: wrap; gap: 20px; }
.footer-links { display: flex; gap: 16px; flex-wrap: wrap; }
.footer-links a { display: inline-flex; align-items: center; gap: 6px; }

/* Typography basics */
.eyebrow { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); }

/* Responsive Nav */
@media (max-width: 900px) {
  .nav-links { display: none; }
  .menu-ready .menu-toggle { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); cursor: pointer; }
  .menu-ready .nav-links.is-open { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); padding: 20px; border-bottom: 1px solid var(--line); box-shadow: 0 10px 20px var(--shadow); align-items: flex-start; }
}
@media (max-width: 600px) {
  .theme-label { display: none; }
  .mark-name { display: none; }
}

@media print {
  nav, footer { display: none !important; }
}
`;

fs.writeFileSync('assets/site.css', siteCss);

// 2. Refactor resume.css to use a top-to-bottom document flow
const resumeCss = `
.resume-hero {
  padding-block: 60px 40px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.resume-hero h1 { margin: 8px 0 12px; font-size: clamp(2rem, 4vw, 3rem); }
.resume-hero h1 small { font-size: 0.5em; color: var(--muted); }
.headline { font-size: var(--text-lg); color: var(--text-secondary); font-weight: 500; margin-bottom: 16px; }
.summary { font-size: var(--text-base); color: var(--text-secondary); max-width: 800px; }

.portrait-modest {
  width: 160px;
  height: 213px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 8px 16px var(--shadow);
}
@media (min-width: 768px) {
  .resume-hero { flex-direction: row; justify-content: space-between; align-items: flex-start; }
  .portrait-modest { width: 180px; height: 240px; }
}

.contact-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 20px 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  margin-bottom: 40px;
}
.contact-strip a { display: inline-flex; align-items: center; gap: 6px; }
.pdf-download { color: var(--text); font-weight: bold; }

.resume-container {
  max-width: 960px;
  margin: 0 auto;
}

.block { margin-bottom: 48px; }
.block h2 { margin-bottom: 24px; font-size: clamp(1.5rem, 3vw, 2rem); }

.role {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--line);
}
.role:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.role-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.role h3 { margin: 0 0 4px; font-size: 1.4rem; font-family: var(--font-body); font-weight: 600; }
.role .company { font-size: 1rem; color: var(--accent); margin: 0; font-weight: 500; }
.role .date { font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); margin-bottom: 8px; }
@media (min-width: 768px) {
  .role-header { flex-direction: row; justify-content: space-between; align-items: baseline; }
  .role .date { margin-bottom: 0; }
}

.role ul { padding-left: 20px; color: var(--text-secondary); margin: 0; font-size: 0.95rem; line-height: 1.6; }
.role ul li { margin-bottom: 8px; }

/* Grid for skills/capabilities */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.skill-category {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}
.skill-category h3 { font-size: 1.1rem; margin: 0 0 12px; color: var(--text); font-family: var(--font-body); }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { padding: 4px 10px; font-size: 0.8rem; border: 1px solid var(--line); border-radius: 99px; color: var(--text-secondary); background: var(--bg); }

/* Education list */
.plain-list { list-style: none; padding: 0; margin: 0; }
.plain-list li { margin-bottom: 16px; font-size: 0.95rem; color: var(--text-secondary); }
.plain-list strong { display: block; color: var(--text); font-size: 1.05rem; }

@media print {
  @page { size: A4; margin: 15mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: #fff !important; color: #111 !important; font-size: 11pt; }
  nav, footer, .theme-control, .contact-strip .pdf-download { display: none !important; }
  .shell { width: 100% !important; max-width: none !important; margin: 0 !important; }
  .resume-hero { border-bottom: 2px solid #333; padding-block: 0 16px; margin-bottom: 16px; flex-direction: row; align-items: center; }
  .resume-hero h1 { font-size: 24pt; margin: 0 0 8px; color: #000 !important; }
  .portrait-modest { width: 80px; height: 107px; box-shadow: none; border-radius: 4px; }
  .headline { font-size: 12pt; color: #333 !important; }
  .summary { font-size: 10.5pt; color: #444 !important; }
  .contact-strip { padding: 8px 0; margin-bottom: 16px; border-bottom: 1px solid #ddd; }
  .contact-strip a { color: #333 !important; }
  .block h2 { font-size: 14pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
  .role { border-bottom: none; margin-bottom: 16px; padding-bottom: 0; }
  .role h3 { font-size: 12pt; color: #000 !important; }
  .role .company { font-size: 11pt; color: #222 !important; }
  .skill-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .skill-category { padding: 12px; border: 1px solid #ccc; }
  .tag { border-color: #ccc; background: transparent; color: #222 !important; }
}
`;

fs.writeFileSync('assets/resume.css', resumeCss);

// 3. Fix resume.html to use the new vertical flow
const resumeHtmlRaw = fs.readFileSync('resume.html', 'utf8');
const resumeHtmlNew = resumeHtmlRaw.replace(/<main.*?<\/main>/s, `<main class="shell" id="main-content" tabindex="-1">
    <div class="resume-container">
      <header class="resume-hero">
        <div>
          <span class="eyebrow">Professional résumé · Updated 7 September 2026</span>
          <h1>Dinesh Behera <small>| Dinu | DinuDante</small></h1>
          <p class="headline">Senior Technical Consultant · Cloud, Platform & DevOps Engineer</p>
          <p class="summary">Cloud, platform and DevOps professional with 5+ years of enterprise experience across Red Hat OpenShift, Kubernetes, OpenStack, Linux/Windows, automation and monitoring. Strong in production troubleshooting, upgrade readiness, operational audits, RCA and evidence-driven technical documentation.</p>
        </div>
        <img src="assets/dinesh-professional.webp" alt="Dinesh Behera portrait" class="portrait-modest" decoding="async">
      </header>
      
      <div class="contact-strip">
        <a href="mailto:dineshdante.ds@gmail.com">dineshdante.ds@gmail.com</a>
        <span>Odisha, India</span>
        <a href="https://dinudante.in">dinudante.in</a>
        <a href="https://proleapacademy.com" target="_blank" rel="noopener">ProLEAP Academy</a>
        <a href="https://dinudante.com" target="_blank" rel="noopener">DDPrinterZ</a>
        <a class="pdf-download" href="assets/Dinesh_Behera_Resume.pdf" download="Dinesh_Behera_Resume.pdf">
          <svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10l3.5-3.5 1.4 1.4-5.9 5.9-5.9-5.9 1.4-1.4L11 13V3ZM4 19h16v2H4v-2Z"/></svg> Download résumé (PDF)
        </a>
      </div>

      <section class="block">
        <h2>Professional experience</h2>
        <article class="role">
          <div class="role-header">
            <div>
              <h3>Senior Technical Consultant / Cloud, Platform & DevOps Engineer</h3>
              <p class="company">Prodevans Technologies · Bhubaneswar / client sites</p>
            </div>
            <span class="date">Jan 2021 — present</span>
          </div>
          <ul>
            <li>Deliver enterprise consulting across OpenShift/Kubernetes, OpenStack, Linux/Windows, automation, monitoring and DevOps environments.</li>
            <li>Perform cluster health checks, upgrade-readiness analysis, workload diagnostics, backup validation, capacity assessment, incident troubleshooting and post-change validation.</li>
            <li>Create SOPs, MOPs, RCAs, audit reports, implementation and rollback plans; coordinate with OEM, application, network and security teams.</li>
            <li>At Odisha State Data Centre, supported OpenShift lifecycle planning, backup and evidence workflows, OpenStack audits and multi-day infrastructure health reporting.</li>
          </ul>
        </article>
        <article class="role">
          <div class="role-header">
            <div>
              <h3>Chief Executive Officer</h3>
              <p class="company">ProLEAP Academy</p>
            </div>
            <span class="date">Concurrent</span>
          </div>
          <ul>
            <li>Lead job-oriented technical-skilling initiatives and personally teach Python, DevOps and technical documentation.</li>
            <li>Design practical roadmaps, labs, capstones and live troubleshooting sessions focused on demonstrable, portfolio-ready outcomes.</li>
          </ul>
        </article>
        <article class="role">
          <div class="role-header">
            <div>
              <h3>Chief Business Officer</h3>
              <p class="company">PDCloudEX</p>
            </div>
            <span class="date">Concurrent</span>
          </div>
          <ul>
            <li>Support cloud-platform positioning, customer and partner communication, solution enablement and business-technical coordination.</li>
          </ul>
        </article>
      </section>

      <section class="block">
        <h2>Engineering capabilities</h2>
        <div class="skill-grid">
          <div class="skill-category">
            <h3>Platforms & cloud</h3>
            <div class="tags"><span class="tag">OpenShift</span><span class="tag">Kubernetes</span><span class="tag">OpenStack</span><span class="tag">AWS</span><span class="tag">GCP</span><span class="tag">VMware</span><span class="tag">Hyper-V</span></div>
          </div>
          <div class="skill-category">
            <h3>Automation & DevOps</h3>
            <div class="tags"><span class="tag">Ansible / AAP</span><span class="tag">Python</span><span class="tag">Bash</span><span class="tag">Terraform</span><span class="tag">Jenkins</span><span class="tag">GitOps</span></div>
          </div>
          <div class="skill-category">
            <h3>Systems & monitoring</h3>
            <div class="tags"><span class="tag">RHEL</span><span class="tag">Windows Server</span><span class="tag">Prometheus</span><span class="tag">Grafana</span><span class="tag">DNS</span><span class="tag">Basic networking</span></div>
          </div>
          <div class="skill-category">
            <h3>Delivery & registries</h3>
            <div class="tags"><span class="tag">Git</span><span class="tag">GitHub</span><span class="tag">GitLab</span><span class="tag">Harbor</span></div>
          </div>
        </div>
      </section>

      <section class="block">
        <h2>Documentation & delivery style</h2>
        <ul>
          <li>Evidence-first troubleshooting with impact assessment, rollback planning, controlled execution and post-change validation.</li>
          <li>SOPs, MOPs, RCAs, operational audits, architecture diagrams and decision-ready health/utilization reports.</li>
          <li>Clear coordination across application, platform, network, security and vendor teams.</li>
          <li>Automation-first execution that preserves auditability, repeatability and safe ownership boundaries.</li>
        </ul>
      </section>

      <section class="block">
        <h2>Education & credentials</h2>
        <ul class="plain-list">
          <li><strong>B.Tech, Mechanical Engineering</strong> National Institute of Science & Technology, Berhampur (2017–2021)</li>
          <li><strong>HackerRank</strong> Problem Solving (Basic & Intermediate) &middot; Python (Basic)</li>
          <li><strong>Languages</strong> English, Hindi, Odia</li>
        </ul>
      </section>
    </div>
  </main>`);
fs.writeFileSync('resume.html', resumeHtmlNew);

console.log('Refactor script done.');
