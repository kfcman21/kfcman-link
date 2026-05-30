const fs = require('fs');

const content = fs.readFileSync('public_index.html.original', 'utf8');
let pos = 0;
let count = 0;

while ((pos = content.indexOf('</html>', pos)) !== -1) {
  count++;
  console.log(`Match ${count} at position ${pos}`);
  const snippet = content.slice(Math.max(0, pos - 150), pos + 100);
  console.log(JSON.stringify(snippet));
  console.log('---------------------------------------------');
  pos += 7;
}
