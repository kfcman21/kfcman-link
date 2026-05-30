const fs = require('fs');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

const types = new Set();
lines.forEach(line => {
  if (line.trim()) {
    try {
      const obj = JSON.parse(line);
      types.add(obj.type);
    } catch (e) {}
  }
});

console.log(Array.from(types));
