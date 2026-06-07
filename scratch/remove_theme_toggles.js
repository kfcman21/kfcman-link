const fs = require('fs');

const pathIndex = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html';

function cleanFile(filePath, target, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (content.includes(normalizedTarget)) {
    content = content.replace(normalizedTarget, normalizedReplacement);
    if (isCrlf) {
      content = content.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated: ${filePath}`);
  } else {
    console.log(`Warning: Target string not found in ${filePath}`);
  }
}

// 1.2 Sidebar theme button
const sidebarBtnTarget = `        <!-- Sun/Moon switch -->
        <button class="w-9 h-9 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-800 dark:text-white cursor-pointer flex-shrink-0" id="theme-toggle-btn-sidebar" title="테마 변경">
          <i data-lucide="sun" class="w-4.5 h-4.5 block dark:hidden text-clay-toy"></i>
          <i data-lucide="moon" class="w-4.5 h-4.5 hidden dark:block text-clay-mint"></i>
        </button>`;

cleanFile(pathIndex, sidebarBtnTarget, '');
