const fs = require('fs');

const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log("Searching for 'collapsed' in index.html:");
lines.forEach((line, idx) => {
  if (line.includes('collapsed') || line.includes('toggle-sidebar')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
