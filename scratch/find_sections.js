const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (index >= 840 && index <= 1300) {
    if (line.includes("id=") || line.includes("section")) {
      console.log(`Line ${index + 1}: ${line.strip ? line.strip() : line.trim()}`);
    }
  }
});
