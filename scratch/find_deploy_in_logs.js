const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\박찬규\\.gemini\\antigravity\\brain\\341c3581-5121-42fa-900e-90668eea8c2f\\.system_generated\\logs\\transcript.jsonl";

async function run() {
  if (!fs.existsSync(logFile)) {
    console.log("Log file does not exist.");
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('ssh') || line.includes('scp') || line.includes('rsync') || line.includes('pm2') || line.includes('140.245') || line.includes('kfcman.link') || line.includes('git')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, idx) => {
            if (tc.name === 'run_command') {
              console.log(`Line ${lineCount}: run_command -> ${tc.args.CommandLine || tc.args.commandLine}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

run();
