const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let stepCount = 0;
const fileViews = {};

rl.on('line', (line) => {
  stepCount++;
  try {
    const obj = JSON.parse(line);
    // Find view_file tool executions and their output
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'view_file') {
          const args = tc.args || {};
          const path = args.AbsolutePath || '';
          const filename = path.split(/[\\/]/).pop();
          if (filename && (filename.includes('index.html') || filename.includes('app.js') || filename.includes('style.css'))) {
            if (!fileViews[filename]) fileViews[filename] = [];
            fileViews[filename].push({
              step: obj.step_index,
              start: args.StartLine || 1,
              end: args.EndLine || 'end',
            });
          }
        }
      });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('File view events in transcript.jsonl:');
  console.log(JSON.stringify(fileViews, null, 2));
});
