const fs = require('fs');
const path = require('path');

const dirs = ['public', 'www'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file.endsWith('.html')) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      if (content.includes('src="/app.js"') || content.includes('src="app.js"') || content.includes('src=\'/app.js\'') || content.includes('src=\'app.js\'')) {
        console.log(`Found references in ${dir}/${file}`);
      }
    }
  });
});
console.log('Search complete.');
