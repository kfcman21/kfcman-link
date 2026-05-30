const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html.corrupt_bak'), 'utf8');

// Build the correct HTML structure:
// 1. part1 = corrupt_bak[0..55448] (right before settings comment) - eusseuk is OPEN
// 2. Add </section> to close eusseuk-section
// 3. Add the admin panel content (admin-approval-section)
// 4. Add the complete settings-section from s4

// Step 1: Get part1 (up to settings comment, eusseuk still open)
const settingsCommentIdx = 55448;
const part1 = html.substring(0, settingsCommentIdx).trimEnd();

// Verify eusseuk is the open section
const opens = (part1.match(/<section/g) || []).length;
const closes = (part1.match(/<\/section>/g) || []).length;
console.log('Section opens:', opens, 'closes:', closes, 'depth:', opens - closes);

// Step 2: Close eusseuk-section
const eusseukCloseTag = '\n      </section>';

// Step 3: Get admin panel content  
const adminPart = html.substring(79061, 98606);
const settingsSubviewShortcutIdx = adminPart.indexOf('id="settings-subview-shortcut"');
const adminPanelContent = adminPart.substring(0, settingsSubviewShortcutIdx).trimEnd();

// Step 4: Get s4 (complete settings-section)
const s4 = html.substring(119913);

// In s4, inject adminPanelContent into settings-subview-admin div
const adminDivOpenTag = s4.indexOf('"settings-subview-admin">');
const adminDivOpenEnd = s4.indexOf('>', adminDivOpenTag) + 1;
const adminDivComment = s4.indexOf('</div>', adminDivOpenEnd);

const s4BeforeAdmin = s4.substring(0, adminDivOpenEnd);
const s4AfterAdmin = s4.substring(adminDivComment);

// Build the complete HTML
const cleanHtml = part1 + eusseukCloseTag + '\n\n' + s4BeforeAdmin + '\n' + adminPanelContent + '\n          ' + s4AfterAdmin;

// VERIFY section nesting
const eusseukIdx = cleanHtml.indexOf('id="eusseuk-section"');
const eusseukStart = cleanHtml.lastIndexOf('<section', eusseukIdx);
let depth = 0;
let eusseukCloseChar = -1;
for (let i = eusseukStart; i < cleanHtml.length; i++) {
  if (cleanHtml.substring(i, i+8) === '<section') depth++;
  if (cleanHtml.substring(i, i+10) === '</section>') {
    depth--;
    if (depth === 0) {
      eusseukCloseChar = i;
      break;
    }
  }
}
const settingsIdx = cleanHtml.indexOf('id="settings-section"');
console.log('\neusseuk-section closes at char:', eusseukCloseChar);
console.log('settings-section at char:', settingsIdx);
console.log('settings-section is OUTSIDE eusseuk:', settingsIdx > eusseukCloseChar);

// Check for critical IDs
const criticalIds = ['eusseuk-section', 'settings-section', 'admin-approval-section', 'monitor-cpu-val', 
  'settings-subview-admin', 'settings-subview-classroom', 'classroom-settings-section', 'classroom-section',
  'gradebook-section', 'thermometer-section', 'btn-settings-subtab-admin', 'btn-settings-subtab-classroom'];
criticalIds.forEach(id => {
  console.log(id + ':', cleanHtml.includes('id="' + id + '"') ? 'FOUND' : 'MISSING');
});

// Check for duplicates
const idRx = /id="([^"]+)"/g;
const ids = [];
let m;
while (m = idRx.exec(cleanHtml)) ids.push(m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log('\nDuplicate IDs:', [...new Set(dupes)]);

console.log('\nTotal length:', cleanHtml.length);

// Write files
fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), cleanHtml);
fs.writeFileSync(path.join(__dirname, '..', 'www', 'index.html'), cleanHtml);
console.log('Done! Files written!');
