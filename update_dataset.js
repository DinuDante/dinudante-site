const fs = require('fs');

let master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

// 1. Correct existing errors
master.forEach(p => {
  const t = p.title.toLowerCase();
  
  if (t.includes('dailyobjects wrap-lock strip cable bind')) {
    p.primaryCategory = 'WORKSPACE';
  }
  if (t.includes('kreo arctik pro laptop cooler pad')) {
    p.primaryCategory = 'WORKSPACE';
  }
  if ((t.includes('sony') || t.includes('sennheiser')) && (t.includes('headphone') || t.includes('earphone'))) {
    p.primaryCategory = 'AUDIO';
  }
  if (t.includes('sandisk') && (t.includes('sd') || t.includes('memory card'))) {
    p.primaryCategory = 'STORAGE & CONNECTIVITY';
  }
  
  // Also applying the rules that were hardcoded in build_setup_new.js previously, 
  // since they should be in the dataset, not the renderer.
  if (t.includes('tp-link eh210')) p.primaryCategory = 'STORAGE & CONNECTIVITY';
  if (t.includes('green soul') && t.includes('chair')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('kz edx pro')) p.primaryCategory = 'AUDIO';
  if (t.includes('benq gw2790q')) p.primaryCategory = 'DISPLAYS';
  if (t.includes('lg ultrawide')) p.primaryCategory = 'DISPLAYS';
  if (t.includes('xiaomi pad 7')) p.primaryCategory = 'COMPUTING & MOBILE';
  if (t.includes('sony mdr-zx310ap')) p.primaryCategory = 'AUDIO';
  if (t.includes('quntis monitor light')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('green soul') && t.includes('table')) p.primaryCategory = 'WORKSPACE';
  if (t.includes('usb4') || t.includes('thunderbolt')) p.primaryCategory = 'STORAGE & CONNECTIVITY';
  
  if (!p.primaryCategory) p.primaryCategory = 'EVERYDAY & UTILITY';
});

// 2. Add the two new items
master.push({
  title: "ARZOPA 16.1''144Hz Portable Monitor, 106% sRGB FHD 1080P Kickstand Portable Gaming Monitor with Speaker HDR, Ultra Slim, Eye Care Screen for Laptop, PC, Mobile,PS5, MacBook- USB C & HDMI Connectivity",
  url: "https://link.amazon/B02oIJdYW",
  image: "https://m.media-amazon.com/images/I/51dXBO0yW0L._SY300_SX300_QL70_FMwebp_.jpg",
  asin: "B0CRKGKZVX",
  primaryCategory: "DISPLAYS",
  featured: true
});

master.push({
  title: "Ambrane 100W Fast Charging Powerbank for MacBook, Type C Laptop & Mobile Charging, USB-A Output 25,000mAh Battery, Triple Output, Power Delivery & Quick Charge (Powerlit Ultra, Black)",
  url: "https://link.amazon/B057fmWSL",
  image: "https://m.media-amazon.com/images/I/71fmgrzbpML._SX425_.jpg",
  asin: "B0BYVDM93V",
  primaryCategory: "POWER & CHARGING",
  featured: true
});

fs.writeFileSync('master_dataset.json', JSON.stringify(master, null, 2));
console.log('Dataset updated.');
