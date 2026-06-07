const fs = require('fs');

const filePath = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html';
let html = fs.readFileSync(filePath, 'utf8');

const isCrlf = html.includes('\r\n');
html = html.replace(/\r\n/g, '\n');

// 1. Sparkles SVG
const sparklesTarget = `<i data-lucide="sparkles" stroke-width="1.6" class="w-5.5 h-5.5 text-violet-600 dark:text-violet-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]"></i>`;
const sparklesReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-sparkles" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#8b5cf6" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path d="M12 3C12 3 13 8 16 11C19 14 21 12 21 12C21 12 16 13 13 16C10 19 12 21 12 21C12 21 11 16 8 13C5 10 3 12 3 12C3 12 8 11 11 8C14 5 12 3 12 3Z" fill="url(#grad-sparkles)"/>
                  <path d="M19 5C19 5 19.5 7 21 8.5C22.5 10 23 9.5 23 9.5C23 9.5 21 10 19.5 11.5C18 13 19 14 19 14C19 14 18.5 12 17 10.5C15.5 9 15 9.5 15 9.5C15 9.5 17 9 18.5 7.5C20 6 19 5 19 5Z" fill="url(#grad-sparkles)" opacity="0.8"/>
                </svg>`;

// 2. Kanban SVG
const kanbanTarget = `<i data-lucide="layout-grid" stroke-width="1.6" class="w-5.5 h-5.5 text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]"></i>`;
const kanbanReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-kanban" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#f97316" />
                      <stop offset="100%" stop-color="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="5" height="18" rx="1.5" fill="url(#grad-kanban)" opacity="0.25" stroke="url(#grad-kanban)" stroke-width="1.5"/>
                  <rect x="9.5" y="3" width="5" height="18" rx="1.5" fill="url(#grad-kanban)" opacity="0.25" stroke="url(#grad-kanban)" stroke-width="1.5"/>
                  <rect x="16" y="3" width="5" height="18" rx="1.5" fill="url(#grad-kanban)" opacity="0.25" stroke="url(#grad-kanban)" stroke-width="1.5"/>
                  <rect x="4" y="5" width="3" height="4" rx="1" fill="url(#grad-kanban)"/>
                  <rect x="10.5" y="5" width="3" height="6" rx="1" fill="url(#grad-kanban)"/>
                  <rect x="10.5" y="13" width="3" height="4" rx="1" fill="url(#grad-kanban)" opacity="0.7"/>
                  <rect x="17" y="5" width="3" height="5" rx="1" fill="url(#grad-kanban)"/>
                </svg>`;

// 3. Vote SVG
const voteTarget = `<i data-lucide="vote" stroke-width="1.6" class="w-5.5 h-5.5 text-rose-600 dark:text-rose-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"></i>`;
const voteReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-vote" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#f43f5e" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path d="M4 9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9Z" stroke="url(#grad-vote)" stroke-width="1.5" fill="url(#grad-vote)" fill-opacity="0.15"/>
                  <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="url(#grad-vote)" stroke-width="1.5"/>
                  <path d="M10 9H14V13L12 11.5L10 13V9Z" fill="url(#grad-vote)"/>
                  <path d="M9 14.5L11 16.5L15 12" stroke="url(#grad-vote)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;

// 4. Award SVG
const awardTarget = `<i data-lucide="award" stroke-width="1.6" class="w-5.5 h-5.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"></i>`;
const awardReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-award" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#d946ef" />
                    </linearGradient>
                  </defs>
                  <path d="M8.5 14.5L6 21L12 18.5L18 21L15.5 14.5" stroke="url(#grad-award)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="url(#grad-award)" fill-opacity="0.2"/>
                  <circle cx="12" cy="10" r="6" fill="url(#grad-award)" stroke="url(#grad-award)" stroke-width="1.5"/>
                  <path d="M12 7L13.25 9.5L16 9.75L14 11.5L14.5 14.25L12 12.75L9.5 14.25L10 11.5L8 9.75L10.75 9.5L12 7Z" fill="#ffffff"/>
                </svg>`;

// 5. Docs SVG
const docsTarget = `<i data-lucide="file-text" stroke-width="1.6" class="w-5.5 h-5.5 text-teal-600 dark:text-teal-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]"></i>`;
const docsReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-docs" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#20b8a6" />
                      <stop offset="100%" stop-color="#10b981" />
                    </linearGradient>
                  </defs>
                  <path d="M6 2H14L18 6V20C18 21.1046 17.1046 22 16 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" fill="url(#grad-docs)" fill-opacity="0.15" stroke="url(#grad-docs)" stroke-width="1.5"/>
                  <path d="M14 2V6H18L14 2Z" fill="url(#grad-docs)" stroke="url(#grad-docs)" stroke-width="1.5" stroke-linejoin="round"/>
                  <line x1="7" y1="10" x2="15" y2="10" stroke="url(#grad-docs)" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="7" y1="14" x2="15" y2="14" stroke="url(#grad-docs)" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="7" y1="18" x2="11" y2="18" stroke="url(#grad-docs)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>`;

// 6. QR SVG
const qrTarget = `<i data-lucide="qr-code" stroke-width="1.6" class="w-5.5 h-5.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"></i>`;
const qrReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-qr" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#3b82f6" />
                      <stop offset="100%" stop-color="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="url(#grad-qr)" stroke-width="1.5" fill="url(#grad-qr)" fill-opacity="0.1"/>
                  <rect x="5" y="5" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="15" y="3" width="6" height="6" rx="1.5" stroke="url(#grad-qr)" stroke-width="1.5" fill="url(#grad-qr)" fill-opacity="0.1"/>
                  <rect x="17" y="5" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="3" y="15" width="6" height="6" rx="1.5" stroke="url(#grad-qr)" stroke-width="1.5" fill="url(#grad-qr)" fill-opacity="0.1"/>
                  <rect x="5" y="17" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="15" y="15" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="19" y="15" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="15" y="19" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="19" y="19" width="2" height="2" rx="0.5" fill="url(#grad-qr)" opacity="0.4"/>
                  <rect x="11" y="11" width="2" height="2" rx="0.5" fill="url(#grad-qr)"/>
                  <rect x="11" y="5" width="2" height="2" rx="0.5" fill="url(#grad-qr)" opacity="0.4"/>
                  <rect x="5" y="11" width="2" height="2" rx="0.5" fill="url(#grad-qr)" opacity="0.4"/>
                </svg>`;

// 7. Stats SVG
const statsTarget = `<i data-lucide="bar-chart-3" stroke-width="1.6" class="w-5.5 h-5.5 text-sky-600 dark:text-sky-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]"></i>`;
const statsReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-stats" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#0ea5e9" />
                      <stop offset="100%" stop-color="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="13" width="3.5" height="7" rx="1.5" fill="url(#grad-stats)" fill-opacity="0.25" stroke="url(#grad-stats)" stroke-width="1.5"/>
                  <rect x="10.25" y="8" width="3.5" height="12" rx="1.5" fill="url(#grad-stats)" fill-opacity="0.25" stroke="url(#grad-stats)" stroke-width="1.5"/>
                  <rect x="16.5" y="3" width="3.5" height="17" rx="1.5" fill="url(#grad-stats)"/>
                  <path d="M4 14.5L10.25 9.5L16.5 4.5H20.5V8.5L16.5 4.5" stroke="url(#grad-stats)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;

// 8. Settings SVG
const settingsTarget = `<i data-lucide="settings" stroke-width="1.6" class="w-5.5 h-5.5 text-slate-600 dark:text-slate-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]"></i>`;
const settingsReplacement = `<svg class="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad-settings" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#64748b" />
                      <stop offset="100%" stop-color="#94a3b8" />
                    </linearGradient>
                  </defs>
                  <circle cx="10" cy="14" r="4" stroke="url(#grad-settings)" stroke-width="1.5" fill="url(#grad-settings)" fill-opacity="0.2"/>
                  <circle cx="10" cy="14" r="1.5" stroke="url(#grad-settings)" stroke-width="1.5"/>
                  <path d="M10 9V8M10 20V19M5 14H4M16 14H15M6.5 10.5L5.5 9.5M14.5 18.5L13.5 17.5M6.5 17.5L5.5 18.5M14.5 10.5L13.5 11.5" stroke="url(#grad-settings)" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="17" cy="7" r="2.5" stroke="url(#grad-settings)" stroke-width="1.5" fill="url(#grad-settings)" fill-opacity="0.2"/>
                  <circle cx="17" cy="7" r="1" stroke="url(#grad-settings)" stroke-width="1.5"/>
                  <path d="M17 3.5V4.5M17 10.5V9.5M13.5 7H14.5M20.5 7H19.5" stroke="url(#grad-settings)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>`;

function doReplace(target, replacement, name) {
  if (html.includes(target)) {
    html = html.replace(target, replacement);
    console.log(`Replaced ${name} icon!`);
  } else {
    console.log(`Warning: ${name} target icon not found.`);
  }
}

doReplace(sparklesTarget, sparklesReplacement, "Sparkles");
doReplace(kanbanTarget, kanbanReplacement, "Kanban");
doReplace(voteTarget, voteReplacement, "Vote");
doReplace(awardTarget, awardReplacement, "Award");
doReplace(docsTarget, docsReplacement, "Docs");
doReplace(qrTarget, qrReplacement, "QR");
doReplace(statsTarget, statsReplacement, "Stats");
doReplace(settingsTarget, settingsReplacement, "Settings");

if (isCrlf) {
  html = html.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log("Completed!");
