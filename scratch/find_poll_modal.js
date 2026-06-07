const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
let idx = content.indexOf('id="create-poll-modal"');
if (idx === -1) {
  idx = content.indexOf('create-poll-card');
  // find the one that is NOT in style tag (around index 17000)
  idx = content.indexOf('create-poll-card', idx + 100);
  idx = content.indexOf('create-poll-card', idx + 100);
}
console.log(content.substring(idx - 200, idx + 1200));
