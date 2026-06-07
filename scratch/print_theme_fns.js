const fs = require('fs');
const appJs = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/app.js', 'utf8');
const lines = appJs.split('\n');

function printRange(start, end) {
  console.log(`--- Lines ${start} to ${end} ---`);
  for (let i = start; i <= end; i++) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}

printRange(100, 135);
printRange(3400, 3420);
printRange(4940, 4960);
