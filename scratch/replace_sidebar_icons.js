const fs = require('fs');

const files = [
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html'
];

const homeTarget = `<i data-lucide="home" stroke-width="1.75" class="w-4.5 h-4.5 text-violet-500 dark:text-violet-400 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300"></i>`;
const homeReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-home" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <path d="M12 3L3 10.5V20C3 20.5523 3.44772 21 4 21H9V14H15V21H20C20.5523 21 21 20.5523 21 20V10.5L12 3Z" fill="url(#grad-side-home)"/>
              <path d="M12 3L3 10.5L12 3ZM21 10.5L12 3L21 10.5Z" stroke="url(#grad-side-home)" stroke-width="1.5"/>
            </svg>`;

const capTarget = `<i data-lucide="graduation-cap" stroke-width="1.75" class="w-4.5 h-4.5 text-purple-500 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300"></i>`;
const capReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-classroom" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#a855f7" />
                  <stop offset="100%" stop-color="#d946ef" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad-side-classroom)"/>
              <path d="M6 10V14.5C6 16.5 8.5 18 12 18C15.5 18 18 16.5 18 14.5V10" stroke="url(#grad-side-classroom)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <path d="M20 7.5V14.5" stroke="url(#grad-side-classroom)" stroke-width="2" stroke-linecap="round"/>
            </svg>`;

const folderTarget = `<i data-lucide="folder" stroke-width="1.75" class="w-4.5 h-4.5 text-sky-500 dark:text-sky-400 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300"></i>`;
const folderReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-projects" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M4 4H9L11 7H20C21.1046 7 22 7.89543 22 9V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V6C2 4.89543 2.89543 4 4 4Z" fill="url(#grad-side-projects)" fill-opacity="0.25" stroke="url(#grad-side-projects)" stroke-width="1.5"/>
              <path d="M2 9H22" stroke="url(#grad-side-projects)" stroke-width="1.5"/>
            </svg>`;

const kanbanTarget = `<i data-lucide="layout-grid" stroke-width="1.75" class="w-4.5 h-4.5 text-orange-500 dark:text-orange-400 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300"></i>`;
const kanbanReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-kanban" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f97316" />
                  <stop offset="100%" stop-color="#f59e0b" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="5" height="18" rx="1.5" fill="url(#grad-side-kanban)" opacity="0.25" stroke="url(#grad-side-kanban)" stroke-width="1.5"/>
              <rect x="9.5" y="3" width="5" height="18" rx="1.5" fill="url(#grad-side-kanban)" opacity="0.25" stroke="url(#grad-side-kanban)" stroke-width="1.5"/>
              <rect x="16" y="3" width="5" height="18" rx="1.5" fill="url(#grad-side-kanban)" opacity="0.25" stroke="url(#grad-side-kanban)" stroke-width="1.5"/>
              <rect x="4" y="5" width="3" height="4" rx="1" fill="url(#grad-side-kanban)"/>
              <rect x="10.5" y="5" width="3" height="6" rx="1" fill="url(#grad-side-kanban)"/>
              <rect x="17" y="5" width="3" height="5" rx="1" fill="url(#grad-side-kanban)"/>
            </svg>`;

const docsTarget = `<i data-lucide="file-text" stroke-width="1.75" class="w-4.5 h-4.5 text-teal-500 dark:text-teal-400 animate-pulse group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300"></i>`;
const docsReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-docs" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#20b8a6" />
                  <stop offset="100%" stop-color="#10b981" />
                </linearGradient>
              </defs>
              <path d="M6 2H14L18 6V20C18 21.1046 17.1046 22 16 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" fill="url(#grad-side-docs)" fill-opacity="0.15" stroke="url(#grad-side-docs)" stroke-width="1.5"/>
              <path d="M14 2V6H18L14 2Z" fill="url(#grad-side-docs)" stroke="url(#grad-side-docs)" stroke-width="1.5" stroke-linejoin="round"/>
              <line x1="7" y1="10" x2="15" y2="10" stroke="url(#grad-side-docs)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="7" y1="14" x2="15" y2="14" stroke="url(#grad-side-docs)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`;

const settingsTarget = `<i data-lucide="settings" stroke-width="1.75" class="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"></i>`;
const settingsReplacement = `<svg class="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-side-settings" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#64748b" />
                  <stop offset="100%" stop-color="#94a3b8" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="3" stroke="url(#grad-side-settings)" stroke-width="1.5" fill="url(#grad-side-settings)" fill-opacity="0.2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="url(#grad-side-settings)" stroke-width="1.5" fill="none"/>
            </svg>`;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  function doReplace(target, replacement, name) {
    if (html.includes(target)) {
      html = html.replace(new RegExp(escapeRegExp(target), 'g'), replacement);
      console.log(`Replaced ${name} icon in ${filePath}`);
    } else {
      console.log(`Warning: ${name} icon not found in ${filePath}`);
    }
  }

  doReplace(homeTarget, homeReplacement, "Home");
  doReplace(capTarget, capReplacement, "Classroom");
  doReplace(folderTarget, folderReplacement, "Projects");
  doReplace(kanbanTarget, kanbanReplacement, "Kanban");
  doReplace(docsTarget, docsReplacement, "Docs");
  doReplace(settingsTarget, settingsReplacement, "Settings");

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, html, 'utf8');
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log("Sidebar replacements complete!");
