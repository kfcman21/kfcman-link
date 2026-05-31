// ==========================================================================
// kfcman.link URL Shortener Frontend Controller (With Multi-User Auth & Stats)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Helper to get or create a unique guest ID stored in localStorage to distinguish voters on the same IP
  function getOrCreateGuestId() {
    let guestId = localStorage.getItem('kfcman_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kfcman_guest_id', guestId);
    }
    return guestId;
  }

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
  const guestHeaderButtons = document.getElementById('guest-header-buttons');
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
      document.documentElement.classList.remove('dark');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
    lucide.createIcons();
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
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
        headerNav.style.display = 'flex';
        logoutBtn.style.display = 'flex';
        const logoutBtnMobile = document.getElementById('btn-logout-mobile');
        if (logoutBtnMobile) logoutBtnMobile.classList.remove('hidden');
        guestHeaderButtons.style.display = 'none';
        
        guestContent.classList.add('hidden');
        memberContent.classList.remove('hidden');
        
        // Hide mobile guest buttons and show member ones
        const mobileNavGuestGroup = document.getElementById('mobile-nav-guest-group');
        const mobileNavMemberGroup = document.getElementById('mobile-nav-member-group');
        if (mobileNavGuestGroup) mobileNavGuestGroup.classList.add('hidden');
        if (mobileNavMemberGroup) mobileNavMemberGroup.classList.remove('hidden');
        
        // Render user warning banner if active
        const userWarningBanner = document.getElementById('user-warning-banner');
        const userWarningMessage = document.getElementById('user-warning-message');
        if (data.warning) {
          userWarningMessage.textContent = data.warning;
          userWarningBanner.classList.remove('hidden');
        } else {
          userWarningBanner.classList.add('hidden');
        }
        
        // Admin & Manager authorization check & Settings Tab Control
        currentUserRole = data.role;
        currentUserLinks = data.totalLinks || 0;
        currentUserClicks = data.totalClicks || 0;
        const btnSettingsSubtabAdmin = document.getElementById('btn-settings-subtab-admin');
        if (data.role === 'admin' || data.role === 'manager') {
          if (btnSettingsSubtabAdmin) btnSettingsSubtabAdmin.classList.remove('hidden');
          renderAdminPanel();
          if (!window.adminMetricsInterval) {
            window.adminMetricsInterval = setInterval(renderAdminPanel, 15000); // 15 seconds auto refresh
          }
        } else {
          if (btnSettingsSubtabAdmin) btnSettingsSubtabAdmin.classList.add('hidden');
          if (window.adminMetricsInterval) {
            clearInterval(window.adminMetricsInterval);
            window.adminMetricsInterval = null;
          }
        }
        
        // Hide/Show Eusseuk settings tab based on role (Restricted to VIP, Manager, Admin)
        const btnSettingsSubtabClassroom = document.getElementById('btn-settings-subtab-classroom');
        if (btnSettingsSubtabClassroom) {
          if (data.role === 'vip' || data.role === 'manager' || data.role === 'admin') {
            btnSettingsSubtabClassroom.classList.remove('hidden');
          } else {
            btnSettingsSubtabClassroom.classList.add('hidden');
          }
        }
        
        // Hide/Show Wall board nav item based on user role (Restricted to VIP, Manager, Admin)
        const navItemWall = document.getElementById('nav-item-wall');
        if (navItemWall) {
          if (data.role === 'vip' || data.role === 'manager' || data.role === 'admin') {
            navItemWall.style.display = 'flex';
          } else {
            navItemWall.style.display = 'none';
          }
        }

        // Hide/Show settings navigation items based on user role (Hide completely for general 'user')
        const navItemSettings = document.getElementById('nav-item-settings');
        const mNavSettings = document.getElementById('mobile-nav-settings');
        if (data.role === 'user') {
          if (navItemSettings) navItemSettings.style.display = 'none';
          if (mNavSettings) mNavSettings.style.display = 'none';
        } else {
          if (navItemSettings) navItemSettings.style.display = 'flex';
          if (mNavSettings) mNavSettings.style.display = 'flex';
        }

        renderDashboard();

        // 쏙점수 학급 데이터 조회
        await fetchClassroom();
        // 기본적으로 단축주소 탭 활성화 (모든 회원 공통)
        switchMainTab('shortener');

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
    headerNav.style.display = 'none';
    logoutBtn.style.display = 'none';
    const logoutBtnMobile = document.getElementById('btn-logout-mobile');
    if (logoutBtnMobile) logoutBtnMobile.classList.add('hidden');
    guestHeaderButtons.style.display = 'flex';
    
    guestContent.classList.remove('hidden');
    memberContent.classList.add('hidden');
    adminApprovalSection.classList.add('hidden');
    
    // 학급 전용 섹션들 일괄 숨김 처리
    const classroomSection = document.getElementById('classroom-section');
    const gradebookSection = document.getElementById('gradebook-section');
    const thermometerSection = document.getElementById('thermometer-section');
    const classroomSettingsSection = document.getElementById('classroom-settings-section');
    if (classroomSection) classroomSection.classList.add('hidden');
    if (gradebookSection) gradebookSection.classList.add('hidden');
    if (thermometerSection) thermometerSection.classList.add('hidden');
    if (classroomSettingsSection) classroomSettingsSection.classList.add('hidden');
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) settingsSection.classList.add('hidden');

    // 모바일 하단 네비게이션 복구
    const mobileNavGuestGroup = document.getElementById('mobile-nav-guest-group');
    const mobileNavMemberGroup = document.getElementById('mobile-nav-member-group');
    if (mobileNavGuestGroup) mobileNavGuestGroup.classList.remove('hidden');
    if (mobileNavMemberGroup) mobileNavMemberGroup.classList.add('hidden');

    // classroomData = null; // Assuming this is defined globally or imported elsewhere

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
    if (authModal) {
      authModal.querySelectorAll('input').forEach(inp => inp.removeAttribute('disabled'));
      authModal.classList.remove('hidden');
    }
    switchAuthTab(mode);
  }

  function closeAuthModal() {
    if (authModal) {
      authModal.classList.add('hidden');
      authModal.querySelectorAll('input').forEach(inp => inp.setAttribute('disabled', 'true'));
    }
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
  
  const btnHeroLogin = document.getElementById('btn-hero-login');
  if (btnHeroLogin) {
    btnHeroLogin.addEventListener('click', () => openAuthModal('login'));
  }
  
  btnAuthModalClose.addEventListener('click', () => {
    closeAuthModal();
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Special case: Suspended account for inactivity
        if (response.status === 403 && data.status === 'suspended') {
          if (confirm('장기 미사용(30일 이상)으로 계정이 정지되었습니다.\n관리자에게 계정 활성화(정지 해제) 요청 메시지를 보내시겠습니까?')) {
            try {
              const reqActRes = await fetch('/api/request-reactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: data.username })
              });
              const actData = await reqActRes.json();
              if (reqActRes.ok) {
                showToast('요청 전송 완료', actData.message, 'success');
              } else {
                showToast('요청 전송 실패', actData.error, 'error');
              }
            } catch (err) {
              showToast('서버 네트워크 오류', '계정 정지 해제 요청 발송 중 문제가 발생했습니다.', 'error');
            }
          }
          loginSubmitBtn.disabled = false;
          btnSpan.textContent = '로그인';
          return;
        }
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      // Success
      setAuthToken(data.token);
      loginUsernameInput.value = '';
      loginPasswordInput.value = '';
      closeAuthModal();
      
      showToast('로그인 완료', `${data.username}님, 프리미엄 링크 허브에 오신 것을 환영합니다!`, 'success');
      await checkLoginState();

    } catch (err) {
      showToast('로그인 실패', err.message, 'error');
    } finally {
      loginSubmitBtn.disabled = false;
      btnSpan.textContent = '로그인하기';
    }
  });

  // Handle Registration submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value;
    const confirmPassword = registerConfirmPasswordInput.value;

    if (!username || !password || !confirmPassword) {
      showToast('입력 오류', '모든 항목을 입력해 주세요.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('비밀번호 불일치', '설정한 비밀번호와 비밀번호 확인 입력이 일치하지 않습니다.', 'error');
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
  }

  btnCopyBrand.addEventListener('click', () => {
    copyTextToClipboard(`http://kfcman.link/${generatedCode}`, btnCopyBrand);
  });

  btnCopyLocal.addEventListener('click', () => {
    copyTextToClipboard(activeQrUrl, btnCopyLocal);
  });

  // --- 9. QR Modals Control ---
  btnQrTrigger.addEventListener('click', () => {
    new QRious({
      element: qrCanvas,
      value: activeQrUrl,
      size: 200,
      foreground: '#070a13',
      background: '#ffffff',
      level: 'H'
    });
    qrModal.classList.remove('hidden');
  });

  btnQrModalClose.addEventListener('click', () => {
    qrModal.classList.add('hidden');
  });

  btnQrDownload.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `kfcman-link-qr-${generatedCode}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
  });

  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      closeAuthModal();
    }
    if (e.target === qrModal) {
      qrModal.classList.add('hidden');
    }
    if (e.target === statsModal) {
      statsModal.classList.add('hidden');
    }
  });

  // --- Usage Limit Tracker Helper ---
  function updateUsageLimitTracker(count) {
    const usageLimitContainer = document.getElementById('usage-limit-container');
    const usageLimitText = document.getElementById('usage-limit-text');
    const usageLimitBar = document.getElementById('usage-limit-bar');
    
    if (usageLimitContainer && usageLimitText && usageLimitBar) {
      if (currentUserRole === 'user') {
        usageLimitContainer.classList.remove('hidden');
        usageLimitText.textContent = `${count} / 50 개 생성됨`;
        const percent = Math.min((count / 50) * 100, 100);
        usageLimitBar.style.width = `${percent}%`;
        if (count >= 50) {
          usageLimitBar.style.backgroundColor = '#ff0054';
        } else {
          usageLimitBar.style.backgroundColor = '';
        }
      } else {
        usageLimitContainer.classList.add('hidden');
      }
    }
  }

  // --- 10. Dashboard Rendering ---
  async function renderDashboard() {
    try {
      const response = await secureFetch('/api/links');

      if (!response.ok) {
        throw new Error('링크 통계를 불러오지 못했습니다.');
      }

      const { links } = await response.json();

      updateUsageLimitTracker(links.length);

      if (links.length === 0) {
        listEmptyState.classList.remove('hidden');
        linksTableWrapper.classList.add('hidden');
        btnClearHistory.classList.add('hidden');
        
        statTotalLinks.textContent = '0';
        statTotalClicks.textContent = '0';
        statAvgClicks.textContent = '0.0';
        applyFeatureVisibility();
        return;
      }

      links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalLinksCount = links.length;
      const totalClicksSum = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const avgClicksRate = totalLinksCount > 0 ? (totalClicksSum / totalLinksCount).toFixed(1) : '0.0';

      statTotalLinks.textContent = totalLinksCount;
      statTotalClicks.textContent = totalClicksSum;
      statAvgClicks.textContent = avgClicksRate;
      
      applyFeatureVisibility();

      linksTableBody.innerHTML = '';
      
      links.forEach(link => {
        const row = document.createElement('tr');
        
        const localLinkUrl = `${window.location.origin}/${link.code}`;
        const visualBrandUrl = `http://kfcman.link/${link.code}`;
        
        const originalUrlClean = link.originalUrl.replace(/^https?:\/\/(www\.)?/, '');
        const dateStr = new Date(link.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        const clickClass = link.clicks > 0 ? 'click-badge has-clicks' : 'click-badge';

        row.innerHTML = `
          <td>
            <div class="table-link-pair">
              <a href="${localLinkUrl}" target="_blank" class="table-short-link" title="이동하기">
                <span>kfcman.link/${link.code}</span>
                <i data-lucide="external-link" style="width:12px; height:12px;"></i>
              </a>
              <a href="${link.originalUrl}" target="_blank" class="table-original-link" title="${link.originalUrl}">
                ${originalUrlClean}
              </a>
            </div>
          </td>
          <td>
            <span class="table-date">${dateStr}</span>
          </td>
          <td>
            <span class="${clickClass}"><i data-lucide="mouse-pointer-click" style="width:12px; height:12px;"></i> ${link.clicks}</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-action-icon btn-table-copy" data-url="${visualBrandUrl}" title="주소 복사">
                <i data-lucide="copy"></i>
              </button>
              <button class="btn-action-icon btn-table-qr" data-url="${localLinkUrl}" data-code="${link.code}" title="QR 코드">
                <i data-lucide="qr-code"></i>
              </button>
              <button class="btn-action-icon btn-table-stats" data-code="${link.code}" title="상세 통계">
                <i data-lucide="bar-chart-3"></i>
              </button>
              <button class="btn-action-icon btn-table-delete" data-code="${link.code}" title="삭제" style="color: rgba(239, 68, 68, 0.65);">
                <i data-lucide="trash"></i>
              </button>
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
  function bindTableActionEvents() {
    document.querySelectorAll('.btn-table-copy').forEach(button => {
      button.addEventListener('click', () => {
        const urlToCopy = button.getAttribute('data-url');
        copyTextToClipboard(urlToCopy, button);
      });
    });

    document.querySelectorAll('.btn-table-qr').forEach(button => {
      button.addEventListener('click', () => {
        const qrUrl = button.getAttribute('data-url');
        generatedCode = button.getAttribute('data-code');
        activeQrUrl = qrUrl;

        new QRious({
          element: qrCanvas,
          value: activeQrUrl,
          size: 200,
          foreground: '#070a13',
          background: '#ffffff',
          level: 'H'
        });

        qrModal.classList.remove('hidden');
      });
    });

    document.querySelectorAll('.btn-table-stats').forEach(button => {
      button.addEventListener('click', () => {
        const code = button.getAttribute('data-code');
        showStatsModal(code);
      });
    });

    document.querySelectorAll('.btn-table-delete').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.getAttribute('data-code');
        if (confirm(`단축 주소 [kfcman.link/${code}]를 영구히 삭제하시겠습니까?\n삭제 시 해당 주소로 접속이 불가능해집니다.`)) {
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
          <div style="font-size:13px; color:var(--text-muted); text-align:center; padding: 24px 0;">
            아직 수집된 방문 유입 경로가 없습니다.
          </div>
        `;
      } else {
        sortedRefs.forEach(([name, count]) => {
          const percentage = ((count / clicksData.length) * 100).toFixed(0);
          
          const refRow = document.createElement('div');
          refRow.className = 'referral-row';
          refRow.innerHTML = `
            <div class="referral-info">
              <span class="referral-name">${name}</span>
              <span class="referral-count">${count}회 (${percentage}%)</span>
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
    // Load notification configuration (once) safely
    try {
      await loadNotificationSettings();
    } catch (e) {
      console.error("Failed to load notification settings:", e);
    }

    // Load User Usage Statistics & Management Panel safely
    try {
      await renderUserManagementPanel();
    } catch (e) {
      console.error("Failed to load user management panel:", e);
    }

    // 1. Fetch system monitoring metrics
    try {
      const sysResponse = await secureFetch('/api/admin/system');
      if (sysResponse.ok) {
        const sysData = await sysResponse.json();
        
        monitorCpuVal.textContent = sysData.cpu + '%';
        monitorMemVal.textContent = sysData.memory + '%';
        monitorDiskVal.textContent = sysData.disk + '%';
        monitorUptimeVal.textContent = sysData.uptime;
        
        // Dynamic colors for safety/warning ranges
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

      const { users } = await response.json();

      if (users.length === 0) {
        adminEmptyState.classList.remove('hidden');
        adminTableWrapper.classList.add('hidden');
        return;
      }

      adminPendingBody.innerHTML = '';
      users.forEach(user => {
        const row = document.createElement('tr');
        
        const dateStr = new Date(user.createdAt).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        row.innerHTML = `
          <td>
            <div style="font-weight:600; color:var(--color-cyan); display:flex; align-items:center; gap:8px;">
              <i data-lucide="user-plus" style="width:16px; height:16px;"></i>
              <span>${user.username}</span>
            </div>
          </td>
          <td>
            <span class="table-date">${dateStr}</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-admin-approve px-3 py-1.5 text-xs font-black border-2 border-white rounded-xl bg-clay-grass hover:bg-teal-400 text-black shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1" data-username="${user.username}">
                <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                <span>승인</span>
              </button>
              <button class="btn-admin-reject px-3 py-1.5 text-xs font-black border-2 border-white rounded-xl bg-clay-red hover:bg-red-600 text-white shadow-clay-flat hover:shadow-clay-flat-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1" data-username="${user.username}">
                <i data-lucide="user-minus" class="w-3.5 h-3.5"></i>
                <span>거절</span>
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
          try {
            const response = await secureFetch('/api/admin/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
    }
  }

  // Collect config fields from form
  function getNotificationFormValues() {
    return {
      email: {
        enabled: chkEmailEnabled.checked,
        host: txtEmailHost.value.trim(),
        port: parseInt(numEmailPort.value) || 465,
        secure: selEmailSecure.value === 'true',
        user: txtEmailUser.value.trim(),
        pass: txtEmailPass.value,
        receiver: txtEmailReceiver.value.trim()
      },
      webhook: {
        enabled: chkWebhookEnabled.checked,
        url: txtWebhookUrl.value.trim()
      },
      sms: {
        enabled: chkSmsEnabled.checked,
        apiKey: txtSmsApikey.value.trim(),
        apiSecret: txtSmsApisecret.value.trim(),
        sender: txtSmsSender.value.trim(),
        receiver: txtSmsReceiver.value.trim(),
        useKakao: chkSmsUsekakao.checked,
        pfId: txtSmsPfid.value.trim(),
        templateId: txtSmsTemplateid.value.trim()
      }
    };
  }

  // Handle Save Notifications settings
  notificationSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-notification');
    const prevText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>저장 중...</span><i data-lucide="loader" class="animate-spin" style="width:16px; height:16px;"></i>`;
    lucide.createIcons();
    
    try {
      const response = await secureFetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        
        const isSelf = user.username.toLowerCase() === userWelcomeName.textContent.trim().toLowerCase();
        
        // Status badge
        let statusBadge = '';
        if (user.approved) {
          statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 bg-brand-green/15 text-brand-green border border-brand-green/20"><i data-lucide="check" class="w-3 h-3"></i> 활성</span>`;
        } else {
          statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/20"><i data-lucide="shield-off" class="w-3 h-3"></i> 정지</span>`;
        }
        
        // Warning status info
        let warnIndicator = '';
        if (user.warning) {
          warnIndicator = `<span class="text-[10px] block text-red-500 mt-1 font-semibold" title="${user.warning}"><i data-lucide="alert-triangle" class="w-3 h-3 inline-block align-middle mr-0.5"></i> 경고중</span>`;
        }
        
        // Role select dropdown
        const isRoleSelectDisabled = isSelf || (currentUserRole !== 'admin');
        const roleSelector = `
          <select class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-xl text-xs font-black cursor-pointer text-slate-800 dark:text-slate-100 shadow-sm btn-user-change-role" data-username="${user.username}" ${isRoleSelectDisabled ? 'disabled style="opacity:0.6; pointer-events:none;"' : ''}>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자 👑</option>
            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>부관리자 🛡️</option>
            <option value="vip" ${user.role === 'vip' ? 'selected' : ''}>우수회원 ⭐</option>
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반회원 👤</option>
            <option value="pending" ${user.approved === false || user.role === 'pending' ? 'selected' : ''}>대기회원 ⏳</option>
          </select>
        `;
        
        row.innerHTML = `
          <td>
            <div class="font-bold text-brand-cyan flex flex-col text-left text-sm">
              <span>${user.username}</span>
              ${warnIndicator}
            </div>
          </td>
          <td>${roleSelector}</td>
          <td><strong class="text-brand-purple font-bold text-sm">${user.totalLinks}개</strong></td>
          <td><strong class="text-brand-cyan font-bold text-sm">${user.totalClicks}회</strong></td>
          <td><span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${dateStr}</span></td>
          <td>${statusBadge}</td>
          <td>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button class="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 text-[10px] rounded transition-all btn-user-warn flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" data-warning="${user.warning || ''}" title="경고 메시지 전송">
                <i data-lucide="bell" class="w-3 h-3 text-brand-yellow"></i> 경고
              </button>
              <button class="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 font-bold px-2 py-1 text-[10px] rounded transition-all btn-user-toggle-block flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" title="${user.approved ? '계정 정지' : '계정 활성화'}" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''} style="border-color: ${user.approved ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; color: ${user.approved ? '#f87171' : '#10b981'};">
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
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, message: message.trim() })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            showToast('경고 처리 완료', message.trim() ? `사용자 [${username}]에게 성공적으로 경고를 발송했습니다.` : `사용자 [${username}]의 경고를 성공적으로 해제했습니다.`, 'success');
            renderUserManagementPanel();
          } catch (err) {
            showToast('경고 처리 실패', err.message, 'error');
          }
        }
      });
    });

    // Toggle block action
    document.querySelectorAll('.btn-user-toggle-block').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-username');
        if (confirm(`사용자 [${username}] 계정 상태를 변경하시겠습니까?`)) {
          try {
            const response = await secureFetch('/api/admin/users/toggle-block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            showToast('계정 상태 변경 완료', data.message, 'success');
            renderUserManagementPanel();
          } catch (err) {
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

    // Change role action
    document.querySelectorAll('.btn-user-change-role').forEach(select => {
      select.addEventListener('change', async () => {
        const username = select.getAttribute('data-username');
        const newRole = select.value;
        try {
          const response = await secureFetch('/api/admin/users/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, role: newRole })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          
          showToast('등급 변경 완료', data.message, 'success');
          renderUserManagementPanel();
        } catch (err) {
          showToast('등급 변경 실패', err.message, 'error');
          renderUserManagementPanel();
        }
      });
    });
  }

  // Refresh user stats button
  const refreshUserStatsBtn = document.getElementById('btn-refresh-user-stats');
  if (refreshUserStatsBtn) {
    refreshUserStatsBtn.addEventListener('click', () => {
      renderUserManagementPanel();
      showToast('새로고침 완료', '회원 사용량 및 계정 상태 정보를 다시 읽어왔습니다.', 'info');
    });
  }

  // --- REAL-TIME POLLS (SURVEYS) FRONTEND SYSTEM ---

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
  const btnSubmitVote = document.getElementById('btn-submit-vote');
  
  const pollModalStatsScreen = document.getElementById('poll-modal-stats-screen');
  const pollStatsBarsList = document.getElementById('poll-stats-bars-list');
  const pollModalTotalVotes = document.getElementById('poll-modal-total-votes');
  const pollVotedNotice = document.getElementById('poll-voted-notice');

  // Visualization View Tabs
  const btnPollViewBar = document.getElementById('btn-poll-view-bar');
  const btnPollViewDonut = document.getElementById('btn-poll-view-donut');
  const btnPollViewCloud = document.getElementById('btn-poll-view-cloud');
  const btnPollViewOpen = document.getElementById('btn-poll-view-open');
  const btnPollViewScale = document.getElementById('btn-poll-view-scale');
  const btnPollViewQuiz = document.getElementById('btn-poll-view-quiz');
  
  const pollStatsDonutContainer = document.getElementById('poll-stats-donut-container');
  const pollStatsWordcloud = document.getElementById('poll-stats-wordcloud');
  const pollStatsOpenEnded = document.getElementById('poll-stats-openended');
  const pollStatsScale = document.getElementById('poll-stats-scale');
  const pollStatsQuiz = document.getElementById('poll-stats-quiz');

  const pollDonutSvg = document.getElementById('poll-donut-svg');
  const pollDonutLegend = document.getElementById('poll-donut-legend');
  const donutCenterPercent = document.getElementById('donut-center-percent');
  const donutCenterLabel = document.getElementById('donut-center-label');

  let currentPollViewTab = 'bar'; // 'bar', 'donut', 'cloud', 'open', 'scale', 'quiz'
  let currentActivePollId = null;

  if (btnPollViewBar) btnPollViewBar.addEventListener('click', () => setPollViewTab('bar'));
  if (btnPollViewDonut) btnPollViewDonut.addEventListener('click', () => setPollViewTab('donut'));
  if (btnPollViewCloud) btnPollViewCloud.addEventListener('click', () => setPollViewTab('cloud'));
  if (btnPollViewOpen) btnPollViewOpen.addEventListener('click', () => setPollViewTab('open'));
  if (btnPollViewScale) btnPollViewScale.addEventListener('click', () => setPollViewTab('scale'));
  if (btnPollViewQuiz) btnPollViewQuiz.addEventListener('click', () => setPollViewTab('quiz'));

  function setPollViewTab(tab) {
    currentPollViewTab = tab;
    
    const activeClasses = ['bg-brand-cyan/20', 'border-brand-cyan/35', 'text-brand-cyan'];
    const inactiveClasses = ['bg-slate-100', 'dark:bg-white/5', 'border-slate-200', 'dark:border-white/10', 'text-slate-500', 'dark:text-slate-300'];
    
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
    updateTabStyles(btnPollViewOpen, tab === 'open');
    updateTabStyles(btnPollViewScale, tab === 'scale');
    updateTabStyles(btnPollViewQuiz, tab === 'quiz');

    togglePollViewTabContainers();
  }

  function togglePollViewTabContainers() {
    if (pollStatsBarsList) pollStatsBarsList.classList.toggle('hidden', currentPollViewTab !== 'bar');
    if (pollStatsDonutContainer) pollStatsDonutContainer.classList.toggle('hidden', currentPollViewTab !== 'donut');
    if (pollStatsWordcloud) pollStatsWordcloud.classList.toggle('hidden', currentPollViewTab !== 'cloud');
    if (pollStatsOpenEnded) pollStatsOpenEnded.classList.toggle('hidden', currentPollViewTab !== 'open');
    if (pollStatsScale) pollStatsScale.classList.toggle('hidden', currentPollViewTab !== 'scale');
    if (pollStatsQuiz) pollStatsQuiz.classList.toggle('hidden', currentPollViewTab !== 'quiz');
  }
  let pollFilter = 'all'; // 'all', 'active', 'closed'
  let pollsData = [];
  let currentUsername = '';
  let currentUserRole = '';
  let currentUserLinks = 0;
  let currentUserClicks = 0;

  // --- 4-Tab Structure Unified Switcher & Settings Config ---
  window.switchMainTab = function(tabId) {
    const hasPollsUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    const hasClassroomUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    
    if (tabId === 'polls' && !hasPollsUnlock) {
      showToast('잠금 상태 🔒', '실시간 설문 광장 기능은 \'우수회원👑\' 등급 전용 혜택입니다. 무제한 주소 단축 및 설문 개설을 위해 관리자에게 등급업을 요청해 주세요!', 'warning');
      tabId = 'shortener';
      return;
    }
    if (tabId === 'classroom' && !hasClassroomUnlock) {
      showToast('잠금 상태 🔒', '으쓱점수 학급 대시보드 기능은 \'우수회원👑\' 등급 전용 혜택입니다. 학급 개설 및 점수 관리를 위해 관리자에게 등급업을 요청해 주세요!', 'warning');
      tabId = 'shortener';
      return;
    }
    if (tabId === 'settings' && currentUserRole === 'user') {
      showToast('접근 제한 🔒', '통합 설정 제어판 기능은 \'우수회원👑\' 등급 이상만 접근할 수 있습니다.', 'warning');
      tabId = 'shortener';
      return;
    }

    const shortenerSec = document.getElementById('shortener-section');
    const dashSec = document.getElementById('dashboard-section');
    const pollSec = document.getElementById('polls-section');
    const eusseukSec = document.getElementById('eusseuk-section');
    const settingsSec = document.getElementById('settings-section');
    
    const navShortener = document.getElementById('nav-item-shortener');
    const navPolls = document.getElementById('nav-item-polls');
    const navClassroom = document.getElementById('nav-item-classroom');
    const navSettings = document.getElementById('nav-item-settings');
    
    const mNavShortener = document.getElementById('mobile-nav-shortener-member');
    const mNavPolls = document.getElementById('mobile-nav-polls-member');
    const mNavClassroom = document.getElementById('mobile-nav-classroom');
    const mNavSettings = document.getElementById('mobile-nav-settings');

    // Hide all
    if (shortenerSec) shortenerSec.classList.add('hidden');
    if (dashSec) dashSec.classList.add('hidden');
    if (pollSec) pollSec.classList.add('hidden');
    if (eusseukSec) eusseukSec.classList.add('hidden');
    if (settingsSec) settingsSec.classList.add('hidden');

    // Remove active styles from desktop header
    [navShortener, navPolls, navClassroom, navSettings].forEach(el => {
      if (el) el.classList.remove('active');
    });
    // Remove active styles from mobile navigation bar
    [mNavShortener, mNavPolls, mNavClassroom, mNavSettings].forEach(el => {
      if (el) {
        el.classList.remove('active-mobile-nav');
        el.classList.add('text-slate-400', 'dark:text-slate-500');
      }
    });

    if (tabId === 'shortener') {
      if (shortenerSec) shortenerSec.classList.remove('hidden');
      if (dashSec) dashSec.classList.remove('hidden');
      if (navShortener) navShortener.classList.add('active');
      if (mNavShortener) {
        mNavShortener.classList.add('active-mobile-nav');
        mNavShortener.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
    } else if (tabId === 'polls') {
      if (pollSec) pollSec.classList.remove('hidden');
      if (navPolls) navPolls.classList.add('active');
      if (mNavPolls) {
        mNavPolls.classList.add('active-mobile-nav');
        mNavPolls.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      fetchAndRenderPolls();
    } else if (tabId === 'classroom') {
      if (eusseukSec) eusseukSec.classList.remove('hidden');
      if (navClassroom) navClassroom.classList.add('active');
      if (mNavClassroom) {
        mNavClassroom.classList.add('active-mobile-nav');
        mNavClassroom.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      fetchClassroom();
      switchClassroomSubTab('dash'); // Default to Class Dashboard view inside classroom
    } else if (tabId === 'settings') {
      if (settingsSec) settingsSec.classList.remove('hidden');
      if (navSettings) navSettings.classList.add('active');
      if (mNavSettings) {
        mNavSettings.classList.add('active-mobile-nav');
        mNavSettings.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      
      // Load classroom settings data
      renderSettingsView();
      
      // Default to Admin subtab if admin/manager, otherwise classroom settings subtab
      if (currentUserRole === 'admin' || currentUserRole === 'manager') {
        switchSettingsSubTab('admin');
      } else {
        switchSettingsSubTab('classroom');
      }
    }

    lucide.createIcons();
  };

  window.switchSettingsSubTab = function(subTabId) {
    const subviewAdmin = document.getElementById('settings-subview-admin');
    const subviewShortcut = document.getElementById('settings-subview-shortcut');
    const subviewClassroom = document.getElementById('settings-subview-classroom');

    const btnSubtabAdmin = document.getElementById('btn-settings-subtab-admin');
    const btnSubtabShortcut = document.getElementById('btn-settings-subtab-shortcut');
    const btnSubtabClassroom = document.getElementById('btn-settings-subtab-classroom');

    // Hide all
    [subviewAdmin, subviewShortcut, subviewClassroom].forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Remove active styles
    [btnSubtabAdmin, btnSubtabShortcut, btnSubtabClassroom].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    if (subTabId === 'admin') {
      if (subviewAdmin) subviewAdmin.classList.remove('hidden');
      const adminApprovalSection = document.getElementById('admin-approval-section');
      if (adminApprovalSection) adminApprovalSection.classList.remove('hidden');
      if (btnSubtabAdmin) {
        btnSubtabAdmin.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabAdmin.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderAdminPanel();
    } else if (subTabId === 'shortcut') {
      if (subviewShortcut) subviewShortcut.classList.remove('hidden');
      if (btnSubtabShortcut) {
        btnSubtabShortcut.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabShortcut.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    } else if (subTabId === 'classroom' || subTabId === 'fontsize') {
      if (subviewClassroom) subviewClassroom.classList.remove('hidden');
      const classroomSettingsSection = document.getElementById('classroom-settings-section');
      if (classroomSettingsSection) classroomSettingsSection.classList.remove('hidden');
      if (btnSubtabClassroom) {
        btnSubtabClassroom.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabClassroom.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      if (window.switchSettingsSubtab) {
        window.switchSettingsSubtab(subTabId === 'fontsize' ? 'fontsize' : 'privacy');
      }
    }

    lucide.createIcons();
  };

  window.switchClassroomSubTab = function(subTabId) {
    const classroomSec = document.getElementById('classroom-section');
    const gradebookSec = document.getElementById('gradebook-section');
    const thermometerSec = document.getElementById('thermometer-section');

    const btnDash = document.getElementById('btn-classroom-subtab-dash');
    const btnGradebook = document.getElementById('btn-classroom-subtab-gradebook');
    const btnThermometer = document.getElementById('btn-classroom-subtab-thermometer');

    // Hide all sub-views
    if (classroomSec) classroomSec.classList.add('hidden');
    if (gradebookSec) gradebookSec.classList.add('hidden');
    if (thermometerSec) thermometerSec.classList.add('hidden');

    // Remove active styles from sub-tab buttons
    [btnDash, btnGradebook, btnThermometer].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    // Show selected sub-view & active button
    if (subTabId === 'dash') {
      if (classroomSec) classroomSec.classList.remove('hidden');
      if (btnDash) {
        btnDash.classList.add('active', 'bg-clay-purple', 'text-white');
        btnDash.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    } else if (subTabId === 'gradebook') {
      if (gradebookSec) gradebookSec.classList.remove('hidden');
      if (btnGradebook) {
        btnGradebook.classList.add('active', 'bg-clay-purple', 'text-white');
        btnGradebook.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    } else if (subTabId === 'thermometer') {
      if (thermometerSec) thermometerSec.classList.remove('hidden');
      if (btnThermometer) {
        btnThermometer.classList.add('active', 'bg-clay-purple', 'text-white');
        btnThermometer.classList.remove('bg-clay-sand', 'text-slate-800');
      }
    }

    lucide.createIcons();
  };

  // SPA Navigation Toggling
  if (navItemShortener) {
    navItemShortener.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('shortener');
    });
  }

  if (navItemDashboard) {
    navItemDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('shortener');
      setTimeout(() => {
        dashboardSection.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  }

  if (navItemPolls) {
    navItemPolls.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('polls');
    });
  }

  // Settings Sub-tab button bindings
  const btnSettingsSubtabAdmin = document.getElementById('btn-settings-subtab-admin');
  const btnSettingsSubtabShortcut = document.getElementById('btn-settings-subtab-shortcut');
  const btnSettingsSubtabClassroom = document.getElementById('btn-settings-subtab-classroom');

  if (btnSettingsSubtabAdmin) btnSettingsSubtabAdmin.addEventListener('click', () => switchSettingsSubTab('admin'));
  if (btnSettingsSubtabShortcut) btnSettingsSubtabShortcut.addEventListener('click', () => switchSettingsSubTab('shortcut'));
  if (btnSettingsSubtabClassroom) btnSettingsSubtabClassroom.addEventListener('click', () => switchSettingsSubTab('classroom'));

  const navItemSettings = document.getElementById('nav-item-settings');
  if (navItemSettings) {
    navItemSettings.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('settings');
    });
  }

  const mobileNavSettings = document.getElementById('mobile-nav-settings');
  if (mobileNavSettings) {
    mobileNavSettings.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('settings');
    });
  }

  // Collapsible Form card triggers
  if (btnCreatePollToggle) {
    btnCreatePollToggle.addEventListener('click', () => {
      if (createPollCard) {
        createPollCard.classList.remove('hidden');
        createPollCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (btnClosePollCreate) {
    btnClosePollCreate.addEventListener('click', () => {
      if (createPollCard) createPollCard.classList.add('hidden');
    });
  }

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
        lucide.createIcons();
      }
  
      // Bind delete option handler
      row.querySelector('.btn-delete-option').addEventListener('click', () => {
        row.remove();
        renumberOptions();
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
    
    // Dynamically populate quiz correct option dropdown
    const quizCorrectSelect = document.getElementById('poll-quiz-correct-input');
    if (quizCorrectSelect) {
      const prevVal = quizCorrectSelect.value;
      quizCorrectSelect.innerHTML = '';
      for (let i = 0; i < optionCount; i++) {
        const optEl = document.createElement('option');
        optEl.value = String(i);
        optEl.textContent = `문항 ${i + 1}`;
        quizCorrectSelect.appendChild(optEl);
      }
      if (prevVal !== "" && parseInt(prevVal) < optionCount) {
        quizCorrectSelect.value = prevVal;
      }
    }
  }

  // Visual Clickable Card Selector for Board Type Selection
  const boardTypeCards = document.querySelectorAll('.board-type-card');
  const hiddenBoardTypeInput = document.getElementById('poll-board-type-input');
  if (boardTypeCards && hiddenBoardTypeInput) {
    boardTypeCards.forEach(card => {
      card.addEventListener('click', () => {
        boardTypeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const val = card.getAttribute('data-value');
        hiddenBoardTypeInput.value = val;
        
        // Show/hide quiz settings container
        const quizSettingsContainer = document.getElementById('quiz-settings-container');
        if (quizSettingsContainer) {
          if (val === 'quiz') {
            quizSettingsContainer.classList.remove('hidden');
          } else {
            quizSettingsContainer.classList.add('hidden');
          }
        }

        // Show/hide subjective / objective option builder container
        const builderContainer = document.getElementById('poll-options-builder-container');
        if (builderContainer) {
          if (val === 'open' || val === 'cloud') {
            builderContainer.classList.add('hidden');
          } else {
            builderContainer.classList.remove('hidden');
          }
        }

        // Toggle required attributes to avoid HTML5 validation issues for hidden fields
        if (pollOptionsContainer) {
          const optionInputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
          if (val === 'open' || val === 'cloud') {
            optionInputs.forEach(inp => inp.removeAttribute('required'));
          } else {
            optionInputs.forEach((inp, idx) => {
              if (idx < 2) {
                inp.setAttribute('required', 'true');
              } else {
                inp.removeAttribute('required');
              }
            });
          }
        }
      });
    });
  }

  // Poll Form Submit Handler
  if (createPollForm) {
    createPollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('poll-title-input').value.trim();
      const durationMinutes = parseInt(document.getElementById('poll-duration-input').value) || 10;
      const allowMultiple = document.getElementById('poll-multiple-input').checked;
      const dupMode = document.getElementById('poll-dup-mode-input').value;
      const boardType = document.getElementById('poll-board-type-input').value;
      
      const optionInputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
      const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(Boolean);
  
      if (boardType !== 'open' && boardType !== 'cloud' && options.length < 2) {
        showToast('문항 작성 오류', '설문 조사를 위해 최소 2개 이상의 유효한 문항을 입력해 주세요.', 'error');
        return;
      }
  
      const submitBtn = document.getElementById('btn-create-poll-submit');
      const btnSpan = submitBtn.querySelector('span');
      submitBtn.disabled = true;
      btnSpan.textContent = '게시글 업로드 중...';
      
      const quizCorrectIndex = boardType === 'quiz' ? parseInt(document.getElementById('poll-quiz-correct-input').value) : null;
      const quizDuration = boardType === 'quiz' ? parseInt(document.getElementById('poll-quiz-duration-input').value) || 30 : null;
  
      try {
        const response = await secureFetch('/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, options, durationMinutes, allowMultiple, dupMode, boardType, quizCorrectIndex, quizDuration })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
  
        // Generate Guest-Friendly Shareable URL
        const shareUrl = `${window.location.origin}/${data.poll.id}`;

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
        
        // Reset Form fields
        document.getElementById('poll-title-input').value = '';
        if (boardTypeCards && hiddenBoardTypeInput) {
          boardTypeCards.forEach(c => c.classList.remove('active'));
          const defaultCard = document.querySelector('.board-type-card[data-value="bar"]');
          if (defaultCard) defaultCard.classList.add('active');
          hiddenBoardTypeInput.value = 'bar';
        }
        
        const builderContainer = document.getElementById('poll-options-builder-container');
        if (builderContainer) builderContainer.classList.remove('hidden');
        
        pollOptionsContainer.innerHTML = `
          <div class="poll-option-row flex gap-3 items-center">
            <div class="flex-1 flex items-center bg-slate-900/40 dark:bg-slate-900/40 border border-white/5 focus-within:border-brand-cyan/50 rounded-xl px-4 py-3 gap-3 transition-all">
              <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400"></i>
              <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 cursor-text" placeholder="문항 1 입력" required autocomplete="off">
            </div>
            <div class="w-8"></div>
          </div>
          <div class="poll-option-row flex gap-3 items-center">
            <div class="flex-1 flex items-center bg-slate-900/40 dark:bg-slate-900/40 border border-white/5 focus-within:border-brand-cyan/50 rounded-xl px-4 py-3 gap-3 transition-all">
              <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400"></i>
              <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 cursor-text" placeholder="문항 2 입력" required autocomplete="off">
            </div>
            <div class="w-8"></div>
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
        btnSpan.textContent = '게시하기';
      }
    });
  }

  // Filter Buttons binding
  if (btnFilterPollAll) btnFilterPollAll.addEventListener('click', () => setPollFilter('all'));
  if (btnFilterPollActive) btnFilterPollActive.addEventListener('click', () => setPollFilter('active'));
  if (btnFilterPollClosed) btnFilterPollClosed.addEventListener('click', () => setPollFilter('closed'));
  if (pollSearchInput) pollSearchInput.addEventListener('input', () => renderPollsList());

  function setPollFilter(filter) {
    pollFilter = filter;
    
    const activeClasses = ['bg-brand-cyan/20', 'border-brand-cyan/35', 'text-brand-cyan'];
    const inactiveClasses = ['bg-white/5', 'border-white/10', 'text-slate-300'];
    
    const updateFilterStyles = (btn, isActive) => {
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
    
    updateFilterStyles(btnFilterPollAll, filter === 'all');
    updateFilterStyles(btnFilterPollActive, filter === 'active');
    updateFilterStyles(btnFilterPollClosed, filter === 'closed');
    
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

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      if (pollsEmptyState) pollsEmptyState.classList.remove('hidden');
      pollsGrid.classList.add('hidden');
      return;
    }

    if (pollsEmptyState) pollsEmptyState.classList.add('hidden');
    pollsGrid.classList.remove('hidden');

    // Sort: Newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filtered.forEach(poll => {
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat-lg clay-card text-left flex flex-col gap-3 hover:-translate-y-1 transition-all';

      const isExpired = new Date() > new Date(poll.expiresAt);
      const statusText = isExpired ? '마감됨' : '진행중';
      const statusColor = isExpired ? '#f87171' : 'var(--color-green)';
      
      const ownerLabel = poll.owner.toLowerCase() === 'kfcman' || poll.owner.toLowerCase() === 'admin' 
        ? `${poll.owner} <span class="text-[10px] bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded ml-1 font-bold">관리자</span>`
        : poll.owner;

      const totalVotesCount = poll.voters ? poll.voters.length : 0;
      
      // Calculate countdown string
      const countdownHtml = isExpired 
        ? `<span class="text-slate-400 font-semibold text-xs flex items-center gap-1"><i data-lucide="calendar-x" class="w-3.5 h-3.5 inline-block"></i> 투표 종료</span>`
        : `<span class="poll-countdown-timer text-brand-yellow font-bold text-xs flex items-center gap-1" data-expires="${poll.expiresAt}"><i data-lucide="clock" class="w-3.5 h-3.5 inline-block animate-pulse"></i> 계산 중...</span>`;

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
          <button class="w-9 h-9 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500/10 text-red-400 btn-delete-poll active:scale-95 transition-all flex-shrink-0" data-id="${poll.id}" title="설문 삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        `;
      }

      card.innerHTML = `
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${isExpired ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-brand-green/10 border-brand-green/20 text-brand-green'}">
              ${!isExpired ? '<span class="w-2 h-2 rounded-full bg-brand-green inline-block animate-ping"></span>' : ''}
              ${statusText}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${poll.dupMode === 'hourly' ? 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'}">
              ${poll.dupMode === 'hourly' ? '1시간마다 참여' : '평생 1회 제한'}
            </span>
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">작성자: <strong class="text-slate-800 dark:text-slate-200">${ownerLabel}</strong></span>
        </div>
        
        <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug mt-2 line-clamp-2 min-h-[44px]" title="${poll.title}">
          ${poll.title}
        </h3>

        <div class="flex justify-between items-center mt-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 w-full">
          ${countdownHtml}
          <span class="text-xs text-slate-500 dark:text-slate-400">참여: <strong class="text-brand-cyan">${totalVotesCount}명</strong></span>
        </div>

        <div class="flex gap-2 mt-4 w-full">
          ${!isExpired && !hasVoted 
            ? `<button class="btn-vote-trigger flex-1 bg-gradient-to-r from-brand-purple to-brand-cyan hover:shadow-lg shadow-brand-purple/20 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center hover:scale-[1.01] active:scale-95 cursor-pointer h-9" data-id="${poll.id}">투표 참여하기</button>`
            : `<button class="btn-stats-trigger flex-1 bg-brand-green/10 border border-brand-green/20 hover:bg-brand-green/15 text-brand-green font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center hover:scale-[1.01] active:scale-95 cursor-pointer h-9" data-id="${poll.id}">${hasVoted ? '투표 완료 (결과보기)' : '결과 분석 보기'}</button>`
          }
          <button class="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 btn-share-poll active:scale-95 transition-all flex-shrink-0" data-id="${poll.id}" title="주소 공유">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
          ${deleteButtonHtml}
        </div>
      `;

      pollsGrid.appendChild(card);
    });

    lucide.createIcons();
    bindPollCardEvents();
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
          const totalSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const secs = totalSecs % 60;
          
          const pad = (n) => String(n).padStart(2, '0');
          timer.innerHTML = `<i data-lucide="clock" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
        }
      });
    }, 1000);
  }

  // Bind trigger actions in cards
  function bindPollCardEvents() {
    document.querySelectorAll('.btn-vote-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
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
        const shareUrl = `${window.location.origin}/${id}`;
        
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
    
    // Set flag for initial poll open to load creator's default tab choice
    window.isInitialPollLoad = true;
    
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
      
      const isReVoting = localStorage.getItem('kfcman_revoting_' + poll.id) === 'true';
      let hasVoted = false;
      if (!isReVoting) {
        hasVoted = localStorage.getItem('kfcman_voted_' + poll.id) === 'true';
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

      // Set default tab on first open to designated board type
      if (window.isInitialPollLoad) {
        if (poll.boardType) {
          setPollViewTab(poll.boardType);
        } else {
          setPollViewTab('bar');
        }
        window.isInitialPollLoad = false;
      }

      const pollModalShareUrl = document.getElementById('poll-modal-share-url');
      if (pollModalShareUrl) {
        const shareUrl = `${window.location.origin}/${encodeURIComponent(poll.title)}`;
        pollModalShareUrl.value = shareUrl;
        
        // Update the header pill text
        const headerShareUrlText = document.getElementById('poll-modal-header-share-url-text');
        if (headerShareUrlText) {
          headerShareUrlText.textContent = `${window.location.host}/${poll.title}`;
        }
        
        // Dynamically update the QR code image next to the title
        const qrImage = document.getElementById('poll-modal-qr-image');
        if (qrImage) {
          qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;
        }
      }

      // Timer calculation
      if (pollModalTimer) {
        if (isExpired) {
          pollModalTimer.textContent = '투표 마감됨';
          pollModalTimer.style.color = '#f87171';
        } else {
          const diffSecs = Math.max(0, Math.floor((new Date(poll.expiresAt) - new Date()) / 1000));
          const mins = Math.floor(diffSecs / 60);
          const secs = diffSecs % 60;
          const pad = (n) => String(n).padStart(2, '0');
          pollModalTimer.textContent = `남은 시간 ${pad(mins)}:${pad(secs)}`;
          pollModalTimer.style.color = '#ff9f43';
        }
      }

      if (viewMode === 'vote') {
        if (pollModalVoteScreen) pollModalVoteScreen.classList.remove('hidden');
        if (pollModalStatsScreen) pollModalStatsScreen.classList.add('hidden');
        
        // Draw voting options list
        if (pollVoteOptionsList) {
          pollVoteOptionsList.innerHTML = '';
          
          if (poll.boardType === 'open') {
            // 주관식 / 개방형 폼
            const textareaRow = document.createElement('div');
            textareaRow.className = 'w-full text-left space-y-3';
            textareaRow.innerHTML = `
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500">닉네임</label>
                <input type="text" id="poll-vote-nickname" placeholder="익명 게스트" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat">
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500">자유 의견 작성</label>
                <textarea id="poll-vote-subjective" placeholder="이곳에 의견을 편하게 남겨주세요." rows="4" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat outline-none focus:border-brand-cyan/50 transition-all"></textarea>
              </div>
            `;
            pollVoteOptionsList.appendChild(textareaRow);
            
          } else if (poll.boardType === 'scale') {
            // 만족도 척도 슬라이더 폼
            poll.options.forEach(opt => {
              const row = document.createElement('div');
              row.className = 'space-y-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl flex flex-col gap-1.5 w-full text-left';
              row.innerHTML = `
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${opt.text}</span>
                <div class="flex items-center gap-3 w-full">
                  <input type="range" min="1" max="5" step="1" value="3" class="flex-1 accent-brand-cyan scale-range-slider h-2 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer" data-option-index="${opt.index}">
                  <span class="text-sm font-black text-brand-cyan scale-range-val w-10 text-center">3점</span>
                </div>
              `;
              
              // Bind range change event to update display
              const slider = row.querySelector('.scale-range-slider');
              const valSpan = row.querySelector('.scale-range-val');
              slider.addEventListener('input', () => {
                valSpan.textContent = `${slider.value}점`;
              });
              
              pollVoteOptionsList.appendChild(row);
            });
            
          } else if (poll.boardType === 'quiz') {
            // 서바이벌 퀴즈 폼
            const timePassedMs = Date.now() - new Date(poll.createdAt).getTime();
            const durationMs = (poll.quizDuration || 30) * 1000;
            const isQuizExpired = timePassedMs > durationMs;
            
            if (isQuizExpired) {
              const info = document.createElement('div');
              info.className = 'text-center py-6 text-slate-500 dark:text-slate-400 text-xs space-y-2';
              info.innerHTML = `
                <i data-lucide="timer-off" class="w-8 h-8 mx-auto text-clay-red display:block mb-1"></i>
                <p class="font-extrabold text-clay-red">퀴즈 제한 시간이 이미 초과되었습니다!</p>
                <p>더 이상 투표에 참여할 수 없습니다. 실시간 리더보드 결과를 확인하세요!</p>
              `;
              pollVoteOptionsList.appendChild(info);
              
              // Disable vote submit button
              const voteSubmitBtn = document.getElementById('btn-submit-vote');
              if (voteSubmitBtn) voteSubmitBtn.disabled = true;
              
              lucide.createIcons();
            } else {
              // Enable vote submit button just in case
              const voteSubmitBtn = document.getElementById('btn-submit-vote');
              if (voteSubmitBtn) voteSubmitBtn.disabled = false;
              
              // Save quiz start time to measure response speed
              window.quizStartTime = Date.now();
              
              const nicknameRow = document.createElement('div');
              nicknameRow.className = 'space-y-1.5 w-full text-left mb-3';
              nicknameRow.innerHTML = `
                <label class="text-xs font-black text-slate-500">닉네임</label>
                <input type="text" id="poll-quiz-nickname" placeholder="서바이벌 참여 닉네임 입력" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat" required autocomplete="off">
              `;
              pollVoteOptionsList.appendChild(nicknameRow);
              
              poll.options.forEach(opt => {
                const item = document.createElement('label');
                item.className = 'bg-slate-50 dark:bg-slate-950/30 flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all border border-slate-200 dark:border-white/5 rounded-xl';
                item.innerHTML = `
                  <input type="radio" name="poll_choice" value="${opt.index}" class="w-4.5 h-4.5 accent-brand-cyan cursor-pointer" required>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${opt.text}</span>
                `;
                pollVoteOptionsList.appendChild(item);
              });
            }
            
          } else if (poll.boardType === 'cloud') {
            // 워드클라우드 단어 직접 입력형 폼
            const cloudInputs = document.createElement('div');
            cloudInputs.className = 'w-full text-left space-y-3';
            cloudInputs.innerHTML = `
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500">닉네임</label>
                <input type="text" id="poll-vote-nickname" placeholder="익명 게스트" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-slate-500">워드클라우드 단어 제출 (최대 3개)</label>
                <input type="text" placeholder="단어 1 입력 (필수)" class="poll-cloud-word w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat" autocomplete="off" maxlength="20" required>
                <input type="text" placeholder="단어 2 입력 (선택)" class="poll-cloud-word w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat" autocomplete="off" maxlength="20">
                <input type="text" placeholder="단어 3 입력 (선택)" class="poll-cloud-word w-full bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-clay-flat" autocomplete="off" maxlength="20">
              </div>
            `;
            pollVoteOptionsList.appendChild(cloudInputs);
            
            const voteSubmitBtn = document.getElementById('btn-submit-vote');
            if (voteSubmitBtn) voteSubmitBtn.disabled = false;
            
          } else {
            // Standard Multiple Choice
            const voteSubmitBtn = document.getElementById('btn-submit-vote');
            if (voteSubmitBtn) voteSubmitBtn.disabled = false;
            
            poll.options.forEach(opt => {
              const item = document.createElement('label');
              item.className = 'bg-slate-50 dark:bg-slate-950/30 flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all border border-slate-200 dark:border-white/5 rounded-xl';
              const inputType = poll.allowMultiple ? 'checkbox' : 'radio';
              item.innerHTML = `
                <input type="${inputType}" name="poll_choice" value="${opt.index}" class="w-4.5 h-4.5 accent-brand-cyan cursor-pointer">
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${opt.text}</span>
              `;
              pollVoteOptionsList.appendChild(item);
            });
          }
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
            container.className = 'flex flex-col gap-1.5 w-full';
  
            const hue = (idx * 137) % 360;
            const gradientStyle = `linear-gradient(90deg, hsla(${hue}, 85%, 60%, 0.95), hsla(${hue + 25}, 85%, 50%, 0.95))`;
  
            container.innerHTML = `
              <div class="flex justify-between items-center text-sm mb-0.5">
                <span class="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full inline-block" style="background: hsla(${hue}, 85%, 60%, 0.95); box-shadow: 0 0 8px hsla(${hue}, 85%, 60%, 0.6)"></span>
                  ${opt.text}
                </span>
                <span class="font-black text-slate-900 dark:text-white">${percent}% <span class="font-bold text-xs text-slate-400 dark:text-slate-500">(${opt.votes}표)</span></span>
              </div>
              <div class="w-full h-5 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-inner">
                <div class="h-full rounded-xl menti-bar-fill transition-all duration-1000 ease-out" style="width:${percent}%; background:${gradientStyle}; box-shadow:0 0 14px hsla(${hue}, 85%, 60%, 0.35);"></div>
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

          poll.options.forEach((opt, idx) => {
            const percentVal = totalVotesCount > 0 ? (opt.votes / totalVotesCount) * 100 : 0;
            const percent = percentVal.toFixed(1);
            const hue = (idx * 137) % 360;

            if (opt.votes > maxOption.votes) {
              maxOption = { text: opt.text, percent: `${percent}%`, votes: opt.votes };
            }

            if (percentVal > 0) {
              const arcLength = (percentVal / 100) * circumference;
              const strokeOffset = circumference - arcLength + (accumulatedPercent / 100) * circumference;
              
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('cx', '50');
              circle.setAttribute('cy', '50');
              circle.setAttribute('r', String(radius));
              circle.setAttribute('fill', 'transparent');
              circle.setAttribute('stroke', `hsla(${hue}, 85%, 60%, 0.9)`);
              circle.setAttribute('stroke-width', '8');
              circle.setAttribute('stroke-dasharray', `${arcLength} ${circumference}`);
              circle.setAttribute('stroke-dashoffset', String(-((accumulatedPercent / 100) * circumference)));
              circle.setAttribute('stroke-linecap', 'round');
              circle.style.transition = 'stroke-dashoffset 0.8s ease';
              circle.style.cursor = 'pointer';
              
              // Hover effect to show stats in the center of donut
              circle.addEventListener('mouseover', () => {
                if (donutCenterPercent) donutCenterPercent.textContent = `${percent}%`;
                if (donutCenterLabel) donutCenterLabel.textContent = opt.text;
              });

              pollDonutSvg.appendChild(circle);
              accumulatedPercent += percentVal;
            }

            // Append Legend Item
            const legendRow = document.createElement('div');
            legendRow.className = 'flex items-center gap-2 text-xs w-full';
            
            legendRow.innerHTML = `
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:hsla(${hue}, 85%, 60%, 0.9);"></span>
              <span class="text-slate-800 dark:text-slate-300 flex-1 text-left font-semibold truncate" title="${opt.text}">${opt.text}</span>
              <span class="text-slate-500 dark:text-slate-400 font-bold flex-shrink-0">${percent}% (${opt.votes}표)</span>
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
              <div class="text-slate-500 dark:text-slate-400 text-xs text-center w-full py-5 space-y-1.5">
                <i data-lucide="cloud-off" class="w-6 h-6 mb-1 display:inline-block opacity-50 mx-auto"></i>
                <p>투표 득표 기록이 발생하면 멋진 워드클라우드가 실시간으로 형성됩니다.</p>
              </div>
            `;
            lucide.createIcons();
          } else {
            const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
            
            poll.options.forEach((opt, idx) => {
              const weight = opt.votes / maxVotes;
              const percent = ((opt.votes / totalVotesCount) * 100).toFixed(1);
              const fontSize = 28 + weight * 52; // 28px to 80px (2x larger)
              const opacity = 0.5 + weight * 0.5; // 0.5 to 1.0
              const hue = (idx * 137) % 360;

              const wordSpan = document.createElement('span');
              wordSpan.textContent = opt.text;
              wordSpan.title = `득표: ${opt.votes}표 (${percent}%)`;
              wordSpan.style.fontSize = `${fontSize}px`;
              wordSpan.style.color = `hsla(${hue}, 85%, 65%, ${opacity})`;
              wordSpan.style.fontWeight = weight > 0.5 ? '900' : (weight > 0.25 ? '700' : '500');
              
              const floatDur = 4.5 + Math.random() * 4.5;
              const floatDelay = Math.random() * -6;
              wordSpan.className = 'px-3.5 py-2.5 menti-word transition-all duration-300 hover:scale-125 cursor-pointer select-none font-black tracking-tight rounded-2xl bg-slate-500/5 dark:bg-white/5 border border-slate-200/10 dark:border-white/5 shadow-sm';
              wordSpan.style.setProperty('--float-duration', `${floatDur}s`);
              wordSpan.style.setProperty('--float-delay', `${floatDelay}s`);

              pollStatsWordcloud.appendChild(wordSpan);
            });
          }
        }

        // 4. Draw Open Ended Answers (Floating Speech Bubbles)
        const pollStatsOpenEnded = document.getElementById('poll-stats-openended');
        if (pollStatsOpenEnded) {
          pollStatsOpenEnded.innerHTML = '';
          const answers = poll.subjectiveAnswers || [];
          if (answers.length === 0) {
            pollStatsOpenEnded.innerHTML = `
              <div class="text-slate-500 dark:text-slate-400 text-xs text-center w-full col-span-full py-5 space-y-1.5">
                <i data-lucide="message-square-off" class="w-6 h-6 mb-1 display:inline-block opacity-50 mx-auto"></i>
                <p>아직 제출된 의견이 없습니다. 실시간으로 3D neon 의견 카드가 여기에 형성됩니다!</p>
              </div>
            `;
            lucide.createIcons();
          } else {
            answers.forEach((ans, idx) => {
              const card = document.createElement('div');
              const hue = (idx * 137) % 360;
              card.className = 'px-4 py-3 border rounded-2xl shadow-clay-flat text-left space-y-1.5 hover:scale-[1.03] transition-all duration-300';
              card.style.background = `hsla(${hue}, 85%, 60%, 0.08)`;
              card.style.borderColor = `hsla(${hue}, 85%, 60%, 0.35)`;
              card.style.boxShadow = `0 0 10px hsla(${hue}, 85%, 60%, 0.1), 0 4px 6px -1px rgba(0,0,0,0.1)`;
              card.innerHTML = `
                <p class="text-sm font-extrabold text-slate-800 dark:text-slate-100 word-break:break-word">${ans.text}</p>
                <div class="flex justify-between items-center text-[10px] font-black text-slate-400">
                  <span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${ans.nickname || '익명'}</span>
                  <span>${new Date(ans.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              `;
              pollStatsOpenEnded.appendChild(card);
            });
            lucide.createIcons();
          }
        }

        // 5. Draw Scale Evaluation Bars
        const pollStatsScale = document.getElementById('poll-stats-scale');
        if (pollStatsScale) {
          pollStatsScale.innerHTML = '';
          poll.options.forEach((opt, idx) => {
            const avg = opt.votes > 0 ? (opt.totalScore / opt.votes).toFixed(1) : '0.0';
            const hue = (idx * 137) % 360;
            const row = document.createElement('div');
            row.className = 'flex flex-col gap-1.5 w-full text-left';
            row.innerHTML = `
              <div class="flex justify-between items-center text-sm mb-0.5">
                <span class="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full inline-block" style="background: hsla(${hue}, 85%, 60%, 0.95); box-shadow: 0 0 8px hsla(${hue}, 85%, 60%, 0.6)"></span>
                  ${opt.text}
                </span>
                <span class="font-black text-brand-cyan">${avg} / 5.0 <span class="font-bold text-xs text-slate-400 dark:text-slate-500">(${opt.votes}명 참여)</span></span>
              </div>
              <div class="w-full h-4 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-inner">
                <div class="h-full rounded-xl transition-all duration-1000 ease-out" style="width:${(avg / 5.0) * 100}%; background:linear-gradient(90deg, hsla(${hue}, 85%, 60%, 0.95), hsla(${hue + 25}, 85%, 50%, 0.95)); box-shadow:0 0 14px hsla(${hue}, 85%, 60%, 0.35);"></div>
              </div>
            `;
            pollStatsScale.appendChild(row);
          });
        }

        // 6. Draw Quiz Competition Arena
        const pollStatsQuiz = document.getElementById('poll-stats-quiz');
        if (pollStatsQuiz) {
          const timerValEl = document.getElementById('quiz-arena-timer-value');
          const timePassedMs = Date.now() - new Date(poll.createdAt).getTime();
          const durationMs = (poll.quizDuration || 30) * 1000;
          const diffSecs = Math.max(0, Math.ceil((durationMs - timePassedMs) / 1000));
          
          if (timerValEl) {
            if (diffSecs <= 0) {
              timerValEl.textContent = '마감됨';
              timerValEl.style.color = '#f87171';
            } else {
              timerValEl.textContent = `${diffSecs}초 남음`;
              timerValEl.style.color = 'var(--color-yellow)';
            }
          }

          const leaderboardList = document.getElementById('quiz-leaderboard-list');
          if (leaderboardList) {
            leaderboardList.innerHTML = '';
            
            // Sort voters by pointsEarned descending
            const quizVoters = (poll.voters || [])
              .filter(v => v.pointsEarned !== undefined)
              .sort((a, b) => b.pointsEarned - a.pointsEarned);
            
            if (quizVoters.length === 0) {
              leaderboardList.innerHTML = `
                <div class="text-slate-500 dark:text-slate-400 text-xs text-center py-5 space-y-1.5">
                  <i data-lucide="swords" class="w-6 h-6 mb-1 display:inline-block opacity-50 mx-auto"></i>
                  <p>아직 퀴즈 제출자가 없습니다. 실시간 경쟁에 첫 획을 그어 보세요!</p>
                </div>
              `;
              lucide.createIcons();
            } else {
              quizVoters.slice(0, 5).forEach((voter, rankIdx) => {
                let rankIcon = String(rankIdx + 1);
                let rankClass = 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400';
                
                if (rankIdx === 0) {
                  rankIcon = '👑';
                  rankClass = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30';
                } else if (rankIdx === 1) {
                  rankIcon = '🥈';
                  rankClass = 'bg-slate-300/20 text-slate-300 border border-slate-300/30';
                } else if (rankIdx === 2) {
                  rankIcon = '🥉';
                  rankClass = 'bg-amber-600/20 text-amber-500 border border-amber-600/30';
                }
                
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between p-3 rounded-2xl bg-slate-900/10 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:scale-[1.01] transition-all duration-200';
                row.innerHTML = `
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${rankClass}">${rankIcon}</span>
                    <span class="font-extrabold text-slate-800 dark:text-slate-200">${voter.nickname}</span>
                    ${voter.isCorrect ? '<span class="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">정답</span>' : '<span class="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">오답</span>'}
                  </div>
                  <span class="font-black text-brand-cyan">${voter.pointsEarned || 0}점</span>
                `;
                leaderboardList.appendChild(row);
              });
            }
          }
        }

        // Toggle visibility to current selected tab
        togglePollViewTabContainers();

        // Mentimeter Dynamic Controls: Show/Hide Reset Button for Creator/Admin and Bind click events!
        const btnPollResetResults = document.getElementById('btn-poll-reset-results');
        const btnPollChangeVote = document.getElementById('btn-poll-change-vote');

        // Toggle visibility of creator reset button
        if (btnPollResetResults) {
          const isOwnerOrAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || poll.owner === cleanUser;
          if (isOwnerOrAdmin) {
            btnPollResetResults.classList.remove('hidden');
          } else {
            btnPollResetResults.classList.add('hidden');
          }
        }

        // Bind Individual Vote Modification (재투표)
        if (btnPollChangeVote) {
          // Replaces previous listener with a fresh one to avoid double binding
          const newBtn = btnPollChangeVote.cloneNode(true);
          btnPollChangeVote.parentNode.replaceChild(newBtn, btnPollChangeVote);
          newBtn.addEventListener('click', () => {
            localStorage.setItem('kfcman_revoting_' + poll.id, 'true');
            localStorage.removeItem('kfcman_voted_' + poll.id);
            showToast('투표 리셋 🔄', '이전 투표 내용이 초기화되었습니다. 다시 투표하실 수 있습니다!', 'info');
            fetchPollDetailsAndDraw(poll.id, 'vote');
          });
        }

        // Bind Whole Poll Reset (결과 초기화)
        if (btnPollResetResults) {
          const newBtn = btnPollResetResults.cloneNode(true);
          btnPollResetResults.parentNode.replaceChild(newBtn, btnPollResetResults);
          newBtn.addEventListener('click', async () => {
            if (confirm('⚠️ 경고: 이 설문의 모든 투표 내역을 초기화하고 재투표(재설문)를 시작하시겠습니까?\n이 작업은 취소할 수 없습니다.')) {
              try {
                const res = await secureFetch(`/api/polls/${poll.id}/reset`, { method: 'POST' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                localStorage.removeItem('kfcman_voted_' + poll.id);
                localStorage.removeItem('kfcman_revoting_' + poll.id);
                showToast('설문 리셋 완료 ✨', '선호도 조사가 성공적으로 초기화되어 모든 사용자가 투표를 다시 진행할 수 있습니다!', 'success');
                
                await fetchPollDetailsAndDraw(poll.id, 'vote');
                fetchAndRenderPolls();
              } catch (err) {
                showToast('초기화 실패', err.message, 'error');
              }
            }
          });
        }
      }

    } catch (err) {
      console.error(err);
      showToast('로드 오류', err.message, 'error');
      if (pollVoteModal) pollVoteModal.classList.add('hidden');
    }
  }

  // Handle vote submissions
  if (pollVoteForm) {
    pollVoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      let checked = [];
      let extraPayload = {};
      
      const responseDetails = await secureFetch(`/api/polls/${currentActivePollId}`);
      if (!responseDetails.ok) throw new Error('설문 정보를 불러올 수 없습니다.');
      const { poll } = await responseDetails.json();
      
      if (poll.boardType === 'open') {
        const subjectiveText = document.getElementById('poll-vote-subjective').value.trim();
        if (!subjectiveText) {
          showToast('의견 미입력', '제출할 의견을 입력해 주세요!', 'error');
          return;
        }
        extraPayload = {
          nickname: document.getElementById('poll-vote-nickname').value.trim() || '익명 게스트',
          subjectiveText: subjectiveText
        };
      } else if (poll.boardType === 'cloud') {
        const words = Array.from(pollVoteForm.querySelectorAll('.poll-cloud-word'))
          .map(el => el.value.trim())
          .filter(Boolean);
        if (words.length === 0) {
          showToast('단어 입력', '제출할 단어를 최소 하나 이상 입력해 주세요!', 'error');
          return;
        }
        extraPayload = {
          nickname: document.getElementById('poll-vote-nickname').value.trim() || '익명 게스트',
          words: words
        };
        checked = [];
      } else if (poll.boardType === 'scale') {
        const scores = {};
        const sliders = pollVoteForm.querySelectorAll('.scale-range-slider');
        sliders.forEach(slider => {
          const index = parseInt(slider.getAttribute('data-option-index'));
          scores[index] = parseFloat(slider.value);
        });
        extraPayload = {
          scores: scores
        };
        checked = Object.keys(scores).map(x => parseInt(x));
      } else if (poll.boardType === 'quiz') {
        const nickname = document.getElementById('poll-quiz-nickname').value.trim();
        if (!nickname) {
          showToast('닉네임 입력', '퀴즈 참여를 위해 닉네임을 작성해 주세요!', 'error');
          return;
        }
        const radio = pollVoteForm.querySelector('input[name="poll_choice"]:checked');
        if (!radio) {
          showToast('선택 요청', '정답을 선택해 주세요!', 'error');
          return;
        }
        checked = [parseInt(radio.value)];
        
        // Calculate response time elapsed since start of rendering
        const timeElapsedMs = window.quizStartTime ? (Date.now() - window.quizStartTime) : 0;
        extraPayload = {
          nickname: nickname,
          timeElapsedMs: timeElapsedMs
        };
      } else {
        checked = Array.from(pollVoteForm.querySelectorAll('input[name="poll_choice"]:checked')).map(el => parseInt(el.value));
        if (checked.length === 0) {
          showToast('선택 요청', '선호하시는 항목을 최소 하나 이상 선택해 주세요!', 'error');
          return;
        }
      }
  
      const voteSubmitBtn = document.getElementById('btn-submit-vote');
      const btnSpan = voteSubmitBtn.querySelector('span');
      voteSubmitBtn.disabled = true;
      btnSpan.textContent = '투표 등록 중...';
  
      try {
        const response = await secureFetch(`/api/polls/${currentActivePollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedIndexes: checked, guestId: getOrCreateGuestId(), extraPayload })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
  
        // Store client-side trace for guest duplicate voting checks
        localStorage.removeItem('kfcman_revoting_' + currentActivePollId);
        localStorage.setItem('kfcman_voted_' + currentActivePollId, 'true');

        showToast('투표 성공', '성공적으로 선호도 조사에 참여하셨습니다. 소중한 의견 감사드립니다!', 'success');
        
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

  const btnCopyModalHeaderUrl = document.getElementById('btn-copy-modal-header-url');
  if (btnCopyModalHeaderUrl) {
    btnCopyModalHeaderUrl.addEventListener('click', () => {
      const pollModalShareUrl = document.getElementById('poll-modal-share-url');
      if (pollModalShareUrl && pollModalShareUrl.value) {
        navigator.clipboard.writeText(pollModalShareUrl.value).then(() => {
          showToast(
            '설문 주소 복사 완료',
            '선호도 조사 비로그인 참여 링크가 클립보드에 안전하게 복사되었습니다!',
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
      
      // Fetch details and redraw modal ONLY when results screen (stats) is visible.
      // This prevents auto-refresh from clearing/resetting inputs when the guest is typing or voting.
      try {
        const isStatsVisible = pollModalStatsScreen && !pollModalStatsScreen.classList.contains('hidden');
        if (isStatsVisible) {
          await fetchPollDetailsAndDraw(currentActivePollId, 'stats');
        }
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

  // --- Mobile Buttons Event Bindings ---
  const themeToggleBtnMobile = document.getElementById('theme-toggle-btn-mobile');
  if (themeToggleBtnMobile) {
    themeToggleBtnMobile.addEventListener('click', () => {
      themeToggleBtn.click(); // Forward click to the original theme toggle
    });
  }

  const logoutBtnMobile = document.getElementById('btn-logout-mobile');
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener('click', () => {
      logoutBtn.click(); // Forward click to the original logout button
    });
  }

  // --- Mobile Tab Bar Interactive Controller ---
  const mobileNavShortener = document.getElementById('mobile-nav-shortener');
  const mobileNavDashboard = document.getElementById('mobile-nav-dashboard');
  const mobileNavPolls = document.getElementById('mobile-nav-polls');

  function updateMobileNavActive(activeId) {
    [mobileNavShortener, mobileNavDashboard, mobileNavPolls].forEach(el => {
      if (el) {
        if (el.id === activeId) {
          el.classList.add('active-mobile-nav');
          el.classList.remove('text-slate-400', 'dark:text-slate-500');
        } else {
          el.classList.remove('active-mobile-nav');
          el.classList.add('text-slate-400', 'dark:text-slate-500');
        }
      }
    });
  }

  if (mobileNavShortener) mobileNavShortener.addEventListener('click', () => updateMobileNavActive('mobile-nav-shortener'));
  if (mobileNavDashboard) mobileNavDashboard.addEventListener('click', () => updateMobileNavActive('mobile-nav-dashboard'));
  if (mobileNavPolls) mobileNavPolls.addEventListener('click', () => updateMobileNavActive('mobile-nav-polls'));

  // Simple Scroll Spy for Mobile Bottom Navigation
  window.addEventListener('scroll', () => {
    if (window.innerWidth >= 1024) return; // Only on mobile/tablet hybrid screens
    const mobileNavMemberGroup = document.getElementById('mobile-nav-member-group');
    if (mobileNavMemberGroup && !mobileNavMemberGroup.classList.contains('hidden')) return; // Skip scroll spy when in classroom dashboard mode

    const scrollPos = window.scrollY + 200;
    const dashSec = document.getElementById('dashboard-section');
    const pollSec = document.getElementById('polls-section');
    
    if (pollSec && scrollPos >= pollSec.offsetTop) {
      updateMobileNavActive('mobile-nav-polls');
    } else if (dashSec && scrollPos >= dashSec.offsetTop) {
      updateMobileNavActive('mobile-nav-dashboard');
    } else {
      updateMobileNavActive('mobile-nav-shortener');
    }
  });

  // Initial trigger
  updateMobileNavActive('mobile-nav-shortener');


  // ==========================================================================
  // --- 11. CLASSROOM GAMIFICATION SYSTEM CONTROLLER (쏙점수) ---
  // ==========================================================================
  
  let classroomDb = null;
  let classroomData = null;
  let currentSettingsSubtab = 'privacy';

  // DOM Cache
  const navItemClassroom = document.getElementById('nav-item-classroom');
  const navItemGradebook = document.getElementById('nav-item-gradebook');
  const navItemThermometer = document.getElementById('nav-item-thermometer');
  const navItemClassroomSettings = document.getElementById('nav-item-classroom-settings');

  const mobileNavClassroom = document.getElementById('mobile-nav-classroom');
  const mobileNavGradebook = document.getElementById('mobile-nav-gradebook');
  const mobileNavThermometer = document.getElementById('mobile-nav-thermometer');
  const mobileNavClassroomSettings = document.getElementById('mobile-nav-classroom-settings');

  const classroomSection = document.getElementById('classroom-section');
  const gradebookSection = document.getElementById('gradebook-section');
  const thermometerSection = document.getElementById('thermometer-section');
  const classroomSettingsSection = document.getElementById('classroom-settings-section');

  const dashStudentCount = document.getElementById('dash-student-count');
  const dashTempVal = document.getElementById('dash-temp-val');
  const dashTotalRaw = document.getElementById('dash-total-raw');
  const dashRatioRule = document.getElementById('dash-ratio-rule');
  const dashNextTargetTemp = document.getElementById('dash-next-target-temp');
  const dashNextTargetActivity = document.getElementById('dash-next-target-activity');
  const dashTempRemainingLabel = document.getElementById('dash-temp-remaining-label');
  const dashAchievedGoalsList = document.getElementById('dash-achieved-goals-list');
  const dashTempProgressBar = document.getElementById('dash-temp-progress-bar');
  const dashTempMilestonesContainer = document.getElementById('dash-temp-milestones-container');
  const spaceRaceTracksContainer = document.getElementById('space-race-tracks-container');
  const dashStudentsGrid = document.getElementById('dash-students-grid');

  const gradeStudentCount = document.getElementById('grade-student-count');
  const gradebookTableBody = document.getElementById('gradebook-table-body');

  const detailTempProgressBar = document.getElementById('detail-temp-progress-bar');
  const detailTempMilestonesContainer = document.getElementById('detail-temp-milestones-container');
  const detailTempVal = document.getElementById('detail-temp-val');
  const detailRemainingMiles = document.getElementById('detail-remaining-miles');
  const detailStatTotalRaw = document.getElementById('detail-stat-total-raw');
  const detailStatTotalPaid = document.getElementById('detail-stat-total-paid');
  const detailStatTotalUnpaid = document.getElementById('detail-stat-total-unpaid');
  const detailStatStudentsCount = document.getElementById('detail-stat-students-count');
  const milestonesListContainer = document.getElementById('milestones-list-container');
  const addMilestoneForm = document.getElementById('add-milestone-form');
  const milestoneTempInput = document.getElementById('milestone-temp-input');
  const milestoneActivityInput = document.getElementById('milestone-activity-input');

  const btnSubtabPrivacy = document.getElementById('btn-subtab-privacy');
  const btnSubtabRules = document.getElementById('btn-subtab-rules');
  const btnSubtabFontsize = document.getElementById('btn-subtab-fontsize');
  const settingsPrivacyCard = document.getElementById('settings-privacy-card');
  const settingsRulesCard = document.getElementById('settings-rules-card');
  const settingsFontsizeCard = document.getElementById('settings-fontsize-card');

  const chkNamePrivacy = document.getElementById('chk-name-privacy');
  const privacyStatusLabel = document.getElementById('privacy-status-label');
  const bulkGenerateSettingsForm = document.getElementById('bulk-generate-settings-form');
  const bulkGenCount = document.getElementById('bulk-gen-count');
  const bulkGenStart = document.getElementById('bulk-gen-start');

  const ruleCurrentRatioLabel = document.getElementById('rule-current-ratio-label');
  const ruleCurrentTempLabel = document.getElementById('rule-current-temp-label');
  const rulesAchievementRatios = document.getElementById('rules-achievement-ratios');
  const rulesTempDividers = document.getElementById('rules-temp-dividers');
  const ratioCustomForm = document.getElementById('ratio-custom-form');
  const customRatioVal = document.getElementById('custom-ratio-val');
  const dividerCustomForm = document.getElementById('divider-custom-form');
  const customDividerVal = document.getElementById('custom-divider-val');

  // Modals DOM
  const classroomImportModal = document.getElementById('classroom-import-modal');
  const btnImportModalClose = document.getElementById('btn-import-modal-close');
  const importCsvTextarea = document.getElementById('import-csv-textarea');
  const btnImportSubmit = document.getElementById('btn-import-submit');

  const classroomAddAllModal = document.getElementById('classroom-add-all-modal');
  const btnAddAllModalClose = document.getElementById('btn-add-all-modal-close');
  const addAllScoresForm = document.getElementById('add-all-scores-form');
  const addAllScoreVal = document.getElementById('add-all-score-val');

  const classroomAddTransferModal = document.getElementById('classroom-add-transfer-modal');
  const btnTransferModalClose = document.getElementById('btn-transfer-modal-close');
  const addTransferStudentForm = document.getElementById('add-transfer-student-form');
  const transferStudentNum = document.getElementById('transfer-student-num');
  const transferStudentName = document.getElementById('transfer-student-name');

  // Unified Section Switcher
  window.switchClassroomTab = function(sectionId) {
    if (sectionId === 'classroom-section') switchClassroomSubTab('dash');
    else if (sectionId === 'gradebook-section') switchClassroomSubTab('gradebook');
    else if (sectionId === 'thermometer-section') switchClassroomSubTab('thermometer');
    else if (sectionId === 'classroom-settings-section') {
      switchMainTab('settings');
      switchSettingsSubTab('classroom');
    }
  };

  // Bind Main Tab and Sub-Tab Switchers
  if (navItemClassroom) {
    navItemClassroom.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('classroom');
    });
  }

  // Bind Mobile Main Nav Buttons
  const mobileNavShortenerMember = document.getElementById('mobile-nav-shortener-member');
  const mobileNavPollsMember = document.getElementById('mobile-nav-polls-member');
  const mobileNavClassroomMember = document.getElementById('mobile-nav-classroom');

  if (mobileNavShortenerMember) {
    mobileNavShortenerMember.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('shortener');
    });
  }
  if (mobileNavPollsMember) {
    mobileNavPollsMember.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('polls');
    });
  }
  if (mobileNavClassroomMember) {
    mobileNavClassroomMember.addEventListener('click', (e) => {
      e.preventDefault();
      switchMainTab('classroom');
    });
  }

  // Bind Classroom Subtab Navigation Buttons
  const btnSubtabDash = document.getElementById('btn-classroom-subtab-dash');
  const btnSubtabGradebook = document.getElementById('btn-classroom-subtab-gradebook');
  const btnSubtabThermometer = document.getElementById('btn-classroom-subtab-thermometer');

  if (btnSubtabDash) btnSubtabDash.addEventListener('click', () => switchClassroomSubTab('dash'));
  if (btnSubtabGradebook) btnSubtabGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnSubtabThermometer) btnSubtabThermometer.addEventListener('click', () => switchClassroomSubTab('thermometer'));

  // Grid / Race click-redirects to sub-tabs
  const btnRaceGotoGradebook = document.getElementById('btn-race-goto-gradebook');
  const btnGridGotoGradebook = document.getElementById('btn-grid-goto-gradebook');
  const btnPrivacyGotoGradebook = document.getElementById('btn-privacy-goto-gradebook');
  const btnSettingsGotoGradebook = document.getElementById('btn-settings-goto-gradebook');

  if (btnRaceGotoGradebook) btnRaceGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnGridGotoGradebook) btnGridGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnPrivacyGotoGradebook) btnPrivacyGotoGradebook.addEventListener('click', () => {
    switchMainTab('settings');
    switchSettingsSubTab('classroom');
  });
  if (btnSettingsGotoGradebook) btnSettingsGotoGradebook.addEventListener('click', () => {
    switchMainTab('settings');
    switchSettingsSubTab('classroom');
  });

  // Load classroom data from server
  window.fetchClassroom = async function() {
    try {
      const res = await secureFetch('/api/classroom');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      classroomDb = data.classroom;
      if (classroomDb && classroomDb.classes && classroomDb.activeClassId) {
        classroomData = classroomDb.classes[classroomDb.activeClassId];
      } else {
        classroomData = classroomDb;
      }
      renderAllClassroomViews();
      updateClassSwitcherUI();
    } catch (err) {
      console.error(err);
      showToast('로드 실패', '학급 데이터를 서버로부터 불러오지 못했습니다.', 'error');
    }
  };

  // Save classroom data to server
  async function saveClassroomToServer() {
    try {
      if (classroomDb && classroomDb.classes && classroomDb.activeClassId) {
        classroomDb.classes[classroomDb.activeClassId] = classroomData;
      }
      const res = await secureFetch('/api/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroom: classroomDb || classroomData })
      });
      if (!res.ok) throw new Error('Save Error');
      const data = await res.json();
      classroomDb = data.classroom;
      if (classroomDb && classroomDb.classes && classroomDb.activeClassId) {
        classroomData = classroomDb.classes[classroomDb.activeClassId];
      } else {
        classroomData = classroomDb;
      }
      renderAllClassroomViews();
      updateClassSwitcherUI();
    } catch (err) {
      console.error(err);
      showToast('저장 실패', '서버 저장 중 네트워크 에러가 발생했습니다.', 'error');
    }
  }

  // Main Render Hub
  function renderAllClassroomViews() {
    if (!classroomData) return;
    
    // Sort students by number ascending for lists/grids
    classroomData.students.sort((a, b) => a.number - b.number);

    renderDashboardView();
    renderGradebookView();
    renderThermometerView();
    renderSettingsView();
  }

  // Render 1: Dashboard View
  function renderDashboardView() {
    // 1. Stats
    const totalStudents = classroomData.students.length;
    dashStudentCount.textContent = totalStudents;

    // Toggle initial guidance card if students list is empty
    const classInitialGuidanceCard = document.getElementById('class-initial-guidance-card');
    if (classInitialGuidanceCard) {
      if (totalStudents === 0) {
        classInitialGuidanceCard.classList.remove('hidden');
      } else {
        classInitialGuidanceCard.classList.add('hidden');
      }
    }
    
    const totalRaw = classroomData.students.reduce((sum, s) => sum + (s.rawScore || 0), 0);
    dashTotalRaw.textContent = totalRaw.toLocaleString() + '점';

    const tempDivider = classroomData.rules.thermometerRatio || 200;
    dashRatioRule.textContent = `÷ ${tempDivider}`;

    // Temperature value calculation
    const calculatedTemp = parseFloat((totalRaw / tempDivider).toFixed(1));
    dashTempVal.textContent = `${calculatedTemp}°`;

    // Dynamic horizontal scale logic (0 to 200, stretches if a milestone or currentTemp is higher)
    const maxScale = Math.max(200, ...classroomData.goals.map(g => g.temp), calculatedTemp);
    const fillPercent = Math.min(100, (calculatedTemp / maxScale) * 100);

    if (dashTempProgressBar) {
      dashTempProgressBar.style.width = fillPercent + '%';
    }

    // Populate milestone indicators dynamically
    if (dashTempMilestonesContainer) {
      classroomData.goals.sort((a, b) => a.temp - b.temp);
      dashTempMilestonesContainer.innerHTML = classroomData.goals.map((g, idx) => {
        const percent = (g.temp / maxScale) * 100;
        const reached = calculatedTemp >= g.temp;
        const isAbove = (idx % 2 === 0);
        return `
          <div class="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none" style="left: ${percent}%;">
            ${isAbove ? `
              <!-- Milestone Badge Above -->
              <div class="absolute bottom-full mb-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
                <div class="w-3.5 h-3.5 border-r-2 border-b-2 border-white rotate-45 -mt-1.5 shadow-sm transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
              </div>
            ` : `
              <!-- Milestone Badge Below -->
              <div class="absolute top-full mt-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <div class="w-3.5 h-3.5 border-l-2 border-t-2 border-white rotate-45 -mb-1.5 shadow-sm transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
              </div>
            `}
            
            <!-- Indicator line inside track -->
            <div class="w-1 h-full border-l border-white/20 dark:border-white/10 relative">
              <!-- Interactive dot -->
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white transition-all shadow-md ${reached ? 'bg-white scale-125' : 'bg-slate-300 dark:bg-slate-700'}"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Goal Target calculations
    classroomData.goals.sort((a, b) => a.temp - b.temp);
    
    const nextGoal = classroomData.goals.find(g => g.temp > calculatedTemp) || classroomData.goals[classroomData.goals.length - 1];
    if (nextGoal) {
      dashNextTargetTemp.textContent = `${nextGoal.temp.toFixed(1)}°`;
      dashNextTargetActivity.textContent = nextGoal.activity;
      
      const rawRemaining = Math.max(0, (nextGoal.temp * tempDivider) - totalRaw);
      const tempRemaining = Math.max(0, parseFloat((nextGoal.temp - calculatedTemp).toFixed(1)));
      dashTempRemainingLabel.innerHTML = `남은 온도 ${tempRemaining}° <span class="text-[9px] text-slate-400 font-bold ml-1">(${rawRemaining.toLocaleString()}점 남음)</span>`;
    } else {
      dashNextTargetTemp.textContent = '100°';
      dashNextTargetActivity.textContent = '모든 칭찬 보상 완료! 🚀';
      dashTempRemainingLabel.textContent = '축하합니다!';
    }

    // Achieved goals list
    const achieved = classroomData.goals.filter(g => g.temp <= calculatedTemp);
    dashAchievedGoalsList.innerHTML = achieved.map(g => `
      <div class="flex items-center gap-2 text-base font-bold text-slate-500 leading-normal mt-1">
        <i data-lucide="check-circle" class="w-5 h-5 text-clay-grass flex-shrink-0"></i>
        <span>${g.temp.toFixed(0)}° - ${g.activity}</span>
      </div>
    `).join('') || `<div class="text-base text-slate-400 font-bold">아직 달성한 칭찬 목표가 없습니다.</div>`;

    // 3. TOP 5 Space Race
    // Sort students by rawScore descending to pick top 5
    const topStudents = [...classroomData.students]
      .sort((a, b) => (b.rawScore || 0) - (a.rawScore || 0))
      .slice(0, 5);

    // Max score among top 5 for width scaling (prevent division by 0)
    const maxScore = Math.max(1, topStudents[0] ? topStudents[0].rawScore : 1);

    const rocketColors = [
      'from-clay-sky to-clay-grass',
      'from-clay-purple to-clay-sky',
      'from-clay-toy to-clay-purple',
      'from-clay-grass to-clay-toy',
      'from-clay-red to-clay-toy'
    ];

    if (spaceRaceTracksContainer) {
      spaceRaceTracksContainer.innerHTML = topStudents.map((s, idx) => {
        const percent = Math.min(100, Math.round((s.rawScore / maxScore) * 82) + 12); // min width 12% to look good
        const nameText = classroomData.rules.namePrivacy ? `${s.number}번` : `${s.number}번. ${s.name}`;
        const color = rocketColors[idx] || rocketColors[0];
        
        const unpaidAchievements = Math.floor((s.unpaid || 0) / (classroomData.rules.rawToAchievementRatio || 50));

        return `
          <div class="space-y-1 text-left">
            <div class="flex justify-between items-center text-[10px] font-black text-slate-500">
              <span>${nameText}</span>
              <span>누적 <strong class="text-slate-800 dark:text-white">${s.rawScore}</strong> / 달성 <strong class="text-clay-sky dark:text-clay-mint">${s.achievements}</strong> <strong class="text-clay-grass ml-1">미지급 ${unpaidAchievements}</strong></span>
            </div>
            <div class="h-8 w-full bg-slate-100 dark:bg-slate-950/50 border border-white/5 rounded-full relative overflow-hidden flex items-center shadow-inner">
              <!-- Rocket Engine Tail Trail (dynamic width) -->
              <div class="h-full bg-gradient-to-r ${color} rounded-l-full flex justify-end items-center pr-3 transition-all duration-1000 ease-out shadow-lg" style="width: ${percent}%;">
                <!-- Shiny metallic rocket cabin representation -->
                <div class="w-5 h-5 rounded-full bg-white/30 border border-white/40 flex items-center justify-center animate-pulse">
                  <i data-lucide="rocket" class="w-3 h-3 text-white -rotate-45"></i>
                </div>
              </div>
              <!-- Custom rank pill -->
              <div class="absolute left-3 w-5 h-5 rounded-full border border-white bg-white text-black text-[9px] font-black flex items-center justify-center shadow shadow-slate-200">${idx + 1}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Students Grid
    dashStudentsGrid.innerHTML = classroomData.students.map(s => {
      const nameText = classroomData.rules.namePrivacy ? '' : s.name;
      const unpaidAchievements = Math.floor((s.unpaid || 0) / (classroomData.rules.rawToAchievementRatio || 50));
      return `
        <div class="bg-white dark:bg-clay-card border-4 border-white rounded-3xl p-6 shadow-clay-flat flex flex-col justify-between items-center text-center clay-card hover:scale-105 transition-all">
          <div class="w-14 h-14 rounded-full border-2 border-white bg-slate-100 dark:bg-slate-850 text-xl font-black flex items-center justify-center shadow-sm text-slate-700 dark:text-slate-300">${s.number}</div>
          ${nameText ? `<span class="text-xl font-black text-slate-800 dark:text-slate-100 mt-3 truncate w-full">${s.name}</span>` : ''}
          <div class="mt-3 text-3xl font-black text-clay-sky dark:text-clay-mint leading-none">${s.rawScore.toLocaleString()}</div>
          <div class="text-[17px] font-black text-clay-grass mt-3.5 bg-clay-grass/15 border-2 border-clay-grass/25 px-4 py-1.5 rounded-2xl">미지급 ${unpaidAchievements}</div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  // Render 2: Gradebook View
  function renderGradebookView() {
    gradeStudentCount.textContent = classroomData.students.length;
    
    gradebookTableBody.innerHTML = classroomData.students.map(s => {
      const unpaidAchievements = Math.floor((s.unpaid || 0) / (classroomData.rules.rawToAchievementRatio || 50));
      const calculatedAchievements = s.achievements;
      const nameText = classroomData.rules.namePrivacy ? '-' : s.name;

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <td class="p-6">
            <span class="font-sans font-black text-slate-400 bg-slate-100 dark:bg-slate-850 px-4 py-2 rounded-xl border border-white/5 text-xl">${s.number}</span>
          </td>
          <td class="p-6 font-black text-slate-800 dark:text-white text-xl">
            <div class="flex items-center gap-2">
              <span class="student-name-label cursor-pointer" data-num="${s.number}">${nameText}</span>
              <i data-lucide="edit" class="w-5 h-5 text-slate-400 cursor-pointer opacity-40 hover:opacity-100 btn-edit-student-name" data-num="${s.number}"></i>
            </div>
          </td>
          <td class="p-6">
            <div class="flex items-center gap-2">
              <span class="font-sans font-extrabold text-slate-800 dark:text-slate-100 student-score-label cursor-pointer text-xl" data-num="${s.number}">${s.rawScore.toLocaleString()}</span>
              <i data-lucide="edit" class="w-5 h-5 text-slate-400 cursor-pointer opacity-40 hover:opacity-100 btn-edit-student-score" data-num="${s.number}"></i>
            </div>
          </td>
          <td class="p-6">
            <div class="flex items-center gap-2">
              <span class="bg-clay-sky/15 text-clay-sky border border-clay-sky/25 px-4 py-2 rounded-2xl font-extrabold text-base inline-flex items-center gap-1.5 student-achievements-label cursor-pointer" data-num="${s.number}">
                <span>${calculatedAchievements}점</span>
              </span>
              <i data-lucide="edit" class="w-5 h-5 text-slate-400 cursor-pointer opacity-40 hover:opacity-100 btn-edit-student-achievements" data-num="${s.number}"></i>
            </div>
          </td>
          <td class="p-6">
            <div class="flex items-center gap-2">
              <span class="font-sans font-extrabold text-slate-600 dark:text-slate-400 student-paid-label cursor-pointer text-xl" data-num="${s.number}">${s.paidScore.toLocaleString()}</span>
              <i data-lucide="edit" class="w-5 h-5 text-slate-400 cursor-pointer opacity-40 hover:opacity-100 btn-edit-student-paid" data-num="${s.number}"></i>
            </div>
          </td>
          <td class="p-6">
            <div class="flex items-center gap-2">
              <span class="bg-clay-grass/15 text-clay-grass border border-clay-grass/25 px-4 py-2 rounded-2xl font-extrabold text-base inline-flex items-center gap-1.5 student-unpaid-label cursor-pointer" data-num="${s.number}">
                <span>${unpaidAchievements}점</span>
              </span>
              <i data-lucide="edit" class="w-5 h-5 text-slate-400 cursor-pointer opacity-40 hover:opacity-100 btn-edit-student-unpaid" data-num="${s.number}"></i>
            </div>
          </td>
          <td class="p-6 text-center">
            <div class="flex items-center justify-center gap-3">
              <button class="btn-action-add-score w-12 h-12 rounded-xl border border-white/10 bg-clay-sky hover:bg-cyan-400 text-white flex items-center justify-center shadow cursor-pointer active:scale-90" data-num="${s.number}" title="점수 부여 (+50점)">
                <i data-lucide="plus" class="w-6 h-6"></i>
              </button>
              <button class="btn-action-pay-score w-20 h-12 rounded-xl border border-white/10 bg-clay-grass hover:bg-teal-400 text-black flex items-center justify-center gap-1.5 shadow cursor-pointer font-black text-xs active:scale-95" data-num="${s.number}" title="미지급 점수 지급">
                <i data-lucide="gift" class="w-4 h-4"></i>
                <span>지급</span>
              </button>
              <button class="btn-action-delete-student w-12 h-12 rounded-xl border border-white/10 bg-clay-red hover:bg-red-500 text-white flex items-center justify-center shadow cursor-pointer active:scale-90" data-num="${s.number}" title="학생 제거">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind Edit Action triggers (To both Edit Icon AND Text Label!)
    document.querySelectorAll('.btn-edit-student-name, .student-name-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        const newName = prompt(`[${student.number}번] 새로운 이름을 입력해 주세요:`, student.name);
        if (newName !== null) {
          student.name = newName.trim() || `${student.number}번 학생`;
          saveClassroomToServer();
        }
      });
    });

    document.querySelectorAll('.btn-edit-student-score, .student-score-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        const newScore = prompt(`[${student.number}번] 새로운 누적 원점수를 입력해 주세요:`, student.rawScore);
        if (newScore !== null && !isNaN(parseInt(newScore))) {
          student.rawScore = Math.max(0, parseInt(newScore));
          
          // Re-calculate achievements and unpaid score
          const ratio = classroomData.rules.rawToAchievementRatio || 50;
          student.achievements = Math.floor(student.rawScore / ratio);
          student.unpaid = student.rawScore - student.paidScore;
          
          saveClassroomToServer();
        }
      });
    });

    document.querySelectorAll('.btn-edit-student-achievements, .student-achievements-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        const newAchievements = prompt(`[${student.number}번] 새로운 달성 점수(마일리지)를 입력해 주세요:`, student.achievements);
        if (newAchievements !== null && !isNaN(parseInt(newAchievements))) {
          student.achievements = Math.max(0, parseInt(newAchievements));
          saveClassroomToServer();
        }
      });
    });

    document.querySelectorAll('.btn-edit-student-paid, .student-paid-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        const newPaid = prompt(`[${student.number}번] 새로운 지급 완료 원점수를 입력해 주세요:`, student.paidScore);
        if (newPaid !== null && !isNaN(parseInt(newPaid))) {
          student.paidScore = Math.max(0, Math.min(student.rawScore, parseInt(newPaid)));
          student.unpaid = student.rawScore - student.paidScore;
          saveClassroomToServer();
        }
      });
    });

    document.querySelectorAll('.btn-edit-student-unpaid, .student-unpaid-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        const ratio = classroomData.rules.rawToAchievementRatio || 50;
        const currentUnpaidAchievements = Math.floor((student.unpaid || 0) / ratio);
        const newUnpaidAchievements = prompt(`[${student.number}번] 새로운 미지급 점수(마일리지)를 입력해 주세요:`, currentUnpaidAchievements);
        if (newUnpaidAchievements !== null && !isNaN(parseInt(newUnpaidAchievements))) {
          const unpaidVal = Math.max(0, parseInt(newUnpaidAchievements));
          student.unpaid = unpaidVal * ratio;
          student.paidScore = Math.max(0, student.rawScore - student.unpaid);
          saveClassroomToServer();
        }
      });
    });

    // Bind plus / gift / delete triggers
    document.querySelectorAll('.btn-action-add-score').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;
        
        // Add 50 raw points
        student.rawScore += 50;
        
        const ratio = classroomData.rules.rawToAchievementRatio || 50;
        student.achievements = Math.floor(student.rawScore / ratio);
        student.unpaid = student.rawScore - student.paidScore;
        
        showToast('점수 부여', `[${student.number}번] 학생에게 50점 원점수가 추가 가산되었습니다.`, 'success');
        saveClassroomToServer();
      });
    });

    document.querySelectorAll('.btn-action-pay-score').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const student = classroomData.students.find(s => s.number === num);
        if (!student) return;

        const ratio = classroomData.rules.rawToAchievementRatio || 50;
        const unpaidAchievements = Math.floor((student.unpaid || 0) / ratio);
        
        if (unpaidAchievements === 0) {
          showToast('지급 안내', `지급할 잔여 마일리지가 존재하지 않습니다.`, 'info');
          return;
        }

        // Add to paid score
        student.paidScore += unpaidAchievements * ratio;
        student.unpaid = student.rawScore - student.paidScore;

        showToast('보상 지급 완료', `[${student.number}번] 학생에게 리워드 ${unpaidAchievements}개 지급 처리가 등록되었습니다!`, 'success');
        saveClassroomToServer();
      });
    });

    document.querySelectorAll('.btn-action-delete-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        if (confirm(`진짜로 ${num}번 학생을 명렬표에서 삭제 탈퇴시키겠습니까?`)) {
          classroomData.students = classroomData.students.filter(s => s.number !== num);
          showToast('학생 삭제', `학급에서 ${num}번 학생이 성공적으로 전출 삭제되었습니다.`, 'info');
          saveClassroomToServer();
        }
      });
    });

    lucide.createIcons();
  }

  // Render 3: Thermometer View
  function renderThermometerView() {
    const totalRaw = classroomData.students.reduce((sum, s) => sum + (s.rawScore || 0), 0);
    const totalPaid = classroomData.students.reduce((sum, s) => sum + (s.paidScore || 0), 0);
    const totalUnpaid = Math.max(0, totalRaw - totalPaid);
    const totalStudents = classroomData.students.length;
    const tempDivider = classroomData.rules.thermometerRatio || 200;

    const calculatedTemp = parseFloat((totalRaw / tempDivider).toFixed(1));
    detailTempVal.textContent = `${calculatedTemp}°`;

    // Dynamic horizontal scale logic (0 to 200, stretches if a milestone or currentTemp is higher)
    const maxScale = Math.max(200, ...classroomData.goals.map(g => g.temp), calculatedTemp);
    const fillPercent = Math.min(100, (calculatedTemp / maxScale) * 100);

    if (detailTempProgressBar) {
      detailTempProgressBar.style.width = fillPercent + '%';
    }

    // Populate milestone indicators dynamically
    if (detailTempMilestonesContainer) {
      classroomData.goals.sort((a, b) => a.temp - b.temp);
      detailTempMilestonesContainer.innerHTML = classroomData.goals.map((g, idx) => {
        const percent = (g.temp / maxScale) * 100;
        const reached = calculatedTemp >= g.temp;
        const isAbove = (idx % 2 === 0);
        return `
          <div class="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none" style="left: ${percent}%;">
            ${isAbove ? `
              <!-- Milestone Badge Above -->
              <div class="absolute bottom-full mb-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
                <div class="w-3.5 h-3.5 border-r-2 border-b-2 border-white rotate-45 -mt-1.5 shadow-sm transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
              </div>
            ` : `
              <!-- Milestone Badge Below -->
              <div class="absolute top-full mt-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <div class="w-3.5 h-3.5 border-l-2 border-t-2 border-white rotate-45 -mb-1.5 shadow-sm transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
              </div>
            `}
            
            <!-- Indicator line inside track -->
            <div class="w-1 h-full border-l border-white/20 dark:border-white/10 relative">
              <!-- Interactive dot -->
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white transition-all shadow-md ${reached ? 'bg-white scale-125' : 'bg-slate-300 dark:bg-slate-700'}"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    detailStatTotalRaw.textContent = totalRaw.toLocaleString() + '점';
    detailStatTotalPaid.textContent = totalPaid.toLocaleString() + '점';
    detailStatTotalUnpaid.textContent = totalUnpaid.toLocaleString() + '점';
    detailStatStudentsCount.textContent = totalStudents + '명';

    // Target Goal Remaining calc
    classroomData.goals.sort((a, b) => a.temp - b.temp);
    const nextGoal = classroomData.goals.find(g => g.temp > calculatedTemp) || classroomData.goals[classroomData.goals.length - 1];
    if (nextGoal) {
      const rawRemaining = Math.max(0, (nextGoal.temp * tempDivider) - totalRaw);
      detailRemainingMiles.innerHTML = `
        ${nextGoal.temp.toFixed(1)}° 까지<br>
        <span class="text-clay-purple dark:text-clay-mint font-black text-xs">${rawRemaining.toLocaleString()}점</span> 남았어요!
      `;
    } else {
      detailRemainingMiles.innerHTML = `목표 도달 완료! 🚀`;
    }

    // Milestones List items
    milestonesListContainer.innerHTML = classroomData.goals.map(g => `
      <div class="bg-slate-50 dark:bg-slate-950 p-3.5 border-2 border-white rounded-2xl flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-3">
          <span class="text-xs font-black bg-clay-purple text-white px-2 py-0.5 rounded">${g.temp.toFixed(1)}°</span>
          <span class="text-xs font-extrabold text-slate-800 dark:text-slate-100">${g.activity}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <i data-lucide="edit" class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white btn-edit-milestone" data-id="${g.id}"></i>
          <i data-lucide="trash-2" class="w-4 h-4 text-clay-red cursor-pointer hover:text-red-500 btn-delete-milestone" data-id="${g.id}"></i>
        </div>
      </div>
    `).join('') || `<div class="p-6 text-center text-slate-400 font-bold text-xs">온도 마일스톤이 존재하지 않습니다.</div>`;

    // Bind Milestone actions
    document.querySelectorAll('.btn-edit-milestone').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const goal = classroomData.goals.find(g => g.id === id);
        if (!goal) return;
        const newActivity = prompt(`[${goal.temp.toFixed(1)}°] 새로운 목표 활동명을 입력하세요:`, goal.activity);
        if (newActivity !== null) {
          goal.activity = newActivity.trim() || '목표 보상';
          saveClassroomToServer();
        }
      });
    });

    document.querySelectorAll('.btn-delete-milestone').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('이 온도계 목표 활동을 삭제하시겠습니까?')) {
          classroomData.goals = classroomData.goals.filter(g => g.id !== id);
          saveClassroomToServer();
        }
      });
    });

    lucide.createIcons();
  }

  // Add Milestone Submission
  if (addMilestoneForm) {
    addMilestoneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tempVal = parseFloat(milestoneTempInput.value);
      const activityVal = milestoneActivityInput.value.trim();

      if (isNaN(tempVal) || !activityVal) return;

      classroomData.goals.push({
        id: 'goal_' + Math.random().toString(36).substr(2, 9),
        temp: tempVal,
        activity: activityVal
      });

      milestoneTempInput.value = '';
      milestoneActivityInput.value = '';
      
      showToast('목표 추가 완료', `${tempVal}° 보상 [${activityVal}]이 추가되었습니다.`, 'success');
      saveClassroomToServer();
    });
  }

  // Render 4: Settings View
  function renderSettingsView() {
    if (!classroomData || !classroomData.rules) {
      console.log("Classroom settings data not loaded yet.");
      return;
    }
    // 1. Privacy Toggle Switch
    chkNamePrivacy.checked = !classroomData.rules.namePrivacy;
    privacyStatusLabel.textContent = classroomData.rules.namePrivacy ? '학생 이름 숨김 (익명 번호)' : '학생 이름 사용';

    // 2. Rules Labels
    ruleCurrentRatioLabel.textContent = `${classroomData.rules.rawToAchievementRatio || 50}점 = 달성 1점`;
    ruleCurrentTempLabel.textContent = `합계 ÷ ${classroomData.rules.thermometerRatio || 200}`;

    // Highlight active ratio buttons
    document.querySelectorAll('.btn-ratio').forEach(btn => {
      const ratio = parseInt(btn.dataset.ratio);
      if (ratio === classroomData.rules.rawToAchievementRatio) {
        btn.classList.add('active', 'bg-clay-purple', 'text-white');
        btn.classList.remove('bg-clay-sand', 'text-slate-800');
      } else {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    // Highlight active dividers buttons
    document.querySelectorAll('.btn-divider').forEach(btn => {
      const div = parseInt(btn.dataset.div);
      if (div === classroomData.rules.thermometerRatio) {
        btn.classList.add('active', 'bg-clay-purple', 'text-white');
        btn.classList.remove('bg-clay-sand', 'text-slate-800');
      } else {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });
  }

  // Bind Settings Subtabs switcher (privacy, rules, and fontsize inside eusseuk settings)
  window.switchSettingsSubtab = function(subtab) {
    currentSettingsSubtab = subtab;
    [btnSubtabPrivacy, btnSubtabRules, btnSubtabFontsize].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    [settingsPrivacyCard, settingsRulesCard, settingsFontsizeCard].forEach(card => {
      if (card) card.classList.add('hidden');
    });

    if (subtab === 'privacy') {
      if (btnSubtabPrivacy) {
        btnSubtabPrivacy.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabPrivacy.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      if (settingsPrivacyCard) settingsPrivacyCard.classList.remove('hidden');
    } else if (subtab === 'rules') {
      if (btnSubtabRules) {
        btnSubtabRules.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabRules.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      if (settingsRulesCard) settingsRulesCard.classList.remove('hidden');
    } else if (subtab === 'fontsize') {
      if (btnSubtabFontsize) {
        btnSubtabFontsize.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabFontsize.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      if (settingsFontsizeCard) settingsFontsizeCard.classList.remove('hidden');
      initFontSizePanel();
    }
  };

  if (btnSubtabPrivacy) btnSubtabPrivacy.addEventListener('click', () => switchSettingsSubtab('privacy'));
  if (btnSubtabRules) btnSubtabRules.addEventListener('click', () => switchSettingsSubtab('rules'));
  if (btnSubtabFontsize) btnSubtabFontsize.addEventListener('click', () => switchSettingsSubtab('fontsize'));

  // Reset Classroom Scores
  const btnResetClassroomScores = document.getElementById('btn-reset-classroom-scores');
  if (btnResetClassroomScores) {
    btnResetClassroomScores.addEventListener('click', async () => {
      if (confirm('정말로 학급의 모든 학생 점수를 0점으로 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        classroomData.students.forEach(s => {
          s.rawScore = 0;
          s.achievements = 0;
          s.paidScore = 0;
          s.unpaid = 0;
        });
        await saveClassroomToServer();
        showToast('초기화 완료', '모든 학생의 점수가 0으로 초기화되었습니다.', 'success');
      }
    });
  }

  // Update Multiple Classrooms UI
  function updateClassSwitcherUI() {
    const classSelectSwitcher = document.getElementById('class-select-switcher');
    const classDeleteSelect = document.getElementById('class-delete-select');
    const txtClassRename = document.getElementById('txt-class-rename');
    const dashClassroomTitle = document.getElementById('dash-classroom-title');

    if (!classroomDb || !classroomDb.classes) return;

    const activeId = classroomDb.activeClassId;
    const classes = classroomDb.classes;

    // Update Title in Dashboard
    if (dashClassroomTitle && classes[activeId]) {
      dashClassroomTitle.textContent = `${classes[activeId].name} 대시보드`;
    }

    // Populate Switcher Select
    if (classSelectSwitcher) {
      classSelectSwitcher.innerHTML = Object.keys(classes).map(id => `
        <option value="${id}" ${id === activeId ? 'selected' : ''}>${classes[id].name}</option>
      `).join('');
    }

    // Populate Delete Selector (excluding active classroom)
    if (classDeleteSelect) {
      const inactiveClasses = Object.keys(classes).filter(id => id !== activeId);
      if (inactiveClasses.length === 0) {
        classDeleteSelect.innerHTML = `<option value="">삭제 가능한 다른 학급 없음</option>`;
      } else {
        classDeleteSelect.innerHTML = inactiveClasses.map(id => `
          <option value="${id}">${classes[id].name}</option>
        `).join('');
      }
    }

    // Fill in rename text field
    if (txtClassRename && classes[activeId]) {
      txtClassRename.value = classes[activeId].name;
    }
  }

  // Bind Class Switcher
  const classSelectSwitcher = document.getElementById('class-select-switcher');
  if (classSelectSwitcher) {
    classSelectSwitcher.addEventListener('change', async () => {
      const selectedId = classSelectSwitcher.value;
      if (classroomDb && classroomDb.classes[selectedId]) {
        classroomDb.activeClassId = selectedId;
        classroomData = classroomDb.classes[selectedId];
        await saveClassroomToServer();
        showToast('학급 전환', `"${classroomData.name}" 학급으로 전환되었습니다.`, 'success');
      }
    });
  }

  // Bind Class Rename
  const btnClassRename = document.getElementById('btn-class-rename');
  const txtClassRename = document.getElementById('txt-class-rename');
  if (btnClassRename) {
    btnClassRename.addEventListener('click', async () => {
      const newName = txtClassRename.value.trim();
      if (!newName) {
        showToast('입력 오류', '올바른 학급 이름을 입력해 주세요.', 'warning');
        return;
      }
      if (classroomDb && classroomDb.classes && classroomDb.activeClassId) {
        const activeId = classroomDb.activeClassId;
        classroomDb.classes[activeId].name = newName;
        classroomData.name = newName;
        await saveClassroomToServer();
        showToast('이름 변경', `학급 이름이 "${newName}"으로 변경되었습니다.`, 'success');
      }
    });
  }

  // Bind Class Create
  const btnClassCreate = document.getElementById('btn-class-create');
  const txtClassCreate = document.getElementById('txt-class-create');
  if (btnClassCreate) {
    btnClassCreate.addEventListener('click', async () => {
      const newClassName = txtClassCreate.value.trim();
      if (!newClassName) {
        showToast('입력 오류', '생성할 학급 이름을 입력해 주세요.', 'warning');
        return;
      }
      if (classroomDb && classroomDb.classes) {
        const newClassId = 'class_' + Date.now();
        // Create preset students list
        const defaultStudents = [];
        for (let i = 1; i <= 15; i++) {
          defaultStudents.push({
            number: i,
            name: `${i}번 학생`,
            rawScore: 0,
            paidScore: 0,
            achievements: 0,
            unpaid: 0
          });
        }
        classroomDb.classes[newClassId] = {
          id: newClassId,
          name: newClassName,
          students: defaultStudents,
          goals: [
            { id: 'goal_1', temp: 60.0, activity: '써바이벌 피구' },
            { id: 'goal_2', temp: 80.0, activity: '과자, 영화' },
            { id: 'goal_3', temp: 100.0, activity: '써바이벌 피구' }
          ],
          rules: {
            namePrivacy: false,
            rawToAchievementRatio: 50,
            thermometerRatio: 200
          }
        };
        classroomDb.activeClassId = newClassId;
        classroomData = classroomDb.classes[newClassId];
        txtClassCreate.value = '';
        await saveClassroomToServer();
        showToast('학급 생성 완료', `"${newClassName}" 학급이 새롭게 개설되고 선택되었습니다.`, 'success');
      }
    });
  }

  // Bind Class Delete
  const btnClassDelete = document.getElementById('btn-class-delete');
  const classDeleteSelect = document.getElementById('class-delete-select');
  if (btnClassDelete) {
    btnClassDelete.addEventListener('click', async () => {
      const targetId = classDeleteSelect.value;
      if (!targetId || targetId === classroomDb.activeClassId) {
        showToast('선택 오류', '삭제할 학급을 올바르게 선택해 주세요.', 'warning');
        return;
      }
      const targetName = classroomDb.classes[targetId].name;
      if (confirm(`정말로 "${targetName}" 학급을 삭제하시겠습니까?\n해당 학급의 학생 명렬표, 으쓱 점수, 온도계 등 모든 데이터가 영구 삭제됩니다.`)) {
        delete classroomDb.classes[targetId];
        await saveClassroomToServer();
        showToast('학급 삭제 완료', `"${targetName}" 학급이 삭제되었습니다.`, 'info');
      }
    });
  }



  // Font / Size Panel initializer
  function initFontSizePanel() {
    const fontSelector = document.getElementById('font-selector');
    const PAGES = ['dashboard', 'gradebook', 'thermometer', 'settings'];
    const PAGE_SELECTORS = {
      dashboard: '#eusseuk-section',
      gradebook: '#gradebook-section',
      thermometer: '#thermometer-section',
      settings: '#settings-section'
    };

    // Load saved font
    const savedFont = localStorage.getItem('kfcman_font') || "'Noto Sans KR', sans-serif";
    if (fontSelector) {
      fontSelector.value = savedFont;
      document.body.style.fontFamily = savedFont;
    }

    if (fontSelector) {
      fontSelector.addEventListener('change', () => {
        const font = fontSelector.value;
        document.body.style.fontFamily = font;
        localStorage.setItem('kfcman_font', font);
        // Load Google Font dynamically
        const fontName = font.replace(/'/g, '').split(',')[0].trim();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`;
        document.head.appendChild(link);
        showToast('폰트 변경', `"${fontName}" 폰트가 적용되었습니다.`, 'success');
      });
    }

    // Load saved sizes
    PAGES.forEach(page => {
      const slider = document.getElementById(`size-slider-${page}`);
      const label = document.getElementById(`size-label-${page}`);
      const saved = parseInt(localStorage.getItem(`kfcman_size_${page}`)) || 100;
      if (slider) slider.value = saved;
      if (label) label.textContent = saved + '%';
      applySizeToPage(page, saved);

      if (slider) {
        slider.addEventListener('input', () => {
          const val = parseInt(slider.value);
          if (label) label.textContent = val + '%';
          localStorage.setItem(`kfcman_size_${page}`, val);
          applySizeToPage(page, val);
        });
      }
    });

    // Reset button
    const btnReset = document.getElementById('btn-reset-sizes');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        PAGES.forEach(page => {
          const slider = document.getElementById(`size-slider-${page}`);
          const label = document.getElementById(`size-label-${page}`);
          if (slider) slider.value = 100;
          if (label) label.textContent = '100%';
          localStorage.removeItem(`kfcman_size_${page}`);
          applySizeToPage(page, 100);
        });
        showToast('초기화 완료', '모든 글자 크기가 기본값(100%)으로 초기화되었습니다.', 'info');
      });
    }
  }

  function applySizeToPage(page, percent) {
    const PAGE_SELECTORS = {
      dashboard: '#eusseuk-section',
      gradebook: '#gradebook-section',
      thermometer: '#thermometer-section',
      settings: '#settings-section'
    };
    const el = document.querySelector(PAGE_SELECTORS[page]);
    if (el) el.style.fontSize = percent + '%';
  }

  // Apply saved sizes on load
  ['dashboard', 'gradebook', 'thermometer', 'settings'].forEach(page => {
    const saved = parseInt(localStorage.getItem(`kfcman_size_${page}`)) || 100;
    applySizeToPage(page, saved);
  });
  // Apply saved font on load
  const savedFontOnLoad = localStorage.getItem('kfcman_font');
  if (savedFontOnLoad) document.body.style.fontFamily = savedFontOnLoad;

  // Privacy Toggle Trigger
  if (chkNamePrivacy) {
    chkNamePrivacy.addEventListener('change', () => {
      classroomData.rules.namePrivacy = !chkNamePrivacy.checked;
      saveClassroomToServer();
      showToast(
        '설정 저장됨',
        classroomData.rules.namePrivacy ? '개인정보 보호를 위해 학생 실명이 감춰졌습니다.' : '학급 관리를 위해 학생 실명이 활성화되었습니다.',
        'success'
      );
    });
  }

  // Rules Ratio clicks
  document.querySelectorAll('.btn-ratio').forEach(btn => {
    btn.addEventListener('click', () => {
      const ratio = parseInt(btn.dataset.ratio);
      classroomData.rules.rawToAchievementRatio = ratio;
      
      // Re-calculate all achievements
      classroomData.students.forEach(s => {
        s.achievements = Math.floor(s.rawScore / ratio);
      });

      saveClassroomToServer();
      showToast('규칙 저장', `달성 환산 기준이 ${ratio}점으로 덮어씌워졌습니다.`, 'success');
    });
  });

  if (ratioCustomForm) {
    ratioCustomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ratio = parseInt(customRatioVal.value);
      if (isNaN(ratio) || ratio < 1) return;
      classroomData.rules.rawToAchievementRatio = ratio;
      classroomData.students.forEach(s => {
        s.achievements = Math.floor(s.rawScore / ratio);
      });
      customRatioVal.value = '';
      saveClassroomToServer();
      showToast('규칙 저장', `달성 환산 기준이 커스텀 ${ratio}점으로 저장되었습니다.`, 'success');
    });
  }

  // Rules Divider clicks
  document.querySelectorAll('.btn-divider').forEach(btn => {
    btn.addEventListener('click', () => {
      const divider = parseInt(btn.dataset.div);
      classroomData.rules.thermometerRatio = divider;
      saveClassroomToServer();
      showToast('규칙 저장', `온도계 나누기 기준이 ÷ ${divider}으로 저장되었습니다.`, 'success');
    });
  });

  if (dividerCustomForm) {
    dividerCustomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const divider = parseInt(customDividerVal.value);
      if (isNaN(divider) || divider < 1) return;
      classroomData.rules.thermometerRatio = divider;
      customDividerVal.value = '';
      saveClassroomToServer();
      showToast('규칙 저장', `온도계 나누기 기준이 커스텀 ÷ ${divider}으로 저장되었습니다.`, 'success');
    });
  }

  // Modals Toggles & Actions
  const btnImportScores = document.getElementById('btn-import-scores');
  const btnAddAllScores = document.getElementById('btn-add-all-scores');
  const btnGenerateNumbers = document.getElementById('btn-generate-numbers');
  const btnAddTransfer = document.getElementById('btn-add-transfer');

  // Excel Import Trigger
  if (btnImportScores) btnImportScores.addEventListener('click', () => {
    importCsvTextarea.value = '';
    classroomImportModal.classList.remove('hidden');
  });
  if (btnImportModalClose) btnImportModalClose.addEventListener('click', () => classroomImportModal.classList.add('hidden'));

  if (btnImportSubmit) {
    btnImportSubmit.addEventListener('click', () => {
      const text = importCsvTextarea.value.trim();
      if (!text) return;

      try {
        const lines = text.split('\n');
        const students = [];

        lines.forEach(line => {
          const parts = line.split(/[,\t]/);
          if (parts.length < 2) return;
          
          const num = parseInt(parts[0].trim());
          let name = '';
          let raw = 0;
          let paid = 0;

          if (isNaN(num)) return;

          if (parts.length === 2) {
            // Format: number, score
            raw = parseInt(parts[1].trim());
            name = `${num}번 학생`;
          } else if (parts.length === 3) {
            // Format: number, name, score OR number, score, paid
            if (isNaN(parseInt(parts[1].trim()))) {
              name = parts[1].trim();
              raw = parseInt(parts[2].trim());
            } else {
              raw = parseInt(parts[1].trim());
              paid = parseInt(parts[2].trim());
              name = `${num}번 학생`;
            }
          } else {
            // Format: number, name, score, paid
            name = parts[1].trim();
            raw = parseInt(parts[2].trim());
            paid = parseInt(parts[3].trim());
          }

          raw = isNaN(raw) ? 0 : raw;
          paid = isNaN(paid) ? 0 : paid;
          name = name || `${num}번 학생`;

          const ratio = classroomData.rules.rawToAchievementRatio || 50;

          students.push({
            number: num,
            name,
            rawScore: raw,
            paidScore: paid,
            achievements: Math.floor(raw / ratio),
            unpaid: raw - paid
          });
        });

        if (students.length === 0) {
          throw new Error('파싱된 학생 데이터가 없습니다. 형식을 올바르게 입력해 주세요.');
        }

        classroomData.students = students;
        classroomImportModal.classList.add('hidden');
        showToast('불러오기 완료', `총 ${students.length}명의 데이터가 안전하게 일괄 적용되었습니다.`, 'success');
        saveClassroomToServer();

      } catch (e) {
        showToast('파싱 실패', e.message, 'error');
      }
    });
  }

  // Assign Points to All Trigger
  if (btnAddAllScores) btnAddAllScores.addEventListener('click', () => {
    addAllScoreVal.value = '';
    classroomAddAllModal.classList.remove('hidden');
  });
  if (btnAddAllModalClose) btnAddAllModalClose.addEventListener('click', () => classroomAddAllModal.classList.add('hidden'));

  if (addAllScoresForm) {
    addAllScoresForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const scoreToAdd = parseInt(addAllScoreVal.value);
      if (isNaN(scoreToAdd) || scoreToAdd === 0) return;

      const ratio = classroomData.rules.rawToAchievementRatio || 50;

      classroomData.students.forEach(s => {
        s.rawScore = Math.max(0, s.rawScore + scoreToAdd);
        s.achievements = Math.floor(s.rawScore / ratio);
        s.unpaid = s.rawScore - s.paidScore;
      });

      classroomAddAllModal.classList.add('hidden');
      showToast('일괄 가산 완료', `학급 모든 학생들의 누적 원점수에 ${scoreToAdd}점이 성공적으로 일괄 반영되었습니다.`, 'success');
      saveClassroomToServer();
    });
  }

  // Generate Numbers Trigger
  if (btnGenerateNumbers) btnGenerateNumbers.addEventListener('click', () => {
    switchClassroomTab('classroom-settings-section');
    switchSettingsSubtab('privacy');
    bulkGenCount.focus();
    showToast('안내', '설정 탭의 "번호만으로 학급 일괄 생성" 폼으로 이동했습니다.', 'info');
  });

  // Transfer Student Trigger
  if (btnAddTransfer) btnAddTransfer.addEventListener('click', () => {
    transferStudentNum.value = classroomData.students.length > 0 ? Math.max(...classroomData.students.map(s => s.number)) + 1 : 1;
    transferStudentName.value = '';
    classroomAddTransferModal.classList.remove('hidden');
  });
  if (btnTransferModalClose) btnTransferModalClose.addEventListener('click', () => classroomAddTransferModal.classList.add('hidden'));

  if (addTransferStudentForm) {
    addTransferStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const num = parseInt(transferStudentNum.value);
      const name = transferStudentName.value.trim() || `${num}번 학생`;

      if (isNaN(num) || num < 1) return;

      if (classroomData.students.some(s => s.number === num)) {
        showToast('생성 실패', `이미 번호 [${num}번] 학생이 명렬표에 존재합니다. 중복 생성 불가!`, 'error');
        return;
      }

      classroomData.students.push({
        number: num,
        name,
        rawScore: 0,
        paidScore: 0,
        achievements: 0,
        unpaid: 0
      });

      classroomAddTransferModal.classList.add('hidden');
      showToast('전입 완료', `${num}번 [${name}] 학생이 전입 학생 목록에 추가 등록되었습니다.`, 'success');
      saveClassroomToServer();
    });
  }

  // Bulk creation submission from Settings Tab
  if (bulkGenerateSettingsForm) {
    bulkGenerateSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const count = parseInt(bulkGenCount.value);
      const start = parseInt(bulkGenStart.value);

      if (isNaN(count) || count < 1 || isNaN(start) || start < 1) return;

      if (confirm(`진짜로 기존 학생 리스트를 모두 폐기하고, ${start}번부터 ${start + count - 1}번까지 총 ${count}명의 신규 번호 슬롯을 일괄 생성하시겠습니까?`)) {
        try {
          const res = await secureFetch('/api/classroom/students/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count, startNumber: start })
          });
          if (!res.ok) throw new Error('Bulk API Error');
          const data = await res.json();
          classroomData = data.classroom;
          renderAllClassroomViews();
          
          bulkGenCount.value = '';
          showToast('일괄 생성 완료', `성공적으로 ${count}명의 학생 목록이 새로 초기화 구축되었습니다!`, 'success');
          switchClassroomTab('gradebook-section');
        } catch (err) {
          showToast('생성 에러', err.message, 'error');
        }
      }
    });
  }

  // --- PASSWORD VISIBILITY TOGGLER & FEATURE TOGGLES ---
  function applyFeatureVisibility() {
    const hasPollsUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    const hasClassroomUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    
    // Regular users have Eusseuk and Polls conditionally enabled
    const useEusseuk = hasClassroomUnlock && (localStorage.getItem('feature_eusseuk') !== 'false');
    const usePolls = hasPollsUnlock && (localStorage.getItem('feature_polls') !== 'false');
    
    // Header navigation
    const navItemEusseuk = document.getElementById('nav-item-classroom');
    const navItemPolls = document.getElementById('nav-item-polls');
    
    if (navItemEusseuk) {
      if (useEusseuk) navItemEusseuk.style.display = 'flex';
      else navItemEusseuk.style.display = 'none';
    }
    if (navItemPolls) {
      if (usePolls) navItemPolls.style.display = 'flex';
      else navItemPolls.style.display = 'none';
    }
    
    // Mobile navigation
    const mobEusseuk = document.getElementById('mobile-nav-classroom');
    const mobPolls = document.getElementById('mobile-nav-polls');
    const mobPollsMem = document.getElementById('mobile-nav-polls-member');
    
    if (mobEusseuk) {
      if (useEusseuk) mobEusseuk.style.display = 'flex';
      else mobEusseuk.style.display = 'none';
    }
    if (mobPolls) {
      if (usePolls) mobPolls.style.display = 'flex';
      else mobPolls.style.display = 'none';
    }
    if (mobPollsMem) {
      if (usePolls) mobPollsMem.style.display = 'flex';
      else mobPollsMem.style.display = 'none';
    }

    // Update toggles state in UI
    const chkEusseuk = document.getElementById('chk-toggle-eusseuk');
    const chkPolls = document.getElementById('chk-toggle-polls');
    if (chkEusseuk) chkEusseuk.checked = localStorage.getItem('feature_eusseuk') !== 'false';
    if (chkPolls) chkPolls.checked = localStorage.getItem('feature_polls') !== 'false';

    // Show a premium feature unlock board on the dashboard if any premium features are still locked
    const vipPromoCard = document.getElementById('vip-promotion-card');
    if (vipPromoCard) {
      if (hasClassroomUnlock && hasPollsUnlock) {
        vipPromoCard.classList.add('hidden');
      } else {
        vipPromoCard.classList.remove('hidden');
        
        // Fetch current user link statistics from UI elements or variables
        const currentLinksVal = parseInt(document.getElementById('stat-total-links')?.textContent || '0');
        const currentClicksVal = parseInt(document.getElementById('stat-total-clicks')?.textContent || '0');
        const bestMetric = Math.max(currentLinksVal, currentClicksVal, currentUserLinks, currentUserClicks);
        
        // Update link values in UI
        document.querySelectorAll('.promo-current-links').forEach(el => {
          el.textContent = bestMetric.toLocaleString();
        });
        
        // Update Polls Tier
        const progressPollsPercent = Math.min(100, (bestMetric / 50) * 100);
        const progressPollsBar = document.getElementById('promo-progress-polls');
        const statusPolls = document.getElementById('promo-status-polls');
        const tierPollsCard = document.getElementById('promo-tier-polls');
        
        if (progressPollsBar) progressPollsBar.style.width = `${progressPollsPercent}%`;
        if (statusPolls) {
          if (hasPollsUnlock) {
            statusPolls.textContent = '활성화 🎉';
            statusPolls.className = 'text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30';
            if (tierPollsCard) tierPollsCard.style.borderColor = 'rgba(168, 85, 247, 0.3)';
          } else {
            statusPolls.textContent = '잠금 🔒';
            statusPolls.className = 'text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5';
            if (tierPollsCard) tierPollsCard.style.borderColor = 'rgba(255,255,255,0.05)';
          }
        }
        
        // Update Classroom Tier
        const progressClassroomPercent = Math.min(100, (bestMetric / 100) * 100);
        const progressClassroomBar = document.getElementById('promo-progress-classroom');
        const statusClassroom = document.getElementById('promo-status-classroom');
        const tierClassroomCard = document.getElementById('promo-tier-classroom');
        
        if (progressClassroomBar) progressClassroomBar.style.width = `${progressClassroomPercent}%`;
        if (statusClassroom) {
          if (hasClassroomUnlock) {
            statusClassroom.textContent = '활성화 🎉';
            statusClassroom.className = 'text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
            if (tierClassroomCard) tierClassroomCard.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          } else {
            statusClassroom.textContent = '잠금 🔒';
            statusClassroom.className = 'text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5';
            if (tierClassroomCard) tierClassroomCard.style.borderColor = 'rgba(255,255,255,0.05)';
          }
        }
      }
    }
  }

  // Bind Feature Toggles
  const chkEusseuk = document.getElementById('chk-toggle-eusseuk');
  const chkPolls = document.getElementById('chk-toggle-polls');

  if (chkEusseuk) {
    chkEusseuk.addEventListener('change', () => {
      localStorage.setItem('feature_eusseuk', chkEusseuk.checked ? 'true' : 'false');
      applyFeatureVisibility();
      showToast('설정 변경', `으쓱점수 기능이 ${chkEusseuk.checked ? '활성화' : '비활성화'}되었습니다.`, 'success');
    });
  }

  if (chkPolls) {
    chkPolls.addEventListener('change', () => {
      localStorage.setItem('feature_polls', chkPolls.checked ? 'true' : 'false');
      applyFeatureVisibility();
      showToast('설정 변경', `선호도 설문 기능이 ${chkPolls.checked ? '활성화' : '비활성화'}되었습니다.`, 'success');
    });
  }

  // Initial call
  applyFeatureVisibility();

  // Password toggle visibility binding
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-toggle-password');
    if (!btn) return;
    
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    
    const isPassword = input.getAttribute('type') === 'password';
    input.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Update Lucide icon dynamically
    btn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
    lucide.createIcons();
  });

  // Guidance card setup button
  const btnGotoSettingsInit = document.getElementById('btn-goto-settings-init');
  if (btnGotoSettingsInit) {
    btnGotoSettingsInit.addEventListener('click', () => {
      switchMainTab('settings');
      switchSettingsSubTab('classroom');
    });
  }
});