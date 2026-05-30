const fs = require('fs');

const filepath = "public/js/app.js";
let content = fs.readFileSync(filepath, 'utf8');

const oldBlock = `    if (subTabId === 'admin') {
      if (subviewAdmin) subviewAdmin.classList.remove('hidden');
      if (btnSubtabAdmin) {
        btnSubtabAdmin.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabAdmin.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderAdminPanel();
    } else if (subTabId === 'shortcut') {
      if (subviewShortcut) subviewShortcut.classList.remove('hidden');
      if (btnSubtabShortcut) {
        btnSubtabShortcut.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabShortcut.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    } else if (subTabId === 'classroom') {
      if (subviewClassroom) subviewClassroom.classList.remove('hidden');
      if (btnSubtabClassroom) {
        btnSubtabClassroom.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabClassroom.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    }`;

const newBlock = `    if (subTabId === 'admin') {
      if (subviewAdmin) subviewAdmin.classList.remove('hidden');
      const adminApprovalSection = document.getElementById('admin-approval-section');
      if (adminApprovalSection) adminApprovalSection.classList.remove('hidden');
      if (btnSubtabAdmin) {
        btnSubtabAdmin.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabAdmin.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderAdminPanel();
    } else if (subTabId === 'shortcut') {
      if (subviewShortcut) subviewShortcut.classList.remove('hidden');
      if (btnSubtabShortcut) {
        btnSubtabShortcut.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabShortcut.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    } else if (subTabId === 'classroom') {
      if (subviewClassroom) subviewClassroom.classList.remove('hidden');
      const classroomSettingsSection = document.getElementById('classroom-settings-section');
      if (classroomSettingsSection) classroomSettingsSection.classList.remove('hidden');
      if (btnSubtabClassroom) {
        btnSubtabClassroom.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabClassroom.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Settings sub-tab visibility fixed in public/js/app.js successfully!");
} else {
  console.log("Error: could not find settings sub-tab block in public/js/app.js!");
  process.exit(1);
}
