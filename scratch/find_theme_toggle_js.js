const fs = require('fs');
const appJs = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/app.js', 'utf8');
const lines = appJs.split('\n');

console.log("Searching for theme-toggle-btn in app.js:");
lines.forEach((line, idx) => {
  if (line.includes('theme-toggle-btn') || line.includes('light-theme') || line.includes('dark-theme')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
