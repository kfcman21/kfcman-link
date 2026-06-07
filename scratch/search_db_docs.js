const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\database.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('getUserDocs') || line.includes('getWall') || line.includes('getUserWalls')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
