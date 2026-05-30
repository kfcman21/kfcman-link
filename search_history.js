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
        const name = tc.name;
        const args = tc.arguments || {};
        const path = args.AbsolutePath || args.TargetFile || '';
        if (path.includes('index.html') || path.includes('app.js') || path.includes('style.css')) {
          console.log(`Step ${stepCount}: Tool Call ${name} -> path: ${path}`);
        }
      });
    }
    
    // Check in output/responses if any tool call returned the file contents
    if (obj.type === 'VIEW_FILE' || obj.type === 'view_file') {
      const path = obj.content || '';
      console.log(`Step ${stepCount}: view_file response`);
    }
  } catch (err) {
    // Ignore parse errors
  }
});
