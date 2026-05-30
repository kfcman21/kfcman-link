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
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            const args = tc.args; // Note: in STEP 9 JSON above, it is "args", not "arguments"
            if (!args) return;
            
            let targetFile = args.TargetFile || args.targetFile;
            if (typeof targetFile === 'string') {
              // Strip quotes
              targetFile = targetFile.replace(/^"|"$/g, '').replace(/\\"/g, '"');
            }

            if (targetFile && targetFile.toLowerCase().includes('index.html')) {
              console.log(`Line ${lineCount}: ${tc.name} for ${targetFile}`);
              
              let codeContent = args.CodeContent || args.codeContent;
              let replacementContent = args.ReplacementContent || args.replacementContent;

              if (typeof codeContent === 'string') {
                codeContent = codeContent.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
              }
              if (typeof replacementContent === 'string') {
                replacementContent = replacementContent.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
              }

              if (codeContent && (codeContent.includes('classroom-settings-section') || codeContent.includes('chk-name-privacy'))) {
                console.log("FOUND SETTINGS IN CodeContent!");
                fs.writeFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\scratch\\recovered_settings.html', codeContent);
                console.log("Written recovered html to recovered_settings.html!");
              }

              if (replacementContent && (replacementContent.includes('classroom-settings-section') || replacementContent.includes('chk-name-privacy'))) {
                console.log("FOUND SETTINGS IN ReplacementContent!");
                console.log(replacementContent);
              }
            }
          }
        });
      }
    } catch (e) {
      console.log(`Error parsing line ${lineCount}:`, e.message);
    }
  }
}

run();
