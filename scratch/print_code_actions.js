const fs = require('fs');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

let count = 0;
for (const line of lines) {
  if (line.trim()) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'CODE_ACTION') {
        console.log(`Step ${obj.step_index}:`);
        console.log(JSON.stringify(obj).substring(0, 1000));
        console.log('----------------------------------------------------');
        count++;
        if (count >= 3) break;
      }
    } catch (e) {}
  }
}
