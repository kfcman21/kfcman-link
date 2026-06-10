// ==========================================================================
// kfcman.link URL Shortener Frontend Controller (With Multi-User Auth & Stats)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements Cache ---
  const shortenForm = document.getElementById('shorten-form');
  const urlInput = document.getElementById('url-input');
  const customAliasInput = document.getElementById('custom-alias-input');
  const shortenBtn = document.getElementById('shorten-btn');
  
  const inputContainer = document.getElementById('input-container');
  const resultContainer = document.getElementById('result-container');
  const brandUrlDisplay = document.getElementById('brand-url-display');
  const localUrlDisplay = document.getElementById('local-url-display');
  
  const btnCopyBrand = document.getElementById('btn-copy-brand');
  const btnCopyLocal = document.getElementById('btn-copy-local');
  const btnQrTrigger = document.getElementById('btn-qr-trigger');
  const btnReset = document.getElementById('btn-reset');
  
  // Theme & Header Elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const userWelcomeTag = document.getElementById('user-welcome-tag');
  const userWelcomeName = document.getElementById('user-welcome-name');
  const headerNav = document.getElementById('header-nav');
  const guestHeaderButtons = document.
  const logoutBtn = document.getElementById('btn-logout');
  
  // Guest Landing Triggers
  const btnLoginTrigger = document.getElementById('btn-login-trigger');
  const btnRegisterTrigger = document.getElementById('btn-register-trigger');
  const btnHeroStart = document.getElementById('btn-hero-start');
  const guestContent = document.getElementById('guest-content');
  const memberContent = document.getElementById('member-content');
  
  // Modals & Authentication Switcher
  const authModal = document.getElementById('auth-modal');
  const btnAuthModalClose = document.getElementById('btn-auth-modal-close');
  const tabLoginTrigger = document.getElementById('tab-login-trigger');
  const tabRegisterTrigger = document.getElementById('tab-register-trigger');
  const authLoginContent = document.getElementById('auth-login-content');
  const authRegisterContent = document.getElementById('auth-register-content');
  
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  
  const registerForm = document.getElementById('register-form');
  const registerUsernameInput = document.getElementById('register-username');
  const registerPasswordInput = document.getElementById('register-password');
  const registerConfirmPasswordInput = document.getElementById('register-confirm-password');

  // Dashboard Elements
  const btnClearHistory = document.getElementById('btn-clear-history');
  const statTotalLinks = document.getElementById('stat-total-links');
  const statTotalClicks = document.getElementById('stat-total-clicks');
  const statAvgClicks = document.getElementById('stat-avg-clicks');
  
  const listEmptyState = document.getElementById('list-empty-state');
  const linksTableWrapper = document.getElementById('links-table-wrapper');
  const linksTableBody = document.getElementById('links-table-body');
  
  // Modals
  const qrModal = document.getElementById('qr-modal');
  const btnQrModalClose = document.getElementById('btn-qr-modal-close');
  const qrCanvas = document.getElementById('qr-canvas');
  const btnQrDownload = document.getElementById('btn-qr-download');
  
  const statsModal = document.getElementById('stats-modal');
  const btnStatsModalClose = document.getElementById('btn-stats-modal-close');
  const statsModalCode = document.getElementById('stats-modal-code');
  const statsOriginalUrl = document.getElementById('stats-original-url');
  const statsClicksTotal = document.getElementById('stats-clicks-total');
  const statsReferrersContainer = document.getElementById('stats-referrers-container');
  const statsClicksLogBody = document.getElementById('stats-clicks-log-body');
  
  const toastContainer = document.getElementById('toast-container');

  // Admin Approval Elements
  const adminApprovalSection = document.getElementById('admin-approval-section');
  const adminEmptyState = document.getElementById('admin-empty-state');
  const adminTableWrapper = document.getElementById('admin-table-wrapper');
  const adminPendingBody = document.getElementById('admin-pending-body');
  
  // Server Monitor Elements
  const monitorCpuVal = document.getElementById('monitor-cpu-val');
  const monitorMemVal = document.getElementById('monitor-mem-val');
  const monitorDiskVal = document.getElementById('monitor-disk-val');
  const monitorUptimeVal = document.getElementById('monitor-uptime-val');

  // --- State Variables ---
  let generatedCode = '';
  let activeQrUrl = '';

  // --- 1. Theme Module (Light / Dark Mode Option) ---
  function initTheme() {
    const savedTheme = localStorage.getItem('kfcman_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    lucide.createIcons();
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('kfcman_theme', isLight ? 'light' : 'dark');
    lucide.createIcons();
    showToast(
      isLight ? '화이트 테마 활성화' : '블랙 테마 활성화',
      isLight ? '눈이 편안한 밝은 화이트 모드로 전환되었습니다.' : '세련되고 깊이 있는 다크 모드로 전환되었습니다.',
      'info'
    );
  });

  initTheme();

  // --- 2. Security Auth Module (Login / Logout Control) ---
  function getAuthToken() {
    return localStorage.getItem('kfcman_auth_token');
  }

  function setAuthToken(token) {
    localStorage.setItem('kfcman_auth_token', token);
  }

  function removeAuthToken() {
    localStorage.removeItem('kfcman_auth_token');
  }

  async function checkLoginState() {
    const token = getAuthToken();
    if (token) {
      try {
        const response = await secureFetch('/api/me');
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        const data = await response.json();
        
        // Authenticated successfully
        userWelcomeName.textContent = data.username;
        
        userWelcomeTag.classList.remove('hidden');
        headerNav.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        guestHeaderButtons.classList.add('hidden');
        
        guestContent.classList.add('hidden');
        memberContent.classList.remove('hidden');
        
        // Render user warning banner if active
        const userWarningBanner = document.getElementById('user-warning-banner');
        const userWarningMessage = document.getElementById('user-warning-message');
        if (data.warning) {
          userWarningMessage.textContent = data.warning;
          userWarningBanner.classList.remove('hidden');
        } else {
          userWarningBanner.classList.add('hidden');
        }
        
        // Admin authorization check
        if (data.role === 'admin') {
          adminApprovalSection.classList.remove('hidden');
          renderAdminPanel();
          if (!window.adminMetricsInterval) {
            window.adminMetricsInterval = setInterval(renderAdminPanel, 15000); // 15 seconds auto refresh
          }
        } else {
          adminApprovalSection.classList.add('hidden');
          if (window.adminMetricsInterval) {
            clearInterval(window.adminMetricsInterval);
            window.adminMetricsInterval = null;
          }
        }

        // Custom code section visibility: regular users see the locked notice only
        const customCodeSection = document.getElementById('custom-code-section');
        const customCodeLockedSection = document.getElementById('custom-code-locked-section');
        if (customCodeSection && customCodeLockedSection) {
          if (data.role === 'user') {
            // 일반회원: 커스텀 코드 입력 숨기고 잠금 안내 표시
            customCodeSection.classList.add('hidden');
            customCodeLockedSection.classList.remove('hidden');
          } else {
            // VIP·관리자: 커스텀 코드 입력 표시
            customCodeSection.classList.remove('hidden');
            customCodeLockedSection.classList.add('hidden');
          }
        }

        // 칸반보드·주제톡방 접근 제한 (일반회원 잠금) - 모든 /wall, /chat 링크 포괄 처리
        const permissionDeniedModal = document.getElementById('permission-denied-modal');
        const btnPermissionClose = document.getElementById('btn-permission-modal-close');
        const btnPermissionOk = document.getElementById('btn-permission-modal-ok');
        const permissionFeatureBadge = document.getElementById('permission-denied-feature-badge');

        // 권한없음 모달 표시 함수
        function showPermissionDeniedModal(featureName, featureIcon) {
          if (!permissionDeniedModal) return;
          // 기능 배지 설정
          if (permissionFeatureBadge) {
            permissionFeatureBadge.innerHTML = `
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-white bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 shadow-sm">
                <i data-lucide="${featureIcon}" class="w-3.5 h-3.5"></i>
                ${featureName}
              </span>
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-xl border-2 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/30 text-xs font-black text-amber-600 dark:text-amber-400">
                <i data-lucide="lock" class="w-3 h-3"></i>
                우수회원 전용
              </span>
            `;
            lucide.createIcons();
          }
          permissionDeniedModal.classList.remove('hidden');
        }

        function closePermissionDeniedModal() {
          if (permissionDeniedModal) {
            permissionDeniedModal.classList.add('hidden');
          }
        }

        // 모달 닫기 버튼 이벤트
        if (btnPermissionClose) {
          btnPermissionClose.addEventListener('click', closePermissionDeniedModal);
        }
        if (btnPermissionOk) {
          btnPermissionOk.addEventListener('click', closePermissionDeniedModal);
        }
        // 모달 외부 클릭 시 닫기
        if (permissionDeniedModal) {
          permissionDeniedModal.addEventListener('click', (e) => {
            if (e.target === permissionDeniedModal) closePermissionDeniedModal();
          });
        }

        if (data.role === 'user') {
          // 1) 특정 ID 요소 잠금 (사이드바·그리드 아이템)
          const namedWallItems = [
            { el: document.getElementById('grid-item-kanban'), name: '칸반보드', icon: 'layout-kanban' },
            { el: document.getElementById('grid-item-chat'),   name: '주제 톡방', icon: 'message-circle' },
            { el: document.getElementById('nav-item-wall-side'), name: '칸반보드', icon: 'layout-kanban' },
            { el: document.getElementById('nav-item-chat-side'), name: '주제 톡방', icon: 'message-circle' },
          ];

          namedWallItems.forEach(({ el, name, icon }) => {
            if (!el) return;
            el.removeAttribute('href');
            el.style.cursor = 'not-allowed';
            el.style.opacity = '0.45';
            el.title = `👑 우수회원 전용 기능입니다.`;
            // 기존 이벤트 제거 후 재등록
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            newEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              showPermissionDeniedModal(name, icon);
            });
          });

          // 2) href="/wall" 또는 href="/chat" 로 이동하는 나머지 모든 링크 일괄 차단
          document.querySelectorAll('a[href="/wall"], a[href="/chat"]').forEach((el) => {
            // 이미 처리된 요소 (opacity 처리된 것) 스킵
            if (el.style.opacity === '0.45') return;
            const isChat = el.getAttribute('href') === '/chat';
            const name = isChat ? '주제 톡방' : '칸반보드';
            const icon = isChat ? 'message-circle' : 'layout-kanban';
            el.removeAttribute('href');
            el.style.cursor = 'not-allowed';
            el.style.opacity = '0.45';
            el.title = `👑 우수회원 전용 기능입니다.`;
            el.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              showPermissionDeniedModal(name, icon);
            });
          });

          // 3) onclick 방식 버튼 (switchMainTab 없는 wall/chat 전용 버튼) 처리는
          //    위 querySelectorAll이 a 태그를 모두 커버하므로 충분함
        }

        
        renderDashboard();

        // Handle pending shared poll redirections in SPA
        const urlParams = new URLSearchParams(window.location.search);
        const pollId = urlParams.get('poll');
        if (pollId) {
          // Immediately switch tab to polls and open modal
          showPollsTab();
          openPollModal(pollId, 'vote');
          
          // Clean up search query parameter silently
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
      } catch (err) {
        // Token exists but server says it's invalid
        removeAuthToken();
        showGuestState();
      }
    } else {
      showGuestState();
    }
  }

  function showGuestState() {
    userWelcomeTag.classList.add('hidden');
    headerNav.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    guestHeaderButtons.classList.remove('hidden');
    
    guestContent.classList.remove('hidden');
    memberContent.classList.add('hidden');
    adminApprovalSection.classList.add('hidden');
    
    if (window.adminMetricsInterval) {
      clearInterval(window.adminMetricsInterval);
      window.adminMetricsInterval = null;
    }

    // Direct guest to the shared poll without requiring login!
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('poll');
    if (pollId) {
      // Immediately open modal directly over guest welcome screen!
      openPollModal(pollId, 'vote');
      
      // Clean up search query parameter silently
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }

  // --- 3. Secure Custom Fetch Wrapper ---
  // Automatically attaches X-KFCMan-Auth header and handles 401 Unauthorized token expirations.
  async function secureFetch(url, options = {}) {
    const token = getAuthToken();
    if (!options.headers) {
      options.headers = {};
    }
    if (token) {
      options.headers['X-KFCMan-Auth'] = token;
    }

    try {
      const response = await fetch(url, options);
      if (response.status === 401) {
        // Token has expired or password changed
        removeAuthToken();
        checkLoginState();
        showToast('세션 만료', '인증이 만료되었습니다. 다시 로그인해 주세요.', 'error');
        throw new Error('Unauthorized');
      const response = await fetch(url, options);
      if (response.status === 401) {
        // Token has expired or password changed
        removeAuthToken();
        checkLoginState();
        showToast('세션 만료', '인증이 만료되었습니다. 다시 로그인해 주세요.', 'error');
        throw new Error('Unauthorized');
      }
      return response;
    } catch (err) {
      if (err.message === 'Unauthorized') {
        throw err;
      }
      console.error('Network Error:', err);
      throw new Error('서버와 통신하는 중 네트워크 에러가 발생했습니다.');
    }
  }

  // --- 4. Modal Triggers & Tab Switching ---
  function openAuthModal(mode = 'login') {
    authModal.classList.remove('hidden');
    switchAuthTab(mode);
  }

  function switchAuthTab(mode) {
    if (mode === 'login') {
      tabLoginTrigger.classList.add('active');
      tabRegisterTrigger.classList.remove('active');
      authLoginContent.classList.remove('hidden');
      authRegisterContent.classList.add('hidden');
      loginUsernameInput.focus();
    } else {
      tabLoginTrigger.classList.remove('active');
      tabRegisterTrigger.classList.add('active');
      authLoginContent.classList.add('hidden');
      authRegisterContent.classList.remove('hidden');
      registerUsernameInput.focus();
    }
  }

  btnLoginTrigger.addEventListener('click', () => openAuthModal('login'));
  btnRegisterTrigger.addEventListener('click', () => openAuthModal('register'));
  btnHeroStart.addEventListener('click', () => openAuthModal('register'));
  
  btnAuthModalClose.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });

  tabLoginTrigger.addEventListener('click', () => switchAuthTab('login'));
  tabRegisterTrigger.addEventListener('click', () => switchAuthTab('register'));

  // Handle Login submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    
    if (!username || !password) {
      showToast('입력 오류', '아이디와 비밀번호를 모두 입력해 주세요.', 'error');
      return;
    }

    const loginSubmitBtn = document.getElementById('btn-login-submit');
    const btnSpan = loginSubmitBtn.querySelector('span');
    loginSubmitBtn.disabled = true;
    btnSpan.textContent = '로그인 중...';

    try {
      const response = await fetch('/api/login', {
      return;
    }

    const registerSubmitBtn = document.getElementById('btn-register-submit');
    const btnSpan = registerSubmitBtn.querySelector('span');
    registerSubmitBtn.disabled = true;
    btnSpan.textContent = '가입 등록 중...';

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      // Success
      showToast(
        '가입 신청 접수 완료',
        '회원가입 신청이 안전하게 접수되었습니다! <strong>관리자가 회원 가입을 승인한 이후부터</strong> 로그인 및 서비스 이용이 가능합니다.',
        'success'
      );
      
      // Auto-fill username in login form and switch tab
      
      switchAuthTab('login');
    } catch (err) {
      showToast('가입 실패', err.message, 'error');
    } finally {
      registerSubmitBtn.disabled = false;
        'success'
      );
      
      // Auto-fill username in login form and switch tab
      loginUsernameInput.value = username;
      registerUsernameInput.value = '';
      registerPasswordInput.value = '';
      registerConfirmPasswordInput.value = '';
      
      switchAuthTab('login');
    } catch (err) {
      showToast('가입 실패', err.message, 'error');
    } finally {
      registerSubmitBtn.disabled = false;
      btnSpan.textContent = '가입 완료하고 시작하기';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', async () => {
    if (confirm('안전하게 로그아웃하시겠습니까?')) {
      try {
        await secureFetch('/api/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout API Error:', err);
      }
      removeAuthToken();
      showToast('로그아웃 완료', '안전하게 로그아웃되었습니다.', 'info');
      checkLoginState();
    }
  });

  // --- 5. Toast Notification Utility ---
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-content">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-message">${message}</p>
      btnSpan.textContent = '가입 완료하고 시작하기';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', async () => {
    if (confirm('안전하게 로그아웃하시겠습니까?')) {
      try {
        await secureFetch('/api/logout', { method: 'POST' });
  });

  // --- 5. Toast Notification Utility ---
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-content">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close"><i data-lucide="x"></i></button>
    `;

    toastContainer.appendChild(toast);
    lucide.createIcons();

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  // --- 6. URL Error Handler from Redirect Routes ---
  function checkUrlErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'notfound') {
      const missingCode = urlParams.get('code');
      showToast('주소를 찾을 수 없음', `요청하신 단축 주소코드 [${missingCode}]는 존재하지 않거나 만료되었습니다.`, 'error');
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
    // 일반회원이 칸반/톡방 접근 시도 후 리다이렉트된 경우
    if (urlParams.get('blocked') === 'wall') {
      showToast('접근 제한', '칸반보드 및 주제 톡방은 <strong>우수회원👑 이상</strong>만 이용할 수 있습니다. 관리자에게 등급업을 요청해 주세요!', 'error');
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }
  checkUrlErrors();

  // --- 7. Shortener Submit Handler ---
  shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlValue = urlInput.value.trim();
    const customCodeValue = customAliasInput.value.trim();

    if (!urlValue) return;

    shortenBtn.disabled = true;
    const prevBtnHtml = shortenBtn.innerHTML;
    shortenBtn.innerHTML = `<span>단축 중...</span><i data-lucide="loader" class="animate-spin"></i>`;
    lucide.createIcons();

    try {
      const response = await secureFetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlValue,
          customCode: customCodeValue || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '단축 주소 생성에 실패했습니다.');
      }

      generatedCode = data.link.code;
      activeQrUrl = `${window.location.origin}/${generatedCode}`;
      
      brandUrlDisplay.textContent = `http://kfcman.link/${generatedCode}`;
      localUrlDisplay.textContent = activeQrUrl;

      inputContainer.classList.add('hidden');
      resultContainer.classList.remove('hidden');
      resultContainer.classList.add('animate-fade-in');

      showToast('성공!', '단축 URL이 정상적으로 만들어졌습니다.', 'success');
      renderDashboard();

    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('오류 발생', err.message, 'error');
      }
    } finally {
      shortenBtn.disabled = false;
      shortenBtn.innerHTML = prevBtnHtml;
      lucide.createIcons();
    }
  });

  // Reset form for new link
  btnReset.addEventListener('click', () => {
    urlInput.value = '';
    customAliasInput.value = '';
    
    resultContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    inputContainer.classList.add('animate-fade-in');
    
    urlInput.focus();
  });

  // --- 8. Clipboard Copy Handlers ---
  function copyTextToClipboard(text, clickButton) {
    // Create a temporary textarea element
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Save current selection range if any exists
    const selected = document.getSelection().rangeCount > 0 
      ? document.getSelection().getRangeAt(0) 
      : false;
    
    el.select();
    el.setSelectionRange(0, 99999); // iOS Safari compatibility
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      success = false;
    }
    
    document.body.removeChild(el);
    
    // Restore original selection range
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
    
    if (success) {
      triggerCopyFeedback(clickButton);
    } else {
      // Modern API fallback if legacy execCommand fails
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          triggerCopyFeedback(clickButton);
        }).catch(() => {
          showToast('복사 실패', '클립보드 복사에 실패했습니다.', 'error');
        });
      } else {
        showToast('복사 실패', '브라우저 보안 제약으로 복사 기능을 사용할 수 없습니다.', 'error');
      }
    }
  }

  function triggerCopyFeedback(button) {
    const icon = button.querySelector('i');
    const originalIconName = icon.getAttribute('data-lucide');
    
    icon.setAttribute('data-lucide', 'check');
    icon.style.color = 'var(--color-green)';
    button.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    button.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
    lucide.createIcons();

    showToast('복사 성공', '링크가 클립보드에 안전하게 복사되었습니다.', 'success');

    setTimeout(() => {
      icon.setAttribute('data-lucide', originalIconName);
      icon.style.color = '';
      button.style.borderColor = '';
      button.style.boxShadow = '';
      lucide.createIcons();
    }, 1500);
  });

  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.add('hidden');
    }
    if (e.target === qrModal) {
      qrModal.classList.add('hidden');
    }
    if (e.target === statsModal) {
      statsModal.classList.add('hidden');
    }
  });

  // --- 10. Dashboard Rendering ---
  async function renderDashboard() {
    try {
      const response = await secureFetch('/api/links');

      if (!response.ok) {
        throw new Error('링크 통계를 불러오지 못했습니다.');
      }

      const { links } = await response.json();

      if (links.length === 0) {
        listEmptyState.classList.remove('hidden');
        linksTableWrapper.classList.add('hidden');
        btnClearHistory.classList.add('hidden');
        
        statTotalLinks.textContent = '0';
        statTotalClicks.textContent = '0';
        statAvgClicks.textContent = '0.0';
        return;
      }

      links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalLinksCount = links.length;
      const totalClicksSum = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const avgClicksRate = totalLinksCount > 0 ? (totalClicksSum / totalLinksCount).toFixed(1) : '0.0';

      statTotalLinks.textContent = totalLinksCount;
      statTotalClicks.textContent
  });

  // --- 10. Dashboard Rendering ---
  async function renderDashboard() {
    try {
      const response = await secureFetch('/api/links');

      if (!response.ok) {
        throw new Error('링크 통계를 불러오지 못했습니다.');
      }

      const { links } = await response.json();

      if (links.length === 0) {
        listEmptyState.classList.remove('hidden');
        linksTableWrapper.classList.add('hidden');
        btnClearHistory.classList.add('hidden');
        
              수집된 접속 기록이 존재하지 않습니다.
            </td>
          </tr>
        `;
      } else {
        const sortedClicks = [...clicksData].reverse().slice(0, 15);
        
        sortedClicks.forEach(click => {
          const tr = document.createElement('tr');
          const timeStr = new Date(click.timestamp).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
              수집된 접속 기록이 존재하지 않습니다.
            </td>
          </tr>
        `;
      } else {
        const sortedClicks = [...clicksData].reverse().slice(0, 15);
        
        sortedClicks.forEach(click => {
          const tr = document.createElement('tr');
          const timeStr = new Date(click.timestamp).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          tr.innerHTML = `
            <td>${timeStr}</td>
            <td><strong style="color:var(--color-cyan);">${click.referrer}</strong></td>
            <td style="font-family:monospace; color:rgba(255,255,255,0.6);">${click.ip}</td>
          `;
          statsClicksLogBody.appendChild(tr);
        });
      }

      statsModal.classList.remove('hidden');

    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('통계 오류', err.message, 'error');
      }
    }
  }

  btnStatsModalClose.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  // Reset entire dashboard
  btnClearHistory.addEventListener('click', () => {
    if (confirm('대시보드의 기록을 초기화하시겠습니까? (서버에 저장된 단축 링크 자체는 소멸되지 않습니다)')) {
      clearAllLocalCodes();
      showToast('대시보드 초기화', '모든 로컬 대시보드 리스트가 삭제되었습니다.', 'info');
      renderDashboard();
    }
  });

  // Initial runs
  checkLoginState();

  // Auto-open login modal if ?login=true is passed in URL
  const initParams = new URLSearchParams(window.location.search);
  if (initParams.get('login') === 'true') {
    openAuthModal('login');
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }
});

            </div>
          </td>
        `;

        linksTableBody.appendChild(row);
      });

      listEmptyState.classList.add('hidden');
      linksTableWrapper.classList.remove('hidden');
      btnClearHistory.classList.remove('hidden');

      lucide.createIcons();
      bindTableActionEvents();

    } catch (err) {
      if (err.message !== 'Unauthorized') {
        console.error(err);
        showToast('대시보드 오류', '통계 정보를 불러오는데 실패했습니다.', 'error');
      }
    }
  }

  // --- 11. Bind Actions in Table Rows ---
      
      statsModalCode.textContent = link.code;
      statsOriginalUrl.textContent = link.originalUrl;
      statsOriginalUrl.href = link.originalUrl;
      statsClicksTotal.textContent = link.clicks || '0';

          try {
            const response = await secureFetch(`/api/links/${code}`, {
              method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            showToast('삭제 완료', '해당 단축 링크가 안전하게 삭제되었습니다.', 'success');
            renderDashboard();
          } catch (err) {
            showToast('삭제 실패', err.message, 'error');
          }
        }
      });
    });
  }

  // --- 12. Detail Stats Modal Loader ---
  async function showStatsModal(code) {
    try {
      const response = await secureFetch(`/api/stats/${code}`);
      if (!response.ok) {
        throw new Error('서버에서 통계 데이터를 수집할 수 없습니다.');
      }
      
      const { link } = await response.json();
      
      statsModalCode.textContent = link.code;
      statsOriginalUrl.textContent = link.originalUrl;
      statsOriginalUrl.href = link.originalUrl;
      statsClicksTotal.textContent = link.clicks || '0';

      const clicksData = link.clicksData || [];
      const referrersMap = {};
      
      clicksData.forEach(click => {
        const ref = click.referrer || 'Direct';
        referrersMap[ref] = (referrersMap[ref] || 0) + 1;
      });

      const sortedRefs = Object.entries(referrersMap).sort((a, b) => b[1] - a[1]);
      
      statsReferrersContainer.innerHTML = '';
      if (sortedRefs.length === 0) {
        statsReferrersContainer.innerHTML = `
            </div>
            <div class="referral-bar-bg">
              <div class="referral-bar-fill" style="width: 0%;"></div>
            </div>
          `;
          
          statsReferrersContainer.appendChild(refRow);
          
          setTimeout(() => {
            const barFill = refRow.querySelector('.referral-bar-fill');
            if (barFill) barFill.style.width = `${percentage}%`;
          }, 50);
        });
      }

      statsClicksLogBody.innerHTML = '';
      if (clicksData.length === 0) {
        statsClicksLogBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">
              수집된 접속 기록이 존재하지 않습니다.
            </td>
          </tr>
        `;
      } else {
        const sortedClicks = [...clicksData].reverse().slice(0, 15);
        
        sortedClicks.forEach(click => {
          const tr = document.createElement('tr');
          const timeStr = new Date(click.timestamp).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          tr.innerHTML = `
            <td>${timeStr}</td>
            <td><strong style="color:var(--color-cyan);">${click.referrer}</strong></

  // Reset entire dashboard
  btnClearHistory.addEventListener('click', async () => {
    if (confirm('대시보드의 모든 단축 링크 기록을 삭제하시겠습니까?\n삭제된 단축 주소는 즉시 작동이 중지되며 다시 되돌릴 수 없습니다.')) {
      try {
        const response = await secureFetch('/api/links/clear', {
          method: 'POST'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast('대시보드 초기화', '모든 단축 주소 및 트래킹 로그가 영구히 소멸되었습니다.', 'info');
        renderDashboard();
      } catch (err) {
        showToast('초기화 실패', err.message, 'error');
      }
    }
  });

  btnStatsModalClose.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  // Reset entire dashboard
  btnClearHistory.addEventListener('click', async () => {
    if (confirm('대시보드의 모든 단축 링크 기록을 삭제하시겠습니까?\n삭제된 단축 주소는 즉시 작동이 중지되며 다시 되돌릴 수 없습니다.')) {
      try {
        const response = await secureFetch('/api/links/clear', {
          method: 'POST'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast('대시보드 초기화', '모든 단축 주소 및 트래킹 로그가 영구히 소멸되었습니다.', 'info');
        renderDashboard();
      } catch (err) {
        showToast('초기화 실패', err.message, 'error');
      }
    }
  });

  // --- 14. Admin Panel Rendering ---
  async function renderAdminPanel() {
    // Load notification configuration (once)
    await loadNotificationSettings();

    // 1. Fetch system monitoring metrics
    try {
      const sysResponse = await secureFetch('/api/admin/system');
      if (sysResponse.ok) {
        const sysData = await sysResponse.json();
        
        monitorCpuVal.textContent = sysData.cpu + '%';
        monitorMemVal.textContent = sysData.memory + '%';
        monitorDiskVal.textContent = sysData.disk + '%';
        monitorCpuVal.style.color = sysData.cpu > 80 ? '#ef4444' : 'var(--color-purple)';
        monitorMemVal.style.color = sysData.memory > 80 ? '#ef4444' : 'var(--color-cyan)';
        monitorDiskVal.style.color = sysData.disk > 80 ? '#ef4444' : 'var(--color-yellow)';
      }
    } catch (err) {
      console.error('Failed to load system metrics:', err);
    }

    // 2. Fetch pending approvals list
    try {
      const response = await secureFetch('/api/admin/pending');
      if (!response.ok) {
        throw new Error('가입 신청 대기 목록을 불러오지 못했습니다.');
      }

            </div>
          </td>
          <td>
            <span class="table-date">${dateStr}</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-primary btn-admin-approve" data-username="${user.username}" style="padding: 6px 12px; font-size: 12px; height: auto; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="user-check" style="width:14px; height:14px;"></i>
                <span>승인</span>
              </button>
              <button class="btn btn-sm btn-glass-danger btn-admin-reject" data-username="${user.username}" style="padding: 6px 12px; font-size: 12px; height: auto; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1);">
                <i data-lucide="user-minus" style="width:14px; height:14px; color: #ef4444;"></i>
                <span style="color: #ef4444;">거절</span>
              </button>
            </div>
          </td>
        `;

        adminPendingBody.appendChild(row);
      });

      adminEmptyState.classList.add('hidden');
      adminTableWrapper.classList.remove('hidden');
      lucide.createIcons();
      bindAdminActionEvents();

    } catch (err) {
      if (err.message !== 'Unauthorized') {
        console.error(err);
        showToast('관리자 오류', err.message, 'error');
      }
    }
  }

  function bindAdminActionEvents() {
    document.querySelectorAll('.btn-admin-approve').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}]의 회원가입을 승인하시겠습니까?\n승인 완료 즉시 해당 계정으로 서비스 로그인이 가능해집니다.`)) {

    document.querySelectorAll('.btn-admin-reject').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}]의 가입 신청을 거절하고 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
          try {
            const response = await secureFetch('/api/admin/reject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('가입 거절 완료', `[${username}] 사용자의 가입 신청을 거절하고 영구 삭제했습니다.`, 'info');
            renderAdminPanel();
          } catch (err) {
            showToast('거절 실패', err.message, 'error');
          }
        }
      });
    });
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });

            const data = await response.json();
              body: JSON.stringify({ username })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('가입 승인 완료', `[${username}] 사용자의 가입이 정상적으로 승인되었습니다.`, 'success');
            renderAdminPanel();
          } catch (err) {
            showToast('승인 실패', err.message, 'error');
          }
        }
      });
    });

    document.querySelectorAll('.btn-admin-reject').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}]의 가입 신청을 거절하고 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
          try {
            if (!response.ok) throw new Error(data.error);

            showToast('가입 승인 완료', `[${username}] 사용자의 가입이 정상적으로 승인되었습니다.`, 'success');
            renderAdminPanel();
          } catch (err) {
            showToast('승인 실패', err.message, 'error');
          }
        }
      });
    });

    document.querySelectorAll('.btn-admin-reject').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}]의 가입 신청을 거절하고 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
          try {
            const response = await secureFetch('/api/admin/reject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('가입 거절 완료', `[${username}] 사용자의 가입 신청을 거절하고 영구 삭제했습니다.`, 'info');
            renderAdminPanel();
          } catch (err) {
            showToast('거절 실패', err.message, 'error');
          }
        }
      });
    });
  }
            showToast('가입 승인 완료', `[${username}] 사용자의 가입이 정상적으로 승인되었습니다.`, 'success');
            renderAdminPanel();
          } catch (err) {
            showToast('승인 실패', err.message, 'error');
          }
        }
      });
    });

    document.querySelectorAll('.btn-admin-reject').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}]의 가입 신청을 거절하고 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
          try {
            const response = await secureFetch('/api/admin/reject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('가입 거절 완료', `[${username}] 사용자의 가입 신청을 거절하고 영구 삭제했습니다.`, 'info');
            renderAdminPanel();
          } catch (err) {
            showToast('거절 실패', err.message, 'error');
          }
        }
      });
    });
  }

  // --- 15. MULTI-CHANNEL SIGNUP NOTIFICATIONS UI MODULE ---
  const chkWebhookEnabled = document.getElementById('chk-webhook-enabled');
  const txtWebhookUrl = document.getElementById('txt-webhook-url');
  const chkEmailEnabled = document.getElementById('chk-email-enabled');
  const txtEmailHost = document.getElementById('txt-email-host');
  const numEmailPort = document.getElementById('num-email-port');
  const selEmailSecure = document.getElementById('sel-email-secure');
  const txtEmailUser = document.getElementById('txt-email-user');
  const txtEmailPass = document.getElementById('txt-email-pass');
  const txtEmailReceiver = document.getElementById('txt-email-receiver');
  const chkSmsEnabled = document.getElementById('chk-sms-enabled');
  const txtSmsApikey = document.getElementById('txt-sms-apikey');
  const txtSmsApisecret = document.getElementById('txt-sms-apisecret');
  const txtSmsSender = document.getElementById('txt-sms-sender');
  const txtSmsReceiver = document.getElementById('txt-sms-receiver');
  const chkSmsUsekakao = document.getElementById('chk-sms-usekakao');
  const txtSmsPfid = document.getElementById('txt-sms-pfid');
  const txtSmsTemplateid = document.getElementById('txt-sms-templateid');
  const notificationSettingsForm = document.getElementById('notification-settings-form');
  const btnTestNotification = document.getElementById('btn-test-notification');
  
  const panelWebhookConfig = document.getElementById('panel-webhook-config');
  const panelEmailConfig = document.getElementById('panel-email-config');
  const panelSmsConfig = document.getElementById('panel-sms-config');
  const panelSmsKakaoDetails = document.getElementById('panel-sms-kakao-details');

  // Input Toggle panel visibility
  chkWebhookEnabled.addEventListener('change', () => {
    panelWebhookConfig.classList.toggle('hidden', !chkWebhookEnabled.checked);
  });
  
  chkEmailEnabled.addEventListener('change', () => {
    panelEmailConfig.classList.toggle('hidden', !chkEmailEnabled.checked);
  });
  
  chkSmsEnabled.addEventListener('change', () => {
    panelSmsConfig.classList.toggle('hidden', !chkSmsEnabled.checked);
  });

  chkSmsUsekakao.addEventListener('change', () => {
    panelSmsKakaoDetails.classList.toggle('hidden', !chkSmsUsekakao.checked);
  });

  let notificationSettingsLoaded = false;
  async function loadNotificationSettings() {
    if (notificationSettingsLoaded) return;
    try {
      const response = await secureFetch('/api/admin/notifications');
      if (!response.ok) throw new Error('알림 설정을 불러오지 못했습니다.');
      const { settings } = await response.json();
      
      // Webhook config
      chkWebhookEnabled.checked = !!settings.webhook?.enabled;
      txtWebhookUrl.value = settings.webhook?.url || '';
      panelWebhookConfig.classList.toggle('hidden', !chkWebhookEnabled.checked);
      
      // Email config
      chkEmailEnabled.checked = !!settings.email?.enabled;
      txtEmailHost.value = settings.email?.host || 'smtp.gmail.com';
      numEmailPort.value = settings.email?.port || 465;
      selEmailSecure.value = settings.email?.secure !== false ? 'true' : 'false';
      txtEmailUser.value = settings.email?.user || '';
      txtEmailPass.value = settings.email?.pass || '';
      txtEmailReceiver.value = settings.email?.receiver || '';
      panelEmailConfig.classList.toggle('hidden', !chkEmailEnabled.checked);
      
      // SMS config
      chkSmsEnabled.checked = !!settings.sms?.enabled;
      txtSmsApikey.value = settings.sms?.apiKey || '';
      txtSmsApisecret.value = settings.sms?.apiSecret || '';
      txtSmsSender.value = settings.sms?.sender || '';
      txtSmsReceiver.value = settings.sms?.receiver || '';
      chkSmsUsekakao.checked = !!settings.sms?.useKakao;
      txtSmsPfid.value = settings.sms?.pfId || '';
      txtSmsTemplateid.value = settings.sms?.templateId || '';
      panelSmsConfig.classList.toggle('hidden', !chkSmsEnabled.checked);
      panelSmsKakaoDetails.classList.toggle('hidden', !chkSmsUsekakao.checked);
      
      notificationSettingsLoaded = true;
      lucide.createIcons();
    } catch (err) {
      console.error(err);
      showToast('알림 로드 실패', err.message, 'error');
        body: JSON.stringify(getNotificationFormValues())
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      showToast('설정 저장 완료', '알림 및 외부 연동 설정이 성공적으로 보관되었습니다.', 'success');
    } catch (err) {
      showToast('저장 실패', err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = prevText;
      lucide.createIcons();
    }
  });
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      showToast('설정 저장 완료', '알림 및 외부 연동 설정이 성공적으로 보관되었습니다.', 'success');
    } catch (err) {
      showToast('저장 실패', err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = prevText;
      lucide.createIcons();
    }
  });

  // Handle Send Test Notification
  btnTestNotification.addEventListener('click', async () => {
    const prevText = btnTestNotification.innerHTML;
    btnTestNotification.disabled = true;
    btnTestNotification.innerHTML = `<span>발송 중...</span><i data-lucide="loader" class="animate-spin" style="width:16px; height:16px;"></i>`;
    lucide.createIcons();
    
    try {
      const response = await secureFetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getNotificationFormValues())
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      showToast('테스트 알림 발송 완료', '테스트 회원가입(아이디: kfcman_test_user) 알림이 모든 활성화 채널로 발송되었습니다. 수신 상태를 확인해 주세요!', 'success');
    } catch (err) {
      showToast('테스트 발송 실패', err.message, 'error');
    } finally {
      btnTestNotification.disabled = false;
      btnTestNotification.innerHTML = prevText;
      lucide.createIcons();
    }
  });

  // --- 16. USER USAGE STATISTICS & MANAGEMENT UI MODULE ---
  async function renderUserManagementPanel() {
    try {
      const response = await secureFetch('/api/admin/users');
      if (!response.ok) throw new Error('회원 통계를 불러오지 못했습니다.');
      const { users } = await response.json();
      
      const adminUserStatsBody = document.getElementById('admin-user-stats-body');
      if (!adminUserStatsBody) return;
      
      adminUserStatsBody.innerHTML = '';
      
      if (users.length === 0) {
        adminUserStatsBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
              등록된 사용자가 없습니다.
            </td>
          </tr>
        `;
        return;
      }
      
      users.forEach(user => {
        const row = document.createElement('tr');
        
        const dateStr = new Date(user.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const isSelf = user.username.toLowerCase() === userWelcomeName.textContent.replace('님 환영합니다!', '').trim().toLowerCase();
        
        // Status badge
        let statusB
        if (user.approved) {
          statusBadge = `<span class="click-badge has-clicks" style="background: rgba(16, 185, 129, 0.15); color: var(--color-green); border: 1px solid rgba(16, 185, 129, 0.2);"><i data-lucide="check" style="width:12px; height:12px;"></i> 활성</span>`;
        } else {
          statusBadge = `<span class="click-badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);"><i data-lucide="shield-off" style="width:12px; height:12px;"></i> 정지</span>`;
        }
        
        // Warning status info
        let warnIndicator = '';
        if (user.warning) {
          warnIndicator = `<span style="font-size:11px; display:block; color:#ef4444; margin-top:2px; font-weight:500;" title="${user.warning}"><i data-lucide="alert-triangle" style="width:10px; height:10px; display:inline-block; vertical-align:middle;"></i> 경고중</span>`;
        }
        
        // Role badge
        const roleBadge = user.role === 'admin' 
          ? `<span style="background: rgba(6, 182, 212, 0.2); color: var(--color-cyan); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid rgba(6, 182, 212, 0.3);">ADMIN</span>`
          : `<span style="background: rgba(255,255,255,0.06); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid rgba(255,255,255,0.08);">USER</span>`;
        
          <td>
            <div style="font-weight:600; color:var(--color-cyan); display:flex; flex-direction:column; text-align: left;">
              <span>${user.username}</span>
              ${warnIndicator}
            </div>
          </td>
          </td>
          <td>${roleBadge}</td>
          <td><strong style="color:var(--color-purple);">${user.totalLinks}개</strong></td>
          <td><strong style="color:var(--color-cyan);">${user.totalClicks}회</strong></td>
          <td><span class="table-date">${dateStr}</span></td>
          <td>${statusBadge}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-glass btn-user-warn" data-username="${user.username}" data-warning="${user.warning || ''}" title="경고 메시지 전송" style="padding:4px 8px; font-size:11px; height:auto; border-color: rgba(234, 179, 8, 0.3); color: var(--color-yellow);">
                <i data-lucide="bell" style="width:12px; height:12px;"></i> 경고
              </button>
              <button class="btn btn-sm btn-glass btn-user-toggle-block" data-username="${user.username}" title="${user.approved ? '계정 정지' : '계정 활성화'}" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''} style="padding:4px 8px; font-size:11px; height:auto; border-color: ${user.approved ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; color: ${user.approved ? '#f87171' : 'var(--color-green)'};">
                <i data-lucide="${user.approved ? 'user-x' : 'user-check'}" style="width:12px; height:12px;"></i> ${user.approved ? '정지' : '승인'}
              </button>
              <button class="btn btn-sm btn-glass-danger btn-user-delete" data-username="${user.username}" title="계정 영구 삭제" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''} style="padding:4px 8px; font-size:11px; height:auto; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); color: #ef4444;">
                <i data-lucide="trash-2" style="width:12px; height:12px;"></i> 삭제
              </button>
            </div>
          </td>
        `;
        
        adminUserStatsBody.appendChild(row);
      });
      
      lucide.createIcons();
      bindUserManagementActionEvents();
    } catch (err) {
      console.error(err);
            <div class="font-bold text-brand-cyan flex flex-col text-left text-sm">
              <span>${user.username}</span>
              ${warnIndicator}
            </div>
          </td>
          <td>${roleBadge}</td>
          <td><strong class="text-brand-purple font-bold text-sm">${user.totalLinks}개</strong></td>
          <td><strong class="text-brand-cyan font-bold text-sm">${user.totalClicks}회</strong></td>
          <td><span class="text-xs text-slate-400 font-medium">${dateStr}</span></td>
          <td>${statusBadge}</td>
          <td>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button class="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold px-2 py-1 text-[10px] rounded transition-all btn-user-warn flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" data-warning="${user.warning || ''}" title="경고 메시지 전송">
                <i data-lucide="bell" class="w-3 h-3 text-brand-yellow"></i> 경고
              </button>
              <button class="bg-white/5 border border-white/10 hover:bg-white/10 font-bold px-2 py-1 text-[10px] rounded transition-all btn-user-toggle-block flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" title="${user.approved ? '계정 정지' : '계정 활성화'}" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''} style="border-color: ${user.approved ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; color: ${user.approved ? '#f87171' : 'var(--color-green)'};">
                <i data-lucide="${user.approved ? 'user-x' : 'user-check'}" class="w-3 h-3"></i> ${user.approved ? '정지' : '승인'}
              </button>
              <button class="bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 text-red-400 font-bold px-2 py-1 text-[10px] rounded transition-all btn-user-delete flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" title="계정 영구 삭제" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''}>
                <i data-lucide="trash-2" class="w-3 h-3"></i> 삭제
              </button>
            </div>
          </td>
        `;
        
        adminUserStatsBody.appendChild(row);
      });
      
      lucide.createIcons();
      bindUserManagementActionEvents();
    } catch (err) {
      console.error(err);
      showToast('회원 관리 오류', err.message, 'error');
    }
  }

  function bindUserManagementActionEvents() {
    // Warn action
    document.querySelectorAll('.btn-user-warn').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        const currentWarning = button.getAttribute('data-warning');
        
        const message = prompt(`사용자 [${username}] 회원에게 대시보드에 노출할 경고 메시지를 입력하세요.\n(입력 값을 비우고 [확인]을 누르면 경고 배너가 즉시 제거됩니다.):`, currentWarning);
        
        if (message !== null) {
          try {
            const response = await secureFetch('/api/admin/users/warn', {
              method: 'POST',
            showToast('상태 변경 실패', err.message, 'error');
          }
        }
      });
    });

    // Delete action
    document.querySelectorAll('.btn-user-delete').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`⚠️ 경고: 사용자 [${username}]의 계정을 영구 삭제하시겠습니까?\n삭제 시 해당 사용자가 소유한 모든 단축 링크 및 통계 데이터도 영구히 파괴됩니다.`)) {
          try {
            const response = await secureFetch('/api/admin/users/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            showToast('계정 영구 삭제 완료', data.message, 'success');
            renderUserManagementPanel();
          } catch (err) {
            showToast('계정 삭제 실패', err.message, 'error');
          }
        }
      });
    });
  }

"  // Refresh user stats button\n  const refreshUserStatsBtn = document.getElementById('btn-refresh-user-stats');\n  if (refreshUserStatsBtn) {\n    refreshUserStatsBtn.addEventListener('click', () => {\n      renderUserManagementPanel();\n      showToast('새로고침 완료', '회원 사용량 및 계정 상태 정보를 다시 읽어왔습니다.', 'info');\n    });\n  }\n\n  // --- REAL-TIME POLLS (SURVEYS) FRONTEND SYSTEM ---\n\n  // DOM Elements\n  const navItemShortener = document.getElementById('nav-item-shortener');\n  const navItemDashboard = document.getElementById('nav-item-dashboard');\n  const navItemPolls = document.getElementById('nav-item-polls');\n  const shortenerSection = document.getElementById('shortener-section');\n  const dashboardSection = document.getElementById('dashboard-section');\n  const pollsSection = document.getElementById('polls-section');\n\n  const btnCreatePollToggle = document.getElementById('btn-create-poll-toggle');\n  const btnClosePollCreate = document.getElementById('btn-close-poll-create');\n  const createPollCard = document.getElementById('create-poll-card');\n  const createPollForm = document.getElementById('create-poll-form');\n  const pollOptionsContainer = document.getElementById('poll-options-container');\n  const btnAddPollOption = document.getElementById('btn-add-poll-option');\n  \n  const pollSearchInput = document.getElementById('poll-search-input');\n  const btnFilterPollAll = document.getElementById('btn-filter-poll-all');\n  const btnFilterPollActive = document.getElementById('btn-filter-poll-active');\n  const btnFilterPollClosed = document.getElementById('btn-filter-poll-closed');\n  \n  const pollsEmptyState = document.getElementById('polls-empty-state');\n  const pollsGrid = document.getElementById('polls-grid');\n  \n  const pollVoteModal = document.getElementById('poll-vote-modal');\n  const btnPollModalClose = document.getElementById('btn-poll-modal-close');\n  const pollModalBadgeStatus = document.getElementById('poll-modal-badge-status');\n  cons
<truncated 27599 bytes>
  if (refreshUserStatsBtn) {
    refreshUserStatsBtn.addEventListener('click', () => {
      renderUserManagementPanel();
      showToast('새로고침 완료', '회원 사용량 및 계정 상태 정보를 다시 읽어왔습니다.', 'info');
    });
  }

  // Initial runs

  // DOM Elements
  const navItemShortener = document.getElementById('nav-item-shortener');
  const navItemDashboard = document.getElementById('nav-item-dashboard');
  const navItemPolls = document.getElementById('nav-item-polls');
  const shortenerSection = document.getElementById('shortener-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const pollsSection = document.getElementById('polls-section');

  const btnCreatePollToggle = document.getElementById('btn-create-poll-toggle');
  const btnClosePollCreate = document.getElementById('btn-close-poll-create');
  const createPollCard = document.getElementById('create-poll-card');
  const createPollForm = document.getElementById('create-poll-form');
  const pollOptionsContainer = document.getElementById('poll-options-container');
  const btnAddPollOption = document.getElementById('btn-add-poll-option');
  
  const pollSearchInput = document.getElementById('poll-search-input');
  const btnFilterPollAll = document.getElementById('btn-filter-poll-all');
  const btnFilterPollActive = document.getElementById('btn-filter-poll-active');
  const btnFilterPollClosed = document.getElementById('btn-filter-poll-closed');
  
  const pollsEmptyState = document.getElementById('polls-empty-state');
  const pollsGrid = document.getElementById('polls-grid');
  
  const pollVoteModal = document.getElementById('poll-vote-modal');
  const btnPollModalClose = document.getElementById('btn-poll-modal-close');
  const pollModalBadgeStatus = document.getElementById('poll-modal-badge-status');
  const pollModalBadgeMultiple = document.getElementById('poll-modal-badge-multiple');
  const pollModalTitle = document.getElementById('poll-modal-title');
  const pollModalOwner = document.getElementById('poll-modal-owner');
  const pollModalTimer = document.getElementById('poll-modal-timer');
  
  const pollModalVoteScreen = document.getElementById('poll-modal-vote-screen');
  const pollVoteForm = document.getElementById('poll-vote-form');
  const pollVoteOptionsList = document.getElementById('poll-vote-options-list');
"  const btnSubmitVote = document.getElementById('btn-submit-vote');\n  \n  const pollModalStatsScreen = document.getElementById('poll-modal-stats-screen');\n  const pollStatsBarsList = document.getElementById('poll-stats-bars-list');\n  const pollModalTotalVotes = document.getElementById('poll-modal-total-votes');\n  const pollVotedNotice = document.getElementById('poll-voted-notice');\n\n  // Visualization View Tabs\n  const btnPollViewBar = document.getElementById('btn-poll-view-bar');\n  const btnPollViewDonut = document.getElementById('btn-poll-view-donut');\n  const btnPollViewCloud = document.getElementById('btn-poll-view-cloud');\n  const pollStatsDonutContainer = document.getElementById('poll-stats-donut-container');\n  const pollStatsWordcloud = document.getElementById('poll-stats-wordcloud');\n  const pollDonutSvg = document.getElementById('poll-donut-svg');\n  const pollDonutLegend = document.getElementById('poll-donut-legend');\n  const donutCenterPercent = document.getElementById('donut-center-percent');\n  const donutCenterLabel = document.getElementById('donut-center-label');\n\n  let currentPollViewTab = 'bar'; // 'bar', 'donut', 'cloud'\n  let currentActivePollId = null;\n\n  if (btnPollViewBar) btnPollViewBar.addEventListener('click', () => setPollViewTab('bar'));\n  if (btnPollViewDonut) btnPollViewDonut.addEventListener('click', () => setPollViewTab('donut'));\n  if (btnPollViewCloud) btnPollViewCloud.addEventListener('click', () => setPollViewTab('cloud'));\n\n  function setPollViewTab(tab) {\n    currentPollViewTab = tab;\n    if (btnPollViewBar) btnPollViewBar.classList.toggle('active', tab === 'bar');\n    if (btnPollViewDonut) btnPollViewDonut.classList.toggle('active', tab === 'donut');\n    if (btnPollViewCloud) btnPollViewCloud.classList.toggle('active', tab === 'cloud');\n\n    togglePollViewTabContainers();\n  }\n\n  function togglePollViewTabContainers() {\n    if (pollStatsBarsList) pollStatsBarsList.classList.toggle('hidden', currentPollViewTab !== 'bar');\n    if (pollStatsDonut
<truncated 208 bytes>
  const pollModalStatsScreen = document.getElementById('poll-modal-stats-screen');
  const pollStatsBarsList = document.getElementById('poll-stats-bars-list');
  const pollModalTotalVotes = document.getElementById('poll-modal-total-votes');
  const pollVotedNotice = document.getElementById('poll-voted-notice');

  let currentActivePollId = null;
  let pollFilter = 'all'; // 'all', 'active', 'closed'
  let pollsData = [];
  
  const pollsEmptyState = document.getElementById('polls-empty-state');
  const pollsGrid = document.getElementById('polls-grid');
  
  const pollVoteModal = document.getElementById('poll-vote-modal');
  const btnPollModalClose = document.getElementById('btn-poll-modal-close');
  const pollModalBadgeStatus = document.getElementById('poll-modal-badge-status');
  const pollModalBadgeMultiple = document.getElementById('poll-modal-badge-multiple');
  const pollModalTitle = document.getElementById('poll-modal-title');
  const pollModalOwner = document.getElementById('poll-modal-owner');
  const pollModalTimer = document.getElementById('poll-modal-timer');
  
  const pollModalVoteScreen = document.getElementById('poll-modal-vote-screen');
  const pollVoteForm = document.getElementById('poll-vote-form');
  const pollVoteOptionsList = document.getElementById('poll-vote-options-list');
  const btnSubmitVote = document.getElementById('btn-submit-vote');
  
  const pollModalStatsScreen = document.getElementById('poll-modal-stats-screen');
  const pollStatsBarsList = document.getElementById('poll-stats-bars-list');
  const pollModalTotalVotes = document.getElementById('poll-modal-total-votes');
  const pollVotedNotice = document.getElementById('poll-voted-notice');

  // Visualization View Tabs
  const btnPollViewBar = document.getElementById('btn-poll-view-bar');
  const btnPollViewDonut = document.getElementById('btn-poll-view-donut');
  const btnPollViewCloud = document.getElementById('btn-poll-view-cloud');
  const pollStatsDonutContainer = document.getElementById('poll-stats-donut-container');
  const pollStatsWordcloud = document.getElementById('poll-stats-wordcloud');
  const pollDonutSvg = document.getElementById('poll-donut-svg');
  const pollDonutLegend = document.getElementById('poll-donut-legend');
  const donutCenterPercent = document.getElementById('donut-center-percent');
  const donutCenterLabel = document.getElementById('donut-center-label');

  let currentPollViewTab = 'bar'; // 'bar', 'donut', 'cloud'
  let currentActivePollId = null;

  const pollDonutLegend = document.getElementById('poll-donut-legend');
  const donutCenterPercent = document.getElementById('donut-center-percent');
  const donutCenterLabel = document.getElementById('donut-center-label');

  let currentPollViewTab = 'bar'; // 'bar', 'donut', 'cloud'
  let currentActivePollId = null;

  if (btnPollViewBar) btnPollViewBar.addEventListener('click', () => setPollViewTab('bar'));
  if (btnPollViewDonut) btnPollViewDonut.addEventListener('click', () => setPollViewTab('donut'));
  if (btnPollViewCloud) btnPollViewCloud.addEventListener('click', () => setPollViewTab('cloud'));

  function setPollViewTab(tab) {
    currentPollViewTab = tab;
    
    const activeClasses = ['bg-brand-cyan/20', 'border-brand-cyan/35', 'text-brand-cyan'];
    const inactiveClasses = ['bg-white/5', 'border-white/10', 'text-slate-300'];
    
    const updateTabStyles = (btn, isActive) => {
      if (!btn) return;
      if (isActive) {
        btn.classList.add(...activeClasses);
        btn.classList.remove(...inactiveClasses);
        btn.classList.add('active');
      } else {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
        btn.classList.remove('active');
      }
    };
    
    updateTabStyles(btnPollViewBar, tab === 'bar');
    updateTabStyles(btnPollViewDonut, tab === 'donut');
    updateTabStyles(btnPollViewCloud, tab === 'cloud');

    togglePollViewTabContainers();
  }

  function togglePollViewTabContainers() {
    if (pollStatsBarsList) pollStatsBarsList.classList.toggle('hidden', currentPollViewTab !== 'bar');
    if (pollStatsDonutContainer) pollStatsDonutContainer.classList.toggle('hidden', currentPollViewTab !== 'donut');
    if (pollStatsWordcloud) pollStatsWordcloud.classList.toggle('hidden', currentPollViewTab !== 'cloud');
  }
  let pollFilter = 'all'; // 'all', 'active', 'closed'
  let pollsData = [];
  let currentUsername = '';

  // SPA Navigation Toggling
  if (navItemShortener) {
    navItemShortener.addEventListener('click', (e) => {
      e.preventDefault();
      showShortenerTab();
    });
  }

  if (navItemDashboard) {
    navItemDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      showShortenerTab();
      // Scroll to dashboard
      });
    });
  }

  function renumberOptions() {
    if (!pollOptionsContainer) return;
    const inputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
    inputs.forEach((input, index) => {
      input.placeholder = `문항 ${index + 1} 입력`;
    });
    optionCount = inputs.length;
  }

  // Poll Form Submit Handler
  if (createPollForm) {
    createPollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('poll-title-input').value.trim();
      const durationMinutes = parseInt(document.getElementById('poll-duration-input').value) || 10;
      const allowMultiple = document.getElementById('poll-multiple-input').checked;
      const dupMode = document.getElementById('poll-dup-mode-input').value;
      
      const optionInputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
      const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(Boolean);
  
      if (options.length < 2) {
        showToast('문항 작성 오류', '설문 조사를 위해 최소 2개 이상의 유효한 문항을 입력해 주세요.', 'error');
        return;
      }
  
      const submitBtn = document.getElementById('btn-create-poll-submit');
      const btnSpan = submitBtn.querySelector('span');
      submitBtn.disabled = true;
      btnSpan.textContent = '게시글 업로드 중...';
  
      try {
        const response = await secureFetch('/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, options, durationMinutes, allowMultiple, dupMode })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast('선호도 조사 등록 완료', '신규 실시간 선호도 설문 조사가 보드에 무사히 게시되었습니다!', 'success');
        
        // Reset Form fields
        document.getElementById('poll-title-input').value = '';
        pollOptionsContainer.innerHTML = `
          <div class="poll-option-row" style="display: flex; gap: 10px; align-items: center;">
            <div class="input-group" style="flex: 1; padding: 4px;">
  // Dynamic choice fields management
  let optionCount = 2;
  if (btnAddPollOption) {
    btnAddPollOption.addEventListener('click', () => {
      optionCount++;
      const row = document.createElement('div');
      row.className = 'poll-option-row animate-fade-in flex gap-3 items-center';
      
      row.innerHTML = `
        <div class="flex-1 flex items-center bg-slate-900/40 dark:bg-slate-900/40 border border-white/5 focus-within:border-brand-cyan/50 rounded-xl px-4 py-3 gap-3 transition-all">
          <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400 flex-shrink-0"></i>
          <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 cursor-text" placeholder="문항 ${optionCount} 입력" required autocomplete="off">
        </div>
        <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500/10 text-red-400 btn-delete-option active:scale-95 transition-all flex-shrink-0">
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      `;
      if (pollOptionsContainer) {
        pollOptionsContainer.appendChild(row);
  if (createPollForm) {
    createPollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('poll-title-input').value.trim();
      const durationMinutes = parseInt(document.getElementById('poll-duration-input').value) || 10;
      const allowMultiple = document.getElementById('poll-multiple-input').checked;
      const dupMode = document.getElementById('poll-dup-mode-input').value;
      
      const optionInputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
      const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(Boolean);
  
      if (options.length < 2) {
        showToast('문항 작성 오류', '설문 조사를 위해 최소 2개 이상의 유효한 문항을 입력해 주세요.', 'error');
        return;
      }
  
      const submitBtn = document.getElementById('btn-create-poll-submit');
      const btnSpan = submitBtn.querySelector('span');
      submitBtn.disabled = true;
      btnSpan.textContent = '게시글 업로드 중...';
  
      try {
        const response = await secureFetch('/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, options, durationMinutes, allowMultiple, dupMode })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        // Generate Guest-Friendly Shareable URL
        const shareUrl = `${window.location.origin}/?poll=${data.poll.id}`;

        // Attempt automatic clipboard copy
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast(
            '선호도 조사 등록 완료 (복사 완료)',
            `비로그인 유저도 참여 가능한 단축 공유 주소가 자동으로 복사되었습니다!<br><br><strong style="color:var(--color-cyan); font-size:12.5px; word-break:break-all;">${shareUrl}</strong><br><br>카카오톡, 네이버 밴드 등에 이 주소를 붙여넣어 즉시 투표를 진행해 보세요.`,
            'success'
          );
        } catch (copyErr) {
          // Fallback if clipboard writing is blocked
          showToast(
            '선호도 조사 등록 완료',
            `비로그인 유저 참여 단축 주소:<br><strong style="color:var(--color-cyan); font-size:12.5px; word-break:break-all;">${shareUrl}</strong><br><br>위 주소를 복사하여 사람들에게 바로 알리세요!`,
            'success'
          );
        }
          </div>
        `;
        optionCount = 2;
        lucide.createIcons();
  
        if (createPollCard) createPollCard.classList.add('hidden');
        fetchAndRenderPolls();
  
      } catch (err) {
        showToast('등록 실패', err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      if (pollsEmptyState) pollsEmptyState.classList.remove('hidden');
      pollsGrid.classList.add('hidden');
      return;
    }

  if (pollSearchInput) pollSearchInput.addEventListener('input', () => renderPollsList());

  function setPollFilter(filter) {
    pollFilter = filter;
    if (btnFilterPollAll) btnFilterPollAll.classList.toggle('active', filter === 'all');
    if (btnFilterPollActive) btnFilterPollActive.classList.toggle('active', filter === 'active');
    if (btnFilterPollClosed) btnFilterPollClosed.classList.toggle('active', filter === 'closed');
    renderPollsList();
  }

  // Fetch and Render Polls Grid
  async function fetchAndRenderPolls() {
    try {
      // Capture username from welcome tag safely
      const nameTag = document.getElementById('user-welcome-name');
      currentUsername = nameTag ? nameTag.textContent.trim() : '';

      const response = await secureFetch('/api/polls');
      if (!response.ok) throw new Error('설문 정보를 로드하지 못했습니다.');
      const data = await response.json();
      pollsData = data.polls || [];

      renderPollsList();
      initPollsTimerLoop();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('로딩 실패', err.message, 'error');
      }
    }
  }

  function renderPollsList() {
    if (!pollsGrid) return;
    pollsGrid.innerHTML = '';
    const searchQuery = pollSearchInput ? pollSearchInput.value.trim().toLowerCase() : '';

    // Filter logic
    let filtered = pollsData.filter(poll => {
      const isExpired = new Date() > new Date(poll.expiresAt);
      const matchesFilter = (pollFilter === 'all') || 
                            (pollFilter === 'active' && !isExpired) || 
                            (pollFilter === 'closed' && isExpired);
      
      const matchesSearch = !searchQuery || 
                            poll.title.toLowerCase().includes(searchQuery) || 
                            poll.owner.toLowerCase().includes(searchQuery);
            ${statusText}
          </span>
          <span style="font-size:12px; color:var(--text-muted);">작성자: <strong>${ownerLabel}</strong></span>
        </div>
        ? `${poll.owner} <span style="font-size:10px; background:rgba(6,182,212,0.15); color:var(--color-cyan); padding:2px 6px; border-radius:4px; margin-left:4px;">관리자</span>`
        : poll.owner;

      const totalVotesCount = poll.voters ? poll.voters.length : 0;
      
      // Calculate countdown string
      const countdownHtml = isExpired 
        ? `<span style="color:var(--text-muted); font-size:13px; font-weight:600;"><i data-lucide="calendar-x" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> 투표 종료</span>`
        : `<span class="poll-countdown-timer" data-expires="${poll.expiresAt}" style="color:#ff9f43; font-size:13px; font-weight:700;"><i data-lucide="clock" style="width:14px; height:14px; display:inline-block; vertical-align:middle; animation:pulse 1.5s infinite;"></i> 계산 중...</span>`;

      // Check if user already voted
      const cleanUser = currentUsername.toLowerCase();
      let hasVoted = false;
      if (poll.voters) {
        if (poll.dupMode === 'hourly') {
          const latestVote = [...poll.voters].reverse().find(v => v.username === cleanUser);
          if (latestVote) {
            const timeElapsed = Date.now() - new Date(latestVote.timestamp).getTime();
            hasVoted = timeElapsed < 3600000;
          }
        } else {
          hasVoted = poll.voters.some(v => v.username === cleanUser);
        }
      }

        ? `${poll.owner} <span style="font-size:10px; background:rgba(6,182,212,0.15); color:var(--color-cyan); padding:2px 6px; border-radius:4px; margin-left:4px;">관리자</span>`
        : poll.owner;

      const totalVotesCount = poll.voters ? poll.voters.length : 0;
      
      // Calculate countdown string
      const countdownHtml = isExpired 
        ? `<span style="color:var(--text-muted); font-size:13px; font-weight:600;"><i data-lucide="calendar-x" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> 투표 종료</span>`
        : `<span class="poll-countdown-timer" data-expires="${poll.expiresAt}" style="color:#ff9f43; font-size:13px; font-weight:700;"><i data-lucide="clock" style="width:14px; height:14px; display:inline-block; vertical-align:middle; animation:pulse 1.5s infinite;"></i> 계산 중...</span>`;

      // Check if user already voted
      const cleanUser = currentUsername.toLowerCase();
      let hasVoted = localStorage.getItem('kfcman_voted_' + poll.id) === 'true';
      if (!hasVoted && poll.voters) {
        if (poll.dupMode === 'hourly') {
          const latestVote = [...poll.voters].reverse().find(v => v.username === cleanUser);
          if (latestVote) {
            const timeElapsed = Date.now() - new Date(latestVote.timestamp).getTime();
            hasVoted = timeElapsed < 3600000;
          }
        } else {
          if (cleanUser) {
            hasVoted = poll.voters.some(v => v.username === cleanUser);
          }
        }
      }

      let deleteButtonHtml = '';
      if (cleanUser === 'kfcman' || cleanUser === 'admin' || poll.owner === cleanUser) {
        deleteButtonHtml = `
          <button class="btn-action-icon btn-delete-poll" data-id="${poll.id}" title="설문 삭제" style="width:36px; height:36px; border-radius:8px; border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.06); color:#ef4444;">
            <i data-lucide="trash-2"></i>
          </button>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 700; background: ${isExpired ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'}; color: ${statusColor}; border: 1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; display:flex; align-items:center; gap:4px;">
              ${!isExpired ? '<span style="width:5px; height:5px; border-radius:50%; background:var(--color-green); display:inline-block; animation:pulse 1s infinite;"></span>' : ''}
              ${statusText}
            </span>
            <span style="font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: ${poll.dupMode === 'hourly' ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.04)'}; color: ${poll.dupMode === 'hourly' ? 'var(--color-yellow)' : 'var(--text-muted)'}; border: 1px solid ${poll.dupMode === 'hourly' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)'};">
              ${poll.dupMode === 'hourly' ? '1시간마다 참여' : '평생 1회 제한'}
            </span>
  }

  // Countdown timer clock interval
  function initPollsTimerLoop() {
    if (window.pollCountdownInterval) {
      clearInterval(window.pollCountdownInterval);
    }
    
    window.pollCountdownInterval = setInterval(() => {
      const timers = document.querySelectorAll('.poll-countdown-timer');
      if (timers.length === 0) {
        clearInterval(window.pollCountdownInterval);
        window.pollCountdownInterval = null;
        return;
            </span>
            <span style="font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: ${poll.dupMode === 'hourly' ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.04)'}; color: ${poll.dupMode === 'hourly' ? 'var(--color-yellow)' : 'var(--text-muted)'}; border: 1px solid ${poll.dupMode === 'hourly' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)'};">
              ${poll.dupMode === 'hourly' ? '1시간마다 참여' : '평생 1회 제한'}
            </span>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">작성자: <strong>${ownerLabel}</strong></span>
        </div>
        
        <h3 style="font-size:16px; font-weight:700; color:#ffffff; line-height:1.4; margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:44px;" title="${poll.title}">
          ${poll.title}
        </h3>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding:10px; border-radius:8px; background:rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.02);">
          ${countdownHtml}
          <span style="font-size:12px; color:var(--text-muted);">참여: <strong style="color:var(--color-cyan);">${totalVotesCount}명</strong></span>
        </div>
  }

  // Countdown timer clock interval
  function initPollsTimerLoop() {
    if (window.pollCountdownInterval) {
      clearInterval(window.pollCountdownInterval);
    }
    
    window.pollCountdownInterval = setInterval(() => {
      const timers = document.querySelectorAll('.poll-countdown-timer');
      if (timers.length === 0) {
        clearInterval(window.pollCountdownInterval);
        window.pollCountdownInterval = null;
        return;
      }

      timers.forEach(timer => {
        const expiresAtStr = timer.getAttribute('data-expires');
        const expiresAt = new Date(expiresAtStr);
        const now = new Date();
        const diffMs = expiresAt - now;

        if (diffMs <= 0) {
          timer.parentElement.innerHTML = `<span style="color:var(--text-muted); font-size:13px; font-weight:600;"><i data-lucide="calendar-x" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> 투표 종료</span>`;
          lucide.createIcons();
          // Refresh list to update UI
          fetchAndRenderPolls();
        } else {
        const id = btn.getAttribute('data-id');
        if (confirm('이 실시간 선호도 설문 조사를 보드에서 영구히 삭제하시겠습니까?\n투표한 모든 사람들의 참여 로그 및 통계 결과도 함께 파괴됩니다.')) {
          try {
            const response = await secureFetch(`/api/polls/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('삭제 성공', '선호도 조사가 정상적으로 영구 파괴되었습니다.', 'success');
            fetchAndRenderPolls();
          } catch (err) {
            showToast('삭제 실패', err.message, 'error');
          }
        }
      });
    });
  }
        const id = btn.getAttribute('data-id');
        openPollModal(id, 'vote');
      });
    });

    document.querySelectorAll('.btn-stats-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openPollModal(id, 'stats');
      });
    });

    document.querySelectorAll('.btn-share-poll').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const shareUrl = `${window.location.origin}/?poll=${id}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast(
            '설문 주소 복사 완료',
            '선호도 조사 참여 링크가 클립보드에 안전하게 복사되었습니다. 카카오톡이나 밴드 등에 붙여넣어 사람들에게 의견을 물어보세요!',
            'success'
          );
        }).catch(() => {
          const tempInput = document.createElement('input');
          tempInput.value = shareUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast(
            '설문 주소 복사 완료',
            '선호도 조사 참여 링크가 복사되었습니다.',
            'success'
          );
        });
      });
    });

    document.querySelectorAll('.btn-delete-poll').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('이 실시간 선호도 설문 조사를 보드에서 영구히 삭제하시겠습니까?\n투표한 모든 사람들의 참여 로그 및 통계 결과도 함께 파괴됩니다.')) {
          try {
            const response = await secureFetch(`/api/polls/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('삭제 성공', '선호도 조사가 정상적으로 영구 파괴되었습니다.', 'success');
            fetchAndRenderPolls();
          } catch (err) {
            showToast('삭제 실패', err.message, 'error');
          }
        }
      });
    });
  }

  // Modal flow
  async function openPollModal(pollId, initialScreen = 'vote') {
    currentActivePollId = pollId;
    if (pollVoteModal) pollVoteModal.classList.remove('hidden');
    
    await fetchPollDetailsAndDraw(pollId, initialScreen);
    
    // Start 3-second live auto-refresh statistics
    startLivePollInterval(pollId);
  }

  async function fetchPollDetailsAndDraw(pollId, screenType) {
    try {
      const response = await secureFetch(`/api/polls/${pollId}`);
      if (!response.ok) throw new Error('설문 상세 정보를 수집하지 못했습니다.');
      const { poll } = await response.json();

      const isExpired = new Date() > new Date(poll.expiresAt);
      const cleanUser = currentUsername.toLowerCase();
      
      let hasVoted = localStorage.getItem('kfcman_voted_' + poll.id) === 'true';
      if (!hasVoted && poll.voters) {
        if (poll.dupMode === 'hourly') {
          if (cleanUser) {
            const latestVote = [...poll.voters].reverse().find(v => v.username === cleanUser);
            if (latestVote) {
              const timeElapsed = Date.now() - new Date(latestVote.timestamp).getTime();
              hasVoted = timeElapsed < 3600000;
            }
          }
        } else {
          if (cleanUser) {
            hasVoted = poll.voters.some(v => v.username === cleanUser);
          }
        }
      }
      // Header labels
      
      let hasVoted = localStorage.getItem('kfcman_voted_' + poll.id) === 'true';
      if (!hasVoted && poll.voters) {
        if (poll.dupMode === 'hourly') {
          if (cleanUser) {
            const latestVote = [...poll.voters].reverse().find(v => v.username === cleanUser);
            if (latestVote) {
              const timeElapsed = Date.now() - new Date(latestVote.timestamp).getTime();
              hasVoted = timeElapsed < 3600000;
            }
          }
        } else {
          if (cleanUser) {
            hasVoted = poll.voters.some(v => v.username === cleanUser);
          }
        }
      }

      // Force stats view if expired or already voted
      const viewMode = (screenType === 'vote' && !isExpired && !hasVoted) ? 'vote' : 'stats';

      // Header labels
      if (pollModalBadgeStatus) {
        pollModalBadgeStatus.textContent = isExpired ? '마감됨' : '진행중';
        pollModalBadgeStatus.style.background = isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
        pollModalBadgeStatus.style.color = isExpired ? '#f87171' : 'var(--color-green)';
      }
      
      if (pollModalBadgeMultiple) {
        pollModalBadgeMultiple.textContent = poll.allowMultiple ? '다중 선택' : '단수 선택';
        pollModalBadgeMultiple.style.background = poll.allowMultiple ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.15)';
        pollModalBadgeMultiple.style.color = poll.allowMultiple ? 'var(--color-purple)' : 'var(--color-cyan)';
      }

      const pollModalBadgeDup = document.getElementById('poll-modal-badge-dup');
      if (pollModalBadgeDup) {
        pollModalBadgeDup.textContent = poll.dupMode === 'hourly' ? '1시간 주기 재참여' : '평생 1회 제한';
        pollModalBadgeDup.style.background = poll.dupMode === 'hourly' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.06)';
        pollModalBadgeDup.style.color = poll.dupMode === 'hourly' ? 'var(--color-yellow)' : 'var(--text-muted)';
      }

      if (pollModalTitle) pollModalTitle.textContent = poll.title;
      if (pollModalOwner) pollModalOwner.textContent = poll.owner;

      // Timer calculation
      if (pollModalTimer) {
        if (isExpired) {
          pollModalTimer.textContent = '투표 마감됨';
          pollModalTimer.style.color = '#f87171';
        } else {
          const diffSecs = Math.max(0, Math.floor((new Date(poll.expiresAt) - new Date()) / 1000));
        // Store client-side trace for guest duplicate voting checks
        localStorage.setItem('kfcman_voted_' + currentActivePollId, 'true');

        showToast('투표 성공', '성공적으로 선호도 조사에 참여하셨습니다. 소중한 의견 감사드립니다!', 'success');
        
        // Update modal stats
        await fetchPollDetailsAndDraw(currentActivePollId, 'stats');
        fetchAndRenderPolls();
          });
        }

      } else {
        if (pollModalVoteScreen) pollModalVoteScreen.classList.add('hidden');
        if (pollModalStatsScreen) pollModalStatsScreen.classList.remove('hidden');
        
        const totalVotesCount = poll.voters ? poll.voters.length : 0;
        if (pollModalTotalVotes) pollModalTotalVotes.textContent = `${totalVotesCount}명`;
        
        if (pollVotedNotice) pollVotedNotice.classList.toggle('hidden', !hasVoted);

        // 1. Draw results HSL gradient horizontal bar charts

        // 1. Draw results HSL gradient horizontal bar charts
        if (pollStatsBarsList) {
          pollStatsBarsList.innerHTML = '';
          
          poll.options.forEach((opt, idx) => {
            const percent = totalVotesCount > 0 ? ((opt.votes / totalVotesCount) * 100).toFixed(1) : '0.0';
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '6px';
  
            const hue = (idx * 137) % 360; // Beautiful spread of distinct hues
            const gradientStyle = `linear-gradient(90deg, hsla(${hue}, 85%, 60%, 0.95), hsla(${hue + 25}, 85%, 50%, 0.95))`;
  
            container.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px;">
                <span style="font-weight:600; color:#ffffff;">${opt.text}</span>
                <span style="font-weight:700; color:var(--text-main);">${percent}% <span style="font-weight:500; font-size:11.5px; color:var(--text-muted);">(${opt.votes}표)</span></span>
              </div>
              <div style="width:100%; height:14px; border-radius:99px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); overflow:hidden;">
                <div style="width:${percent}%; height:100%; border-radius:99px; background:${gradientStyle}; box-shadow:0 0 12px hsla(${hue}, 85%, 60%, 0.4); transition: width 0.8s cubic-bezier(0.1, 0.8, 0.25, 1);"></div>
              </div>
            `;
            
            pollStatsBarsList.appendChild(container);
          });
        }

        if (pollModalStatsScreen) pollModalStatsScreen.classList.add('hidden');
        
        // Draw voting options list
        if (pollVoteOptionsList) {
          pollVoteOptionsList.innerHTML = '';
          poll.options.forEach(opt => {
            const item = document.createElement('label');
            item.className = 'glass-panel flex items-center gap-3.5 px-4.5 py-3.5 cursor-pointer hover:bg-white/5 active:scale-[0.99] transition-all border border-white/5 rounded-xl';
  
            const inputType = poll.allowMultiple ? 'checkbox' : 'radio';
            item.innerHTML = `
              <input type="${inputType}" name="poll_choice" value="${opt.index}" class="w-4.5 h-4.5 accent-brand-cyan cursor-pointer">
              <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${opt.text}</span>
            `;
            
            pollVoteOptionsList.appendChild(item);
          });
        }

      } else {
        if (pollModalVoteScreen) pollModalVoteScreen.classList.add('hidden');
        if (pollModalStatsScreen) pollModalStatsScreen.classList.remove('hidden');
        
        const totalVotesCount = poll.voters ? poll.voters.length : 0;
        if (pollModalTotalVotes) pollModalTotalVotes.textContent = `${totalVotesCount}명`;
        
        if (pollVotedNotice) pollVotedNotice.classList.toggle('hidden', !hasVoted);

        // 1. Draw results HSL gradient horizontal bar charts
        if (pollStatsBarsList) {
          pollStatsBarsList.innerHTML = '';
          
          poll.options.forEach((opt, idx) => {
            const percent = totalVotesCount > 0 ? ((opt.votes / totalVotesCount) * 100).toFixed(1) : '0.0';
            const container = document.createElement('div');
            container.className = 'flex flex-col gap-1.5';
  
            const hue = (idx * 137) % 360;
            const gradientStyle = `linear-gradient(90deg, hsla(${hue}, 85%, 60%, 0.95), hsla(${hue + 25}, 85%, 50%, 0.95))`;
  
            container.innerHTML = `
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200">${opt.text}</span>
                <span class="font-bold text-slate-900 dark:text-slate-100">${percent}% <span class="font-normal text-[10px] text-slate-400">(${opt.votes}표)</span></span>
              </div>
              <div class="w-full h-3 rounded-full bg-slate-950/40 border border-white/5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-out" style="width:${percent}%; background:${gradientStyle}; box-shadow:0 0 12px hsla(${hue}, 85%, 60%, 0.4);"></div>
              </div>
            `;
            
            pollStatsBarsList.appendChild(container);
          });
        }

        // 2. Draw SVG Donut Chart
        if (pollDonutSvg && pollDonutLegend) {
          pollDonutSvg.innerHTML = '';
          pollDonutLegend.innerHTML = '';

          let accumulatedPercent = 0;
          const radius = 35;
          const circumference = 2 * Math.PI * radius; // ~219.91
          
          let maxOption = { text: '참여 없음', percent: '0%', votes: -1 };

              pollDonutSvg.appendChild(circle);
              accumulatedPercent += percentVal;
            }

            // Append Legend Item
            const legendRow = document.createElement('div');
            legendRow.style.display = 'flex';
            legendRow.style.alignItems = 'center';
            legendRow.style.gap = '8px';
            legendRow.style.fontSize = '12.5px';
            
            legendRow.innerHTML = `
              <span style="width:10px; height:10px; border-radius:50%; background:hsla(${hue}, 85%, 60%, 0.9); flex-shrink:0;"></span>
              <span style="color:#ffffff; flex:1; text-align:left; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${opt.text}">${opt.text}</span>
              <span style="color:var(--text-muted); font-weight:600; flex-shrink:0;">${percent}% (${opt.votes}표)</span>
            `;
            pollDonutLegend.appendChild(legendRow);
          });

          // Set Center text to winner initially
          if (donutCenterPercent) donutCenterPercent.textContent = totalVotesCount > 0 ? maxOption.percent : '0%';
          if (donutCenterLabel) donutCenterLabel.textContent = totalVotesCount > 0 ? maxOption.text : '참여 없음';
        }

        // 3. Draw Word Cloud
        if (pollStatsWordcloud) {
          pollStatsWordcloud.innerHTML = '';
          
          if (totalVotesCount === 0) {
            pollStatsWordcloud.innerHTML = `
              <div style="color:var(--text-muted); font-size:13px; text-align:center; width:100%; padding:20px 0;">
                <i data-lucide="cloud-off" style="width:24px; height:24px; margin-bottom:8px; display:inline-block; opacity:0.5;"></i>
                <p>투표 득표 기록이 발생하면 멋진 워드클라우드가 실시간으로 형성됩니다.</p>
              </div>
            `;
            lucide.createIcons();
          } else {
            const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
            
            poll.options.forEach((opt, idx) => {
              const weight = opt.votes / maxVotes;
              const percent = ((opt.votes / totalVotesCount) * 100).toFixed(1);
              const fontSize = 13 + weight * 25; // 13px to 38px
              const opacity = 0.45 + weight * 0.55; // 0.45 to 1.0
              const hue = (idx * 137) % 360;

              const wordSpan = document.createElement('span');
              wordSpan.textContent = opt.text;
              wordSpan.title = `득표: ${opt.votes}표 (${percent}%)`;
              wordSpan.style.fontSize = `${fontSize}px`;
              wordSpan.style.color = `hsla(${hue}, 85%, 65%, ${opacity})`;
              wordSpan.style.fontWeight = weight > 0.5 ? '800' : (weight > 0.25 ? '700' : '500');
              wordSpan.style.padding = '4px 10px';
              wordSpan.style.cursor = 'pointer';
              wordSpan.style.transition = 'transform 0.25s ease';
              wordSpan.style.textShadow = `0 0 15px hsla(${hue}, 85%, 60%, ${weight * 0.35})`;
              wordSpan.style.display = 'inline-block';
              
              wordSpan.addEventListener('mouseover', () => {
                wordSpan.style.transform = 'scale(1.1) translateY(-2px)';
                wordSpan.style.color = `hsla(${hue}, 95%, 70%, 1.0)`;
              });
              wordSpan.addEventListener('mouseout', () => {
                wordSpan.style.transform = 'scale(1)';
                wordSpan.style.color = `hsla(${hue}, 85%, 65%, ${opacity})`;
              });

              pollStatsWordcloud.appendChild(wordSpan);
            });
          }
        }

        // Toggle visibility to current selected tab
        togglePollViewTabContainers();
      }
  
      try {
        const response = await secureFetch(`/api/polls/${currentActivePollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedIndexes: checked })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
  
        showToast('투표 성공', '성공적으로 선호도 조사에 참여하셨습니다. 소중한 의견 감사드립니다!', 'success');
        
        // Update modal stats
        await fetchPollDetailsAndDraw(currentActivePollId, 'stats');
        fetchAndRenderPolls();
  
      } catch (err) {
        showToast('투표 실패', err.message, 'error');
      } finally {
        voteSubmitBtn.disabled = false;
      if (pollVoteModal) pollVoteModal.classList.add('hidden');
    }
  }

  // Handle vote submissions
  if (pollVoteForm) {
    pollVoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
        btnSpan.textContent = '투표 제출하기';
      }
    });
  }

  // Modal closers
  if (btnPollModalClose) {
    btnPollModalClose.addEventListener('click', () => {
      if (pollVoteModal) pollVoteModal.classList.add('hidden');
      stopLivePollInterval();
        // Update modal stats
        await fetchPollDetailsAndDraw(currentActivePollId, 'stats');
        fetchAndRenderPolls();
  
      } catch (err) {
        showToast('투표 실패', err.message, 'error');
      } finally {
        voteSubmitBtn.disabled = false;
        btnSpan.textContent = '투표 제출하기';
      }
    });
  }

  // Modal closers
  if (btnPollModalClose) {
    btnPollModalClose.addEventListener('click', () => {
      if (pollVoteModal) pollVoteModal.classList.add('hidden');
      stopLivePollInterval();
    });
  }

  // Background Live Poll Refresh Loops
  function startLivePollInterval(pollId) {
    stopLivePollInterval();
    window.pollLiveInterval = setInterval(async () => {

  const btnCopyModalPollUrl = document.getElementById('btn-copy-modal-poll-url');
  if (btnCopyModalPollUrl) {
    btnCopyModalPollUrl.addEventListener('click', () => {
      const pollModalShareUrl = document.getElementById('poll-modal-share-url');
      if (pollModalShareUrl && pollModalShareUrl.value) {
        navigator.clipboard.writeText(pollModalShareUrl.value).then(() => {
          showToast(
            '설문 주소 복사 완료',
            '선호도 조사 비로그인 참여 링크가 클립보드에 안전하게 복사되었습니다. 다른 곳에 편하게 붙여넣으세요!',
            'success'
          );
        }).catch(() => {
          const tempInput = document.createElement('input');
          tempInput.value = pollModalShareUrl.value;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast(
            '설문 주소 복사 완료',
            '선호도 조사 비로그인 참여 링크가 복사되었습니다.',
            'success'
          );
        });
      }
    });
  }

  // Background Live Poll Refresh Loops
  function startLivePollInterval(pollId) {
    stopLivePollInterval();
    window.pollLiveInterval = setInterval(async () => {
      if ((pollVoteModal && pollVoteModal.classList.contains('hidden')) || !currentActivePollId) {
        stopLivePollInterval();
        return;
      }
      
      // Fetch details and redraw modal
      try {
        const isStatsVisible = pollModalStatsScreen && !pollModalStatsScreen.classList.contains('hidden');
        const screenMode = isStatsVisible ? 'stats' : 'vote';
        await fetchPollDetailsAndDraw(currentActivePollId, screenMode);
      } catch (err) {
        console.error('Failed to sync live poll stats:', err);
      }
    }, 3000);
  }

  function stopLivePollInterval() {
    if (window.pollLiveInterval) {
      clearInterval(window.pollLiveInterval);
      window.pollLiveInterval = null;
    }
  }

  // Footer Links Modals (Service Intro & Privacy Policy)
  const introModal = document.getElementById('intro-modal');
  const privacyModal = document.getElementById('privacy-modal');
  const linkServiceIntro = document.getElementById('link-service-intro');
  const linkPrivacyPolicy = document.getElementById('link-privacy-policy');
  const btnIntroModalClose = document.getElementById('btn-intro-modal-close');
  const btnPrivacyModalClose = document.getElementById('btn-privacy-modal-close');

  if (linkServiceIntro && introModal) {
    linkServiceIntro.addEventListener('click', (e) => {
      e.preventDefault();
      introModal.classList.remove('hidden');
    });
  }

  if (linkPrivacyPolicy && privacyModal) {
    linkPrivacyPolicy.addEventListener('click', (e) => {
      e.preventDefault();
      privacyModal.classList.remove('hidden');
    });
  }

  if (btnIntroModalClose && introModal) {
    btnIntroModalClose.addEventListener('click', () => {
      introModal.classList.add('hidden');
    });
  }

  if (btnPrivacyModalClose && privacyModal) {
    btnPrivacyModalClose.addEventListener('click', () => {
      privacyModal.classList.add('hidden');
    });
  }

  // Global overlay handler helper for clicking outside modal
  window.addEventListener('click', (e) => {
    if (e.target === pollVoteModal) {
      if (pollVoteModal) pollVoteModal.classList.add('hidden');
      stopLivePollInterval();
    }
    if (e.target === introModal) {
      introModal.classList.add('hidden');
    }
    if (e.target === privacyModal) {
      privacyModal.classList.add('hidden');
    }
  });

  // Initial runs
  checkLoginState();