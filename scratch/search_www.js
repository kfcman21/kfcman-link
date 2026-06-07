const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('/api/login') || content.includes('login') || content.includes('loginUser')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('login') || line.includes('/api/login')) {
            console.log(`${filePath}:${idx+1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www');
