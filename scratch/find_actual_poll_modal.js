const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
let idx = 0;
while ((idx = content.indexOf('create-poll-card', idx)) !== -1) {
  const lineStart = content.lastIndexOf('\n', idx);
  const line = content.substring(lineStart, lineStart + 200);
  if (line.includes('<div') || line.includes('id=')) {
    console.log(`Found at index ${idx}:`);
    console.log(content.substring(idx - 150, idx + 1000));
    break;
  }
  idx += 16;
}
