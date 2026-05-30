const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('settings') || line.includes('privacy') || line.includes('rules') || line.includes('ratio')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
