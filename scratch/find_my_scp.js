const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/176ac379-d510-4610-818d-05114587ec1b/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log path doesn't exist: " + logPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'run_command' && (tc.args.CommandLine.includes('scp') || tc.args.CommandLine.includes('ssh'))) {
          console.log(`Step ${obj.step_index}: ${tc.args.CommandLine}`);
        }
      });
    }
  } catch (e) {}
});
