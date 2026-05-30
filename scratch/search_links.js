const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

console.log('--- LINK TAGS IN INDEX.HTML ---');
const regex = /<link[^>]+>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[0]);
}
