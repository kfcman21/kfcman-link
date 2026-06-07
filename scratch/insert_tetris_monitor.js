const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('public/index.html');
let content = fs.readFileSync(targetPath, 'utf8');

const targetText = `<span class="text-xs font-black text-slate-900 dark:text-white truncate" id="monitor-uptime-val">0일 0시간</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-left">`;

const replacementText = `<span class="text-xs font-black text-slate-900 dark:text-white truncate" id="monitor-uptime-val">0일 0시간</span>
            </div>
          </div>
        </div>

        <!-- OCI Tetris Monitor Resource Grid -->
        <div class="text-left border-b-2 border-dashed border-slate-200 dark:border-white/10 pb-2 mb-4">
          <h3 class="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <i data-lucide="gamepad-2" class="text-clay-purple w-4 h-4"></i>
            오라클 클라우드 테트리스 서버 운영 현황
          </h3>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Active Players -->
          <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-4 shadow-clay-flat flex items-center gap-3 clay-card">
            <div class="w-10 h-10 rounded-xl border-2 border-white bg-clay-purple text-white flex items-center justify-center"><i data-lucide="users" class="w-5 h-5"></i></div>
            <div class="text-left">
              <span class="text-[9px] font-black text-slate-400 block">실시간 참가자 수</span>
              <span class="text-base font-black text-slate-900 dark:text-white" id="monitor-tetris-players">0명</span>
            </div>
          </div>
          <!-- Spectators -->
          <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-4 shadow-clay-flat flex items-center gap-3 clay-card">
            <div class="w-10 h-10 rounded-xl border-2 border-white bg-clay-sky text-white flex items-center justify-center"><i data-lucide="eye" class="w-5 h-5"></i></div>
            <div class="text-left">
              <span class="text-[9px] font-black text-slate-400 block">실시간 관전자 수</span>
              <span class="text-base font-black text-slate-900 dark:text-white" id="monitor-tetris-spectators">0명</span>
            </div>
          </div>
          <!-- Sockets Connected -->
          <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-4 shadow-clay-flat flex items-center gap-3 clay-card">
            <div class="w-10 h-10 rounded-xl border-2 border-white bg-clay-toy text-black flex items-center justify-center"><i data-lucide="activity" class="w-5 h-5"></i></div>
            <div class="text-left">
              <span class="text-[9px] font-black text-slate-400 block">총 활성 소켓 연결 수</span>
              <span class="text-base font-black text-slate-900 dark:text-white" id="monitor-tetris-sockets">0개</span>
            </div>
          </div>
          <!-- Game State -->
          <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-4 shadow-clay-flat flex items-center gap-3 clay-card">
            <div class="w-10 h-10 rounded-xl border-2 border-white bg-clay-grass text-black flex items-center justify-center"><i data-lucide="play-circle" class="w-5 h-5"></i></div>
            <div class="text-left font-sans">
              <span class="text-[9px] font-black text-slate-400 block">현재 대결 상태</span>
              <span class="text-xs font-black text-slate-900 dark:text-white truncate" id="monitor-tetris-state">대기실 (lobby)</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-left">`;

// Let's normalize newlines to make sure it matches
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetText.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const newContent = normalizedContent.replace(normalizedTarget, replacementText.replace(/\r\n/g, '\n'));
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log('Successfully inserted Tetris stats monitor grid into index.html');
} else {
  console.error('Target text not found in index.html');
}
