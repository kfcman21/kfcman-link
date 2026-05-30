const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\server.js";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('admin') || line.includes('kfcman') || line.includes('password') || line.includes('init')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
