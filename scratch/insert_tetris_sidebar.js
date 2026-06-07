const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'public/index.html',
  'public/wall.html',
  'public/docs.html'
];

const tetrisItemHtml = `
          <!-- Tetris Battle Sidebar Item -->
          <a href="/tetris" id="nav-item-tetris-side" class="w-full h-11 px-4 rounded-xl flex items-center gap-3 text-slate-450 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer font-bold group">
            <svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(236,72,153,0.35)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-tetris" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ec4899" />
                  <stop offset="100%" stop-color="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect x="3" y="10" width="18" height="6" rx="1.5" fill="url(#grad-side-tetris)" fill-opacity="0.25" stroke="url(#grad-side-tetris)" stroke-width="1.5"/>
              <rect x="9" y="4" width="6" height="12" rx="1.5" fill="url(#grad-side-tetris)" fill-opacity="0.25" stroke="url(#grad-side-tetris)" stroke-width="1.5"/>
              <rect x="10" y="5" width="4" height="4" rx="1" fill="url(#grad-side-tetris)"/>
              <rect x="4" y="11" width="4" height="4" rx="1" fill="url(#grad-side-tetris)"/>
              <rect x="10" y="11" width="4" height="4" rx="1" fill="url(#grad-side-tetris)"/>
              <rect x="16" y="11" width="4" height="4" rx="1" fill="url(#grad-side-tetris)"/>
            </svg>
            <span class="text-sm font-black sidebar-text">테트리스 배틀</span>
          </a>`;

filesToEdit.forEach(file => {
  const absolutePath = path.resolve(file);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File ${file} does not exist.`);
    return;
  }
  let content = fs.readFileSync(absolutePath, 'utf8');

  // Check if tetris side item is already present
  if (content.includes('nav-item-tetris-side')) {
    console.log(`${file} already has nav-item-tetris-side.`);
    return;
  }

  // Find nav-item-docs-side element in the file and insert tetrisItemHtml after it
  const targetId = 'id="nav-item-docs-side"';
  const startIndex = content.indexOf(targetId);
  if (startIndex === -1) {
    console.error(`Could not find ${targetId} in ${file}`);
    return;
  }

  // Find the closing </a> tag of this item
  const closingTagIndex = content.indexOf('</a>', startIndex);
  if (closingTagIndex === -1) {
    console.error(`Could not find closing </a> tag for docs-side in ${file}`);
    return;
  }

  const insertPosition = closingTagIndex + 4;
  const newContent = content.slice(0, insertPosition) + tetrisItemHtml + content.slice(insertPosition);
  fs.writeFileSync(absolutePath, newContent, 'utf8');
  console.log(`Successfully added Tetris Battle menu to ${file}`);
});
