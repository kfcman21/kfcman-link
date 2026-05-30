const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
let content = fs.readFileSync(filepath, 'utf8');

const targetContent = `        <!-- SUB-VIEW 3: Class Thermometer Settings View -->
        <div class="thermometer-section hidden" id="thermometer-section">
          <div class="text-left mb-6">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-10 h-10 rounded-xl border-2 border-white bg-clay-purple text-white flex items-center justify-center shadow-clay-flat"><i data-lucide="thermometer" class="w-5 h-5"></i></span>
              <span>학급 온도계 상세 설정</span>
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-2">전체 학생 점수 합계 ÷ 200 = 우리 반의 따뜻한 온도</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <!-- Thermometer Visualization Card -->
            <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat-lg clay-card text-center flex flex-col justify-between">
              <div class="flex items-center justify-center gap-6 py-4">
                <!-- Thermometer Bulb & Tube -->
                <div class="relative w-20 h-64 flex flex-col items-center">
                  <div class="w-8 h-48 border-4 border-white bg-slate-100 dark:bg-slate-950/40 rounded-full relative overflow-hidden flex flex-col justify-end shadow-inner">
                    <div id="thermometer-mercury-detail" class="w-full bg-gradient-to-t from-clay-sky to-clay-grass rounded-b-full transition-all duration-1000 ease-out" style="height: 0%;"></div>
                  </div>
                  <div class="w-14 h-14 border-4 border-white bg-gradient-to-tr from-clay-sky to-clay-grass rounded-full -mt-4 shadow-lg flex items-center justify-center relative z-10">
                    <div class="w-6 h-6 bg-white/20 rounded-full animate-ping absolute"></div>
                  </div>
                </div>
                
                <div class="text-left space-y-2">
            <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-5 shadow-clay-flat clay-card space-y-3">
              <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-clay-purple inline-block"></span> 학급 온도계 환산 규칙</h4>
              <p class="text-[10px] font-bold text-slate-400 leading-normal">
                전체 학생의 누적 원점수 합한 값을 몇으로 나누어 학급 온도(°)로 표시할지 정합니다. (현재 <span class="text-clay-purple font-black" id="rule-current-temp-label">합계 ÷ 200</span>)
              </p>
              <div class="flex gap-2 max-w-sm" id="rules-temp-dividers">
                <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer active" data-div="200">÷ 200</button>
                <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="100">÷ 100</button>
                <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="300">÷ 300</button>
                <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="500">÷ 500</button>
                <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="1000">÷ 1000</button>
              </div>
              <form id="divider-custom-form" class="flex gap-2.5 max-w-sm items-end pt-2">
                <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3 py-1.5 shadow-clay-flat">
                  <input type="number" id="custom-divider-val" min="1" placeholder="200" class="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white">
                </div>
                <button type="submit" class="btn px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-grass hover:bg-teal-400 text-black shadow-clay-flat cursor-pointer h-[32px] active:scale-95">저장</button>
              </form>
            </div>
          </div>

          <!-- Subtab 3: Font / Size card (Simple Premium Mockup) -->
          <div id="settings-fontsize-card" class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-5 shadow-clay-flat clay-card space-y-4 hidden">
            <h4 class="text-sm font-black text-slate-950 dark:text-white">학급 전광판 글자 크기 조정</h4>
            <p class="text-[10px] font-bold text-slate-400 leading-normal">
              이 기능은 원격 전광판(대시보드 모니터) 송출 시 뷰어의 텍스트와 레이아웃 스케일을 조율합니다.
            </p>
            <div class="flex gap-3">
              <button type="button" class="px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-sand text-slate-800 shadow-clay-flat cursor-pointer active:scale-95" onclick="document.documentElement.style.fontSize='16px'; showToast('글자 크기 변경', '표준 폰트 스케일(16px)이 적용되었습니다.', 'info')">기본 크기 (16px)</button>
              <button type="button" class="px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-grass text-black shadow-clay-flat cursor-pointer active:scale-95" onclick="document.documentElement.style.fontSize='18.5px'; showToast('글자 크기 변경', '대형 TV용 확대 폰트 스케일(18.5px)이 적용되었습니다.', 'success')">크게 보기 (18.5px)</button>
            </div>
          </div>
        </div>`;

const replacementContent = `        <!-- SUB-VIEW 3: Class Thermometer Settings View -->
        <div class="thermometer-section hidden" id="thermometer-section">
          <div class="text-left mb-6">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-10 h-10 rounded-xl border-2 border-white bg-clay-purple text-white flex items-center justify-center shadow-clay-flat"><i data-lucide="thermometer" class="w-5 h-5"></i></span>
              <span>학급 온도계 상세 설정</span>
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-2">전체 학생 점수 합계 ÷ 200 = 우리 반의 따뜻한 온도</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            <!-- Left: Thermometer Visualization Card -->
            <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat-lg clay-card text-center flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b-2 border-slate-100 dark:border-white/10 pb-3 mb-4">
                  <span class="text-sm font-black text-slate-950 dark:text-white">학급 온도계</span>
                  <span class="text-[10px] font-black text-slate-400">실시간 스케일</span>
                </div>

                <div class="flex items-center justify-center gap-6 py-4">
                  <div class="relative w-20 h-64 flex flex-col items-center">
                    <div class="w-8 h-48 border-4 border-white bg-slate-100 dark:bg-slate-950/40 rounded-full relative overflow-hidden flex flex-col justify-end shadow-inner">
                      <div id="thermometer-mercury-detail" class="w-full bg-gradient-to-t from-clay-sky to-clay-grass rounded-b-full transition-all duration-1000 ease-out" style="height: 0%;"></div>
                    </div>
                    <div class="w-14 h-14 border-4 border-white bg-gradient-to-tr from-clay-sky to-clay-grass rounded-full -mt-4 shadow-lg flex items-center justify-center relative z-10">
                      <div class="w-6 h-6 bg-white/20 rounded-full animate-ping absolute"></div>
                    </div>
                  </div>
                  
                  <div class="text-left space-y-2">
                    <div class="text-5xl font-black text-clay-sky dark:text-clay-mint leading-none font-sans" id="detail-temp-val">0.0°</div>
                    <div class="text-xs font-black text-slate-500">학급 온도</div>
                    <div class="text-[10px] font-bold text-slate-400 mt-3" id="detail-remaining-miles">
                      목표 달성까지<br>
                      점수가 필요합니다
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick stats list inside visualization card -->
              <div class="bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-2xl p-4 text-left mt-4 text-[10px] font-bold text-slate-400 space-y-1">
                <div>누적 원점수: <span id="detail-stat-total-raw" class="text-slate-800 dark:text-white font-black">0점</span></div>
                <div>지급 완료 점수: <span id="detail-stat-total-paid" class="text-slate-800 dark:text-white font-black">0점</span></div>
                <div>지급 대기 점수: <span id="detail-stat-total-unpaid" class="text-slate-800 dark:text-white font-black">0점</span></div>
                <div>등록 학생 수: <span id="detail-stat-students-count" class="text-slate-800 dark:text-white font-black">0명</span></div>
              </div>
            </div>

            <!-- Middle: Milestones List Container Card -->
            <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat-lg clay-card flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b-2 border-slate-100 dark:border-white/10 pb-3 mb-4">
                  <span class="text-sm font-black text-slate-950 dark:text-white">학급 목표 (Milestones)</span>
                  <span class="text-[10px] font-black text-slate-400">온도별 보상</span>
                </div>
                <div class="space-y-3 max-h-80 overflow-y-auto pr-1" id="milestones-list-container">
                  <!-- Milestones dynamically populated -->
                </div>
              </div>
            </div>

            <!-- Right: Add Milestone Form Card -->
            <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat-lg clay-card flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b-2 border-slate-100 dark:border-white/10 pb-3 mb-4">
                  <span class="text-sm font-black text-slate-950 dark:text-white">목표 보상 추가</span>
                  <span class="text-[10px] font-black text-slate-400">신규 추가</span>
                </div>
                <form id="add-milestone-form" class="space-y-4 text-left">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-black text-slate-600 dark:text-slate-300">목표 달성 온도 (°)</label>
                    <div class="flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3.5 py-2 shadow-clay-flat">
                      <input type="number" step="0.1" id="milestone-temp-input" min="0.1" placeholder="예: 36.5" required class="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white">
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-black text-slate-600 dark:text-slate-300">보상/활동 내용</label>
                    <div class="flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3.5 py-2 shadow-clay-flat">
                      <input type="text" id="milestone-activity-input" placeholder="예: 단체 피구 게임" required class="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white">
                    </div>
                  </div>
                  <button type="submit" class="btn px-4 py-2.5 text-xs font-black border-4 border-white rounded-2xl bg-clay-purple hover:bg-purple-600 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>신규 마일스톤 등록</span>
                  </button>
                </form>
              </div>
              <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-2xl text-[9px] font-bold text-slate-400 leading-normal text-left">
                <i data-lucide="info" class="w-3.5 h-3.5 inline-block mr-1 text-clay-sky"></i>
                등록된 온도가 누적 점수로 계산된 온도에 이르면 목표를 자동으로 달성하게 되며, 대시보드 화면 전광판에 즉시 노출됩니다.
              </div>
            </div>

          </div>
        </div>

        <!-- SUB-VIEW 4: Classroom Settings View -->
        <div class="classroom-settings-section hidden" id="classroom-settings-section">
          <div class="text-left mb-6">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-10 h-10 rounded-xl border-2 border-white bg-clay-purple text-white flex items-center justify-center shadow-clay-flat"><i data-lucide="settings" class="w-5 h-5"></i></span>
              <span>학급 설정 제어판</span>
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-2">학급 운영 규칙, 개인정보 보호 및 폰트 크기를 설정합니다.</p>
          </div>

          <!-- Settings Subtabs -->
          <div class="flex gap-2 text-xs font-black border-b-2 border-slate-200 dark:border-white/10 pb-3 mb-6 w-full text-left flex-wrap">
            <button type="button" class="px-3.5 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat active" id="btn-subtab-privacy">
              <i data-lucide="shield-check" class="w-4 h-4 inline-block mr-1"></i> 개인정보 & 생성
            </button>
            <button type="button" class="px-3.5 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-subtab-rules">
              <i data-lucide="sliders" class="w-4 h-4 inline-block mr-1"></i> 점수 환산 규칙
            </button>
            <button type="button" class="px-3.5 py-2 rounded-xl border-2 border-white bg-clay-sand hover:bg-slate-200 text-slate-800 transition-all shadow-clay-flat" id="btn-subtab-fontsize">
              <i data-lucide="type" class="w-4 h-4 inline-block mr-1"></i> 화면 크기 조정
            </button>
          </div>

          <!-- settings cards -->
          <div class="space-y-6">
            <!-- 1. settings-privacy-card -->
            <div id="settings-privacy-card" class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card space-y-6 text-left">
              <div class="space-y-2">
                <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><i data-lucide="eye-off" class="w-4 h-4 text-clay-purple"></i> 실명 익명화 보호 모드</h4>
                <p class="text-xs text-slate-400">활성화 시, 대시보드 및 전광판에 학생 실명 대신 '번호번 학생'으로 표출하여 학생의 개인정보를 원천 보호합니다.</p>
                <div class="flex items-center gap-3 pt-2">
                  <label class="switch-container relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="chk-name-privacy" class="sr-only">
                    <div class="w-11 h-6 bg-slate-300 dark:bg-slate-850 rounded-full border-2 border-white transition-colors duration-200 focus:outline-none">
                      <div class="switch-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full border border-slate-300 transition-transform duration-200"></div>
                    </div>
                  </label>
                  <span class="text-xs font-black text-slate-800 dark:text-white" id="privacy-status-label">학생 이름 숨김 (익명 번호)</span>
                </div>
              </div>

              <hr class="border-slate-100 dark:border-white/10">

              <div class="space-y-4">
                <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><i data-lucide="users" class="w-4 h-4 text-clay-grass"></i> 번호만으로 학급 일괄 생성</h4>
                <p class="text-xs text-slate-400">기존 학생 데이터를 모두 초기화하고 지정된 범위의 번호 슬롯을 초고속 자동 생성합니다.</p>
                <form id="bulk-generate-settings-form" class="space-y-4 max-w-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="block text-[10px] font-black text-slate-500">생성 학생 수 (명)</label>
                      <input type="number" id="bulk-gen-count" min="1" max="100" placeholder="30" required class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat">
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-[10px] font-black text-slate-500">시작 번호 (번)</label>
                      <input type="number" id="bulk-gen-start" min="1" placeholder="1" required class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat">
                    </div>
                  </div>
                  <button type="submit" class="btn px-4 py-2.5 text-xs font-black border-4 border-white rounded-2xl bg-clay-red hover:bg-red-500 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer w-full">
                    <i data-lucide="refresh-cw" class="w-4 h-4 animate-spin" style="animation-duration: 4s;"></i>
                    <span>기존 목록 일괄 폐기 및 신규 자동 생성</span>
                  </button>
                </form>
              </div>
            </div>

            <!-- 2. settings-rules-card -->
            <div id="settings-rules-card" class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat clay-card space-y-6 text-left hidden">
              <div class="space-y-3">
                <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-clay-sky inline-block"></span> 달성 점수(Achievement) 변환 비율</h4>
                <p class="text-xs text-slate-400">
                  학생들이 획득하는 누적 칭찬(원점수)이 몇 점 누적될 때마다 달성(배지) 1점을 환산할지 정합니다. (현재 <span class="text-clay-sky font-black" id="rule-current-ratio-label">50점 = 달성 1점</span>)
                </p>
                <div class="flex gap-2 max-w-md" id="rules-achievement-ratios">
                  <button type="button" class="btn-ratio flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer active" data-ratio="50">50점</button>
                  <button type="button" class="btn-ratio flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-ratio="30">30점</button>
                  <button type="button" class="btn-ratio flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-ratio="100">100점</button>
                </div>
                <form id="ratio-custom-form" class="flex gap-2.5 max-w-sm items-end pt-2">
                  <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3 py-1.5 shadow-clay-flat">
                    <input type="number" id="custom-ratio-val" min="1" placeholder="50" class="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white">
                  </div>
                  <button type="submit" class="btn px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-grass hover:bg-teal-400 text-black shadow-clay-flat cursor-pointer h-[32px]">저장</button>
                </form>
              </div>

              <hr class="border-slate-100 dark:border-white/10">

              <div class="space-y-3">
                <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-clay-purple inline-block"></span> 학급 온도계 환산 규칙</h4>
                <p class="text-xs text-slate-400">
                  전체 학생의 누적 원점수 합한 값을 몇으로 나누어 학급 온도(°)로 표시할지 정합니다. (현재 <span class="text-clay-purple font-black" id="rule-current-temp-label">합계 ÷ 200</span>)
                </p>
                <div class="flex gap-2 max-w-sm" id="rules-temp-dividers">
                  <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer active" data-div="200">÷ 200</button>
                  <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="100">÷ 100</button>
                  <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="300">÷ 300</button>
                  <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="500">÷ 500</button>
                  <button type="button" class="btn-divider flex-1 py-1.5 border-2 border-white rounded-lg bg-clay-sand text-slate-800 text-xs font-black shadow-clay-flat cursor-pointer" data-div="1000">÷ 1000</button>
                </div>
                <form id="divider-custom-form" class="flex gap-2.5 max-w-sm items-end pt-2">
                  <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-3 py-1.5 shadow-clay-flat">
                    <input type="number" id="custom-divider-val" min="1" placeholder="200" class="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white">
                  </div>
                  <button type="submit" class="btn px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-grass hover:bg-teal-400 text-black shadow-clay-flat cursor-pointer h-[32px]">저장</button>
                </form>
              </div>
            </div>

            <!-- 3. settings-fontsize-card (Moved here) -->
            <div id="settings-fontsize-card" class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-5 shadow-clay-flat clay-card space-y-4 hidden text-left">
              <h4 class="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5"><i data-lucide="type" class="w-4 h-4 text-clay-toy"></i> 학급 전광판 글자 크기 조정</h4>
              <p class="text-xs text-slate-400 leading-normal">
                이 기능은 원격 전광판(대시보드 모니터) 송출 시 뷰어의 텍스트와 레이아웃 스케일을 조율합니다.
              </p>
              <div class="flex gap-3">
                <button type="button" class="px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-sand text-slate-800 shadow-clay-flat cursor-pointer active:scale-95" onclick="document.documentElement.style.fontSize='16px'; showToast('글자 크기 변경', '표준 폰트 스케일(16px)이 적용되었습니다.', 'info')">기본 크기 (16px)</button>
                <button type="button" class="px-4 py-2 text-xs font-black border-2 border-white rounded-xl bg-clay-grass text-black shadow-clay-flat cursor-pointer active:scale-95" onclick="document.documentElement.style.fontSize='18.5px'; showToast('글자 크기 변경', '대형 TV용 확대 폰트 스케일(18.5px)이 적용되었습니다.', 'success')">크게 보기 (18.5px)</button>
              </div>
            </div>
          </div>
        </div>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("REPLACED THERMOMETER AND SETTINGS SECTIONS SUCCESSFULLY!");
} else {
  // Let's do a fallback replacement using index.html line numbers or standard sub-string matching
  console.log("EXACT MATCH NOT FOUND. Performing fallback replacement.");
  // Find where id="thermometer-section" starts
  const startIdx = content.indexOf('<div class="thermometer-section hidden" id="thermometer-section">');
  // Find the closing </div> for thermometer-section
  const endMarker = '<!-- ==================== MODALS LISTS ==================== -->';
  const endIdx = content.indexOf(endMarker);
  
  if (startIdx !== -1 && endIdx !== -1) {
    // We want to replace from startIdx to just before endIdx (excluding space/comments before endMarker)
    const beforeSection = content.substring(0, startIdx);
    const afterSection = content.substring(endIdx);
    
    // We also need to keep the closing </section> for eusseuk-section
    const finalContent = beforeSection + replacementContent + '\n      </section>\n\n    </div>\n\n  </main>\n\n  ' + afterSection;
    fs.writeFileSync(filepath, finalContent, 'utf8');
    console.log("FALLBACK REPLACED SUCCESSFULLY!");
  } else {
    console.log("Could not find start/end indexes.");
  }
}
