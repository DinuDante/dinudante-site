const fs = require('fs');

const master = JSON.parse(fs.readFileSync('master_dataset.json', 'utf8'));

master.forEach(item => {
  const t = item.title.toLowerCase();
  const c = item.category.toLowerCase();
  
  let newCat = "COMPUTING & MOBILE"; // Fallback, will refine
  
  // Custom categorization rules
  if (t.includes('printer') || t.includes('filament') || t.includes('pla') || t.includes('3d')) {
    newCat = 'MAKER & 3D PRINTING';
  } else if (t.includes('monitor') || t.includes('display') || t.includes('projector') || c.includes('displays')) {
    if (t.includes('arm') || t.includes('mount')) newCat = 'WORKSPACE';
    else if (t.includes('cable') || t.includes('adapter')) newCat = 'STORAGE & CONNECTIVITY';
    else newCat = 'DISPLAYS';
  } else if (t.includes('keyboard') || t.includes('mouse') || t.includes('controller') || c.includes('input')) {
    newCat = 'INPUT & CONTROL';
  } else if (t.includes('earphone') || t.includes('headphone') || t.includes('mic') || t.includes('speaker') || t.includes('earbuds') || c.includes('audio')) {
    newCat = 'AUDIO';
  } else if (t.includes('camera') || t.includes('webcam') || t.includes('light') || t.includes('tripod') || t.includes('gimbal') || c.includes('creator') || c.includes('content')) {
    if (t.includes('ring light') || t.includes('softbox')) newCat = 'CREATOR GEAR';
    else if (t.includes('lamp') || t.includes('desk light')) newCat = 'WORKSPACE';
    else newCat = 'CREATOR GEAR';
  } else if (t.includes('ssd') || t.includes('drive') || t.includes('hub') || t.includes('router') || t.includes('ethernet') || t.includes('adapter') || t.includes('switch') || t.includes('cable') || t.includes('sd card') || t.includes('reader')) {
    if (t.includes('charging') || t.includes('power')) newCat = 'POWER & CHARGING';
    else newCat = 'STORAGE & CONNECTIVITY';
  } else if (t.includes('charger') || t.includes('power') || t.includes('ups') || t.includes('battery')) {
    newCat = 'POWER & CHARGING';
  } else if (t.includes('desk') || t.includes('chair') || t.includes('arm') || t.includes('stand') || t.includes('mount') || t.includes('mat') || t.includes('clock') || t.includes('organizer') || t.includes('clean') || t.includes('alcohol') || c.includes('workspace')) {
    newCat = 'WORKSPACE';
  } else if (t.includes('laptop') || t.includes('macbook') || t.includes('desktop') || t.includes('mini pc') || t.includes('ipad') || t.includes('phone') || t.includes('mobile') || c.includes('mobile') || c.includes('compute')) {
    if (t.includes('stand') || t.includes('holder')) newCat = 'WORKSPACE';
    else newCat = 'COMPUTING & MOBILE';
  } else if (c.includes('other') || c.includes('lifestyle')) {
    // Let's refine these based on functional keywords
    if (t.includes('case') || t.includes('cover') || t.includes('sleeve')) newCat = 'COMPUTING & MOBILE';
    else if (t.includes('backpack') || t.includes('bag')) newCat = 'COMPUTING & MOBILE';
    else if (t.includes('water') || t.includes('bottle')) newCat = 'WORKSPACE';
    else if (t.includes('shoe') || t.includes('pull up') || t.includes('workout')) newCat = 'WORKSPACE'; // stretch
    else if (t.includes('tyre') || t.includes('car') || t.includes('scooty')) newCat = 'COMPUTING & MOBILE'; // these are very edge cases
    else if (t.includes('knife')) newCat = 'WORKSPACE';
    else newCat = 'COMPUTING & MOBILE';
  }
  
  // Specific hardcoded fixes based on previous list
  if (t.includes('tpms') || t.includes('tyre inflator')) newCat = 'COMPUTING & MOBILE';
  if (t.includes('pull up bar') || t.includes('shoe') || t.includes('water bottle')) newCat = 'WORKSPACE';
  if (t.includes('backpack')) newCat = 'COMPUTING & MOBILE';
  if (t.includes('camera') && t.includes('cctv')) newCat = 'CREATOR GEAR';
  
  item.primaryCategory = newCat;
  item.category = newCat; // Also update legacy field just in case
});

fs.writeFileSync('master_dataset.json', JSON.stringify(master, null, 2));

const counts = {};
master.forEach(i => counts[i.primaryCategory] = (counts[i.primaryCategory] || 0) + 1);

console.table(counts);
