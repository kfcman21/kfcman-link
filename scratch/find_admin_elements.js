const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('admin') || line.includes('approval') || line.includes('monitor') || line.includes('notification')) {
    if (line.includes('id=') || line.includes('<div') || line.includes('<section')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
