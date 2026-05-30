const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

console.log('--- ALL OCCURRENCES OF showShortenerTab ---');
let pos = 0;
while ((pos = appjs.indexOf('showShortenerTab', pos)) !== -1) {
  console.log('Pos:', pos);
  console.log(appjs.substring(pos - 100, pos + 200).replace(/\n/g, ' '));
  console.log('-----------------------------------------');
  pos += 16;
}

console.log('--- ALL OCCURRENCES OF showPollsTab ---');
pos = 0;
while ((pos = appjs.indexOf('showPollsTab', pos)) !== -1) {
  console.log('Pos:', pos);
  console.log(appjs.substring(pos - 100, pos + 200).replace(/\n/g, ' '));
  console.log('-----------------------------------------');
  pos += 12;
}
