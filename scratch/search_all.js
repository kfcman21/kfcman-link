const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.original') || file.endsWith('.perfect')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('settings-privacy-card')) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  });
}

searchDir("C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link");
