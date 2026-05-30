const fs = require('fs');
const path = require('path');

const srcDir = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public";
const destDir = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www";

function copyFolderRecursiveSync(sources, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(sources);
  files.forEach(file => {
    const srcPath = path.join(sources, file);
    const destPath = path.join(target, file);

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyFolderRecursiveSync(srcPath, destPath);
    } else {
      // Don't overwrite api.php or redirect.php if they already exist in destination and are unique
      if ((file === 'api.php' || file === 'redirect.php' || file === '.htaccess') && fs.existsSync(destPath)) {
        console.log(`Skipping special server file: ${file}`);
        return;
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to ${destPath}`);
    }
  });
}

copyFolderRecursiveSync(srcDir, destDir);
console.log("Copy complete!");
