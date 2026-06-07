const fs = require('fs');
const content = fs.readFileSync('public/wall.html', 'utf8');
const start = content.indexOf('landing-screen');
if (start !== -1) {
  console.log(content.substring(start - 50, start + 1500));
}
