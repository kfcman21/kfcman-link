const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const activeJs = path.join(__dirname, 'public', 'js', 'app.js');
const backupJs = path.join(__dirname, 'public', 'js', 'app.js.tailwind_bak');

console.log('--- Starting Self-Healing Syntax Engine for app.js ---');

if (!fs.existsSync(activeJs) || !fs.existsSync(backupJs)) {
  console.error('ERROR: Requisite files not found.');
  process.exit(1);
}

let iteration = 0;
const maxIterations = 50;

while (iteration < maxIterations) {
  iteration++;
  console.log(`Iteration ${iteration}...`);
  
  try {
    execSync(`node -c "${activeJs}"`, { stdio: 'pipe' });
    console.log('SUCCESS! No syntax errors found in app.js.');
    break;
  } catch (error) {
    const stderr = error.stderr.toString();
    console.log('Syntax error caught:');
    
    // Parse line number from error
    // Example: C:\path\to\app.js:28
    const lineMatch = stderr.match(/app\.js:(\d+)/i);
    if (!lineMatch) {
      console.error('Could not parse line number from error output:');
      console.error(stderr);
      process.exit(1);
    }
    
    const lineNum = parseInt(lineMatch[1]);
    console.log(`  Error on line ${lineNum}`);
    
    // Read files
    const activeLines = fs.readFileSync(activeJs, 'utf8').split('\n');
    const backupLines = fs.readFileSync(backupJs, 'utf8').split('\n');
    
    // If it's an unexpected identifier, the error is likely on the line BEFORE it
    // because that previous line was left incomplete!
    let targetLineNum = lineNum;
    if (stderr.includes('Unexpected identifier') || stderr.includes('Unexpected token')) {
      if (lineNum > 1 && activeLines[lineNum - 2].trim().endsWith('.')) {
        targetLineNum = lineNum - 1;
        console.log(`  Unexpected identifier detected and previous line ends with dot. Shifting target line to ${targetLineNum}`);
      } else if (lineNum > 1) {
        // Fallback: let's try healing the previous line if it doesn't end with a dot but still might be broken
        targetLineNum = lineNum - 1;
        console.log(`  Shifting target line to ${targetLineNum} for unexpected token/identifier error`);
      }
    }
    
    if (targetLineNum > activeLines.length) {
      console.error(`Line number ${targetLineNum} is out of bounds for active lines count ${activeLines.length}`);
      process.exit(1);
    }
    
    console.log(`  Restored line: "${activeLines[targetLineNum - 1].trim()}"`);
    
    let healedLine = '';
    const candidateLine = backupLines[targetLineNum - 1];
    console.log(`  Candidate line from backup at same index: "${candidateLine ? candidateLine.trim() : 'undefined'}"`);
    
    const activeLineText = activeLines[targetLineNum - 1].trim();
    const varDeclMatch = activeLineText.match(/(?:const|let|var)\s+(\w+)/);
    
    if (varDeclMatch) {
      const varName = varDeclMatch[1];
      console.log(`  Variable declaration detected: "${varName}". Searching in backup...`);
      const backupIndex = backupLines.findIndex(line => line.includes(`const ${varName} =`) || line.includes(`let ${varName} =`) || line.includes(`var ${varName} =`));
      if (backupIndex !== -1) {
        healedLine = backupLines[backupIndex];
        console.log(`  Found variable match at backup line ${backupIndex + 1}: "${healedLine.trim()}"`);
      } else {
        healedLine = candidateLine;
      }
    } else {
      healedLine = candidateLine;
    }
    
    if (!healedLine) {
      console.error('Could not find candidate healed line in backup!');
      process.exit(1);
    }
    
    activeLines[targetLineNum - 1] = healedLine;
    fs.writeFileSync(activeJs, activeLines.join('\n'), 'utf8');
    console.log(`  Healed line ${targetLineNum} to: "${healedLine.trim()}"`);
  }
}

if (iteration === maxIterations) {
  console.error('Reached max iterations without resolving syntax errors.');
  process.exit(1);
}
