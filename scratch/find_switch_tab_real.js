const fs = require('fs');

const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const appJs = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/app.js', 'utf8');

function findOccurrences(content, name, filename) {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(name)) {
      console.log(`${filename}:${idx+1}: ${line.trim()}`);
    }
  });
}

console.log("Searching for switchMainTab...");
findOccurrences(appJs, 'switchMainTab', 'app.js');
