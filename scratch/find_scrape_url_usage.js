const fs = require('fs');
const serverJs = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/server.js', 'utf8');
const lines = serverJs.split('\n');

console.log("Searching for scrapeUrl in server.js:");
lines.forEach((line, idx) => {
  if (line.includes('scrapeUrl')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
