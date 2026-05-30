const fs = require('fs');
const code = fs.readFileSync('public/app.js', 'utf8');

const targets = ['pollStatsBarsList.innerHTML', 'pollStatsWordcloud.innerHTML', 'pollDonutSvg.innerHTML'];

targets.forEach(t => {
  console.log(`=== BODY OF: ${t} ===`);
  let idx = code.indexOf(t);
  if (idx !== -1) {
    console.log(code.substring(idx - 200, idx + 1500));
  } else {
    console.log('Not found');
  }
  console.log('====================================\n');
});
