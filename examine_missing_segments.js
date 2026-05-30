const fs = require('fs');

function examineFile(reconstructedPath, originalPath, filename) {
  if (!fs.existsSync(reconstructedPath)) {
    console.log(`File not found: ${reconstructedPath}`);
    return;
  }
  const lines = fs.readFileSync(reconstructedPath, 'utf8').split('\n');
  let missingRanges = [];
  let currentRange = null;

  for (let i = 0; i < lines.length; i++) {
    // If line is empty
    if (lines[i].trim() === '') {
      if (currentRange === null) {
        currentRange = { start: i + 1, end: i + 1 };
      } else {
        currentRange.end = i + 1;
      }
    } else {
      if (currentRange !== null) {
        missingRanges.push(currentRange);
        currentRange = null;
      }
    }
  }
  if (currentRange !== null) {
    missingRanges.push(currentRange);
  }

  console.log(`\n==================================================`);
  console.log(`MISSING RANGES FOR ${filename} (${lines.length} lines total)`);
  console.log(`==================================================`);
  console.log(`Total missing segments: ${missingRanges.length}`);
  
  missingRanges.forEach((r, idx) => {
    if (idx < 10) { // only print first 10 ranges to avoid huge output
      console.log(`\nRange #${idx + 1}: Line ${r.start} to ${r.end} (${r.end - r.start + 1} lines)`);
      console.log('--- BEFORE ---');
      for (let j = Math.max(0, r.start - 4); j < r.start - 1; j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      console.log('--- MISSING ORBS ---');
      console.log('--- AFTER ---');
      for (let j = r.end; j < Math.min(lines.length, r.end + 3); j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      console.log('------------------------');
    }
  });
  if (missingRanges.length > 10) {
    console.log(`... and ${missingRanges.length - 10} more ranges.`);
  }
}

examineFile('public/index.html.reconstructed', 'public_index.html.original', 'index.html');
examineFile('public/app.js.reconstructed', 'public_app.js.original', 'app.js');
