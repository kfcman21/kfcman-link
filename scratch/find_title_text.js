const fs = require('fs');
const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log("Searching for main banner text:");
lines.forEach((line, idx) => {
  if (line.includes('수업') || line.includes('진행') || line.includes('canva-banner') || line.includes('h2') || line.includes('h1')) {
    if (idx > 850 && idx < 930) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
