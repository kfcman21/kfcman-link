const fs = require('fs');

const docsHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html', 'utf8');
const wallHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html', 'utf8');

function searchNav(html, filename) {
  console.log(`--- Searching ${filename} ---`);
  const lines = html.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('nav-item-') && line.includes('-side')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  });
}

searchNav(docsHtml, 'docs.html');
searchNav(wallHtml, 'wall.html');
