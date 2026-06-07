const fs = require('fs');

const filePath = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html';
let html = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
const isCrlf = html.includes('\r\n');
html = html.replace(/\r\n/g, '\n');

const targetStr = `                 </div>
               </div>
             </div>

             <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card text-left space-y-4">`;

const cardHtml = `                 </div>
               </div>
             </div>

             <!-- Theme Configuration Card -->
             <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card text-left space-y-4 mb-6">
               <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><i data-lucide="palette" class="w-4 h-4 text-clay-purple"></i> 화면 테마 설정 (Theme Settings)</h4>
               <p class="text-xs text-slate-400 leading-normal">
                 서비스의 화면 테마를 라이트 모드 또는 다크 모드로 변경합니다. 데스크톱과 모바일 장치 모두 동기화되어 즉시 적용됩니다.
               </p>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <!-- Light Mode Option -->
                 <label class="border-2 border-white rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all shadow-sm">
                   <div class="flex items-center gap-3">
                     <div class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center"><i data-lucide="sun" class="w-4.5 h-4.5"></i></div>
                     <span class="text-xs font-black text-slate-800 dark:text-slate-200">라이트 모드 (Light)</span>
                   </div>
                   <input type="radio" name="theme-preference" value="light" class="w-4.5 h-4.5 accent-clay-purple cursor-pointer">
                 </label>
                 
                 <!-- Dark Mode Option -->
                 <label class="border-2 border-white rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all shadow-sm">
                   <div class="flex items-center gap-3">
                     <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><i data-lucide="moon" class="w-4.5 h-4.5"></i></div>
                     <span class="text-xs font-black text-slate-800 dark:text-slate-200">다크 모드 (Dark)</span>
                   </div>
                   <input type="radio" name="theme-preference" value="dark" class="w-4.5 h-4.5 accent-clay-purple cursor-pointer">
                 </label>
               </div>
             </div>

             <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card text-left space-y-4">`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, cardHtml);
  // Restore CRLF if it was original
  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log("Successfully injected theme settings card into index.html!");
} else {
  console.log("Error: targetStr not found in index.html!");
}
