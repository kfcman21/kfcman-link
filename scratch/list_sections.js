const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');
const sections = [];
lines.forEach((l, i) => {
  if (l.includes('<section') && l.includes('id=')) {
    const m = l.match(/id="([^"]+)"/);
    if (m) sections.push((i+1) + ': ' + m[1]);
  }
});
console.log(sections.join('\n'));
