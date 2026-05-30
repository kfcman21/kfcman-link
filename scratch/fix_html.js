const fs = require('fs');
const path = require('path');

// Read the corrupt backup which has all correct content
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html.corrupt_bak'), 'utf8');

// The corrupt backup has these segments:
// [0..55507]:     shortener, dashboard, polls, eusseuk (all OK)
// [55507..57766]: 1st settings-section (header only, empty body)
// [57766..76814]: 2nd eusseuk-section (incomplete)
// [76814..79061]: 2nd settings-section header
// [79061..98606]: admin-approval-section + settings-subview-shortcut + settings-subview-classroom (REAL admin content)
// [98606..100865]: 3rd settings-section (header only)
// [100865..119913]: 3rd eusseuk-section (incomplete) 
// [119913..end]:  4th settings-section (complete with subtabs bar + classroom settings + all modals) - REAL classroom settings

const part1 = html.substring(0, 55507); // Everything up to first settings-section

// Admin panel content from the admin block
const adminPart = html.substring(79061, 98606);
// adminPart starts with: <section class="space-y-8" id="admin-approval-section">
// and ends with: <div class="space-y-6" id="settings-subview-classroom">  </section>
// We only want up to settings-subview-shortcut (to avoid duplication with s4 block)
const settingsSubviewShortcutIdx = adminPart.indexOf('id="settings-subview-shortcut"');
const adminPanelContent = adminPart.substring(0, settingsSubviewShortcutIdx).trimEnd();

// The s4 block has the complete settings section
const s4 = html.substring(119913);

// In s4, the settings-subview-admin div has a placeholder comment inside.
// We need to inject adminPanelContent in place of that comment.
// The placeholder is: <!-- 보안 관리자 통제센터, ... -->
const adminDivOpenTag = s4.indexOf('"settings-subview-admin">');
const adminDivOpenEnd = s4.indexOf('>', adminDivOpenTag) + 1;
const adminDivComment = s4.indexOf('</div>', adminDivOpenEnd);

// Build the final clean HTML:
// part1 + s4[0..adminDivOpenEnd] + adminPanelContent + s4[adminDivComment..]
const s4BeforeAdmin = s4.substring(0, adminDivOpenEnd);
const s4AfterAdmin = s4.substring(adminDivComment);

const cleanHtml = part1 + s4BeforeAdmin + '\n' + adminPanelContent + '\n          ' + s4AfterAdmin;

// Verify structure
const sectionRx = /<section[^>]*id="([^"]+)"[^>]*>/g;
let m;
const sections = [];
while (m = sectionRx.exec(cleanHtml)) {
  sections.push(m[1]);
}
console.log('Sections found:', sections);

// Check for duplicates
const idRx = /id="([^"]+)"/g;
const ids = [];
while (m = idRx.exec(cleanHtml)) {
  ids.push(m[1]);
}
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log('Duplicate IDs:', [...new Set(dupes)]);

// Check critical elements
const criticalIds = [
  'settings-section', 'eusseuk-section', 'admin-approval-section',
  'monitor-cpu-val', 'admin-empty-state', 'admin-table-wrapper', 'admin-pending-body',
  'settings-subview-admin', 'settings-subtabs-bar', 'btn-settings-subtab-admin',
  'settings-subview-shortcut', 'settings-subview-classroom', 'classroom-settings-section',
  'qr-modal', 'stats-modal', 'toast-container', 'auth-modal', 'poll-vote-modal',
  'btn-clear-history', 'classroom-import-modal'
];
criticalIds.forEach(id => {
  console.log(id + ':', ids.includes(id) ? 'FOUND' : 'MISSING');
});

console.log('Total length:', cleanHtml.length);

// Write files
fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), cleanHtml);
fs.writeFileSync(path.join(__dirname, '..', 'www', 'index.html'), cleanHtml);
console.log('Done! Files written to public/index.html and www/index.html');
