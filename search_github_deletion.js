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
    // Print if it contains GitHub deletion or git commands
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const cmd = tc.arguments && tc.arguments.CommandLine ? tc.arguments.CommandLine : '';
        if (cmd.includes('git') || cmd.includes('GitHub') || cmd.includes('rm') || cmd.includes('del')) {
          console.log(`Step ${obj.step_index}: MODEL ran command "${cmd}"`);
        }
      });
    }
  } catch (e) {}
});
