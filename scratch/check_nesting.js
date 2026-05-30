const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');

const eusseukStart = lines.findIndex(l => l.includes('id="eusseuk-section"'));
const settingsStart = lines.findIndex(l => l.includes('id="settings-section"'));

// Count tags to find the closing of eusseuk-section
let depth = 0;
let eusseukEnd = -1;
for (let i = eusseukStart; i < settingsStart; i++) {
  const line = lines[i];
  const opens = (line.match(/<section/g) || []).length;
  const closes = (line.match(/<\/section>/g) || []).length;
  depth += opens - closes;
  if (depth === 0 && i > eusseukStart) {
    eusseukEnd = i;
    break;
  }
}

console.log('eusseuk-section starts at line:', eusseukStart + 1);
console.log('settings-section starts at line:', settingsStart + 1);
console.log('eusseuk-section ends at line:', eusseukEnd + 1);
console.log('settings-section is INSIDE eusseuk-section:', eusseukEnd === -1 || settingsStart < eusseukEnd);
