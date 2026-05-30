const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

// Virtual file system state
const vfs = {
  'index.html': '',
  'app.js': '',
  'style.css': ''
};

// Helper to parse double-serialized JSON strings
function parseString(val) {
  if (typeof val !== 'string') return '';
  // Remove starting and ending quotes if present
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

let stepCount = 0;
rl.on('line', (line) => {
  stepCount++;
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    // STOP replaying at Step 1148 (when Tailwind CSS migration user request arrived)
    if (step >= 1148) {
      return;
    }
    
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const name = tc.name;
        const args = tc.args || {};
        
        let targetPath = parseString(args.TargetFile || args.AbsolutePath || '');
        const filename = targetPath.split(/[\\/]/).pop();
        
        if (filename && vfs.hasOwnProperty(filename)) {
          if (name === 'write_to_file') {
            const codeContent = parseString(args.CodeContent || '');
            if (codeContent) {
              vfs[filename] = codeContent;
              console.log(`[Step ${step}] write_to_file -> ${filename} (${codeContent.length} chars)`);
            }
          } else if (name === 'replace_file_content' || name === 'replace_file_content_mcp') {
            const targetContent = parseString(args.TargetContent || '');
            const replacementContent = parseString(args.ReplacementContent || '');
            
            if (vfs[filename]) {
              const currentContent = vfs[filename];
              if (currentContent.includes(targetContent)) {
                vfs[filename] = currentContent.replace(targetContent, replacementContent);
                console.log(`[Step ${step}] replace_file_content -> ${filename} (replaced ${targetContent.length} chars with ${replacementContent.length} chars)`);
              } else {
                // Fallback: try removing whitespace or carriage returns to match
                const normalizedCurrent = currentContent.replace(/\r\n/g, '\n');
                const normalizedTarget = targetContent.replace(/\r\n/g, '\n');
                const normalizedReplacement = replacementContent.replace(/\r\n/g, '\n');
                
                if (normalizedCurrent.includes(normalizedTarget)) {
                  vfs[filename] = normalizedCurrent.replace(normalizedTarget, normalizedReplacement);
                  console.log(`[Step ${step}] replace_file_content (Normalized) -> ${filename}`);
                } else {
                  console.log(`[Step ${step}] Warning: TargetContent NOT found in ${filename}!`);
                }
              }
            } else {
              console.log(`[Step ${step}] Warning: replace_file_content on empty ${filename}`);
            }
          }
        }
      });
    }
  } catch (e) {
    console.log(`Error parsing line at step ${stepCount}:`, e);
  }
});

rl.on('close', () => {
  console.log('\n--- Replay Completed ---');
  Object.keys(vfs).forEach(filename => {
    const finalContent = vfs[filename];
    console.log(`Reconstructed ${filename} -> Length: ${finalContent.length} chars`);
    
    // Save to actual files
    if (finalContent.length > 0) {
      fs.writeFileSync(`public/${filename}`, finalContent, 'utf8');
      console.log(`Saved public/${filename} successfully!`);
    } else {
      console.log(`Warning: Skip empty file public/${filename}`);
    }
  });
});
