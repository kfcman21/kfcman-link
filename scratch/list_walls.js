const fs = require('fs');
const db = JSON.parse(fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/data/db.json', 'utf8'));
console.log("Wall IDs:", Object.keys(db.walls || {}));
