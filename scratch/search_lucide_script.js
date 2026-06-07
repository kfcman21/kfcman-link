const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('lucide')) {
    if (line.includes('<script') || line.includes('unpkg') || line.includes('cdn')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
