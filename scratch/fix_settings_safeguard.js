const fs = require('fs');

const filepath = "public/js/app.js";
let content = fs.readFileSync(filepath, 'utf8');

const oldDef = `  // Render 4: Settings View
  function renderSettingsView() {
    // 1. Privacy Toggle Switch
    chkNamePrivacy.checked = !classroomData.rules.namePrivacy;`;

const newDef = `  // Render 4: Settings View
  function renderSettingsView() {
    if (!classroomData || !classroomData.rules) {
      console.log("Classroom settings data not loaded yet.");
      return;
    }
    // 1. Privacy Toggle Switch
    chkNamePrivacy.checked = !classroomData.rules.namePrivacy;`;

if (content.includes(oldDef)) {
  content = content.replace(oldDef, newDef);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Safeguard added to renderSettingsView successfully!");
} else {
  console.log("Error: could not find renderSettingsView definition in public/js/app.js!");
  process.exit(1);
}
