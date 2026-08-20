# DinuDante.in project context

Last updated: 2026-08-20 (Asia/Kolkata)

## Identity and positioning

- Display name everywhere: `Dinesh Behera | Dinu | DinuDante`.
- Dinesh Behera is a cloud, platform and DevOps engineer, educator, and 3D-printing founder based in Bhubaneswar, Odisha.
- CEO of ProLEAP Academy; personally teaches Python BootCamp, DevSecOps — The One, and Technical Documentation.
- DDPrinterZ is the extra-curricular/custom 3D-printing studio and maker identity.
- Tone: humble, confident, simple, practical, evidence-led.
- Languages: English, Hindi and Odia.

## Design direction

- Japanese Zen and lo-fi visual system with matte green, navy, black, grey and white.
- Restrained red, purple and green accents are used for dividers, borders and interaction details.
- Preserve the existing serif/monospace typography combination.
- Both light and dark themes are first-class and persist through `localStorage` key `dinu-theme`.
- Theme control uses the sun/moon switch; wider layouts also show the current `LIGHT` or `DARK` state.
- Navigation stays sticky; clicking the brand always returns home.
- Keep layouts simple, calm, fast and responsive rather than decorative or crowded.
- The layout uses a fluid high-resolution composition from narrow phones through 1440p, ultrawide and native 4K displays; do not restore a fixed 1100 px visual cap on large screens.
- Wide layouts deliberately increase content width, type scale, image presentation and section density while retaining controlled line lengths.

## Responsive and image rules

- Support narrow phones through tablets, laptops and wide desktops without horizontal overflow.
- Safari text inflation is disabled with `text-size-adjust: 100%`.
- Professional portrait: `assets/dinesh-professional.webp` (720×960), used for professional/profile contexts.
- Casual portrait: `assets/dinesh-maker.webp` (720×926), used for DDPrinterZ.
- On mobile, the maker portrait is a compact centered 140×175 crop; do not restore tall, narrow or oversized treatments.
- Images retain intrinsic dimensions, use stable aspect crops and decode asynchronously.
- Social/action buttons use inline SVG logos for Instagram, YouTube, WhatsApp, email, résumé and download actions.

## Résumé rules

- The website résumé is the canonical résumé; do not reuse the original source PDF design.
- Downloadable file: `assets/Dinesh_Behera_Resume.pdf`.
- It must remain one A4 page, selectable-text and ATS-friendly.
- The downloadable PDF is a standalone ATS résumé derived from the available Master CV and ATS source résumé; it is intentionally separate from the styled website résumé and must not be regenerated from `resume.html`.
- Current verified PDF properties: one A4 page, 442 extracted words, embedded Arial fonts, no images, three contact links, and populated title/author/subject/keyword metadata.
- The download link uses the cache-busting query `?v=20260820-ats` while retaining the filename `Dinesh_Behera_Resume.pdf`.
- The iOS Safari print path requires the final WebKit print rule in `resume.html`: a fixed 281 mm canvas with the complete résumé scaled to 96%. Do not remove it or replace it with `zoom`; iOS Safari ignored `zoom` and produced two pages.
- Current skills intentionally exclude HPE 3PAR/CSI, storage/data-protection categories, MySQL/DBA, Dynatrace and Data automation.
- Use `Basic networking`, not `Networking` alone.

## Contact and links

- Portfolio: https://dinudante.in
- ProLEAP Academy: https://proleapacademy.com
- DDPrinterZ: https://dinudante.com
- Public email: dineshdante.ds@gmail.com
- Do not display the Prodevans work email.
- WhatsApp actions use the configured `wa.me` link in the source.

## Deployment

- Repository: `git@github.com:DinuDante/dinudante-site.git`
- Branch: `main`
- Hosting: GitHub Pages at https://dinudante.in
- Latest deployed site commit at context save: `32de10d` (`Scale site for high-resolution displays`).
- The preceding PDF/cache releases are `b1ff038` (`Refresh responsive layouts and ATS resume`) and `7e3d498` (`Bust cached resume downloads`).
- GitHub Pages deployment for `32de10d` completed successfully. The live high-resolution HTML and SVG favicon were verified, and the live downloadable PDF matched the local asset byte-for-byte with SHA-256 `dafa616a83e62131d458e5e47bc5f4bef9ad667058cd3653d3bffeb10a77d0d8`.

## Workspace cautions

- Do not stage or modify the untracked `.DS_Store` or `Sources/` directory unless explicitly requested.
- For future releases, commit only intended site assets, push `main`, wait for the Pages action, then verify the live HTML and PDF rather than relying only on the local build.
