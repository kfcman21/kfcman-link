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
    if (lineCount >= 2350 && lineCount <= 2430) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, idx) => {
            const args = tc.args;
            if (!args) return;
            let targetFile = args.TargetFile || args.targetFile;
            if (targetFile && targetFile.includes('index.html')) {
              console.log(`Line ${lineCount}, Call ${idx}: tc.name=${tc.name}`);
              let replacement = args.ReplacementContent || args.replacementContent || args.CodeContent || args.codeContent;
              if (typeof replacement === 'string') {
                replacement = replacement.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
              }
              console.log(`Replacement length: ${replacement.length}`);
              fs.writeFileSync(`C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\scratch\\replacement_${lineCount}_${idx}.html`, replacement);
              console.log(`Saved replacement to replacement_${lineCount}_${idx}.html`);
            }
          });
        }
      } catch (e) {
        console.log(`Error parsing line ${lineCount}: ${e.message}`);
      }
    }
  }
}

run();
