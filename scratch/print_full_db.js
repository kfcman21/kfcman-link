const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/ubuntu/kfcman-link/data/db.json', 'utf8'));
console.log(JSON.stringify(db.walls, null, 2));
