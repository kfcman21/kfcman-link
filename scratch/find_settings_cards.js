const fs = require('fs');
const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log("Searching for settings subviews and headers:");
lines.forEach((line, idx) => {
  if (line.includes('id="settings-subview-') || line.includes('id="classroom-settings-section"')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
