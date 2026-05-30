const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const sIdx = html.indexOf('id="settings-section"');
console.log('settings-section at char:', sIdx);
// Show what's in the settings section
const settingsTag = html.substring(sIdx - 10, sIdx + 500);
console.log('\nStart of settings-section:');
console.log(settingsTag);
