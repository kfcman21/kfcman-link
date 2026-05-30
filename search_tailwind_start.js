const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let stepCount = 0;
rl.on('line', (line) => {
  stepCount++;
  try {
    const obj = JSON.parse(line);
    // Print user inputs to see requests chronologically
    if (obj.type === 'USER_INPUT') {
      console.log(`Step ${obj.step_index} (USER): ${obj.content.slice(0, 150)}...`);
    }
    // Print tool calls that wrote files
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
          const args = tc.args || {};
          const path = args.TargetFile || '';
          if (path.includes('index.html') || path.includes('app.js') || path.includes('style.css')) {
            console.log(`  Step ${obj.step_index}: MODEL wrote ${path.split(/[\\/]/).pop()} using ${tc.name}`);
          }
        }
      });
    }
  } catch (e) {}
});
