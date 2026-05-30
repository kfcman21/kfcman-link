const fs = require('fs');

const filepath = "public/js/app.js";
let content = fs.readFileSync(filepath, 'utf8');

const oldAdminPanel = `  async function renderAdminPanel() {
    // Load notification configuration (once)
    await loadNotificationSettings();

    // Load User Usage Statistics & Management Panel
    await renderUserManagementPanel();`;

const newAdminPanel = `  async function renderAdminPanel() {
    // Load notification configuration (once) safely
    try {
      await loadNotificationSettings();
    } catch (e) {
      console.error("Failed to load notification settings:", e);
    }

    // Load User Usage Statistics & Management Panel safely
    try {
      await renderUserManagementPanel();
    } catch (e) {
      console.error("Failed to load user management panel:", e);
    }`;

if (content.includes(oldAdminPanel)) {
  content = content.replace(oldAdminPanel, newAdminPanel);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Safeguard added to renderAdminPanel successfully!");
} else {
  console.log("Error: could not find renderAdminPanel definition in public/js/app.js!");
  process.exit(1);
}
