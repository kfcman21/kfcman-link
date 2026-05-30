const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

const target = "const shortenerSection = document.getElementById('shortener-section');";
const idx = appjs.indexOf(target);

if (idx !== -1) {
  console.log(appjs.substring(idx - 100, idx + 1800));
} else {
  console.log('Not found');
}
