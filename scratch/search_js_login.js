const fs = require('fs');
const path = require('path');

['wall.js', 'docs.js'].forEach(file => {
  const filePath = path.join('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www\\js', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('checkLogin') || line.includes('getAuthToken') || line.includes('me') || line.includes('Unauthorized') || line.includes('login') || line.includes('token')) {
      if (line.includes('window.location.href') || line.includes('alert') || line.includes('redirect') || line.includes('login') || line.includes('auth')) {
        console.log(`${file}:${idx+1}: ${line.trim()}`);
      }
    }
  });
});
