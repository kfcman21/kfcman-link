const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

// Great news! The section nesting is NOW CORRECT!
// eusseuk-section opens at 36459, closes at 55439
// settings-section starts at ~55451 (AFTER eusseuk closes)
// The previous nesting check was wrong!

// Let's verify with a proper check:
const eusseukIdx = html.indexOf('id="eusseuk-section"');
const settingsIdx = html.indexOf('id="settings-section"');
const eusseukStart = html.lastIndexOf('<section', eusseukIdx);

let depth = 0;
let eusseukCloseChar = -1;
for (let i = eusseukStart; i < html.length; i++) {
  if (html.substring(i, i+8) === '<section') depth++;
  if (html.substring(i, i+10) === '</section>') {
    depth--;
    if (depth === 0) {
      eusseukCloseChar = i;
      break;
    }
  }
}

console.log('eusseuk-section element starts at char:', eusseukStart);
console.log('eusseuk-section closes at char:', eusseukCloseChar);
console.log('settings-section starts at char:', settingsIdx);
console.log('settings-section is OUTSIDE eusseuk-section:', settingsIdx > eusseukCloseChar + 10);

// Check all sections and their positions
const sectionRx = /<section[^>]*id="([^"]+)"[^>]*>/g;
let m;
while (m = sectionRx.exec(html)) {
  console.log('\nSection:', m[1], 'at char:', m.index);
  // Find its close
  let d = 0;
  let close = -1;
  for (let i = m.index; i < html.length; i++) {
    if (html.substring(i, i+8) === '<section') d++;
    if (html.substring(i, i+10) === '</section>') {
      d--;
      if (d === 0) { close = i; break; }
    }
  }
  console.log('  Closes at:', close, '(length:', close - m.index, ')');
}
