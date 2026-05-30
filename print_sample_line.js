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
    if (obj.step_index === 236 || obj.step_index === 240 || obj.step_index === 264) {
      console.log(`--- Step ${obj.step_index} ---`);
      console.log(JSON.stringify(obj, null, 2));
    }
  } catch (e) {}
});
