const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

// We want to reconstruct for each file, mapping each line number to a list of { step, text }
const fileData = {
  'index.html': {},
  'app.js': {},
  'style.css': {}
};

function parseString(val) {
  if (typeof val !== 'string') return '';
  let clean = val;
  if (clean.startsWith('"') && clean.endsWith('"')) {
    try {
      clean = JSON.parse(clean);
    } catch (e) {
      clean = clean.slice(1, -1);
    }
  }
  return clean;
}

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    // ONLY collect pre-Tailwind steps (before step 1148)
    if (step >= 1148) {
      return;
    }
    
    // 1. Process VIEW_FILE step contents
    if (obj.type === 'VIEW_FILE' && obj.content) {
      const content = obj.content;
      // Extract file path from content using a more robust regex
      const pathMatch = content.match(/File Path: `file:\/\/\/(.*?)`/i);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const filename = filePath.split(/[\\/]/).pop();
        
        if (fileData[filename]) {
          const linesMatch = content.match(/Showing lines (\d+) to (\d+)/);
          if (linesMatch) {
            const startLine = parseInt(linesMatch[1]);
            
            // Extract the actual line contents
            const textLines = content.split('\n');
            let isCode = false;
            
            for (let i = 0; i < textLines.length; i++) {
              const textLine = textLines[i];
              if (textLine.startsWith('The following code has been modified')) {
                isCode = true;
                continue;
              }
              if (textLine.startsWith('The above content shows')) {
                isCode = false;
                break;
              }
              if (isCode) {
                const colonIdx = textLine.indexOf(':');
                if (colonIdx !== -1) {
                  const lineNumStr = textLine.slice(0, colonIdx).trim();
                  const lineNum = parseInt(lineNumStr);
                  if (!isNaN(lineNum)) {
                    const code = textLine.slice(colonIdx + 1);
                    const cleanCode = code.startsWith(' ') ? code.slice(1) : code;
                    
                    if (!fileData[filename][lineNum]) fileData[filename][lineNum] = [];
                    fileData[filename][lineNum].push({ step, text: cleanCode });
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 2. Process tool calls for replace_file_content or replace_file_content_mcp
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const name = tc.name;
        const args = tc.args || {};
        
        if ((name === 'replace_file_content' || name === 'replace_file_content_mcp') && args) {
          let targetPath = parseString(args.TargetFile || args.AbsolutePath || '');
          const filename = targetPath.split(/[\\/]/).pop();
          
          if (filename && fileData[filename]) {
            const startLine = parseInt(args.StartLine || '1');
            const targetContent = parseString(args.TargetContent || '');
            
            if (targetContent) {
              const targetLines = targetContent.split('\n');
              targetLines.forEach((text, offset) => {
                const lineNum = startLine + offset;
                if (!fileData[filename][lineNum]) fileData[filename][lineNum] = [];
                // The TargetContent in replace_file_content represents the state BEFORE the replacement was made in this step!
                // So the step when this target content existed was BEFORE this step (i.e. we associate it with step - 1 or simply step - 0.5)
                fileData[filename][lineNum].push({ step: step - 0.5, text });
              });
            }
          }
        }
      });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('Finished parsing log file.');
  
  Object.keys(fileData).forEach(filename => {
    const lines = fileData[filename];
    const lineNumbers = Object.keys(lines).map(n => parseInt(n)).sort((a, b) => a - b);
    
    if (lineNumbers.length === 0) {
      console.log(`No entries found for ${filename}`);
      return;
    }
    
    const reconstructedLines = [];
    const maxLine = Math.max(...lineNumbers);
    let missingCount = 0;
    
    for (let i = 1; i <= maxLine; i++) {
      const lineEntries = lines[i];
      if (lineEntries && lineEntries.length > 0) {
        // Sort by step index descending to find the LATEST pre-Tailwind version of this line
        lineEntries.sort((a, b) => b.step - a.step);
        reconstructedLines.push(lineEntries[0].text);
      } else {
        missingCount++;
        reconstructedLines.push(''); // placeholder
      }
    }
    
    const finalContent = reconstructedLines.join('\n');
    console.log(`Reconstructed ${filename} -> Lines: ${reconstructedLines.length}, Missing: ${missingCount}, Bytes: ${finalContent.length}`);
    
    // Save as .reconstructed_latest
    fs.writeFileSync(`public/${filename}.reconstructed_latest`, finalContent, 'utf8');
  });
});
