const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (index >= 840 && index <= 1200) {
    if (line.includes("id=")) {
      const match = line.match(/id="([^"]+)"/);
      if (match) {
        console.log(`Line ${index + 1}: id="${match[1]}"`);
      }
    }
  }
});
