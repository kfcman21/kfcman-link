const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
let html = fs.readFileSync(filepath, 'utf8');

// 1. Find the start and end index of admin-approval-section
const adminStartTag = '<section class="dashboard-section scroll-mt-24 border-t-4 border-dashed border-white/20 pt-10 hidden" id="admin-approval-section">';
const adminStartIdx = html.indexOf(adminStartTag);
if (adminStartIdx === -1) {
  console.log("Could not find admin-approval-section!");
  process.exit(1);
}

// Find the closing </section> for admin-approval-section (which is followed by polls-section or similar)
const pollsSectionTag = '<!-- 4. Preference Polls System Section -->';
const adminEndIdx = html.indexOf(pollsSectionTag);

if (adminEndIdx === -1) {
  console.log("Could not find polls-section tag!");
  process.exit(1);
}

// Extract the inner HTML of the admin approval section (system monitors, approvals tables, notifications)
const adminApprovalSectionHTML = html.substring(adminStartIdx, adminEndIdx).trim();

// Remove the admin-approval-section from its original spot
html = html.substring(0, adminStartIdx) + html.substring(adminEndIdx);
console.log("Extracted and removed admin-approval-section from old spot!");

// 2. Find and extract the classroom-settings-section we inserted earlier
const settingsStartTag = '<!-- SUB-VIEW 4: Classroom Settings View -->';
const settingsStartIdx = html.indexOf(settingsStartTag);

if (settingsStartIdx === -1) {
  console.log("Could not find SUB-VIEW 4: Classroom Settings View!");
  process.exit(1);
}

// Find where it ends (which is followed by the closing </section> of eusseuk-section, or </main>)
const eusseukEndTag = '</section>\n\n    </div>\n\n  </main>';
const settingsEndIdx = html.indexOf(eusseukEndTag);

if (settingsEndIdx === -1) {
  console.log("Could not find closing of eusseuk-section!");
  process.exit(1);
}

// Extract the classroom settings HTML
const classroomSettingsHTML = html.substring(settingsStartIdx, settingsEndIdx).trim();

// Remove the classroom settings section from inside eusseuk-section
html = html.substring(0, settingsStartIdx) + html.substring(settingsEndIdx);
console.log("Extracted and removed classroom-settings-section from old spot!");

// 3. Now let's build the brand new `#settings-section` block!
// Inside the admin approval section, we want to extract the visual cards so they can fit as sub-tab views.
// Wait, we can just pack the raw admin approval card directly into `#settings-subview-admin`!
// And the classroom settings directly into `#settings-subview-classroom`!
// And for `#settings-subview-shortcut` we will place the `모든 대시보드 리스트 청소` button there!

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
             ${classroomSettingsHTML}
          </div>

        </div>
      </section>`;

// Insert the new settings-section right before the closing eusseukEndTag index (which is currently the end of the member content container)
const memberEndTag = '</section>\n\n    </div>\n\n  </main>';
const memberEndIdx = html.indexOf(memberEndTag);

if (memberEndIdx === -1) {
  console.log("Could not find closing of member content!");
  process.exit(1);
}

const finalHtml = html.substring(0, memberEndIdx) + '\n\n' + settingsSectionHTML + '\n\n' + html.substring(memberEndIdx);
fs.writeFileSync(filepath, finalHtml, 'utf8');
console.log("Part 2: Settings section built and merged into index.html successfully!");
