const fs = require('fs');
const appJs = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/app.js', 'utf8');
const lines = appJs.split('\n');

for (let i = 1846; i <= 1890; i++) {
  console.log(`${i}: ${lines[i-1]}`);
}
