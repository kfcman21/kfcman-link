const fs = require('fs');

const files = [
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/docs.html',
  'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html'
];

const replacements = [
  {
    target: `<i data-lucide="link-2" class="w-5 h-5"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-link" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <path d="M9 17H7A5 5 0 0 1 7 7H9" stroke="url(#grad-mob-link)" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M15 7H17A5 5 0 0 1 17 17H15" stroke="url(#grad-mob-link)" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="url(#grad-mob-link)" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`,
    name: "Link"
  },
  {
    target: `<i data-lucide="bar-chart-2" class="w-5 h-5"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-stats" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
              <rect x="3" y="13" width="4" height="8" rx="1" fill="url(#grad-mob-stats)"/>
              <rect x="10" y="8" width="4" height="13" rx="1" fill="url(#grad-mob-stats)"/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill="url(#grad-mob-stats)"/>
            </svg>`,
    name: "Dashboard/Stats"
  },
  {
    target: `<i data-lucide="vote" class="w-5 h-5"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-vote" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f43f5e" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <path d="M4 9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9Z" stroke="url(#grad-mob-vote)" stroke-width="2" fill="url(#grad-mob-vote)" fill-opacity="0.15"/>
              <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="url(#grad-mob-vote)" stroke-width="2"/>
              <path d="M10 9H14V13L12 11.5L10 13V9Z" fill="url(#grad-mob-vote)"/>
            </svg>`,
    name: "Vote"
  },
  {
    target: `<i data-lucide="award" class="w-5 h-5"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-award" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#a855f7" />
                  <stop offset="100%" stop-color="#d946ef" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="8" r="6" fill="url(#grad-mob-award)" stroke="url(#grad-mob-award)" stroke-width="2"/>
              <path d="M15.47 13.79L19 21L12 18L5 21L8.53 13.79" stroke="url(#grad-mob-award)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="url(#grad-mob-award)" fill-opacity="0.2"/>
            </svg>`,
    name: "Award/Classroom"
  },
  {
    target: `<i data-lucide="file-text" class="w-5 h-5 text-clay-purple animate-pulse"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 animate-pulse transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-docs" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#20b8a6" />
                  <stop offset="100%" stop-color="#10b981" />
                </linearGradient>
              </defs>
              <path d="M6 2H14L18 6V20C18 21.1046 17.1046 22 16 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" fill="url(#grad-mob-docs)" fill-opacity="0.15" stroke="url(#grad-mob-docs)" stroke-width="2"/>
              <path d="M14 2V6H18L14 2Z" fill="url(#grad-mob-docs)" stroke="url(#grad-mob-docs)" stroke-width="2"/>
            </svg>`,
    name: "Docs"
  },
  {
    target: `<i data-lucide="layout-grid" class="w-5 h-5 text-clay-sky"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-kanban" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f97316" />
                  <stop offset="100%" stop-color="#f59e0b" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="url(#grad-mob-kanban)" stroke-width="2" fill="url(#grad-mob-kanban)" fill-opacity="0.2"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="url(#grad-mob-kanban)" stroke-width="2" fill="url(#grad-mob-kanban)" fill-opacity="0.2"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="url(#grad-mob-kanban)" stroke-width="2" fill="url(#grad-mob-kanban)" fill-opacity="0.2"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="url(#grad-mob-kanban)" stroke-width="2" fill="url(#grad-mob-kanban)" fill-opacity="0.2"/>
            </svg>`,
    name: "Kanban/Wall"
  },
  {
    target: `<i data-lucide="settings" class="w-5 h-5"></i>`,
    replacement: `<svg class="w-5.5 h-5.5 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-mob-settings" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#64748b" />
                  <stop offset="100%" stop-color="#94a3b8" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="3" stroke="url(#grad-mob-settings)" stroke-width="2" fill="url(#grad-mob-settings)" fill-opacity="0.2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="url(#grad-mob-settings)" stroke-width="2" fill="none"/>
            </svg>`,
    name: "Settings"
  }
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  replacements.forEach(r => {
    if (html.includes(r.target)) {
      html = html.replace(new RegExp(escapeRegExp(r.target), 'g'), r.replacement);
      console.log(`Replaced ${r.name} in ${filePath}`);
    } else {
      console.log(`Warning: ${r.name} not found in ${filePath}`);
    }
  });

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, html, 'utf8');
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log("Mobile replacements complete!");
