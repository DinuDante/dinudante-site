const fs = require('fs');
const files = ['404.html', 'index.html', 'privacy/index.html', 'resume.html', 'setup.html'];

const faviconsHtml = `
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
`;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // 1. Remove old favicon links
  content = content.replace(/<link rel="icon" href="favicon.svg" type="image\/svg\+xml">/g, '');
  content = content.replace(/<link rel="icon" type="image\/png".*?>/g, '');
  content = content.replace(/<link rel="apple-touch-icon".*?>/g, '');
  
  // Add new favicons before </head>
  if (!content.includes('apple-touch-icon.png')) {
    content = content.replace('</head>', faviconsHtml + '</head>');
  }

  // 2. Extract title and description
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const desc = descMatch ? descMatch[1] : '';
  let url = 'https://dinudante.in/' + (f === 'index.html' ? '' : f);
  if (f === 'privacy/index.html') url = 'https://dinudante.in/privacy/';
  
  // 3. Fix OG / Twitter tags
  const ogHtml = `
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://dinudante.in/assets/logo.png">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://dinudante.in/assets/logo.png">
  `;
  
  // Remove existing OG / Twitter
  content = content.replace(/<meta property="og:.*?>/g, '');
  content = content.replace(/<meta name="twitter:.*?>/g, '');
  
  content = content.replace('</head>', ogHtml + '</head>');

  // 4. JSON-LD Structured Data
  let schema = null;
  const personSchema = {
    "@type": "Person",
    "@id": "https://dinudante.in/#person",
    "name": "Dinesh Behera",
    "alternateName": ["Dinu", "DinuDante"],
    "url": "https://dinudante.in/",
    "jobTitle": "Cloud, Platform & DevOps Engineer"
  };

  if (f === 'index.html') {
    schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://dinudante.in/#website",
      "url": "https://dinudante.in/",
      "name": "DinuDante",
      "author": personSchema
    };
  } else if (f === 'resume.html') {
    schema = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": personSchema
    };
  } else if (f === 'setup.html') {
    schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": desc,
      "about": personSchema
    };
  }

  // Remove existing schema if any
  content = content.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '');
  
  if (schema) {
    const schemaStr = `\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n`;
    content = content.replace('</head>', schemaStr + '</head>');
  }
  
  fs.writeFileSync(f, content);
});

console.log('Head tags injected.');
