const fs = require('fs');

const files = [
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  // Enlarge logo container and SVG inside
  // Target 1: Sidebar Logo container and SVG
  const logoTarget = `w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all flex-shrink-0">
              <svg class="w-7 h-7"`;
  const logoReplacement = `w-11 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all flex-shrink-0">
              <svg class="w-9 h-9"`;

  // Target 2: Header Logo container and SVG (if any)
  const headerLogoTarget = `w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all flex-shrink-0">
          <svg class="w-7 h-7"`;
  const headerLogoReplacement = `w-11 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all flex-shrink-0">
          <svg class="w-9 h-9"`;

  html = html.replace(logoTarget, logoReplacement);
  html = html.replace(headerLogoTarget, headerLogoReplacement);

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Enlarged logo elements in ${filePath}`);
});

console.log("Logo enlargement complete!");
