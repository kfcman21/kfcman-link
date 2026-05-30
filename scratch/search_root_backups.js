const fs = require('fs');
const path = require('path');

const rootDir = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link";
const files = fs.readdirSync(rootDir);

files.forEach(file => {
  if (file.endsWith('.original') || file.endsWith('.js') || file.endsWith('.html')) {
    const fullPath = path.join(rootDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('chk-name-privacy') || content.includes('classroom-settings-section') || content.includes('settings-privacy-card')) {
      console.log(`Found in root file: ${file}`);
    }
  }
});
