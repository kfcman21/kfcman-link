const fs = require('fs');
const code = fs.readFileSync('public/app.js.perfect', 'utf8');

const queries = ['pollStatsBarsList', 'pollStatsWordcloud', 'pollDonutSvg'];

queries.forEach(q => {
  console.log(`=== OCCURRENCE OF: ${q} ===`);
  let idx = code.indexOf(q);
  if (idx !== -1) {
    const start = Math.max(0, idx - 800);
    const end = Math.min(code.length, idx + 1500);
    console.log(code.substring(start, end));
  } else {
    console.log('Not found');
  }
  console.log('====================================\n');
});
