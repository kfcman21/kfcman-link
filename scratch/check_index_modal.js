const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const idx = content.indexOf('id="shortener-modal"');
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 1000));
}
