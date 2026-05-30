const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

console.log('--- SCRIPT TAGS IN INDEX.HTML ---');
const regex = /<script[^>]*>[^<]*<\/script>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[0]);
}
