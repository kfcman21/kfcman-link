const fs = require('fs');
const path = require('path');
const corrupt = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html.corrupt_bak'), 'utf8');

// FINAL DEFINITIVE FIX:
// 
// Build cleanHtml as:
// 1. part1 = corrupt_bak[0..55448] (everything through thermometer section, eusseuk OPEN)
// 2. Close eusseuk-section: </section>
// 3. s4 settings section with admin panel injected:
//    - s4[0..adminDivOpenEnd] + adminPanelContent + s4[adminDivComment..s4settingsClose]
// 4. Close member-content properly: \n    </div>\n  </main>
// 5. Modals and rest: s4[modalsCommentIdx..]

// Get key positions:
const settingsCommentIdx = 55448;
const part1 = corrupt.substring(0, settingsCommentIdx).trimEnd();

const adminPart = corrupt.substring(79061, 98606);
const settingsSubviewShortcutIdx = adminPart.indexOf('id="settings-subview-shortcut"');
const adminPanelContent = adminPart.substring(0, settingsSubviewShortcutIdx).trimEnd();

const s4 = corrupt.substring(119913);

const adminDivOpenTag = s4.indexOf('"settings-subview-admin">');
const adminDivOpenEnd = s4.indexOf('>', adminDivOpenTag) + 1;
const adminDivComment = s4.indexOf('</div>', adminDivOpenEnd);

const s4BeforeAdmin = s4.substring(0, adminDivOpenEnd);
const s4AfterAdmin = s4.substring(adminDivComment);

// Find settings-section close in s4AfterAdmin (relative to s4)
// The settings section in s4 spans from its tag to its close
const s4FullSettings = s4BeforeAdmin + '\n' + adminPanelContent + '\n          ' + s4AfterAdmin;
const s4SettingsIdx = s4FullSettings.indexOf('id="settings-section"');
const s4SettingsStart = s4FullSettings.lastIndexOf('<section', s4SettingsIdx);
let depth = 0;
let s4SettingsCloseChar = -1;
for (let i = s4SettingsStart; i < s4FullSettings.length; i++) {
  if (s4FullSettings.substring(i, i+8) === '<section') depth++;
  if (s4FullSettings.substring(i, i+10) === '</section>') {
    depth--;
    if (depth === 0) {
      s4SettingsCloseChar = i + 10;
      break;
    }
  }
}
console.log('s4FullSettings settings-section closes at char:', s4SettingsCloseChar);

// Get just the settings section portion of s4:
const s4SettingsOnly = s4FullSettings.substring(0, s4SettingsCloseChar);

// Get the modals from the original s4:
const modalsComment = '<!-- ==================== MODALS LISTS';
const modalsInS4Idx = s4.indexOf(modalsComment);
const modalsAndRest = s4.substring(modalsInS4Idx);

// Build the final clean HTML:
const cleanHtml = 
  part1 + 
  '\n      </section>\n\n' +    // Close eusseuk-section
  s4SettingsOnly +               // settings-section (properly ends with </section>)
  '\n\n    </div>\n  </main>\n\n' + // Close member-content + main
  '      ' + modalsAndRest;      // All modals and rest of page

// VERIFY
const eusseukIdx = cleanHtml.indexOf('id="eusseuk-section"');
const eusseukStart = cleanHtml.lastIndexOf('<section', eusseukIdx);
depth = 0;
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
const settingsInClean = cleanHtml.indexOf('id="settings-section"');
console.log('\nVERIFICATION:');
console.log('eusseuk-section closes at char:', eusseukCloseChar);
console.log('settings-section at char:', settingsInClean);
console.log('settings OUTSIDE eusseuk:', settingsInClean > eusseukCloseChar);

// Check critical IDs
const criticalIds = ['eusseuk-section', 'settings-section', 'admin-approval-section', 'monitor-cpu-val', 
  'settings-subview-admin', 'settings-subview-classroom', 'classroom-settings-section', 'classroom-section',
  'gradebook-section', 'thermometer-section', 'btn-settings-subtab-admin', 'btn-settings-subtab-classroom',
  'member-content', 'auth-modal', 'toast-container'];
criticalIds.forEach(id => {
  console.log(id + ':', cleanHtml.includes('id="' + id + '"') ? 'FOUND' : 'MISSING');
});

// Check duplicates
const idRx = /id="([^"]+)"/g;
const ids = [];
let m;
while (m = idRx.exec(cleanHtml)) ids.push(m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log('\nDuplicate IDs:', [...new Set(dupes)]);

// Check div balance
let divDepth = 0;
for (let i = 0; i < cleanHtml.length; i++) {
  if (cleanHtml.substring(i, i+4) === '<div') divDepth++;
  if (cleanHtml.substring(i, i+6) === '</div>') divDepth--;
}
console.log('Final div depth (should be 0):', divDepth);

// Check section balance
let sectionDepth = 0;
for (let i = 0; i < cleanHtml.length; i++) {
  if (cleanHtml.substring(i, i+8) === '<section') sectionDepth++;
  if (cleanHtml.substring(i, i+10) === '</section>') sectionDepth--;
}
console.log('Final section depth (should be 0):', sectionDepth);

console.log('\nTotal length:', cleanHtml.length);

// Write files
fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), cleanHtml);
fs.writeFileSync(path.join(__dirname, '..', 'www', 'index.html'), cleanHtml);
console.log('Done! Files written!');
