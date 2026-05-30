const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

console.log('--- STYLE BLOCKS IN INDEX.HTML ---');
let pos = 0;
while ((pos = html.indexOf('<style', pos)) !== -1) {
  console.log('Style block found at:', pos);
  console.log(html.substring(pos, pos + 250));
  console.log('---------------------------------');
  pos += 6;
}
