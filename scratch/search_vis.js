const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

console.log('--- SEARCHING VISIBILITY CONTROLS ---');
const keywords = ['visibility', 'vip', 'manager', 'eusseuk', 'poll', 'shorten'];

keywords.forEach(kw => {
  let pos = 0;
  let count = 0;
  while ((pos = appjs.toLowerCase().indexOf(kw.toLowerCase(), pos)) !== -1) {
    count++;
    if (count <= 5) {
      console.log(`Keyword: ${kw} at pos ${pos}`);
      console.log(appjs.substring(pos - 60, pos + 100).replace(/\n/g, ' '));
    }
    pos += kw.length;
  }
  console.log(`Total count for "${kw}": ${count}\n--------------------`);
});
