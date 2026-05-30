const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
let html = fs.readFileSync(filepath, 'utf8');

// Step 1: Add setting tab icon in Desktop Navbar (#header-nav)
const oldDesktopNav = `<nav class="hidden lg:flex gap-1.5 max-lg:!hidden" id="header-nav">
          <a href="#shortener-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer active" id="nav-item-shortener" title="단축주소 및 통계">
            <i data-lucide="link-2" class="w-5 h-5"></i>
          </a>
          <a href="#polls-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer" id="nav-item-polls" title="실시간 설문 광장">
            <i data-lucide="vote" class="w-5 h-5"></i>
          </a>
          <a href="#classroom-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer" id="nav-item-classroom" title="으쓱점수 학급 대시보드">
            <i data-lucide="award" class="w-5 h-5"></i>
          </a>
        </nav>`;

const newDesktopNav = `<nav class="hidden lg:flex gap-1.5 max-lg:!hidden" id="header-nav">
          <a href="#shortener-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer active" id="nav-item-shortener" title="단축주소 및 통계">
            <i data-lucide="link-2" class="w-5 h-5"></i>
          </a>
          <a href="#polls-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer" id="nav-item-polls" title="실시간 설문 광장">
            <i data-lucide="vote" class="w-5 h-5"></i>
          </a>
          <a href="#classroom-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer" id="nav-item-classroom" title="으쓱점수 학급 대시보드">
            <i data-lucide="award" class="w-5 h-5"></i>
          </a>
          <a href="#settings-section" class="w-10 h-10 border-2 border-white rounded-xl bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat flex items-center justify-center cursor-pointer" id="nav-item-settings" title="통합 설정 및 관리 패널">
            <i data-lucide="settings" class="w-5 h-5"></i>
          </a>
        </nav>`;

if (html.includes(oldDesktopNav)) {
  html = html.replace(oldDesktopNav, newDesktopNav);
  console.log("Desktop Navbar updated!");
} else {
  console.log("Desktop Navbar not found!");
}

// Step 2: Add setting tab icon in Mobile Navbar (#mobile-nav-member-group)
const oldMobileNav = `<div id="mobile-nav-member-group" class="hidden flex justify-around items-center w-full">
      <a href="#shortener-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-shortener-member">
        <i data-lucide="link-2" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">단축주소</span>
      </a>
      <a href="#polls-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-polls-member">
        <i data-lucide="vote" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">설문</span>
      </a>
      <a href="#classroom-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-classroom">
        <i data-lucide="award" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">으쓱점수</span>
      </a>
    </div>`;

const newMobileNav = `<div id="mobile-nav-member-group" class="hidden flex justify-around items-center w-full">
      <a href="#shortener-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-shortener-member">
        <i data-lucide="link-2" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">단축주소</span>
      </a>
      <a href="#polls-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-polls-member">
        <i data-lucide="vote" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">설문</span>
      </a>
      <a href="#classroom-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-classroom">
        <i data-lucide="award" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">으쓱점수</span>
      </a>
      <a href="#settings-section" class="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" id="mobile-nav-settings">
        <i data-lucide="settings" class="w-5 h-5"></i>
        <span class="text-[9px] font-black">설정</span>
      </a>
    </div>`;

if (html.includes(oldMobileNav)) {
  html = html.replace(oldMobileNav, newMobileNav);
  console.log("Mobile Navbar updated!");
} else {
  console.log("Mobile Navbar not found!");
}

// Step 3: Remove 모든 대시보드 리스트 청소 button from dashboard-section
const oldDashboardHeader = `<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 w-full">
          <div class="text-left">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="bar-chart-2" class="text-clay-sky"></i>
              <span>단축 링크 통계 대시보드</span>
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-1">내가 생성한 단축 코드들의 클릭 수 추이를 실시간 감시합니다.</p>
          </div>
          
          <button class="btn px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer" id="btn-clear-history">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span>모든 대시보드 리스트 청소</span>
          </button>
        </div>`;

const newDashboardHeader = `<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 w-full">
          <div class="text-left">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="bar-chart-2" class="text-clay-sky"></i>
              <span>단축 링크 통계 대시보드</span>
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-1">내가 생성한 단축 코드들의 클릭 수 추이를 실시간 감시합니다.</p>
          </div>
        </div>`;

if (html.includes(oldDashboardHeader)) {
  html = html.replace(oldDashboardHeader, newDashboardHeader);
  console.log("Dashboard cleanup button removed!");
} else {
  console.log("Dashboard cleanup button not found!");
}

// Step 4: Remove 학급 설정 subtab from classroom menu bar inside eusseuk-section
const oldClassroomSubtabBar = `<div class="flex gap-2 text-xs font-black border-b-2 border-slate-200 dark:border-white/10 pb-3 mb-6 w-full text-left flex-wrap">
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat active" id="btn-classroom-subtab-dash">
            <i data-lucide="layout-dashboard" class="w-4 h-4 inline-block mr-1"></i> 대시보드
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-gradebook">
            <i data-lucide="clipboard-list" class="w-4 h-4 inline-block mr-1"></i> 학생 명렬표
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-thermometer">
            <i data-lucide="thermometer" class="w-4 h-4 inline-block mr-1"></i> 학급 온도계
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-settings">
            <i data-lucide="settings" class="w-4 h-4 inline-block mr-1"></i> 학급 설정
          </button>
        </div>`;

const newClassroomSubtabBar = `<div class="flex gap-2 text-xs font-black border-b-2 border-slate-200 dark:border-white/10 pb-3 mb-6 w-full text-left flex-wrap">
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat active" id="btn-classroom-subtab-dash">
            <i data-lucide="layout-dashboard" class="w-4 h-4 inline-block mr-1"></i> 대시보드
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-gradebook">
            <i data-lucide="clipboard-list" class="w-4 h-4 inline-block mr-1"></i> 학생 명렬표
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-thermometer">
            <i data-lucide="thermometer" class="w-4 h-4 inline-block mr-1"></i> 학급 온도계
          </button>
        </div>`;

if (html.includes(oldClassroomSubtabBar)) {
  html = html.replace(oldClassroomSubtabBar, newClassroomSubtabBar);
  console.log("Classroom subtab settings button removed!");
} else {
  console.log("Classroom subtab settings button not found!");
}

fs.writeFileSync(filepath, html, 'utf8');
console.log("Part 1: HTML navbar and layout updates successful!");
