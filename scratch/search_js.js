const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'app.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 130; i <= 160; i++) {
  console.log(`${i}: ${lines[i-1] ? lines[i-1] : ''}`);
}
