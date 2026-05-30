const fs = require('fs');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

let count = 0;
for (const line of lines) {
  if (line.trim()) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name.includes('write')) {
            console.log(`Step ${obj.step_index}: tc.name=${tc.name}`);
            console.log(JSON.stringify(tc));
            console.log('=============================================');
            count++;
            if (count >= 5) break;
          }
        }
      }
    } catch (e) {}
  }
  if (count >= 5) break;
}
