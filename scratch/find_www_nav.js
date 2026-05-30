const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('nav') || line.includes('icon') || line.includes('id="nav-') || line.includes('menu')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
