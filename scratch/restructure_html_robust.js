const fs = require('fs');

const filepath = "public/index.html";
let html = fs.readFileSync(filepath, 'utf8');

console.log("Original HTML size:", html.length);

// 1. Desktop Nav Update
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
  console.log("Desktop Navbar updated successfully!");
} else {
  console.log("Desktop Navbar update skipped or already modified!");
}

// 2. Mobile Nav Update
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
  console.log("Mobile Navbar updated successfully!");
} else {
  console.log("Mobile Navbar update skipped or already modified!");
}

// 3. Remove 모든 대시보드 리스트 청소 button from dashboard-section header
const oldDashboardHeader = `          <button class="btn px-4 py-2.5 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer" id="btn-clear-history">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span>모든 대시보드 리스트 청소</span>
          </button>`;

if (html.includes(oldDashboardHeader)) {
  html = html.replace(oldDashboardHeader, "");
  console.log("Removed clear history button from dashboard-section header!");
} else {
  // Let's try matching with potential slightly different spacing
  const oldDashboardHeaderAlt = `          <button class="btn px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer" id="btn-clear-history">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span>모든 대시보드 리스트 청소</span>
          </button>`;
  if (html.includes(oldDashboardHeaderAlt)) {
    html = html.replace(oldDashboardHeaderAlt, "");
    console.log("Removed clear history button (alt match)!");
  } else {
    console.log("Clear history button not found or already removed!");
  }
}

// 4. Remove 학급 설정 subtab button from eusseuk subtabs
const oldClassroomSubtab = `          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-settings">
            <i data-lucide="settings" class="w-4 h-4 inline-block mr-1"></i> 학급 설정
          </button>`;

if (html.includes(oldClassroomSubtab)) {
  html = html.replace(oldClassroomSubtab, "");
  console.log("Removed Classroom Settings subtab button!");
} else {
  console.log("Classroom Settings subtab button not found!");
}

// 5. Extract admin-approval-section
const adminStartTag = '<!-- 5. Administrator Control Center Section -->';
const adminStartIdx = html.indexOf(adminStartTag);
const adminEndTag = '<!-- 6. Eusseuk Points Classroom Module (Parent Section) -->';
const adminEndIdx = html.indexOf(adminEndTag);

if (adminStartIdx === -1 || adminEndIdx === -1) {
  console.log("Error: could not find admin-approval-section bounds!");
  process.exit(1);
}

const adminApprovalSectionHTML = html.substring(adminStartIdx, adminEndIdx).trim();
// Remove admin approval section from its old place
html = html.substring(0, adminStartIdx) + html.substring(adminEndIdx);
console.log("Extracted admin-approval-section!");

// 6. Extract classroom-settings-section
const classroomStartTag = '<!-- SUB-VIEW 4: Classroom Settings View -->';
const classroomStartIdx = html.indexOf(classroomStartTag);
const classroomEndTag = '<!-- ==================== MODALS LISTS ==================== -->';
const classroomEndIdx = html.indexOf(classroomEndTag);

if (classroomStartIdx === -1 || classroomEndIdx === -1) {
  console.log("Error: could not find classroom-settings-section bounds!");
  process.exit(1);
}

const classroomSettingsHTML = html.substring(classroomStartIdx, classroomEndIdx).trim();
// Remove classroom settings section from its old place
html = html.substring(0, classroomStartIdx) + html.substring(classroomEndIdx);
console.log("Extracted classroom-settings-section!");

// 7. Build and insert the brand new `#settings-section` block!
// The settings view contains 3 settings sub-views:
//   - #settings-subview-admin (Admin Center)
//   - #settings-subview-shortcut (Shortener & Polls settings)
//   - #settings-subview-classroom (으쓱점수 설정)
// We will insert this unified settings section right before <!-- ==================== MODALS LISTS ==================== --> (which is at the bottom of the member content container)

const settingsSectionHTML = `      <!-- 7. Unified Configuration & Settings Section -->
      <section class="settings-section scroll-mt-24 border-t-4 border-dashed border-white/20 pt-10 hidden" id="settings-section">
        <div class="text-left mb-6">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-10 h-10 rounded-xl border-2 border-white bg-clay-sand dark:bg-[#131824] hover:bg-slate-200 text-slate-800 dark:text-white transition-all shadow-clay-flat flex items-center justify-center cursor-pointer"><i data-lucide="settings" class="w-5 h-5"></i></span>
            <span>통합 설정 제어판</span>
          </h2>
          <p class="text-xs font-bold text-slate-500 mt-2">시스템 리소스 모니터링, 가입 대기열 승인, 다채널 알림 및 서비스별 설정을 관리합니다.</p>
        </div>

        <!-- Settings Sub-Tab Navigation Bar -->
        <div class="flex gap-2 text-xs font-black border-b-2 border-slate-200 dark:border-white/10 pb-3 mb-6 w-full text-left flex-wrap" id="settings-subtabs-bar">
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat hidden" id="btn-settings-subtab-admin">
            <i data-lucide="shield-alert" class="w-4 h-4 inline-block mr-1"></i> 통합 관리자 (Admin Center)
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-settings-subtab-shortcut">
            <i data-lucide="link-2" class="w-4 h-4 inline-block mr-1"></i> 단축 & 설문 설정
          </button>
          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat active" id="btn-settings-subtab-classroom">
            <i data-lucide="award" class="w-4 h-4 inline-block mr-1"></i> 으쓱점수 설정
          </button>
        </div>

        <!-- Settings Cards Container -->
        <div class="space-y-8">
          
          <!-- SUB-TAB VIEW 1: Admin Center (Only visible to admin role) -->
          <div class="space-y-8 hidden" id="settings-subview-admin">
             <!-- 보안 관리자 통제센터, 가입 승인 대기열, 계정 통제, 다채널 알림 등 -->
             ${adminApprovalSectionHTML.replace('class="dashboard-section scroll-mt-24 border-t-4 border-dashed border-white/20 pt-10 hidden" id="admin-approval-section"', 'class="space-y-8" id="admin-approval-section"')}
          </div>

          <!-- SUB-TAB VIEW 2: Shortener & Polls Settings -->
          <div class="space-y-6 hidden" id="settings-subview-shortcut">
             <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card text-left space-y-4">
               <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><i data-lucide="trash-2" class="w-4 h-4 text-clay-red"></i> 단축 링크 데이터 청소</h4>
               <p class="text-xs text-slate-400 leading-normal">
                 대시보드에 축적된 모든 단축 링크 히스토리와 트래킹 방문 클릭 로그를 복구 불가능하게 영구히 소멸시킵니다.
               </p>
               <button class="btn px-4 py-2.5 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer" id="btn-clear-history">
                 <i data-lucide="trash-2" class="w-4 h-4"></i>
                 <span>모든 대시보드 리스트 청소</span>
               </button>
             </div>
          </div>

          <!-- SUB-TAB VIEW 3: Classroom Settings (으쓱점수 설정) -->
          <div class="space-y-6" id="settings-subview-classroom">
             ${classroomSettingsHTML.replace('class="classroom-settings-section hidden" id="classroom-settings-section"', 'class="classroom-settings-section" id="classroom-settings-section"')}
          </div>

        </div>
      </section>\n\n      `;

// Find where to insert settingsSectionHTML (which is right before <!-- ==================== MODALS LISTS ==================== -->)
const insertIdx = html.indexOf('<!-- ==================== MODALS LISTS ==================== -->');
if (insertIdx === -1) {
  console.log("Error: could not find insertion index for settings section!");
  process.exit(1);
}

const finalHtml = html.substring(0, insertIdx) + settingsSectionHTML + html.substring(insertIdx);
fs.writeFileSync(filepath, finalHtml, 'utf8');

console.log("Robust HTML Restructuring Completed successfully! Final HTML size:", finalHtml.length);
