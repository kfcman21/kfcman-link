const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\scratch\\recovered_match_2376.html";
const content = fs.readFileSync(filepath, 'utf8');

console.log(`Content length: ${content.length}`);
console.log(content);
