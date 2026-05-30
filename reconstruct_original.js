const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const fileData = {
  'index.html': {},
  'app.js': {},
  'style.css': {}
};

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content) {
      const content = obj.content;
      // Extract file path from content
      const pathMatch = content.match(/File Path: `file:\/\/\/(.*?)`/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const filename = filePath.split('/').pop();
        
        if (fileData[filename]) {
          // Extract showing lines
          const linesMatch = content.match(/Showing lines (\d+) to (\d+)/);
          if (linesMatch) {
            const startLine = parseInt(linesMatch[1]);
            const endLine = parseInt(linesMatch[2]);
            
            // Extract the actual line contents
            const codeLines = [];
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
                // Remove line number prefix (e.g. "1: <content>")
                const colonIdx = textLine.indexOf(':');
                if (colonIdx !== -1) {
                  const lineNumStr = textLine.slice(0, colonIdx).trim();
                  const lineNum = parseInt(lineNumStr);
                  if (!isNaN(lineNum)) {
                    const code = textLine.slice(colonIdx + 1);
                    // Remove leading space if present
                    const cleanCode = code.startsWith(' ') ? code.slice(1) : code;
                    codeLines.push({ num: lineNum, text: cleanCode });
                  }
                }
              }
            }
            
            // Store code lines with step index
            codeLines.forEach(cl => {
              if (!fileData[filename][cl.num]) {
                fileData[filename][cl.num] = [];
              }
              fileData[filename][cl.num].push({
                step: obj.step_index,
                text: cl.text
              });
            });
          }
        }
      }
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('Finished parsing log file.');
  
  // Reconstruct each file by taking the OLDEST log entry for each line number!
  // This guarantees we get the original contents before any Tailwind modifications!
  Object.keys(fileData).forEach(filename => {
    const lines = fileData[filename];
    const lineNumbers = Object.keys(lines).map(n => parseInt(n)).sort((a, b) => a - b);
    
    if (lineNumbers.length === 0) {
      console.log(`No entries found for ${filename}`);
      return;
    }
    
    const reconstructedLines = [];
    let maxLine = Math.max(...lineNumbers);
    
    for (let i = 1; i <= maxLine; i++) {
      const lineEntries = lines[i];
      if (lineEntries && lineEntries.length > 0) {
        // Sort by step index ascending to find the OLDEST version of this line
        lineEntries.sort((a, b) => a.step - b.step);
        reconstructedLines.push(lineEntries[0].text);
      } else {
        // Fallback for missing lines
        reconstructedLines.push('');
      }
    }
    
    const finalContent = reconstructedLines.join('\n');
    console.log(`Reconstructed ${filename} -> Lines: ${reconstructedLines.length}, Bytes: ${finalContent.length}`);
    
    // Write original version back to scratch workspace as .original file first
    fs.writeFileSync(`public_${filename}.original`, finalContent, 'utf8');
  });
});
