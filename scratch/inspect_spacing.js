const fs = require('fs');
const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const lines = indexHtml.split('\n');

for (let i = 2055; i <= 2072; i++) {
  console.log(`${i}: [${lines[i-1].replace(/\r/g, '\\r')}]`);
}
