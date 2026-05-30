const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\database.js";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('admin') || line.includes('adminUser') || line.includes('role') || line.includes('approved')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
