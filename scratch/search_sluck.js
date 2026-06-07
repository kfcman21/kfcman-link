const fs = require('fs');
const path = require('path');

function search(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        search(fullPath);
      }
    } else {
      if (file.endsWith('.html') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('sluck')) {
          console.log(`Found sluck in ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((l, i) => {
            if (l.includes('sluck')) {
              console.log(`  Line ${i+1}: ${l.trim()}`);
            }
          });
        }
      }
    }
  });
}

search('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link');
