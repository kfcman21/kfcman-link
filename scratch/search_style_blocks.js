const fs = require('fs');
const css = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\style.css', 'utf8');
const lines = css.split('\n');

console.log("Searching style.css for 'nav-item' or 'sidebar' or 'active':");
lines.forEach((line, idx) => {
  if (line.includes('nav-item') || line.includes('sidebar') || line.includes('.active')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
