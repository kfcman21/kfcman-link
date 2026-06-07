const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\server.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes("app.get('/wall") || line.includes("app.get('/docs") || line.includes("app.get('/api/wall") || line.includes("app.get('/api/docs")) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
