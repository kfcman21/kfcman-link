const fs = require('fs');
const path = require('path');
const corrupt = fs.readFileSync('public/index.html.corrupt_bak', 'utf8');

// Key insight: The part1 (0..55507) cuts in the MIDDLE of the corrupt file's settings-section.
// At position 55507, the corrupt file is: 
//   (eusseuk-section is open)
//   The settings comment <!-- 7. Unified... --> at position 55448
//   Then settings-section opens at position ~55490
//
// So part1[0..55507] ends just AFTER the settings-section opening tag!
// That means: the "cut point" 55507 is in the MIDDLE of the settings-section in corrupt_bak.
//
// Let's find the ACTUAL end of the eusseuk section content.
// The eusseuk section should only contain classroom content.
// After thermometer section ends, eusseuk should close.
// The thermometer section content ends just before line 55448 (settings comment).
//
// NEW APPROACH:
// Instead of cutting at char 55507, we should cut at the LAST </div> before the settings comment
// which is at position 55426+6 = 55432.
// Then we add </section> to close eusseuk.
// Then append adminPanelContent + s4 (which starts with settings-section).

const eusseukClosePoint = 55432; // After last </div> before settings comment
const part1 = corrupt.substring(0, eusseukClosePoint);
const eusseukClose = '\n      </section>'; // Close eusseuk-section

const adminPart = corrupt.substring(79061, 98606);
const settingsSubviewShortcutIdx = adminPart.indexOf('id="settings-subview-shortcut"');
const adminPanelContent = adminPart.substring(0, settingsSubviewShortcutIdx).trimEnd();

const s4 = corrupt.substring(119913);

// Inject admin panel content into settings-subview-admin
const adminDivOpenTag = s4.indexOf('"settings-subview-admin">');
const adminDivOpenEnd = s4.indexOf('>', adminDivOpenTag) + 1;
const adminDivComment = s4.indexOf('</div>', adminDivOpenEnd);

const s4BeforeAdmin = s4.substring(0, adminDivOpenEnd);
const s4AfterAdmin = s4.substring(adminDivComment);

const cleanHtml = part1 + eusseukClose + '\n\n' + s4BeforeAdmin + '\n' + adminPanelContent + '\n          ' + s4AfterAdmin;

// Verify structure
const sectionMatches = cleanHtml.match(/<section[^>]*id="([^"]+)"[^>]*>/g);
console.log('Sections in new HTML:');
if (sectionMatches) sectionMatches.forEach(m => console.log('  ' + m.substring(0, 80)));

// Check for critical IDs
const criticalIds = ['eusseuk-section', 'settings-section', 'admin-approval-section', 'monitor-cpu-val', 
  'settings-subview-admin', 'settings-subview-classroom', 'classroom-settings-section', 'classroom-section',
  'gradebook-section', 'thermometer-section'];
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

// Check nesting: Is settings inside eusseuk?
const eusseukIdx = cleanHtml.indexOf('id="eusseuk-section"');
const settingsIdx = cleanHtml.indexOf('id="settings-section"');
console.log('\neusseuk-section at char:', eusseukIdx);
console.log('settings-section at char:', settingsIdx);

// Find eusseuk close
let sectionDepth = 0;
let eusseukClose2 = -1;
for (let i = eusseukIdx; i < cleanHtml.length; i++) {
  if (cleanHtml.substring(i, i+8) === '<section') sectionDepth++;
  if (cleanHtml.substring(i, i+10) === '</section>') { sectionDepth--; if (sectionDepth === 0) { eusseukClose2 = i; break; } }
}
console.log('eusseuk-section closes at char:', eusseukClose2);
console.log('settings-section is INSIDE eusseuk:', settingsIdx < eusseukClose2);

console.log('\nTotal length:', cleanHtml.length);

// Write files
fs.writeFileSync(path.join('public', 'index.html'), cleanHtml);
fs.writeFileSync(path.join('www', 'index.html'), cleanHtml);
console.log('\nFiles written successfully!');
