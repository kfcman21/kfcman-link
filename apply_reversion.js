const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Applying Reversion to Pre-Tailwind State ---');

// 1. Define paths
const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const jsDir = path.join(publicDir, 'js');
const cssDir = path.join(publicDir, 'css');

const activeHtml = path.join(publicDir, 'index.html');
const activeJs = path.join(jsDir, 'app.js');
const activeCss = path.join(cssDir, 'style.css');

const perfectHtml = path.join(publicDir, 'index.html.perfect');
const perfectJs = path.join(publicDir, 'app.js.perfect');
const legacyCss = path.join(rootDir, 'www', 'css', 'style.css');

// 2. Backup current Tailwind files
console.log('Backing up current active Tailwind files...');
if (fs.existsSync(activeHtml)) {
  fs.writeFileSync(activeHtml + '.tailwind_bak', fs.readFileSync(activeHtml));
  console.log('  Backed up public/index.html');
}
if (fs.existsSync(activeJs)) {
  fs.writeFileSync(activeJs + '.tailwind_bak', fs.readFileSync(activeJs));
  console.log('  Backed up public/js/app.js');
}
if (fs.existsSync(activeCss)) {
  fs.writeFileSync(activeCss + '.tailwind_bak', fs.readFileSync(activeCss));
  console.log('  Backed up public/css/style.css');
}

// 3. Overwrite with perfect restored files
console.log('Overwriting active files with restored pre-Tailwind ones...');

if (fs.existsSync(perfectHtml)) {
  fs.writeFileSync(activeHtml, fs.readFileSync(perfectHtml));
  console.log('  Restored public/index.html');
} else {
  console.error('ERROR: Reconstructed perfect index.html not found!');
}

if (fs.existsSync(perfectJs)) {
  fs.writeFileSync(activeJs, fs.readFileSync(perfectJs));
  console.log('  Restored public/js/app.js');
} else {
  console.error('ERROR: Reconstructed perfect app.js not found!');
}

if (fs.existsSync(legacyCss)) {
  fs.writeFileSync(activeCss, fs.readFileSync(legacyCss));
  console.log('  Restored public/css/style.css from legacy PHP style.css');
} else {
  console.error('ERROR: Legacy CSS file not found at www/css/style.css');
}

// 4. Validate Javascript syntax of restored app.js
console.log('Validating JS syntax of restored app.js...');
try {
  execSync(`node -c "${activeJs}"`, { stdio: 'inherit' });
  console.log('  Syntax validation: SUCCESS! No syntax errors in restored app.js.');
} catch (e) {
  console.error('  Syntax validation: FAILED! There are syntax errors in restored app.js.');
  process.exit(1);
}

// 5. Clean up temporary .replayed, .perfect, .reconstructed, .original files
console.log('Cleaning up temporary files...');
const filesToClean = [
  'public/index.html.perfect',
  'public/app.js.perfect',
  'public/index.html.reconstructed',
  'public/app.js.reconstructed',
  'public/style.css.reconstructed',
  'public/index.html.replayed_www',
  'public/app.js.replayed_www',
  'public/style.css.replayed_www',
  'public/index.html.reconstructed_latest',
  'public/app.js.reconstructed_latest',
  'public/style.css.reconstructed_latest',
  'public_index.html.original',
  'public_app.js.original',
  'public_style.css.original',
  'reconstruct_perfect.js',
  'reconstruct_latest_pre_tailwind.js',
  'examine_missing_segments.js',
  'replay_with_www_init.js'
];

filesToClean.forEach(f => {
  const p = path.join(rootDir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`  Removed temporary file: ${f}`);
  }
});

console.log('Restoration completed successfully!');
