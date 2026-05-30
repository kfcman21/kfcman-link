const fs = require('fs');
const path = require('path');

const rootDir = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link";
const files = fs.readdirSync(rootDir);

files.forEach(file => {
  if (file.toLowerCase().includes('deploy') || file.toLowerCase().includes('publish') || file.toLowerCase().includes('upload') || file.endsWith('.sh') || file.endsWith('.bat')) {
    console.log(`Found file: ${file}`);
  }
});
