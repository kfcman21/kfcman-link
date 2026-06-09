const fs = require('fs');
const vm = require('vm');

function checkFile(filepath) {
  if (!fs.existsSync(filepath)) {
    console.log(`\nFile ${filepath} does not exist`);
    return;
  }
  const buf = fs.readFileSync(filepath);
  console.log(`\n========================================`);
  console.log(`File: ${filepath}, length: ${buf.length}`);
  
  let content = buf.toString('utf8');
  try {
    new vm.Script(content);
    console.log('SYNTAX: VALID');
  } catch (e) {
    console.log('SYNTAX: INVALID:', e.message);
    if (e.stack) {
      console.log(e.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

['public_app.js.original', 'www/app.js'].forEach(checkFile);
