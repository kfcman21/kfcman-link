const fs = require('fs');

const content = fs.readFileSync('public/index.html', 'utf8');
console.log('Total length:', content.length);
console.log('Lines:', content.split('\n').length);

const terms = ['classroom-settings-section', 'admin-approval-section', 'btn-clear-history', 'chk-name-privacy'];
terms.forEach(term => {
  const idx = content.indexOf(term);
  console.log(`${term} found at:`, idx);
  if (idx !== -1) {
    // Print around it
    console.log(`Snippet around ${term}:`);
    console.log(content.substring(idx - 50, idx + 200));
    console.log('-----------------------');
  }
});
