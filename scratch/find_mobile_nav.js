const fs = require('fs');

const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log("Searching index.html for mobile navigation bottom bar:");
lines.forEach((line, idx) => {
  if (line.includes('mobile-nav') || line.includes('bottom-0') || line.includes('md:hidden') || line.includes('fixed bottom')) {
    if (line.includes('<div') || line.includes('<button') || line.includes('<a') || line.includes('flex')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
