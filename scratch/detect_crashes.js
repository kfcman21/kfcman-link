const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const lines = appJsContent.split('\n');
const declarations = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const matchId = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(['"]([^'"]+)['"]\)/);
  if (matchId) {
    declarations.push({
      variable: matchId[1],
      selectorType: 'id',
      selectorValue: matchId[2],
      line: lineNum,
      raw: line.trim()
    });
    return;
  }
  const matchQs = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*document\.querySelector\(['"]([^'"]+)['"]\)/);
  if (matchQs) {
    declarations.push({
      variable: matchQs[1],
      selectorType: 'query',
      selectorValue: matchQs[2],
      line: lineNum,
      raw: line.trim()
    });
    return;
  }
});

// Let's filter to declarations whose element does not exist in index.html
const missingDecls = declarations.filter(d => {
  let exists = false;
  if (d.selectorType === 'id') {
    exists = indexHtmlContent.includes(`id="${d.selectorValue}"`) || indexHtmlContent.includes(`id='${d.selectorValue}'`) || indexHtmlContent.includes(`id=${d.selectorValue}`);
  } else {
    exists = indexHtmlContent.includes(d.selectorValue);
  }
  return !exists;
});

console.log(`Found ${missingDecls.length} missing elements from index.html:`);

// Now let's trace each usage of these missing variables in app.js
missingDecls.forEach(d => {
  // Let's search lines of app.js for uses of d.variable
  // Specifically, we look for properties accessed: variable.foo, variable[foo], variable(
  const usageRegex = new RegExp(`\\b${d.variable}\\b`, 'g');
  const usages = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (lineNum === d.line) return; // skip declaration line
    
    if (usageRegex.test(line)) {
      usages.push({
        line: lineNum,
        content: line.trim()
      });
    }
  });

  if (usages.length > 0) {
    console.log(`\n❌ Element ID/Selector '${d.selectorValue}' (var: ${d.variable}) declared on line ${d.line} does NOT exist in index.html!`);
    console.log(`   It is used in ${usages.length} places:`);
    usages.forEach(u => {
      // Check if this usage line or surrounding lines have a guard
      let hasGuard = false;
      for (let i = Math.max(0, u.line - 5); i <= u.line; i++) {
        const prevLine = lines[i];
        if (prevLine.includes(`if (${d.variable})`) || prevLine.includes(`if(${d.variable})`) || prevLine.includes(`${d.variable} &&`)) {
          hasGuard = true;
          break;
        }
      }
      if (u.content.includes(`${d.variable} &&`)) {
        hasGuard = true;
      }
      console.log(`     Line ${u.line}: "${u.content}" [Guarded? ${hasGuard ? 'YES' : 'NO'}]`);
    });
  }
});
