const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'wall.html');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 990; i <= 1010; i++) {
  console.log(`${i}: ${lines[i-1] ? lines[i-1] : ''}`);
}
