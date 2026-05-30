const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Replace Settings Form
const formStartText = '<form id="notification-settings-form">';
const formEndText = '</form>';
const formStartIndex = content.indexOf(formStartText);
if (formStartIndex !== -1) {
  // Find the closing </form> tag for this specific form
  const formEndIndex = content.indexOf(formEndText, formStartIndex) + formEndText.length;
  
  const newFormMarkup = `<form id="notification-settings-form">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            <!-- 1. Webhook Configuration -->
            <div class="glass-panel p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 dark:bg-slate-900/30 rounded-2xl">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-bold text-slate-100 dark:text-slate-100 flex items-center gap-2">
                  <i data-lucide="slack" class="text-brand-purple w-4.5 h-4.5"></i> 디스코드 / 텔레그램 웹훅
                </h4>
                <label class="switch-container inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="chk-webhook-enabled" class="cursor-pointer w-9 h-4.5 accent-brand-cyan">
                </label>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4 text-left">
                디스코드 또는 텔레그램의 채널 웹훅 URL을 등록하여 모바일 앱 푸시 알림으로 편리하게 실시간 승인 요청을 받습니다. (100% 무료)
              </p>
              <div id="panel-webhook-config" class="hidden animate-fade-in space-y-3">
                <div class="space-y-1.5 text-left">
                  <label class="block text-[11px] font-bold text-slate-400">웹훅 주소 (Webhook URL)</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-brand-cyan/50 focus-within:ring-1 focus-within:ring-brand-cyan/20 transition-all">
                    <i data-lucide="link-2" class="w-4 h-4 text-slate-400"></i>
                    <input type="url" id="txt-webhook-url" placeholder="https://discord.com/api/webhooks/..." autocomplete="off" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Email (SMTP) Configuration -->
            <div class="glass-panel p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 dark:bg-slate-900/30 rounded-2xl">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-bold text-slate-100 dark:text-slate-100 flex items-center gap-2">
                  <i data-lucide="mail" class="text-brand-yellow w-4.5 h-4.5"></i> 이메일 (SMTP) 알림
                </h4>
                <label class="switch-container inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="chk-email-enabled" class="cursor-pointer w-9 h-4.5 accent-brand-cyan">
                </label>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4 text-left">
                Gmail, Naver 등 메일 송신 기능을 활용해 회원가입 신청이 들어올 때마다 지정된 관리자 메일 계정으로 상세 정보를 즉시 전송합니다.
              </p>
              <div id="panel-email-config" class="hidden animate-fade-in space-y-3 text-left">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">SMTP 서버 호스트</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="server" class="w-4 h-4 text-slate-400"></i>
                    <input type="text" id="txt-email-host" placeholder="smtp.gmail.com" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="block text-[11px] font-bold text-slate-400">포트 (Port)</label>
                    <input type="number" id="num-email-port" placeholder="465" class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-cyan/50 focus:outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-[11px] font-bold text-slate-400">보안 SSL/TLS</label>
                    <select id="sel-email-secure" class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-cyan/50 focus:outline-none transition-all cursor-pointer h-[38px] font-semibold">
                      <option value="true" class="bg-slate-950 text-white" selected>SSL (465 권장)</option>
                      <option value="false" class="bg-slate-950 text-white">STARTTLS (587)</option>
                    </select>
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">계정 이메일 주소</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="user" class="w-4 h-4 text-slate-400"></i>
                    <input type="email" id="txt-email-user" placeholder="your_email@gmail.com" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">비밀번호 (SMTP 앱 비밀번호)</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="key-round" class="w-4 h-4 text-slate-400"></i>
                    <input type="password" id="txt-email-pass" placeholder="SMTP 앱 비밀번호" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">알림 수신 이메일 주소</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="mail-check" class="w-4 h-4 text-slate-400"></i>
                    <input type="email" id="txt-email-receiver" placeholder="admin_inbox@domain.com" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. SMS & KakaoTalk (Coolsms) Configuration -->
            <div class="glass-panel p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 dark:bg-slate-900/30 rounded-2xl">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-bold text-slate-100 dark:text-slate-100 flex items-center gap-2">
                  <i data-lucide="message-square" class="text-brand-cyan w-4.5 h-4.5"></i> 문자 & 카카오 알림톡 (Coolsms)
                </h4>
                <label class="switch-container inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="chk-sms-enabled" class="cursor-pointer w-9 h-4.5 accent-brand-cyan">
                </label>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4 text-left">
                Coolsms API를 연동해 관리자 휴대폰 번호로 가입 대기 문자를 보냅니다. 비즈니스 채널이 있는 경우 카카오 알림톡(Alimtalk) 수신도 지원합니다.
              </p>
              <div id="panel-sms-config" class="hidden animate-fade-in space-y-3 text-left">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">Coolsms API Key</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="key" class="w-4 h-4 text-slate-400"></i>
                    <input type="text" id="txt-sms-apikey" placeholder="NCS로 시작하는 API Key" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">Coolsms API Secret</label>
                  <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 gap-2 focus-within:border-brand-cyan/50 transition-all">
                    <i data-lucide="shield-check" class="w-4 h-4 text-slate-400"></i>
                    <input type="password" id="txt-sms-apisecret" placeholder="API Secret Key" class="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="block text-[11px] font-bold text-slate-400">발신 번호 (sender)</label>
                    <input type="text" id="txt-sms-sender" placeholder="01012345678" class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-cyan/50 focus:outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-[11px] font-bold text-slate-400">수신 번호 (receiver)</label>
                    <input type="text" id="txt-sms-receiver" placeholder="01012345678" class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-cyan/50 focus:outline-none transition-all">
                  </div>
                </div>

                <!-- Kakao Alimtalk Checkbox Toggle -->
                <div class="mt-3 p-3 rounded-xl bg-slate-950/60 border border-dashed border-white/5 space-y-2 text-left">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" id="chk-sms-usekakao" class="w-4.5 h-4.5 accent-brand-cyan cursor-pointer">
                    <span class="text-xs font-bold text-slate-200">💬 카카오 알림톡(Alimtalk)으로 받기</span>
                  </label>
                  <p class="text-[10px] text-slate-400 leading-relaxed">
                    * 알림톡 템플릿과 카카오 비즈니스 채널 발신 키가 등록/승인되어 있어야 작동하며, 미충족 시 일반 문자로 자동 백업 전송됩니다.
                  </p>
                  
                  <div id="panel-sms-kakao-details" class="hidden animate-fade-in space-y-2 mt-2">
                    <div class="space-y-1">
                      <label class="block text-[10px] font-bold text-slate-400">프로필 ID (pfId)</label>
                      <input type="text" id="txt-sms-pfid" placeholder="KA01PF19030601..." class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-cyan/50 focus:outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                      <label class="block text-[10px] font-bold text-slate-400">승인받은 템플릿 ID (templateId)</label>
                      <input type="text" id="txt-sms-templateid" placeholder="KA01TP19030602..." class="w-full bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-cyan/50 focus:outline-none transition-all">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          <!-- Configuration Buttons -->
          <div class="flex gap-3 justify-end items-center border-t border-white/5 pt-5 mt-5">
            <button type="button" class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" id="btn-test-notification">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>테스트 알림 발송</span>
            </button>
            <button type="submit" class="bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold px-5 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" id="btn-save-notification">
              <i data-lucide="save" class="w-3.5 h-3.5"></i>
              <span>설정 저장하기</span>
            </button>
          </div>
        </form>`;

  content = content.slice(0, formStartIndex) + newFormMarkup + content.slice(formEndIndex);
  console.log('1. Settings form replaced successfully.');
} else {
  console.log('Error: Settings form NOT found.');
}

// Helper to replace text block
function replaceBlock(searchKeyStart, searchKeyEnd, replacement, label) {
  const start = content.indexOf(searchKeyStart);
  if (start !== -1) {
    const end = content.indexOf(searchKeyEnd, start) + searchKeyEnd.length;
    content = content.slice(0, start) + replacement + content.slice(end);
    console.log(label + ' replaced successfully.');
  } else {
    console.log('Error: ' + label + ' NOT found.');
  }
}

// 2. Replace Polls search and grid header
const searchStart = '<!-- Polls Board Search & Grid -->';
const searchEnd = '<!-- Grid Layout for Poll Cards -->';
const newSearchMarkup = `<!-- Polls Board Search & Grid -->
      <div class="flex justify-between items-center mb-6 gap-4 flex-wrap text-left w-full border-t border-white/5 pt-10 mt-10">
        <div class="flex items-center bg-slate-900/40 dark:bg-slate-900/40 border border-white/5 focus-within:border-brand-cyan/50 rounded-xl px-4 py-2.5 gap-3 transition-all w-full max-w-xs">
          <i data-lucide="search" class="w-4 h-4 text-slate-400"></i>
          <input type="text" id="poll-search-input" placeholder="주제 또는 등록자 검색..." class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 cursor-text">
        </div>
        
        <div class="flex gap-2">
          <button class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 text-xs rounded-lg transition-all cursor-pointer active" id="btn-filter-poll-all">전체</button>
          <button class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 text-xs rounded-lg transition-all cursor-pointer" id="btn-filter-poll-active">진행중</button>
          <button class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 text-xs rounded-lg transition-all cursor-pointer" id="btn-filter-poll-closed">마감됨</button>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center py-10 text-center" id="polls-empty-state">
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-brand-cyan bg-brand-cyan/15 border border-brand-cyan/20 mb-3"><i data-lucide="vote" class="w-6 h-6"></i></div>
        <h4 class="text-sm font-bold text-white dark:text-white">진행 중인 선호도 조사가 없습니다</h4>
        <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">새로운 선호도 설문 조사를 직접 생성하여 사람들의 실시간 선호도를 파악해보세요!</p>
      </div>

      <!-- Grid Layout for Poll Cards -->`;

// Replace from searchStart to searchEnd + grid container open (which had style tags)
replaceBlock(searchStart, '<div class="features-grid" id="polls-grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">', 
  newSearchMarkup + '\n      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="polls-grid">', '2. Polls search, empty state & grid');

// 3. Replace Footer
const footerStart = '<!-- Footer -->';
const footerEnd = '</footer>';
const newFooterMarkup = `<!-- Footer -->
  <footer class="bg-slate-950/40 border-t border-white/5 py-8 mt-12 transition-colors duration-300">
    <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
      <p class="text-xs text-slate-500 font-medium">&copy; 2026 kfcman.link. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" id="link-service-intro" class="text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer">서비스 소개</a>
        <a href="#" id="link-privacy-policy" class="text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer">개인정보처리방침</a>
      </div>
    </div>
  </footer>`;
replaceBlock(footerStart, footerEnd, newFooterMarkup, '3. Footer');

// 4. Replace Auth Modal
const authModalStart = '<!-- AUTHENTICATION DUAL MODAL (Login & Register Switcher) -->';
const authModalEnd = '<!-- QR Code Modal (Glassmorphic Pop-up) -->';
const newAuthModalMarkup = `<!-- AUTHENTICATION DUAL MODAL (Login & Register Switcher) -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="auth-modal">
    <div class="modal-content glass-panel max-w-md w-full mx-4 p-6 md:p-8 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-left">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-auth-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>

      <!-- Auth Tabs Switcher -->
      <div class="flex border-b border-white/5 mb-6">
        <button class="flex-1 pb-3 text-sm font-bold text-slate-400 hover:text-white border-b-2 border-transparent transition-all auth-tab active" id="tab-login-trigger">로그인</button>
        <button class="flex-1 pb-3 text-sm font-bold text-slate-400 hover:text-white border-b-2 border-transparent transition-all auth-tab" id="tab-register-trigger">회원가입</button>
      </div>

      <!-- Tab Content 1: Login Form -->
      <div class="auth-tab-content space-y-4" id="auth-login-content">
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-white dark:text-white font-title">KFCMan.link 로그인</h2>
          <p class="text-xs text-slate-400">가입하신 아이디와 비밀번호로 로그인해 주세요.</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div class="space-y-3">
            <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3.5 py-3 gap-3 focus-within:border-brand-cyan/50 transition-all">
              <i data-lucide="user" class="w-4.5 h-4.5 text-slate-400"></i>
              <input type="text" id="login-username" placeholder="아이디 입력 (3~16자)" required autocomplete="username" class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500">
            </div>
            <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3.5 py-3 gap-3 focus-within:border-brand-cyan/50 transition-all">
              <i data-lucide="key-round" class="w-4.5 h-4.5 text-slate-400"></i>
              <input type="password" id="login-password" placeholder="비밀번호 입력" required autocomplete="current-password" class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500">
            </div>
          </div>
          <button type="submit" class="bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold w-full py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer text-sm mt-6" id="btn-login-submit">
            <span>로그인하기</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </form>
      </div>

      <!-- Tab Content 2: Register Form -->
      <div class="auth-tab-content hidden space-y-4" id="auth-register-content">
        <div class="space-y-2">
          <h2 class="text-lg font-bold text-white dark:text-white font-title">KFCMan.link 회원가입</h2>
          <p class="text-xs text-slate-400">나만의 단축 허브와 클릭 통계를 무료로 시작하세요.</p>
          <div class="p-3 bg-brand-cyan/8 border border-brand-cyan/20 rounded-xl flex items-start gap-2.5 leading-normal">
            <i data-lucide="shield-alert" class="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5"></i>
            <span class="text-xs text-brand-cyan">가입 후 <strong>관리자 승인을 완료해야</strong> 서비스 이용 및 로그인이 가능합니다.</span>
          </div>
        </div>
        <form id="register-form" class="space-y-4">
          <div class="space-y-3">
            <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3.5 py-3 gap-3 focus-within:border-brand-cyan/50 transition-all">
              <i data-lucide="user-plus" class="w-4.5 h-4.5 text-slate-400"></i>
              <input type="text" id="register-username" placeholder="아이디 생성 (영문/숫자 3~16자)" required autocomplete="username" class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500">
            </div>
            <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3.5 py-3 gap-3 focus-within:border-brand-cyan/50 transition-all">
              <i data-lucide="key-round" class="w-4.5 h-4.5 text-slate-400"></i>
              <input type="password" id="register-password" placeholder="비밀번호 설정 (최소 6자)" required autocomplete="new-password" class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500">
            </div>
            <div class="flex items-center bg-slate-950/50 dark:bg-slate-950/60 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-3.5 py-3 gap-3 focus-within:border-brand-cyan/50 transition-all">
              <i data-lucide="shield-check" class="w-4.5 h-4.5 text-slate-400"></i>
              <input type="password" id="register-confirm-password" placeholder="비밀번호 확인" required autocomplete="new-password" class="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500">
            </div>
          </div>
          <button type="submit" class="bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold w-full py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer text-sm mt-6" id="btn-register-submit">
            <span>가입 완료하고 시작하기</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    </div>
  </div>

  `;
replaceBlock(authModalStart, authModalEnd, newAuthModalMarkup + '\n  <!-- QR Code Modal (Glassmorphic Pop-up) -->', '4. Auth Modal');

// 5. Replace QR Modal
const qrModalStart = '<!-- QR Code Modal (Glassmorphic Pop-up) -->';
const qrModalEnd = '<!-- Detailed Stats Modal (Glassmorphic Pop-up) -->';
const newQrModalMarkup = `<!-- QR Code Modal (Glassmorphic Pop-up) -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="qr-modal">
    <div class="modal-content glass-panel max-w-xs w-full mx-4 p-6 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-center">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-qr-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <h3 class="text-lg font-bold text-white dark:text-white font-title">QR 코드 이미지</h3>
      <p class="text-xs text-slate-400 mt-1 mb-6">모바일 기기로 스캔하여 단축 주소로 바로 이동할 수 있습니다.</p>
      
      <div class="flex justify-center items-center bg-white p-4 rounded-xl shadow-inner mb-6 mx-auto w-48 h-48">
        <canvas id="qr-canvas" class="w-full h-full"></canvas>
      </div>

      <div>
        <button class="bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold w-full py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer text-sm" id="btn-qr-download">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>QR 코드 다운로드</span>
        </button>
      </div>
    </div>
  </div>

  `;
replaceBlock(qrModalStart, qrModalEnd, newQrModalMarkup + '\n  <!-- Detailed Stats Modal (Glassmorphic Pop-up) -->', '5. QR Modal');

// 6. Replace Stats Modal
const statsModalStart = '<!-- Detailed Stats Modal (Glassmorphic Pop-up) -->';
const statsModalEnd = '<!-- Preference Poll Voting & Statistics Modal -->';
const newStatsModalMarkup = `<!-- Detailed Stats Modal (Glassmorphic Pop-up) -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="stats-modal">
    <div class="modal-content glass-panel max-w-2xl w-full mx-4 p-6 md:p-8 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-left max-h-[90vh] overflow-y-auto">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-stats-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <div class="border-b border-white/5 pb-4 mb-5">
        <span class="inline-block px-2.5 py-1 text-xs font-bold tracking-wider text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg uppercase" id="stats-modal-code">CODE</span>
        <h3 class="text-xl font-bold text-white dark:text-white font-title mt-2.5">링크 트래킹 리포트</h3>
      </div>
      
      <div class="space-y-6">
        <div class="bg-slate-950/50 dark:bg-slate-950/60 border border-white/5 p-4 rounded-xl">
          <span class="block text-xs font-bold text-slate-400 mb-1">원본 주소</span>
          <a href="#" target="_blank" class="text-sm font-semibold text-brand-cyan hover:underline break-all" id="stats-original-url">https://example.com/very/long/url</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Big Click Counter -->
          <div class="bg-slate-950/50 dark:bg-slate-950/60 border border-white/5 p-5 rounded-xl flex flex-col items-center justify-center text-center">
            <div class="text-4xl font-extrabold text-brand-cyan tracking-tight" id="stats-clicks-total">0</div>
            <span class="text-xs text-slate-400 font-medium mt-1">누적 클릭 횟수</span>
          </div>

          <!-- Referral Sources Bar Charts -->
          <div class="bg-slate-950/50 dark:bg-slate-950/60 border border-white/5 p-5 rounded-xl col-span-2 space-y-4">
            <h4 class="text-sm font-bold text-white dark:text-white flex items-center gap-1.5"><i data-lucide="globe" class="text-brand-cyan"></i> 유입 소스 분석</h4>
            <div class="space-y-3 referrals-chart" id="stats-referrers-container">
              <!-- Dynamically populated percentage bars -->
            </div>
          </div>
        </div>

        <!-- Recent Click Log -->
        <div class="bg-slate-950/50 dark:bg-slate-950/60 border border-white/5 p-5 rounded-xl space-y-4">
          <h4 class="text-sm font-bold text-white dark:text-white flex items-center gap-1.5"><i data-lucide="clock" class="text-brand-yellow"></i> 최근 유입 실시간 로그 (최근 15건)</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-white/5 text-slate-400 font-bold">
                  <th class="pb-2">유입 시간</th>
                  <th class="pb-2">유입 경로 (Referrer)</th>
                  <th class="pb-2">접속 IP</th>
                </tr>
              </thead>
              <tbody id="stats-clicks-log-body" class="text-slate-300 divide-y divide-white/[0.02]">
                <!-- Dynamically populated rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  `;
replaceBlock(statsModalStart, statsModalEnd, newStatsModalMarkup + '\n  <!-- Preference Poll Voting & Statistics Modal -->', '6. Stats Modal');

// 7. Replace Poll Voting Modal
const pollModalStart = '<!-- Preference Poll Voting & Statistics Modal -->';
const pollModalEnd = '<!-- Service Introduction Modal -->';
const newPollModalMarkup = `<!-- Preference Poll Voting & Statistics Modal -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="poll-vote-modal">
    <div class="modal-content glass-panel max-w-xl w-full mx-4 p-6 md:p-8 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-left max-h-[90vh] overflow-y-auto">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-poll-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      
      <div class="border-b border-white/5 pb-4 mb-5">
        <div class="flex gap-2 items-center flex-wrap">
          <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-green/10 border border-brand-green/20 rounded-md text-brand-green" id="poll-modal-badge-status">진행중</span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-cyan/10 border border-brand-cyan/20 rounded-md text-brand-cyan" id="poll-modal-badge-multiple">단수 선택</span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-yellow/10 border border-brand-yellow/20 rounded-md text-brand-yellow" id="poll-modal-badge-dup">평생 1회 제한</span>
        </div>
        <h3 class="text-xl font-bold text-white dark:text-white font-title mt-3 leading-snug" id="poll-modal-title">선호도 조사 주제</h3>
        <p class="text-xs text-slate-400 mt-1">등록자: <span id="poll-modal-owner" class="text-brand-cyan font-bold">kfcman</span> | 제한시간: <span id="poll-modal-timer" class="text-brand-yellow font-bold">로딩 중...</span></p>
        
        <!-- Premium copyable guest sharing URL bar -->
        <div id="poll-modal-share-bar" class="mt-3.5 flex items-center bg-slate-950/50 border border-white/5 p-2 rounded-xl gap-2 w-full">
          <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0"><i data-lucide="link" class="w-3.5 h-3.5 text-brand-cyan"></i> 공유 주소:</span>
          <input type="text" id="poll-modal-share-url" readonly class="flex-1 bg-transparent border-none outline-none text-xs text-brand-cyan font-semibold select-all cursor-default min-w-0" value="http://kfcman.link/?poll=...">
          <button type="button" class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-3 py-1 text-[11px] rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer flex-shrink-0" id="btn-copy-modal-poll-url">
            <i data-lucide="copy" class="w-3 h-3"></i> <span>복사</span>
          </button>
        </div>
      </div>

      <!-- Voting Screen Container -->
      <div id="poll-modal-vote-screen" class="hidden space-y-4">
        <p class="text-xs text-slate-400 leading-relaxed">가장 선호하는 항목을 선택하고 아래의 투표 제출 버튼을 클릭하세요.</p>
        <form id="poll-vote-form" class="space-y-5">
          <div id="poll-vote-options-list" class="flex flex-col gap-3">
            <!-- Choice list with radio/checkbox cards populated dynamically -->
          </div>
          
          <button type="submit" class="bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer text-sm" id="btn-submit-vote">
            <span>투표 제출하기</span>
            <i data-lucide="check-circle-2" class="w-4 h-4"></i>
          </button>
        </form>
      </div>

      <!-- Statistics Screen Container -->
      <div id="poll-modal-stats-screen" class="hidden space-y-5">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <!-- Custom Visual Tab Switcher Buttons -->
          <div class="poll-view-tabs flex bg-slate-950/50 border border-white/5 p-1 rounded-xl gap-1">
            <button type="button" class="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active" id="btn-poll-view-bar">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i> <span>막대그래프</span>
            </button>
            <button type="button" class="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer" id="btn-poll-view-donut">
              <i data-lucide="pie-chart" class="w-3.5 h-3.5"></i> <span>원형 도넛</span>
            </button>
            <button type="button" class="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer" id="btn-poll-view-cloud">
              <i data-lucide="cloud" class="w-3.5 h-3.5"></i> <span>워드클라우드</span>
            </button>
          </div>
          
          <span class="text-[10px] bg-brand-cyan/10 border border-brand-cyan/20 rounded-full px-3 py-1 text-brand-cyan font-bold flex items-center gap-1.5" id="poll-live-sync-badge">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-cyan inline-block animate-pulse"></span>
            <span>실시간 연동 중</span>
          </span>
        </div>

        <!-- 1. Horizontal Progress Bars Chart -->
        <div id="poll-stats-bars-list" class="flex flex-col gap-4">
          <!-- Dynamically populated progress bars -->
        </div>

        <!-- 2. Interactive SVG Donut/Pie Chart (Initially Hidden) -->
        <div id="poll-stats-donut-container" class="hidden animate-fade-in flex flex-col md:flex-row gap-6 items-center bg-slate-950/30 border border-white/5 rounded-2xl p-5">
          <div class="w-36 h-36 relative flex-shrink-0 mx-auto">
            <svg id="poll-donut-svg" viewBox="0 0 100 100" class="-rotate-90 w-full h-full">
              <!-- Circles dynamically drawn here -->
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              <span id="donut-center-percent" class="font-title text-xl font-extrabold text-white">0%</span>
              <span id="donut-center-label" class="text-[9px] text-slate-400 overflow-hidden text-overflow-ellipsis white-space-nowrap max-w-[80px]">문항 1</span>
            </div>
          </div>
          <div id="poll-donut-legend" class="flex-1 flex flex-col gap-2 w-full">
            <!-- Legends dynamically drawn here -->
          </div>
        </div>

        <!-- 3. Visual Word Cloud (Initially Hidden) -->
        <div id="poll-stats-wordcloud" class="hidden animate-fade-in flex flex-wrap gap-4 justify-center items-center min-height-[180px] p-6 rounded-2xl bg-slate-950/40 border border-white/5 overflow-hidden">
          <!-- Option words dynamically scaled and placed here -->
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-dashed border-white/5 text-xs text-slate-400 font-semibold">
          <span>참여 인원: <strong id="poll-modal-total-votes" class="text-white">0명</strong></span>
          <span id="poll-voted-notice" class="text-brand-green flex items-center gap-1.5"><i data-lucide="check-check" class="w-4 h-4"></i> 이미 투표에 참여하셨습니다.</span>
        </div>
      </div>
    </div>
  </div>

  `;
replaceBlock(pollModalStart, pollModalEnd, newPollModalMarkup + '\n  <!-- Service Introduction Modal -->', '7. Poll Modal');

// 8. Replace Intro Modal
const introModalStart = '<!-- Service Introduction Modal -->';
const introModalEnd = '<!-- Privacy Policy Modal -->';
const newIntroModalMarkup = `<!-- Service Introduction Modal -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="intro-modal">
    <div class="modal-content glass-panel max-w-md w-full mx-4 p-6 md:p-8 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-left">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-intro-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <div class="border-b border-white/5 pb-4 mb-5">
        <h3 class="text-xl font-bold text-white dark:text-white flex items-center gap-2 font-title">
          <i data-lucide="info" class="text-brand-cyan w-5.5 h-5.5"></i> 서비스 소개
        </h3>
      </div>
      <div class="text-sm text-slate-300 leading-relaxed flex flex-col gap-4">
        <p><strong>kfcman.link</strong>는 프리미엄 단축 URL 관리와 실시간 여론 조사를 결합한 멀티 플랫폼 서비스입니다.</p>
        <div class="bg-slate-950/50 border border-white/5 p-4 rounded-xl space-y-1">
          <h4 class="font-bold text-brand-cyan text-sm">1. 1초 간편 주소 단축</h4>
          <p class="text-xs text-slate-400 leading-normal">길고 지저분한 주소를 1초 만에 깔끔하게 줄여주고, 유입 경로(Referrer) 및 접속 로그를 실시간 상세 통계 그래프로 확인합니다.</p>
        </div>
        <div class="bg-slate-950/50 border border-white/5 p-4 rounded-xl space-y-1">
          <h4 class="font-bold text-brand-purple text-sm">2. 실시간 선호도 설문 게시판</h4>
          <p class="text-xs text-slate-400 leading-normal">회원은 물론 비회원(게스트)까지 실시간 참여 가능한 여론조사를 생성합니다. 막대그래프, 원형 도넛 차트, 다채로운 워드클라우드로 결과를 즉시 시각화합니다.</p>
        </div>
        <div class="bg-slate-950/50 border border-white/5 p-4 rounded-xl space-y-1">
          <h4 class="font-bold text-brand-green text-sm">3. 지능형 중복/어뷰징 방지</h4>
          <p class="text-xs text-slate-400 leading-normal">브라우저의 로컬 스토리지와 접속자의 고유 IP 대조 2중 필터링을 통해 미로그인 유저의 공정한 투표 및 중복 참여를 방지합니다.</p>
        </div>
      </div>
    </div>
  </div>

  `;
replaceBlock(introModalStart, introModalEnd, newIntroModalMarkup + '\n  <!-- Privacy Policy Modal -->', '8. Intro Modal');

// 9. Replace Privacy Modal
const privacyModalStart = '<!-- Privacy Policy Modal -->';
const privacyModalEnd = '<!-- Toast Notification System -->';
const newPrivacyModalMarkup = `<!-- Privacy Policy Modal -->
  <div class="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 hidden" id="privacy-modal">
    <div class="modal-content glass-panel max-w-md w-full mx-4 p-6 md:p-8 border border-white/10 dark:border-white/5 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-scale-up text-left">
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90" id="btn-privacy-modal-close" aria-label="닫기">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <div class="border-b border-white/5 pb-4 mb-5">
        <h3 class="text-xl font-bold text-white dark:text-white flex items-center gap-2 font-title">
          <i data-lucide="shield-check" class="text-brand-green w-5.5 h-5.5"></i> 개인정보처리방침
        </h3>
      </div>
      <div class="text-xs text-slate-300 leading-relaxed flex flex-col gap-4">
        <p>kfcman.link는 이용자의 소중한 개인정보를 안전하게 보호하기 위해 최선의 노력을 다하고 있습니다.</p>
        <div class="space-y-1">
          <h4 class="font-bold text-slate-100 text-xs">■ 개인정보 수집 항목</h4>
          <p class="text-[11px] text-slate-400 leading-normal">
            - <strong>회원 가입</strong>: 가입 시 비밀번호 단방향 암호화 해시 및 아이디(ID)<br>
            - <strong>비회원(게스트) 설문 참여</strong>: 투표 공정성 및 중복 참여 검증을 위한 접속 IP 정보, 참여 일시
          </p>
        </div>
        <div class="space-y-1">
          <h4 class="font-bold text-slate-100 text-xs">■ 개인정보 수집 목적</h4>
          <p class="text-[11px] text-slate-400 leading-normal">
            - 설문조사 투표 참여 중복 방지 (IP 기반 1시간 주기/영구 차단 검증)<br>
            - 서비스 안정성 유지 및 비정상적인 어뷰징 공격 필터링
          </p>
        </div>
        <div class="space-y-1">
          <h4 class="font-bold text-slate-100 text-xs">■ 개인정보 보관 및 파기</h4>
          <p class="text-[11px] text-slate-400 leading-normal">
            - 수집된 IP 정보는 설문조사 통계 및 검증 목적 이외에는 절대 보관/이용되지 않습니다.<br>
            - 개설자가 설문을 파괴(삭제)할 경우, 해당 설문에 기록된 비회원 참여 IP 주소 또한 서버 및 DB에서 **완벽히 영구 삭제**됩니다.
          </p>
        </div>
      </div>
    </div>
  </div>

  `;
replaceBlock(privacyModalStart, privacyModalEnd, newPrivacyModalMarkup + '\n  <!-- Toast Notification System -->', '9. Privacy Modal');

fs.writeFileSync(indexPath, content, 'utf8');
console.log('index.html modified successfully.');
