const fs = require('fs');
const path = require('path');

const homeDir = "C:\\Users\\박찬규";
const searchDirs = [homeDir, path.join(homeDir, 'Desktop'), path.join(homeDir, 'Documents')];

searchDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file.toLowerCase().includes('kfcman')) {
          console.log(`Found kfcman folder in ${dir}: ${file} -> ${fullPath}`);
        }
      } catch (e) {}
    });
  } catch (e) {}
});
