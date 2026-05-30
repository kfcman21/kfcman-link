const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

const targets = ['showShortenerTab', 'showDashboardTab', 'showPollsTab'];

targets.forEach(t => {
  console.log(`=== OCCURRENCE OF ${t} ===`);
  let idx = appjs.indexOf(t);
  if (idx !== -1) {
    console.log(appjs.substring(idx - 100, idx + 1000));
  } else {
    console.log('Not found');
  }
});
