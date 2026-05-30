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
    if (step === 23 || step === 27 || step === 31 || step === 127 || step === 131 || step === 135) {
      console.log(`--- Step ${step} ---`);
      console.log(JSON.stringify(obj, null, 2));
    }
  } catch (e) {}
});
