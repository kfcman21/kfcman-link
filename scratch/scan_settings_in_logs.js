const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('settings-privacy-card') || line.includes('classroom-settings-section')) {
      console.log(`Line ${lineCount} contains settings:`);
      // Let's search for HTML block in this line
      const index = line.indexOf('settings-privacy-card');
      const start = Math.max(0, index - 500);
      const end = Math.min(line.length, index + 3000);
      console.log(line.substring(start, end));
      console.log('========================================================================');
    }
  }
}

run();
