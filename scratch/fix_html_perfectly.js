const fs = require('fs');

// Restore public/index.html from clean www/index.html
fs.copyFileSync('www/index.html', 'public/index.html');
console.log("Restored public/index.html from www/index.html");

let html = fs.readFileSync('public/index.html', 'utf8');

// Normalize CRLF to LF for robust matching
html = html.replace(/\r\n/g, '\n');

// 1. Locate and extract classroom settings view
const startTag = '<!-- SUB-VIEW 4: Classroom Settings View -->';
const startIdx = html.indexOf(startTag);

const endTerm = `document.documentElement.style.fontSize='18.5px'; showToast('글자 크기 변경', '대형 TV용 확대 폰트 스케일(18.5px)이 적용되었습니다.', 'success')">크게 보기 (18.5px)</button>
              </div>
            </div>
          </div>
        </div>
      </section>`;

const endIdx = html.indexOf(endTerm);

if (startIdx === -1 || endIdx === -1) {
  console.log("Error: could not locate classroom settings bounds!");
  process.exit(1);
}

const classroomSettingsHTML = html.substring(startIdx, endIdx + endTerm.length).trim();

// 2. Build the brand new `#settings-section` block!
// Inside `#settings-subview-admin` we place the `#admin-approval-section` which is already in the HTML.
const adminStartTag = '<!-- 5. Administrator Control Center Section -->';
const adminStartIdx = html.indexOf(adminStartTag);
const adminEndTag = '<!-- 6. Eusseuk Points Classroom Module (Parent Section) -->';
const adminEndIdx = html.indexOf(adminEndTag);

if (adminStartIdx === -1 || adminEndIdx === -1) {
  console.log("Error: could not find admin-approval-section bounds!");
  process.exit(1);
}

const adminApprovalSectionHTML = html.substring(adminStartIdx, adminEndIdx).trim();

// 3. Now let's perform a single replace that deletes eusseuk settings and admin approval section, and closes everything perfectly!
// We will replace from adminStartIdx to end of Eusseuk settings section!
// Wait! adminStartIdx is BEFORE eusseuk section.
// So let's delete them separately.
// First, delete admin approval section:
html = html.substring(0, adminStartIdx) + html.substring(adminEndIdx);
console.log("Deleted admin-approval-section from old spot.");

// Now locate the classroom settings start and end again in the new html
const newStartIdx = html.indexOf(startTag);
const newEndIdx = html.indexOf(endTerm);

if (newStartIdx === -1 || newEndIdx === -1) {
  console.log("Error: could not locate classroom settings in new html!");
  process.exit(1);
}

// We will replace classroom settings view with the correct closing tags of eusseuk-section!
// And then place settings-section!
// And then close member-content and main!
// The eusseuk-section needs to be closed with </section>.
// The member-content needs to be closed with </div>.
// The main needs to be closed with </main>.

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
             ${adminApprovalSectionHTML.replace('class="dashboard-section hidden" id="admin-approval-section"', 'class="space-y-8" id="admin-approval-section"')}
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
             ${classroomSettingsHTML}
          </div>

        </div>
      </section>`;

// Replace eusseuk settings view with eusseuk section closer, then settings-section, then member content closer
const replacementBlock = `</section>\n\n      ${settingsSectionHTML}\n\n    </div>\n  </main>`;

// Find where to slice (from newStartIdx to the end of the member container in clean HTML).
// The clean HTML closing sequence is right after endTerm:
// \n\n    </div>\n\n  </main>\n          </div>\n\n        </div>\n      </section>
const modalsIdx = html.indexOf('<!-- ==================== MODALS LISTS ==================== -->');

if (modalsIdx === -1) {
  console.log("Error: could not find modals index!");
  process.exit(1);
}

html = html.substring(0, newStartIdx) + replacementBlock + '\n\n      ' + html.substring(modalsIdx);
console.log("HTML successfully restructured with perfect structural tag safety!");

// 4. Add Settings Tab in Desktop Navbar
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

html = html.replace(oldDesktopNav, newDesktopNav);

// 5. Add Settings Tab in Mobile Navbar
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

html = html.replace(oldMobileNav, newMobileNav);

// 6. Remove 모든 대시보드 리스트 청소 button from dashboard-section header
const oldDashboardHeader = `          <button class="btn px-4 py-2.5 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer" id="btn-clear-history">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span>모든 대시보드 리스트 청소</span>
          </button>`;

html = html.replace(oldDashboardHeader, "");

// 7. Remove 학급 설정 subtab button from eusseuk subtabs
const oldClassroomSubtab = `          <button type="button" class="px-4 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-classroom-subtab-settings">
            <i data-lucide="settings" class="w-4 h-4 inline-block mr-1"></i> 학급 설정
          </button>`;

html = html.replace(oldClassroomSubtab, "");

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("HTML Restructured Perfectly! Final size:", html.length);
