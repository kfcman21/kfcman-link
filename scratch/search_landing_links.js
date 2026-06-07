const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('칸반보드') || line.includes('HWP') || line.includes('docs') || line.includes('wall')) {
    if (idx > 1000 && idx < 2000) { // Let's narrow it down to general range if we want, or just print all matching lines
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
