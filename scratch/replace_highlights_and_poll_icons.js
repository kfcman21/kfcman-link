const fs = require('fs');

const indexFile = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html';
const wallFile = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/wall.html';

// 1. UPDATE HIGHLIGHT CARDS IN INDEX.HTML
if (fs.existsSync(indexFile)) {
  let html = fs.readFileSync(indexFile, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  // Highlight Card 1: Link-2 (Watermark and Small)
  const targetLinkBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out"><i data-lucide="link-2" class="w-24 h-24 text-white"></i></div>`;
  const replacementLinkBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out">
                <svg class="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17H7A5 5 0 0 1 7 7H9" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M15 7H17A5 5 0 0 1 17 17H15" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>`;

  const targetLinkSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300"><i data-lucide="link-2" stroke-width="2" class="w-4 h-4 text-white group-hover:rotate-6 transition-transform"></i></div>`;
  const replacementLinkSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <svg class="w-5 h-5 text-white group-hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17H7A5 5 0 0 1 7 7H9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M15 7H17A5 5 0 0 1 17 17H15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>`;

  // Highlight Card 2: Kanban (Watermark and Small)
  const targetKanbanBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out"><i data-lucide="layout-grid" class="w-24 h-24 text-white"></i></div>`;
  const replacementKanbanBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out">
                <svg class="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="5" height="18" rx="1.5" stroke="white" stroke-width="1.5"/>
                  <rect x="9.5" y="3" width="5" height="18" rx="1.5" stroke="white" stroke-width="1.5"/>
                  <rect x="16" y="3" width="5" height="18" rx="1.5" stroke="white" stroke-width="1.5"/>
                  <rect x="4" y="5" width="3" height="4" rx="1" fill="white"/>
                  <rect x="10.5" y="5" width="3" height="6" rx="1" fill="white"/>
                  <rect x="17" y="5" width="3" height="5" rx="1" fill="white"/>
                </svg>
              </div>`;

  const targetKanbanSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300"><i data-lucide="layout-grid" stroke-width="2" class="w-4 h-4 text-white group-hover:rotate-6 transition-transform"></i></div>`;
  const replacementKanbanSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <svg class="w-5 h-5 text-white group-hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="5" height="18" rx="1.5" stroke="currentColor" stroke-width="2"/>
                  <rect x="9.5" y="3" width="5" height="18" rx="1.5" stroke="currentColor" stroke-width="2"/>
                  <rect x="16" y="3" width="5" height="18" rx="1.5" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>`;

  // Highlight Card 3: Vote (Watermark and Small)
  const targetVoteBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out"><i data-lucide="vote" class="w-24 h-24 text-white"></i></div>`;
  const replacementVoteBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out">
                <svg class="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9Z" stroke="white" stroke-width="1.5"/>
                  <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="white" stroke-width="1.5"/>
                </svg>
              </div>`;

  const targetVoteSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300"><i data-lucide="vote" stroke-width="2" class="w-4 h-4 text-white group-hover:rotate-6 transition-transform"></i></div>`;
  const replacementVoteSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <svg class="w-5 h-5 text-white group-hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9H20V21H4V9Z" stroke="currentColor" stroke-width="2"/>
                  <path d="M8 9V5H16V9" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>`;

  // Highlight Card 4: Award (Watermark and Small)
  const targetAwardBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out"><i data-lucide="award" class="w-24 h-24 text-white"></i></div>`;
  const replacementAwardBg = `<div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-700 ease-out">
                <svg class="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="10" r="6" stroke="white" stroke-width="1.5"/>
                  <path d="M8.5 14.5L6 21L12 18.5L18 21L15.5 14.5" stroke="white" stroke-width="1.5"/>
                </svg>
              </div>`;

  const targetAwardSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300"><i data-lucide="award" stroke-width="2" class="w-4 h-4 text-white group-h`;
  const replacementAwardSm = `<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <svg class="w-5 h-5 text-white group-hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="2"/>
                  <path d="M9 14L7 20L12 18L17 20L15 14" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>`;

  // Apply highlight replacements
  html = html.replace(targetLinkBg, replacementLinkBg);
  html = html.replace(targetLinkSm, replacementLinkSm);
  html = html.replace(targetKanbanBg, replacementKanbanBg);
  html = html.replace(targetKanbanSm, replacementKanbanSm);
  html = html.replace(targetVoteBg, replacementVoteBg);
  html = html.replace(targetVoteSm, replacementVoteSm);
  html = html.replace(targetAwardBg, replacementAwardBg);
  // Match first part of award to avoid broken tags
  const awardIdx = html.indexOf(targetAwardSm);
  if (awardIdx !== -1) {
    const endAwardIdx = html.indexOf('</div>', awardIdx);
    html = html.substring(0, awardIdx) + replacementAwardSm + html.substring(endAwardIdx + 6);
  }

  // 2. UPDATE THE 6 POLL TYPE SELECTOR ICONS IN INDEX.HTML
  // Bar Chart (Stats)
  html = html.replace(`<i data-lucide="bar-chart-3" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="14" width="3" height="7" rx="0.75" fill="white"/>
                      <rect x="10.5" y="8" width="3" height="13" rx="0.75" fill="white"/>
                      <rect x="17" y="3" width="3" height="18" rx="0.75" fill="white"/>
                    </svg>`);
  
  // Donut/Pie Chart
  html = html.replace(`<i data-lucide="pie-chart" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.2 12C20.6 6.4 15.6 1.4 10 0.8V10H19.2C19.7 10.7 20 11.3 20.2 12H21.2Z" fill="white"/>
                      <path d="M18.8 14H10V22.8C14.9 22.2 18.8 18.3 19.4 13.4C19.2 13.6 19 13.8 18.8 14Z" fill="white" opacity="0.8"/>
                      <path d="M8 22.6V12H0.8C1.4 17.6 6.4 22.6 12 23.2C10.7 23.2 9.3 23 8 22.6Z" fill="white" opacity="0.6"/>
                      <path d="M0.8 10H8V0.8C3.1 1.4 0.8 5.3 0.8 10Z" fill="white" opacity="0.4"/>
                    </svg>`);

  // Cloud Lightning
  html = html.replace(`<i data-lucide="cloud-lightning" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 10C19.8 10 20.6 10.3 21.2 10.8C22.3 11.7 23 13 23 14.5C23 17 21 19 18.5 19H7.5C4.5 19 2 16.5 2 13.5C2 10.8 4 8.5 6.7 8.1C7.4 5.2 10 3 13 3C16.4 3 19.2 5.5 19.7 8.8C19.5 8.8 19.2 8.8 19 8.8" stroke="white" stroke-width="2" stroke-linecap="round" fill="white" fill-opacity="0.2"/>
                      <path d="M13 14.5L10.5 19.5H13.5L11 23.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`);

  // Message Square
  html = html.replace(`<i data-lucide="message-square" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 6 3H19C20.1046 3 21 3.89543 21 5V15Z" stroke="white" stroke-width="2" fill="white" fill-opacity="0.2"/>
                      <line x1="7" y1="8" x2="17" y2="8" stroke="white" stroke-width="2" stroke-linecap="round"/>
                      <line x1="7" y1="12" x2="13" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>`);

  // Sliders
  html = html.replace(`<i data-lucide="sliders" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="4" y1="21" x2="4" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <line x1="4" y1="10" x2="4" y2="3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="4" cy="12" r="2.5" fill="white"/>
                      <line x1="12" y1="21" x2="12" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <line x1="12" y1="8" x2="12" y2="3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="12" cy="10" r="2.5" fill="white"/>
                      <line x1="20" y1="21" x2="20" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <line x1="20" y1="12" x2="20" y2="3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="20" cy="14" r="2.5" fill="white"/>
                    </svg>`);

  // Trophy
  html = html.replace(`<i data-lucide="trophy" class="w-4 h-4"></i>`, `<svg class="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9H4.5C3.12 9 2 7.88 2 6.5C2 5.12 3.12 4 4.5 4H6V9Z" stroke="white" stroke-width="1.5" fill="white" fill-opacity="0.1"/>
                      <path d="M18 9H19.5C20.88 9 22 7.88 22 6.5C22 5.12 20.88 4 19.5 4H18V9Z" stroke="white" stroke-width="1.5" fill="white" fill-opacity="0.1"/>
                      <path d="M6 2H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V2Z" fill="white"/>
                      <path d="M12 16V22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M8 22H16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>`);

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(indexFile, html, 'utf8');
  console.log("Updated highlights and poll selector icons in index.html!");
}

// 3. UPDATE THE KANBAN MODAL HEADER ICON IN WALL.HTML
if (fs.existsSync(wallFile)) {
  let html = fs.readFileSync(wallFile, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  const kanbanModalTarget = `<i data-lucide="layout-grid" class="w-8 h-8"></i>`;
  const kanbanModalReplacement = `<svg class="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad-modal-kanban" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#d8b4fe" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="5" height="18" rx="1.5" stroke="url(#grad-modal-kanban)" stroke-width="2" fill="url(#grad-modal-kanban)" fill-opacity="0.25"/>
            <rect x="9.5" y="3" width="5" height="18" rx="1.5" stroke="url(#grad-modal-kanban)" stroke-width="2" fill="url(#grad-modal-kanban)" fill-opacity="0.25"/>
            <rect x="16" y="3" width="5" height="18" rx="1.5" stroke="url(#grad-modal-kanban)" stroke-width="2" fill="url(#grad-modal-kanban)" fill-opacity="0.25"/>
            <rect x="4" y="5" width="3" height="4" rx="1" fill="url(#grad-modal-kanban)"/>
            <rect x="10.5" y="5" width="3" height="6" rx="1" fill="url(#grad-modal-kanban)"/>
            <rect x="17" y="5" width="3" height="5" rx="1" fill="url(#grad-modal-kanban)"/>
          </svg>`;

  if (html.includes(kanbanModalTarget)) {
    html = html.replace(kanbanModalTarget, kanbanModalReplacement);
    console.log("Updated Kanban Board creation modal header icon in wall.html!");
  } else {
    console.log("Warning: Kanban modal header icon not found in wall.html");
  }

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(wallFile, html, 'utf8');
}

console.log("Replacement operations completed successfully!");
