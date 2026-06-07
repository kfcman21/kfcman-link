const fs = require('fs');

const files = [
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/docs.js'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  // Perform replacements
  content = content.replace(/KFCMAN\.CLAUD/g, 'KFCMAN.CLOUD');
  content = content.replace(/claud/g, 'cloud');
  content = content.replace(/CLAUD/g, 'CLOUD');
  content = content.replace(/Claud/g, 'Cloud');

  if (isCrlf) {
    content = content.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Replaced claud with cloud in ${filePath}`);
});

console.log("CLAUD to CLOUD correction complete!");
