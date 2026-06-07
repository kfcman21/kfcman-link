const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('href="/wall"') || line.includes('href="/docs"') || line.includes('href="/wall/') || line.includes('href="/docs/')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
