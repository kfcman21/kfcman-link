const fs = require('fs');

const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');
const styleCss = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/style.css', 'utf8');

function findOccurrences(content, query, name) {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(query)) {
      console.log(`${name}:${idx+1}: ${line.trim()}`);
    }
  });
}

console.log("Searching for 'sidebar' styles...");
findOccurrences(styleCss, 'sidebar', 'style.css');
console.log("Searching for '#nav-item-' styles...");
findOccurrences(styleCss, 'nav-item', 'style.css');
