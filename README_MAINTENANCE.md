# Maintenance & Build Instructions

## Product Updates
1. Edit `master_dataset.json` to update, add, or remove products. Ensure each product has a `title`, `url`, `image`, and `primaryCategory`.
2. Run `node build_setup_new.js` to regenerate `setup.html` from the dataset.

## PDF Regeneration
1. After updating `resume.html`, run `node generate_pdf.js`.
2. This uses Puppeteer to render a clean A4 PDF into `assets/Dinesh_Behera_Resume.pdf`.

## Validation
- Use `node take_screenshots.js` to capture local and production screenshots at mobile (390px) and desktop (1440px) sizes.
- View them in the `screenshots/` directory.

## Deployment
1. Commit all modified HTML, CSS, JSON, and PDF files.
2. Push to the `main` branch. GitHub Pages will automatically publish the static files.
