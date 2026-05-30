const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let count = 0;
rl.on('line', (line) => {
  count++;
  if (count <= 35) {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index} (${obj.source}): ${obj.type} - status: ${obj.status}`);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          console.log(`  Tool call: ${tc.name} with ${JSON.stringify(tc.arguments)}`);
        });
      }
    } catch (e) {}
  } else {
    rl.close();
  }
});
