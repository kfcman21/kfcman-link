const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('public/js/wall.js');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update cardsGrid class name for columns view
content = content.replace(
  'cardsGrid.className = "flex gap-3 overflow-x-auto pb-4 custom-scrollbar items-start w-full min-h-[50vh]";',
  'cardsGrid.className = "flex gap-6 overflow-x-auto pb-6 custom-scrollbar items-start w-full min-h-[75vh] px-2";'
);

// 2. Update column division width from w-48 to w-72
content = content.replace(
  'colDiv.className = "flex-shrink-0 w-48 bg-white/95 dark:bg-slate-900/90 border-2 border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col max-h-[75vh] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-750";',
  'colDiv.className = "flex-shrink-0 w-72 bg-white/95 dark:bg-slate-900/90 border-2 border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col max-h-[75vh] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-750";'
);

// 3. Update addSection column width from w-48 to w-72
content = content.replace(
  'addColDiv.className = "flex-shrink-0 w-48 bg-white/40 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";',
  'addColDiv.className = "flex-shrink-0 w-72 bg-white/45 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";'
);

// 4. Update headerHTML to include card count and header add button
const targetHeader = `        const headerHTML = \`
          <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
            \${headerTitleHTML}
            \${adminHeaderControls}
          </div>
        \`;`;

const replacementHeader = `        const headerHTML = \`
          <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
            <div class="flex items-center gap-1.5 min-w-0">
              \${headerTitleHTML}
              <span class="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/85 text-[9px] font-black text-slate-500 dark:text-slate-400 select-none">\${secCards.length}</span>
            </div>
            <div class="flex items-center gap-0.5">
              \${canWrite ? \`
              <button onclick="openCardModalForSection('\${sec.id}')" class="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-clay-purple transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="카드 추가">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
              \` : ''}
              \${adminHeaderControls}
            </div>
          </div>
        \`;`;

// Normalize endings for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetHeader.replace(/\r\n/g, '\n');
const normalizedReplacement = replacementHeader.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const newContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log('Successfully updated columns rendering to Padlet style!');
} else {
  console.error('Target headerHTML block not found in wall.js');
}
