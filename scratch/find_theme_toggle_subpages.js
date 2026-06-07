const fs = require('fs');

const docsHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html', 'utf8');
const wallHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html', 'utf8');

function findThemeToggle(content, filename) {
  console.log(`--- Theme toggle in ${filename} ---`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('theme-toggle-btn') || line.includes('theme-toggle-btn-sidebar')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  });
}

findThemeToggle(docsHtml, 'docs.html');
findThemeToggle(wallHtml, 'wall.html');
