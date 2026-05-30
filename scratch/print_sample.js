const fs = require('fs');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

console.log(lines[0]);
