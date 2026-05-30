const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

// We want to collect all known pre-Tailwind line versions for each file.
// Structure: fileLines[filename][lineNum] = [ { step, text } ]
const fileLines = {
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
    
    // 1. Process VIEW_FILE step contents (only before step 1148)
    if (step < 1148 && obj.type === 'VIEW_FILE' && obj.content) {
      const content = obj.content;
      const pathMatch = content.match(/File Path: `file:\/\/\/(.*?)`/i);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const filename = filePath.split(/[\\/]/).pop();
        
        if (fileLines[filename]) {
          const linesMatch = content.match(/Showing lines (\d+) to (\d+)/);
          if (linesMatch) {
            const startLine = parseInt(linesMatch[1]);
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
                    
                    if (!fileLines[filename][lineNum]) fileLines[filename][lineNum] = [];
                    fileLines[filename][lineNum].push({ step, text: cleanCode });
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 2. Process tool calls
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const name = tc.name;
        const args = tc.args || {};
        
        if ((name === 'replace_file_content' || name === 'replace_file_content_mcp') && args) {
          let targetPath = parseString(args.TargetFile || args.AbsolutePath || '');
          const filename = targetPath.split(/[\\/]/).pop();
          
          if (filename && fileLines[filename]) {
            const startLine = parseInt(args.StartLine || '1');
            const targetContent = parseString(args.TargetContent || '');
            const replacementContent = parseString(args.ReplacementContent || '');
            
            if (step < 1148) {
              // PRE-TAILWIND EDITS
              // TargetContent exists BEFORE this step
              if (targetContent) {
                targetContent.split('\n').forEach((text, offset) => {
                  const lineNum = startLine + offset;
                  if (!fileLines[filename][lineNum]) fileLines[filename][lineNum] = [];
                  fileLines[filename][lineNum].push({ step: step - 0.5, text });
                });
              }
              // ReplacementContent exists AFTER this step
              if (replacementContent) {
                replacementContent.split('\n').forEach((text, offset) => {
                  const lineNum = startLine + offset;
                  if (!fileLines[filename][lineNum]) fileLines[filename][lineNum] = [];
                  fileLines[filename][lineNum].push({ step: step, text });
                });
              }
            } else {
              // TAILWIND EDITS (step >= 1148)
              // The TargetContent here is the PRE-TAILWIND content!
              // We associate it with step 1147 (last pre-Tailwind step) so it is taken as the latest pre-Tailwind version.
              if (targetContent) {
                targetContent.split('\n').forEach((text, offset) => {
                  const lineNum = startLine + offset;
                  if (!fileLines[filename][lineNum]) fileLines[filename][lineNum] = [];
                  fileLines[filename][lineNum].push({ step: 1147, text });
                });
              }
            }
          }
        }
      });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('Finished parsing transcript logs.');
  
  // Reconstruct index.html
  reconstructFile('index.html', 'public/index.html', 983);
  
  // Reconstruct app.js
  reconstructFile('app.js', 'public/js/app.js', 1650); // Estimating pre-Tailwind lines around 1650 based on step 1137
});

function reconstructFile(filename, activePath, estimatedPreTailwindLines) {
  const activeContent = fs.readFileSync(activePath, 'utf8');
  const activeLines = activeContent.split('\n');
  
  const reconstructedLines = [];
  let gapCount = 0;
  
  // We'll reconstruct up to the estimated pre-Tailwind lines or the max line number we collected
  const collectedLineNums = Object.keys(fileLines[filename]).map(n => parseInt(n));
  const maxCollectedLine = collectedLineNums.length > 0 ? Math.max(...collectedLineNums) : 0;
  const totalLinesToReconstruct = Math.max(estimatedPreTailwindLines, maxCollectedLine);
  
  console.log(`\nReconstructing ${filename} up to line ${totalLinesToReconstruct}...`);
  
  for (let i = 1; i <= totalLinesToReconstruct; i++) {
    const entries = fileLines[filename][i];
    if (entries && entries.length > 0) {
      // Sort by step index descending to find the LATEST pre-Tailwind version
      entries.sort((a, b) => b.step - a.step);
      reconstructedLines.push(entries[0].text);
    } else {
      // FALLBACK: If we have no log entry for this line, it was never modified or viewed.
      // So its original content is exactly the same as in the current active file!
      // (As long as i is within current active lines)
      if (i <= activeLines.length) {
        reconstructedLines.push(activeLines[i - 1]);
      } else {
        reconstructedLines.push('');
        gapCount++;
      }
    }
  }
  
  const finalContent = reconstructedLines.join('\n');
  fs.writeFileSync(`public/${filename}.perfect`, finalContent, 'utf8');
  console.log(`Saved public/${filename}.perfect successfully!`);
  console.log(`  Lines: ${reconstructedLines.length}`);
  console.log(`  Gaps: ${gapCount}`);
  console.log(`  Bytes: ${finalContent.length}`);
}
