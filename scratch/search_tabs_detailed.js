const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

console.log('--- SEARCHING TAB/NAVIGATION FUNCTIONS AND SECTIONS ---');
const lines = appjs.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('section') || line.toLowerCase().includes('tab') || line.toLowerCase().includes('switch')) {
    if (line.length < 150) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    } else {
      console.log(`Line ${idx + 1} (truncated): ${line.substring(0, 150).trim()}...`);
    }
  }
});
