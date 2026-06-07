const fs = require('fs');

const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log("Searching for 'function switchMainTab' or 'switchMainTab =':");
lines.forEach((line, idx) => {
  if (line.includes('function switchMainTab') || line.includes('switchMainTab =') || line.includes('switchMainTab(')) {
    if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('var')) {
      console.log(`${idx+1}: ${line.trim()}`);
      // Print 20 lines after
      for (let i = 1; i <= 25; i++) {
        console.log(`  +${i}: ${lines[idx + i].trim()}`);
      }
    }
  }
});
