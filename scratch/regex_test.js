const fs = require('fs');
const jsPath = 'public/js/app.js';
let jsContent = fs.readFileSync(jsPath, 'utf8');

const regex1 = /function\s+openAuthModal\s*\(\s*mode\s*=\s*'login'\s*\)\s*\{/i;
const regex2 = /btnHeroStart\.addEventListener\s*\(\s*'click'\s*,\s*\(\)\s*=>\s*openAuthModal\('register'\)\)/i;

console.log('regex1 matches:', regex1.test(jsContent));
console.log('regex2 matches:', regex2.test(jsContent));

if (regex1.test(jsContent)) {
  const match1 = jsContent.match(regex1);
  console.log('Match 1:', match1[0]);
}

if (regex2.test(jsContent)) {
  const match2 = jsContent.match(regex2);
  console.log('Match 2:', match2[0]);
}
