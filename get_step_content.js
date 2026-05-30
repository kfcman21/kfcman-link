const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    if (step === 1137 && obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        console.log(`\n================ Step ${step}: ${tc.name} ================`);
        console.log('Args:', JSON.stringify(tc.args, null, 2));
      });
    }
  } catch (e) {}
});
