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
    
    // Check in tool_calls
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if ((tc.name === 'write_to_file' || tc.name === 'replace_file_content') && tc.arguments) {
          const path = tc.arguments.TargetFile || '';
          const filename = path.split(/[\\/]/).pop();
          if (filename && (filename.includes('index.html') || filename.includes('app.js') || filename.includes('style.css'))) {
            const contentLen = tc.arguments.CodeContent ? tc.arguments.CodeContent.length : 0;
            const replacementLen = tc.arguments.ReplacementContent ? tc.arguments.ReplacementContent.length : 0;
            console.log(`Step ${obj.step_index}: MODEL wrote ${filename} using ${tc.name} (Code: ${contentLen} chars, Repl: ${replacementLen} chars)`);
          }
        }
      });
    }
  } catch (e) {}
});
