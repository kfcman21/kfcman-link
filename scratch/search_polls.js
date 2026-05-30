const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

console.log('--- SEARCHING POLL SECTIONS IN INDEX.HTML ---');
let pos = 0;
while ((pos = html.toLowerCase().indexOf('id="poll', pos)) !== -1) {
  console.log('Position:', pos);
  console.log(html.substring(pos, pos + 200));
  console.log('---------------------------------------------');
  pos += 10;
}
