const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:/Users/박찬규/.gemini/antigravity/brain/341c3581-5121-42fa-900e-90668eea8c2f/.system_generated/logs/transcript.jsonl';
const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

// Initialize VFS with the complete original PHP files from www/
const vfs = {
  'index.html': fs.readFileSync('www/index.html', 'utf8'),
  'app.js': fs.readFileSync('www/js/app.js', 'utf8'),
  'style.css': fs.readFileSync('www/css/style.css', 'utf8')
};

console.log('Initial VFS Sizes:');
console.log(`  index.html: ${vfs['index.html'].length} chars`);
console.log(`  app.js: ${vfs['app.js'].length} chars`);
console.log(`  style.css: ${vfs['style.css'].length} chars`);

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
    
    // We ignore the initial write_to_file calls (since they are truncated)
    // and only process replace_file_content or replace_file_content_mcp
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const name = tc.name;
        const args = tc.args || {};
        
        let targetPath = parseString(args.TargetFile || args.AbsolutePath || '');
        const filename = targetPath.split(/[\\/]/).pop();
        
        if (filename && vfs.hasOwnProperty(filename)) {
          // We only process updates after step 135 (when www files were created)
          if (step > 135 && (name === 'replace_file_content' || name === 'replace_file_content_mcp')) {
            const targetContent = parseString(args.TargetContent || '');
            const replacementContent = parseString(args.ReplacementContent || '');
            
            if (targetContent) {
              const currentContent = vfs[filename];
              
              if (currentContent.includes(targetContent)) {
                vfs[filename] = currentContent.replace(targetContent, replacementContent);
                console.log(`[Step ${step}] replace_file_content -> ${filename} (replaced ${targetContent.length} chars with ${replacementContent.length} chars)`);
              } else {
                // Try normalizing whitespace and line endings to match
                const normalizedCurrent = currentContent.replace(/\r\n/g, '\n');
                const normalizedTarget = targetContent.replace(/\r\n/g, '\n');
                const normalizedReplacement = replacementContent.replace(/\r\n/g, '\n');
                
                if (normalizedCurrent.includes(normalizedTarget)) {
                  vfs[filename] = normalizedCurrent.replace(normalizedTarget, normalizedReplacement);
                  console.log(`[Step ${step}] replace_file_content (Normalized) -> ${filename}`);
                } else {
                  console.log(`[Step ${step}] Warning: TargetContent NOT found in ${filename}!`);
                  // Let's print a small snippet of the targetContent we couldn't find to see why
                  console.log('TargetContent snippet:');
                  console.log(targetContent.slice(0, 150));
                  console.log('---------------------------------------------');
                }
              }
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
    
    // Save to active files
    fs.writeFileSync(`public/${filename}.replayed_www`, finalContent, 'utf8');
    console.log(`Saved public/${filename}.replayed_www successfully!`);
  });
});
