const fs = require('fs');

const docsHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html', 'utf8');
const wallHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html', 'utf8');

function checkFile(content, filename) {
  console.log(`--- Checking ${filename} ---`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('fixed bottom') || line.includes('mobile-nav')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  });
}

checkFile(docsHtml, 'docs.html');
checkFile(wallHtml, 'wall.html');
