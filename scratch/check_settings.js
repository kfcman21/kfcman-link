const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const found = html.includes('id="settings-section"');
const count = (html.match(/id="settings-section"/g) || []).length;
const idx = html.indexOf('id="settings-section"');
console.log('settings-section found:', found);
console.log('Count:', count);
console.log('At char index:', idx);
if (idx >= 0) {
  console.log('Context:', html.substring(idx - 50, idx + 100));
}
