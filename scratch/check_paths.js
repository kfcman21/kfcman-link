const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
console.log('Includes css/style.css:', html.includes('css/style.css'));
console.log('Includes href="style.css":', html.includes('href="style.css"'));
console.log('Includes js/app.js:', html.includes('js/app.js'));
console.log('Includes src="app.js":', html.includes('src="app.js"'));
