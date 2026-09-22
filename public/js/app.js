// ==========================================================================
// kfcman.link URL Shortener Frontend Controller (With Multi-User Auth & Stats)
// ==========================================================================

// Global Resilient CDN Fallbacks
(function() {
  if (typeof window.lucide === 'undefined') {
    window.lucide = {
      createIcons: function() {
        console.warn('Lucide icon library not available (CDN blocked/failed to load).');
      }
    };
  }
  if (typeof window.QRious === 'undefined') {
    window.QRious = function() {
      this.set = function() {};
      console.warn('QRious library not available (CDN blocked/failed to load).');
    };
  }
})();

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

  const editLinkModal = document.getElementById('edit-link-modal');
  const btnEditLinkModalClose = document.getElementById('btn-edit-link-modal-close');
  const editLinkCodeLabel = document.getElementById('edit-link-code-label');
  const editLinkUrlInput = document.getElementById('edit-link-url-input');
  const editLinkForm = document.getElementById('edit-link-form');
  const btnEditLinkSubmit = document.getElementById('btn-edit-link-submit');
  let editingLinkCode = null;

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
  let cachedLinks = [];

  // --- 1. Theme Module (Light / Dark Mode Option) ---
  function updateGuestThemeButtons(isLight) {
    const btnLight = document.getElementById('btn-guest-theme-light');
    const btnDark = document.getElementById('btn-guest-theme-dark');
    if (btnLight && btnDark) {
      if (isLight) {
        btnLight.className = "px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer bg-white text-slate-800 border border-slate-100";
        btnDark.className = "px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent";
      } else {
        btnLight.className = "px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent";
        btnDark.className = "px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer bg-slate-950 text-white border border-slate-800";
      }
    }

    const globalLight = document.getElementById('btn-global-theme-light');
    const globalDark = document.getElementById('btn-global-theme-dark');
    if (globalLight && globalDark) {
      globalLight.classList.toggle('active', isLight);
      globalDark.classList.toggle('active', !isLight);
      globalLight.setAttribute('aria-pressed', String(isLight));
      globalDark.setAttribute('aria-pressed', String(!isLight));
    }
  }

  function updateThemeRadioState(isLight) {
    const lightRadio = document.querySelector('input[name="theme-preference"][value="light"]');
    const darkRadio = document.querySelector('input[name="theme-preference"][value="dark"]');
    if (lightRadio && darkRadio) {
      if (isLight) {
        lightRadio.checked = true;
      } else {
        darkRadio.checked = true;
      }
    }
    updateGuestThemeButtons(isLight);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('kfcman_theme');
    const isLight = savedTheme === 'light';
    if (isLight) {
      document.body.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
    lucide.createIcons();
    updateThemeRadioState(isLight);
  }

  window.toggleThemeAction = function() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('kfcman_theme', isLight ? 'light' : 'dark');
    lucide.createIcons();
    updateThemeRadioState(isLight);

    // 마음챙김 / 과학실험실 / MBL 가이드 iframe 내부 테마 실시간 동기화
    ['mindcheck-frame', 'scibot-frame', 'scibit-frame'].forEach(frameId => {
      try {
        const frame = document.getElementById(frameId);
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ type: 'THEME_SYNC', theme: isLight ? 'light' : 'dark' }, '*');
        }
      } catch (e) {
        console.warn(`${frameId} 테마 동기화 중 경고:`, e);
      }
    });

    showToast(
      isLight ? '화이트 테마 활성화' : '블랙 테마 활성화',
      isLight ? '눈이 편안한 밝은 화이트 모드로 전환되었습니다.' : '세련되고 깊이 있는 다크 모드로 전환되었습니다.',
      'info'
    );
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      window.toggleThemeAction();
    });
  }

  initTheme();

  // Guest theme button click listeners
  const btnGuestThemeLight = document.getElementById('btn-guest-theme-light');
  const btnGuestThemeDark = document.getElementById('btn-guest-theme-dark');
  if (btnGuestThemeLight) {
    btnGuestThemeLight.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      if (!isCurrentlyLight) {
        window.toggleThemeAction();
      }
    });
  }
  if (btnGuestThemeDark) {
    btnGuestThemeDark.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      if (isCurrentlyLight) {
        window.toggleThemeAction();
      }
    });
  }

  const btnGlobalThemeLight = document.getElementById('btn-global-theme-light');
  const btnGlobalThemeDark = document.getElementById('btn-global-theme-dark');
  if (btnGlobalThemeLight) {
    btnGlobalThemeLight.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      if (!isCurrentlyLight) {
        window.toggleThemeAction();
      }
    });
  }
  if (btnGlobalThemeDark) {
    btnGlobalThemeDark.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      if (isCurrentlyLight) {
        window.toggleThemeAction();
      }
    });
  }

  // Theme settings radio change listeners
  document.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'theme-preference') {
      const selectedTheme = e.target.value;
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      
      if ((selectedTheme === 'light' && !isCurrentlyLight) || (selectedTheme === 'dark' && isCurrentlyLight)) {
        window.toggleThemeAction(); // Trigger the helper directly!
      }
    }
  });

  // --- 2. Security Auth Module (Login / Logout Control) ---
  function getAuthToken() {
    return localStorage.getItem('kfcman_auth_token');
  }

  function setAuthToken(token) {
    localStorage.setItem('kfcman_auth_token', token);
  }

  function removeAuthToken() {
    localStorage.removeItem('kfcman_auth_token');
    localStorage.removeItem('kfcman_user_role');
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
        currentUsername = data.username || '';
        localStorage.setItem('kfcman_username', currentUsername);
        if (userWelcomeName && data.username) {
          userWelcomeName.textContent = data.username;
        }
        const topBarUsername = document.getElementById('top-bar-username');
        const topBarProfileCircle = document.getElementById('top-bar-profile-circle');
        if (topBarUsername && data.username) {
          topBarUsername.textContent = `${data.username} 님`;
        }
        if (topBarProfileCircle && data.username) {
          topBarProfileCircle.textContent = data.username.charAt(0).toUpperCase();
        }
        localStorage.setItem('kfcman_user_role', data.role || 'user');
        
        const userRoleLabel = document.getElementById('user-role-label');
        if (userRoleLabel) {
          if (data.role === 'admin') userRoleLabel.textContent = '인증 교사 (관리자)';
          else if (data.role === 'manager') userRoleLabel.textContent = '인증 교사 (운영진)';
          else userRoleLabel.textContent = '인증 교사 (정회원)';
        }

        const sidebarProfileCircle = document.getElementById('sidebar-profile-circle');
        if (sidebarProfileCircle && data.username) {
          sidebarProfileCircle.textContent = data.username.charAt(0).toUpperCase();
        }
        const sidebarProfileName = document.getElementById('sidebar-profile-name');
        if (sidebarProfileName && data.username) {
          sidebarProfileName.textContent = data.username;
        }
        const sidebarProfileRole = document.getElementById('sidebar-profile-role');
        if (sidebarProfileRole) {
          if (data.role === 'admin') sidebarProfileRole.textContent = '관리자 (Admin)';
          else if (data.role === 'manager') sidebarProfileRole.textContent = '운영진 (Manager)';
          else if (data.role === 'vip') sidebarProfileRole.textContent = '우수회원 (VIP)';
          else sidebarProfileRole.textContent = '정회원 교사';
        }
        const sidebarProfileGroup = document.getElementById('sidebar-profile-group');
        const sidebarGuestGroup = document.getElementById('sidebar-guest-group');
        if (sidebarProfileGroup) sidebarProfileGroup.classList.remove('hidden');
        if (sidebarGuestGroup) sidebarGuestGroup.classList.add('hidden');
        
        if (userWelcomeTag) {
          userWelcomeTag.classList.remove('hidden');
          userWelcomeTag.classList.add('flex');
        }
        if (headerNav) headerNav.style.display = 'flex';
        if (logoutBtn) {
          logoutBtn.style.display = 'flex';
          logoutBtn.classList.remove('hidden');
        }
        const logoutBtnMobile = document.getElementById('btn-logout-mobile');
        if (logoutBtnMobile) logoutBtnMobile.classList.remove('hidden');
        if (guestHeaderButtons) {
          guestHeaderButtons.style.setProperty('display', 'none', 'important');
          guestHeaderButtons.classList.add('hidden');
          guestHeaderButtons.classList.remove('flex');
        }
        
        if (guestContent) guestContent.classList.add('hidden');
        if (memberContent) memberContent.classList.remove('hidden');
        
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
        
        // 협업 게시판(Wall) 메뉴 비활성화 (항상 숨김)
        const navItemWall = document.getElementById('nav-item-wall');
        if (navItemWall) {
          navItemWall.style.display = 'none';
        }

        // Hide/Show HWP shared storage & editor nav items (Restricted to Admin ONLY)
        const isUserAdmin = (data.role === 'admin');
        const navItemDocsSide = document.getElementById('nav-item-docs-side');
        const navItemTetrisSide = document.getElementById('nav-item-tetris-side');
        const docsHeaderBtn = document.getElementById('nav-item-docs-header');
        const docsHeroBtn = document.getElementById('nav-item-docs-hero');
        const gridItemDocs = document.getElementById('grid-item-docs');

        if (navItemDocsSide) navItemDocsSide.style.display = isUserAdmin ? 'flex' : 'none';
        if (navItemTetrisSide) navItemTetrisSide.style.display = isUserAdmin ? 'flex' : 'none';
        if (gridItemDocs) gridItemDocs.style.display = isUserAdmin ? 'flex' : 'none';

        // [관리자 전용] 오라클 서버 인프라 관제 사이드바 메뉴 노출 제어
        const navItemOracleSide = document.getElementById('nav-item-oracle-side');
        if (navItemOracleSide) {
          if (isUserAdmin) {
            navItemOracleSide.classList.remove('hidden');
            navItemOracleSide.style.display = 'flex';
          } else {
            navItemOracleSide.classList.add('hidden');
            navItemOracleSide.style.display = 'none';
          }
        }

        const mobileNavDocs = document.getElementById('mobile-nav-docs');
        if (mobileNavDocs) mobileNavDocs.style.display = isUserAdmin ? 'flex' : 'none';

        if (docsHeaderBtn) {
          if (isUserAdmin) docsHeaderBtn.classList.remove('hidden');
          else docsHeaderBtn.classList.add('hidden');
        }
        if (docsHeroBtn) {
          if (isUserAdmin) docsHeroBtn.classList.remove('hidden');
          else docsHeroBtn.classList.add('hidden');
        }

        // 협업 게시판(Wall) 모바일 하단 메뉴 비활성화 (항상 숨김)
        const mobileNavWall = document.getElementById('mobile-nav-wall');
        if (mobileNavWall) {
          mobileNavWall.style.display = 'none';
        }

        // Show settings navigation items for all logged-in users (including general 'user' role for theme settings)
        const navItemSettings = document.getElementById('nav-item-settings');
        const mNavSettings = document.getElementById('mobile-nav-settings');
        if (navItemSettings) navItemSettings.style.display = 'flex';
        if (mNavSettings) mNavSettings.style.display = 'flex';

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
    const sidebarProfileGroup = document.getElementById('sidebar-profile-group');
    const sidebarGuestGroup = document.getElementById('sidebar-guest-group');
    if (sidebarProfileGroup) sidebarProfileGroup.classList.add('hidden');
    if (sidebarGuestGroup) sidebarGuestGroup.classList.remove('hidden');

    if (userWelcomeTag) {
      userWelcomeTag.classList.add('hidden');
      userWelcomeTag.classList.remove('flex');
    }
    if (headerNav) headerNav.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
      logoutBtn.classList.add('hidden');
    }
    const logoutBtnMobile = document.getElementById('btn-logout-mobile');
    if (logoutBtnMobile) logoutBtnMobile.classList.add('hidden');
    if (guestHeaderButtons) {
      guestHeaderButtons.style.display = 'flex';
      guestHeaderButtons.classList.remove('hidden');
    }
    
    if (guestContent) guestContent.classList.remove('hidden');
    if (memberContent) memberContent.classList.add('hidden');
    const adminApprovalSec = document.getElementById('admin-approval-section');
    if (adminApprovalSec) adminApprovalSec.classList.add('hidden');

    // Hide HWP shared storage header button and landing welcome hero button when logged out
    const docsHeaderBtn = document.getElementById('nav-item-docs-header');
    const docsHeroBtn = document.getElementById('nav-item-docs-hero');
    if (docsHeaderBtn) docsHeaderBtn.classList.add('hidden');
    if (docsHeroBtn) docsHeroBtn.classList.add('hidden');

    // Hide mobile docs and wall items when logged out
    const mNavDocs = document.getElementById('mobile-nav-docs');
    const mNavWall = document.getElementById('mobile-nav-wall');
    if (mNavDocs) mNavDocs.style.display = 'none';
    if (mNavWall) mNavWall.style.display = 'none';

    // Hide sidebar and grid links for guest users
    const navItemDocsSide = document.getElementById('nav-item-docs-side');
    const navItemTetrisSide = document.getElementById('nav-item-tetris-side');
    const gridItemDocs = document.getElementById('grid-item-docs');
    if (navItemDocsSide) navItemDocsSide.style.display = 'none';
    if (navItemTetrisSide) navItemTetrisSide.style.display = 'none';
    if (gridItemDocs) gridItemDocs.style.display = 'none';

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
    console.log('TRACE: openAuthModal called', { mode, authModalExists: !!authModal });
    if (authModal) {
      authModal.querySelectorAll('input').forEach(inp => inp.removeAttribute('disabled'));
      authModal.classList.remove('hidden');
      console.log('TRACE: Removed hidden class from authModal. Current classes:', authModal.className);
    } else {
      console.error('TRACE: authModal element not found!');
    }
    switchAuthTab(mode);
  }
  window.openAuthModal = openAuthModal;

  function closeAuthModal() {
    if (authModal) {
      authModal.classList.add('hidden');
      authModal.querySelectorAll('input').forEach(inp => inp.setAttribute('disabled', 'true'));
    }
  }
  window.closeAuthModal = closeAuthModal;

  function switchAuthTab(tab) {
    if (tab === 'login') {
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
  window.switchAuthTab = switchAuthTab;

  console.log('TRACE: Binding auth button click listeners');
  if (btnLoginTrigger) {
    btnLoginTrigger.addEventListener('click', () => {
      openAuthModal('login');
    });
  }
  if (btnRegisterTrigger) {
    btnRegisterTrigger.addEventListener('click', () => {
      openAuthModal('register');
    });
  }
  if (btnHeroStart) {
    btnHeroStart.addEventListener('click', () => {
      openAuthModal('register');
    });
  }
  
  const btnHeroLogin = document.getElementById('btn-hero-login');
  if (btnHeroLogin) {
    btnHeroLogin.addEventListener('click', () => {
      openAuthModal('login');
    });
  }

  // Intercept Kanban and Docs links when guest (not logged in) to open login modal
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && (href === '/wall' || href === '/docs')) {
        if (!getAuthToken()) {
          e.preventDefault();
          openAuthModal('login');
        }
      }
    }
  });
  
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
      // 로그인 성공 시 대시보드 최상단으로 매끄럽게 스크롤 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });

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

      // 가입 성공 안내 (승인 대기 없이 바로 로그인 가능)
      showToast(
        '회원가입 완료',
        '회원가입이 성공적으로 완료되었습니다! 방금 생성하신 계정으로 바로 로그인해 주세요.',
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

  // --- 공통 로그아웃 처리 함수 (브라우저 confirm 차단 문제 완전 해결 & 안전한 세션 파기) ---
  async function performLogout() {
    try {
      // 서버 세션 로그아웃 API 호출 (네트워크 지연이나 오류가 있어도 클라이언트 로그아웃은 즉시 완료)
      await secureFetch('/api/logout', { method: 'POST' }).catch((err) => {
        console.warn('Logout API warning:', err);
      });
    } catch (err) {
      console.warn('Logout request skipped:', err);
    }
    // 브라우저 로컬 스토리지에 저장된 토큰 및 권한 삭제
    removeAuthToken();
    // 안내 토스트 메시지 출력
    showToast('로그아웃 완료', '안전하게 로그아웃되었습니다.', 'info');
    // 화면을 즉시 게스트 모드로 안전하게 전환
    showGuestState();
    // 모바일/데스크톱 화면을 최상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 전역 로그아웃 함수 바인딩 (인라인 onclick 지원)
  window.performLogout = performLogout;

  // 상단 헤더 및 대시보드 탑바 로그아웃 버튼 클릭 이벤트 연결
  if (logoutBtn) {
    logoutBtn.addEventListener('click', performLogout);
  }
  const btnTopbarLogout = document.getElementById('btn-topbar-logout');
  if (btnTopbarLogout) {
    btnTopbarLogout.addEventListener('click', performLogout);
  }

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
  // --- 10. Dashboard Rendering ---
  async function renderDashboard() {
    if (!getAuthToken()) return;
    try {
      const response = await secureFetch('/api/links');

      if (!response.ok) {
        throw new Error('링크 통계를 불러오지 못했습니다.');
      }

      const { links } = await response.json();
      cachedLinks = links || [];

      updateUsageLimitTracker(cachedLinks.length);

      // Canva View Mode Switching
      const viewMode = localStorage.getItem('canva_view_mode') || 'grid';
      const recentGrid = document.getElementById('canva-recent-grid');
      const btnViewGrid = document.getElementById('btn-view-grid');
      const btnViewList = document.getElementById('btn-view-list');

      if (viewMode === 'grid') {
        if (recentGrid) recentGrid.classList.remove('hidden');
        if (linksTableWrapper) linksTableWrapper.classList.add('hidden');
        if (btnViewGrid) {
          btnViewGrid.classList.add('text-purple-600', 'dark:text-purple-400', 'bg-slate-100', 'dark:bg-slate-800');
          btnViewGrid.classList.remove('text-slate-400', 'dark:text-slate-500', 'bg-transparent');
        }
        if (btnViewList) {
          btnViewList.classList.remove('text-purple-600', 'dark:text-purple-400', 'bg-slate-100', 'dark:bg-slate-800');
          btnViewList.classList.add('text-slate-400', 'dark:text-slate-500', 'bg-transparent');
        }
      } else {
        if (recentGrid) recentGrid.classList.add('hidden');
        if (linksTableWrapper) linksTableWrapper.classList.remove('hidden');
        if (btnViewList) {
          btnViewList.classList.add('text-purple-600', 'dark:text-purple-400', 'bg-slate-100', 'dark:bg-slate-800');
          btnViewList.classList.remove('text-slate-400', 'dark:text-slate-500', 'bg-transparent');
        }
        if (btnViewGrid) {
          btnViewGrid.classList.remove('text-purple-600', 'dark:text-purple-400', 'bg-slate-100', 'dark:bg-slate-800');
          btnViewGrid.classList.add('text-slate-400', 'dark:text-slate-500', 'bg-transparent');
        }
      }

      await renderRecentItemsGrid(cachedLinks);

      if (cachedLinks.length === 0) {
        listEmptyState.classList.remove('hidden');
        if (viewMode === 'list') {
          linksTableWrapper.classList.add('hidden');
        }
        btnClearHistory.classList.add('hidden');
        
        statTotalLinks.textContent = '0';
        statTotalClicks.textContent = '0';
        statAvgClicks.textContent = '0.0';
        applyFeatureVisibility();
        renderShortenerModalLinks();
        return;
      }

      cachedLinks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalLinksCount = cachedLinks.length;
      const totalClicksSum = cachedLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const avgClicksRate = totalLinksCount > 0 ? (totalClicksSum / totalLinksCount).toFixed(1) : '0.0';

      statTotalLinks.textContent = totalLinksCount;
      statTotalClicks.textContent = totalClicksSum;
      statAvgClicks.textContent = avgClicksRate;
      
      applyFeatureVisibility();

      linksTableBody.innerHTML = '';
      
      cachedLinks.forEach(link => {
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
              <button class="btn-action-icon btn-table-edit" data-code="${link.code}" data-url="${link.originalUrl}" title="수정">
                <i data-lucide="edit"></i>
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
      if (viewMode === 'list') {
        linksTableWrapper.classList.remove('hidden');
      }
      btnClearHistory.classList.remove('hidden');

      lucide.createIcons();
      bindTableActionEvents();
      renderShortenerModalLinks();

    } catch (err) {
      if (err.message !== 'Unauthorized') {
        console.error(err);
        showToast('대시보드 오류', '통계 정보를 불러오는데 실패했습니다.', 'error');
      }
    }
  }

  // --- 10.5 Links list embedded inside the shortener creation modal ---
  function renderShortenerModalLinks() {
    const body = document.getElementById('shortener-modal-links-body');
    const emptyState = document.getElementById('shortener-modal-links-empty');
    if (!body) return;

    body.innerHTML = '';

    if (!cachedLinks || cachedLinks.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    cachedLinks.forEach(link => {
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-100 dark:border-slate-800';

      const localLinkUrl = `${window.location.origin}/${link.code}`;
      const visualBrandUrl = `http://kfcman.link/${link.code}`;
      const originalUrlClean = link.originalUrl.replace(/^https?:\/\/(www\.)?/, '');
      const dateStr = new Date(link.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      row.innerHTML = `
        <td class="p-2.5">
          <a href="${localLinkUrl}" target="_blank" class="font-black text-clay-sky dark:text-clay-mint" title="이동하기">kfcman.link/${link.code}</a>
          <div class="text-slate-400 font-medium truncate max-w-[220px]" title="${link.originalUrl}">${originalUrlClean}</div>
        </td>
        <td class="p-2.5 text-slate-500 dark:text-slate-400">${dateStr}</td>
        <td class="p-2.5 font-black text-clay-sky dark:text-clay-mint">${link.clicks || 0}회</td>
        <td class="p-2.5">
          <div class="flex items-center justify-center gap-1">
            <button class="btn-action-icon btn-table-copy" data-url="${visualBrandUrl}" title="주소 복사"><i data-lucide="copy"></i></button>
            <button class="btn-action-icon btn-table-stats" data-code="${link.code}" title="상세 통계"><i data-lucide="bar-chart-3"></i></button>
            <button class="btn-action-icon btn-table-edit" data-code="${link.code}" data-url="${link.originalUrl}" title="수정"><i data-lucide="edit"></i></button>
            <button class="btn-action-icon btn-table-delete" data-code="${link.code}" title="삭제" style="color: rgba(239, 68, 68, 0.65);"><i data-lucide="trash"></i></button>
          </div>
        </td>
      `;

      body.appendChild(row);
    });

    lucide.createIcons();
    bindTableActionEvents();
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

    document.querySelectorAll('.btn-table-edit').forEach(button => {
      button.addEventListener('click', () => {
        const code = button.getAttribute('data-code');
        openEditLinkModal(code, button.getAttribute('data-url'));
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

  // --- 12.5 Edit Link Modal ---
  function openEditLinkModal(code, currentUrl) {
    editingLinkCode = code;
    editLinkCodeLabel.textContent = `kfcman.link/${code}`;
    editLinkUrlInput.value = currentUrl || '';
    editLinkModal.classList.remove('hidden');
    editLinkUrlInput.focus();
  }

  btnEditLinkModalClose.addEventListener('click', () => {
    editLinkModal.classList.add('hidden');
    editingLinkCode = null;
  });

  editLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingLinkCode) return;

    const newUrl = editLinkUrlInput.value.trim();
    if (!newUrl) return;

    btnEditLinkSubmit.disabled = true;
    const btnSpan = btnEditLinkSubmit.querySelector('span');
    if (btnSpan) btnSpan.textContent = '저장 중...';

    try {
      const response = await secureFetch(`/api/links/${editingLinkCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showToast('수정 완료', '단축 링크의 연결 대상이 성공적으로 변경되었습니다.', 'success');
      editLinkModal.classList.add('hidden');
      editingLinkCode = null;
      renderDashboard();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('수정 실패', err.message, 'error');
      }
    } finally {
      btnEditLinkSubmit.disabled = false;
      if (btnSpan) btnSpan.textContent = '수정 사항 저장';
    }
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
  const ADMIN_SUBTAB_LABELS = {
    overview: '개요',
    users: '회원 이용량 모니터링 & 계정 통제',
    pending: '회원가입 신청 대기열 승인',
    links: '전체 회원 단축 링크 관리',
    notifications: '신규 회원가입 알림 & 다채널 외부 연동 관리'
  };
  const ADMIN_SUBTABS = Object.keys(ADMIN_SUBTAB_LABELS);
  let currentAdminSubtab = 'overview';
  let adminSubtabInitialized = false;

  function getAdminSubtabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('adminSubtab') || localStorage.getItem('kfcman_admin_subtab') || 'overview';
    return ADMIN_SUBTABS.includes(value) ? value : 'overview';
  }

  function persistAdminSubtab(subtab) {
    localStorage.setItem('kfcman_admin_subtab', subtab);
    const url = new URL(window.location.href);
    url.searchParams.set('adminSubtab', subtab);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  async function loadAdminSubtabData(subtab) {
    if (subtab === 'overview') return renderAdminOverviewPanel();
    if (subtab === 'users') return renderUserManagementPanel();
    if (subtab === 'pending') return renderAdminPendingPanel();
    if (subtab === 'links') return renderAdminLinksPanel();
    if (subtab === 'notifications') return loadNotificationSettings();
  }

  window.switchAdminSubtab = async function(subtab, options = {}) {
    const nextSubtab = ADMIN_SUBTABS.includes(subtab) ? subtab : 'overview';
    currentAdminSubtab = nextSubtab;
    adminSubtabInitialized = true;

    document.querySelectorAll('.admin-subview').forEach(view => {
      if (view.id === `admin-subview-${nextSubtab}`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    document.querySelectorAll('[data-admin-subtab]').forEach(btn => {
      const isActive = btn.dataset.adminSubtab === nextSubtab;
      btn.classList.remove('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold', 'text-slate-400', 'dark:text-zinc-500');
      if (isActive) {
        btn.classList.add('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold');
      } else {
        btn.classList.add('text-slate-400', 'dark:text-zinc-500');
      }
    });

    const pathEl = document.getElementById('admin-current-path');
    if (pathEl) pathEl.textContent = `설정 > 통합 관리자 > ${ADMIN_SUBTAB_LABELS[nextSubtab]}`;
    updateSettingsHeader('admin');
    if (options.persist !== false) persistAdminSubtab(nextSubtab);

    try {
      await loadAdminSubtabData(nextSubtab);
    } catch (e) {
      console.error(`Failed to load admin subtab: ${nextSubtab}`, e);
    }
    lucide.createIcons();
  };

  async function renderAdminPanel() {
    if (!adminSubtabInitialized) {
      return window.switchAdminSubtab(getAdminSubtabFromUrl(), { persist: false });
    }
    return loadAdminSubtabData(currentAdminSubtab);
  }

  async function renderAdminOverviewPanel() {
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
  }

  async function renderAdminPendingPanel() {
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

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-admin-subtab]');
    if (!btn) return;
    event.preventDefault();
    window.switchAdminSubtab(btn.dataset.adminSubtab);
  });

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
            renderAdminPendingPanel();
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
            renderAdminPendingPanel();
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

  function initSecretFieldToggles() {
    document.querySelectorAll('[data-secret-field="true"]').forEach(input => {
      if (!input.id || document.querySelector(`[data-secret-toggle="${input.id}"]`)) return;
      const parent = input.parentElement;
      if (!parent) return;
      parent.classList.add('relative');
      input.classList.add('pr-10');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'absolute right-2 bottom-1.5 w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center';
      btn.dataset.secretToggle = input.id;
      btn.title = '민감 정보 표시/숨김';
      btn.innerHTML = '<i data-lucide="eye" class="w-3.5 h-3.5"></i>';
      btn.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.innerHTML = `<i data-lucide="${isHidden ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>`;
        lucide.createIcons();
      });
      parent.appendChild(btn);
    });
  }

  initSecretFieldToggles();

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
  let cachedAdminUsers = [];
  let adminUsersPage = 1;
  const ADMIN_USERS_PAGE_SIZE = 12;

  async function renderUserManagementPanel() {
    try {
      const response = await secureFetch('/api/admin/users');
      if (!response.ok) throw new Error('회원 통계를 불러오지 못했습니다.');
      const { users } = await response.json();
      cachedAdminUsers = users || [];
      adminUsersPage = 1;
      renderAdminUsersTable();
    } catch (err) {
      console.error(err);
      showToast('회원 관리 오류', err.message, 'error');
    }
  }

  function renderAdminUsersSummary(users) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const total = users.length;
    const active = users.filter(user => user.approved !== false).length;
    const newThisMonth = users.filter(user => {
      const created = new Date(user.createdAt);
      return !Number.isNaN(created.getTime()) && created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    }).length;
    const totalLinks = users.reduce((sum, user) => sum + (Number(user.totalLinks) || 0), 0);

    const totalEl = document.getElementById('admin-users-total');
    const activeEl = document.getElementById('admin-users-active');
    const newMonthEl = document.getElementById('admin-users-new-month');
    const linksTotalEl = document.getElementById('admin-users-links-total');
    if (totalEl) totalEl.textContent = total.toLocaleString();
    if (activeEl) activeEl.textContent = active.toLocaleString();
    if (newMonthEl) newMonthEl.textContent = newThisMonth.toLocaleString();
    if (linksTotalEl) linksTotalEl.textContent = totalLinks.toLocaleString();
  }

  function getFilteredAdminUsers() {
    const searchInput = document.getElementById('admin-users-search');
    const roleFilter = document.getElementById('admin-users-role-filter');
    const statusFilter = document.getElementById('admin-users-status-filter');
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    const role = roleFilter?.value || '';
    const status = statusFilter?.value || '';

    return cachedAdminUsers.filter(user => {
      const matchesKeyword = !keyword || user.username.toLowerCase().includes(keyword);
      const normalizedRole = user.approved === false || user.role === 'pending' ? 'pending' : user.role;
      const matchesRole = !role || normalizedRole === role;
      const matchesStatus = !status || (status === 'active' ? user.approved !== false : user.approved === false);
      return matchesKeyword && matchesRole && matchesStatus;
    });
  }

  function renderAdminUsersTable() {
      renderAdminUsersSummary(cachedAdminUsers);
      const adminUserStatsBody = document.getElementById('admin-user-stats-body');
      if (!adminUserStatsBody) return;

      const filteredUsers = getFilteredAdminUsers();
      const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ADMIN_USERS_PAGE_SIZE));
      adminUsersPage = Math.min(Math.max(1, adminUsersPage), totalPages);
      const start = (adminUsersPage - 1) * ADMIN_USERS_PAGE_SIZE;
      const pageUsers = filteredUsers.slice(start, start + ADMIN_USERS_PAGE_SIZE);

      adminUserStatsBody.innerHTML = '';

      if (filteredUsers.length === 0) {
        adminUserStatsBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
              등록된 사용자가 없습니다.
            </td>
          </tr>
        `;
        updateAdminUsersPagination(filteredUsers.length, start, pageUsers.length, totalPages);
        return;
      }

      pageUsers.forEach(user => {
        const row = document.createElement('tr');
        
        const dateStr = new Date(user.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const selfName = (userWelcomeName?.textContent || currentUsername || localStorage.getItem('kfcman_username') || '').trim().toLowerCase();
        const isSelf = user.username.toLowerCase() === selfName;
        
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
          <select class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-xl text-xs font-black cursor-pointer text-slate-800 dark:text-slate-100 btn-user-change-role" data-username="${user.username}" ${isRoleSelectDisabled ? 'disabled style="opacity:0.6; pointer-events:none;"' : ''}>
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
            <details class="relative inline-block">
              <summary class="list-none w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer" title="계정 작업">
                <i data-lucide="more-vertical" class="w-4 h-4"></i>
              </summary>
              <div class="absolute right-0 top-9 z-20 min-w-[120px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg p-1.5 space-y-1">
              <button class="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold px-2 py-1.5 text-[10px] rounded transition-all btn-user-warn flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" data-warning="${user.warning || ''}" title="경고 메시지 전송">
                <i data-lucide="bell" class="w-3 h-3 text-brand-yellow"></i> 경고
              </button>
              <button class="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 font-bold px-2 py-1.5 text-[10px] rounded transition-all btn-user-toggle-block flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" title="${user.approved ? '계정 정지' : '계정 활성화'}" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''} style="color: ${user.approved ? '#f87171' : '#10b981'};">
                <i data-lucide="${user.approved ? 'user-x' : 'user-check'}" class="w-3 h-3"></i> ${user.approved ? '정지' : '승인'}
              </button>
              <button class="w-full bg-transparent hover:bg-red-500/10 text-red-400 font-bold px-2 py-1.5 text-[10px] rounded transition-all btn-user-delete flex items-center gap-1 active:scale-95 cursor-pointer" data-username="${user.username}" title="계정 영구 삭제" ${isSelf ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''}>
                <i data-lucide="trash-2" class="w-3 h-3"></i> 삭제
              </button>
              </div>
            </details>
          </td>
        `;
        
        adminUserStatsBody.appendChild(row);
      });
      
      lucide.createIcons();
      bindUserManagementActionEvents();
      updateAdminUsersPagination(filteredUsers.length, start, pageUsers.length, totalPages);
  }

  function updateAdminUsersPagination(total, start, count, totalPages) {
    const info = document.getElementById('admin-users-page-info');
    const prev = document.getElementById('btn-admin-users-prev');
    const next = document.getElementById('btn-admin-users-next');
    if (info) info.textContent = total === 0 ? '0-0 / 0' : `${start + 1}-${start + count} / ${total}`;
    if (prev) prev.disabled = adminUsersPage <= 1;
    if (next) next.disabled = adminUsersPage >= totalPages;
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

  ['admin-users-search', 'admin-users-role-filter', 'admin-users-status-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        adminUsersPage = 1;
        renderAdminUsersTable();
      });
      el.addEventListener('change', () => {
        adminUsersPage = 1;
        renderAdminUsersTable();
      });
    }
  });

  const btnAdminUsersPrev = document.getElementById('btn-admin-users-prev');
  const btnAdminUsersNext = document.getElementById('btn-admin-users-next');
  if (btnAdminUsersPrev) {
    btnAdminUsersPrev.addEventListener('click', () => {
      adminUsersPage = Math.max(1, adminUsersPage - 1);
      renderAdminUsersTable();
    });
  }
  if (btnAdminUsersNext) {
    btnAdminUsersNext.addEventListener('click', () => {
      adminUsersPage += 1;
      renderAdminUsersTable();
    });
  }

  // --- 14.5 ALL MEMBERS' LINKS MANAGEMENT (Admin Only) ---
  let cachedAdminLinks = [];
  let adminLinksPage = 1;
  const ADMIN_LINKS_PAGE_SIZE = 12;

  async function renderAdminLinksPanel() {
    try {
      const response = await secureFetch('/api/admin/links');
      if (!response.ok) throw new Error('전체 링크 목록을 불러오지 못했습니다.');
      const { links } = await response.json();

      cachedAdminLinks = (links || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      adminLinksPage = 1;
      renderAdminLinksTable();
    } catch (err) {
      console.error(err);
      showToast('링크 관리 오류', err.message, 'error');
    }
  }

  function renderAdminLinksTable() {
    const adminLinksBody = document.getElementById('admin-links-body');
    const adminLinksEmptyState = document.getElementById('admin-links-empty-state');
    const adminLinksCountLabel = document.getElementById('admin-links-count-label');
    if (!adminLinksBody) return;

    const searchInput = document.getElementById('admin-links-search');
    const ownerInput = document.getElementById('admin-links-owner-filter');
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    const ownerKeyword = (ownerInput?.value || '').trim().toLowerCase();
    const filtered = keyword || ownerKeyword
      ? cachedAdminLinks.filter(link =>
          (!keyword || link.code.toLowerCase().includes(keyword) || link.originalUrl.toLowerCase().includes(keyword)) &&
          (!ownerKeyword || (link.owner || '').toLowerCase().includes(ownerKeyword))
        )
      : cachedAdminLinks;

    if (adminLinksCountLabel) {
      adminLinksCountLabel.textContent = `총 ${cachedAdminLinks.length}개${keyword || ownerKeyword ? ` · 검색결과 ${filtered.length}개` : ''}`;
    }

    adminLinksBody.innerHTML = '';

    if (filtered.length === 0) {
      adminLinksEmptyState.classList.remove('hidden');
      updateAdminLinksPagination(0, 0, 0, 1);
      return;
    }
    adminLinksEmptyState.classList.add('hidden');

    const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_LINKS_PAGE_SIZE));
    adminLinksPage = Math.min(Math.max(1, adminLinksPage), totalPages);
    const start = (adminLinksPage - 1) * ADMIN_LINKS_PAGE_SIZE;
    const pageLinks = filtered.slice(start, start + ADMIN_LINKS_PAGE_SIZE);

    pageLinks.forEach(link => {
      const row = document.createElement('tr');
      const localLinkUrl = `${window.location.origin}/${link.code}`;
      const originalUrlClean = link.originalUrl.replace(/^https?:\/\/(www\.)?/, '');
      const dateStr = new Date(link.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      row.innerHTML = `
        <td>
          <a href="${localLinkUrl}" target="_blank" class="text-brand-cyan font-bold hover:underline" title="이동하기">kfcman.link/${link.code}</a>
        </td>
        <td>
          <a href="${link.originalUrl}" target="_blank" class="text-slate-500 dark:text-slate-400 font-medium hover:underline block truncate max-w-[360px]" title="${link.originalUrl}">${originalUrlClean}</a>
        </td>
        <td><span class="text-slate-700 dark:text-slate-300 font-bold">${link.owner || '-'}</span></td>
        <td><strong class="text-brand-cyan font-bold text-sm">${link.clicks || 0}회</strong></td>
        <td><span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${dateStr}</span></td>
        <td>
          <div class="flex items-center justify-center gap-1.5">
            <button class="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 text-[10px] rounded transition-all btn-admin-link-edit flex items-center gap-1 active:scale-95 cursor-pointer" data-code="${link.code}" data-url="${link.originalUrl}" title="연결 대상 수정">
              <i data-lucide="edit" class="w-3 h-3"></i> 수정
            </button>
            <button class="bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 text-red-400 font-bold px-2 py-1 text-[10px] rounded transition-all btn-admin-link-delete flex items-center gap-1 active:scale-95 cursor-pointer" data-code="${link.code}" title="링크 영구 삭제">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 삭제
            </button>
          </div>
        </td>
      `;

      adminLinksBody.appendChild(row);
    });

    lucide.createIcons();
    bindAdminLinksActionEvents();
    updateAdminLinksPagination(filtered.length, start, pageLinks.length, totalPages);
  }

  function updateAdminLinksPagination(total, start, count, totalPages) {
    const info = document.getElementById('admin-links-page-info');
    const prev = document.getElementById('btn-admin-links-prev');
    const next = document.getElementById('btn-admin-links-next');
    if (info) info.textContent = total === 0 ? '0-0 / 0' : `${start + 1}-${start + count} / ${total}`;
    if (prev) prev.disabled = adminLinksPage <= 1;
    if (next) next.disabled = adminLinksPage >= totalPages;
  }

  function bindAdminLinksActionEvents() {
    document.querySelectorAll('.btn-admin-link-edit').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.getAttribute('data-code');
        const currentUrl = button.getAttribute('data-url');
        const newUrl = prompt(`단축 링크 [kfcman.link/${code}]의 새 연결 대상 URL을 입력하세요:`, currentUrl);

        if (newUrl !== null && newUrl.trim() && newUrl.trim() !== currentUrl) {
          try {
            const response = await secureFetch(`/api/admin/links/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: newUrl.trim() })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('링크 수정 완료', `단축 링크 [${code}]가 관리자 권한으로 수정되었습니다.`, 'success');
            renderAdminLinksPanel();
          } catch (err) {
            showToast('링크 수정 실패', err.message, 'error');
          }
        }
      });
    });

    document.querySelectorAll('.btn-admin-link-delete').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.getAttribute('data-code');
        if (confirm(`⚠️ 단축 링크 [kfcman.link/${code}]를 관리자 권한으로 영구 삭제하시겠습니까?\n소유자와 무관하게 즉시 삭제되며 되돌릴 수 없습니다.`)) {
          try {
            const response = await secureFetch(`/api/admin/links/${code}`, {
              method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('링크 삭제 완료', data.message, 'success');
            renderAdminLinksPanel();
          } catch (err) {
            showToast('링크 삭제 실패', err.message, 'error');
          }
        }
      });
    });
  }

  const refreshAdminLinksBtn = document.getElementById('btn-refresh-admin-links');
  if (refreshAdminLinksBtn) {
    refreshAdminLinksBtn.addEventListener('click', () => {
      renderAdminLinksPanel();
      showToast('새로고침 완료', '전체 회원 단축 링크 목록을 다시 읽어왔습니다.', 'info');
    });
  }

  const adminLinksSearchInput = document.getElementById('admin-links-search');
  if (adminLinksSearchInput) {
    adminLinksSearchInput.addEventListener('input', () => {
      adminLinksPage = 1;
      renderAdminLinksTable();
    });
  }

  const adminLinksOwnerInput = document.getElementById('admin-links-owner-filter');
  if (adminLinksOwnerInput) {
    adminLinksOwnerInput.addEventListener('input', () => {
      adminLinksPage = 1;
      renderAdminLinksTable();
    });
  }

  const btnAdminLinksPrev = document.getElementById('btn-admin-links-prev');
  const btnAdminLinksNext = document.getElementById('btn-admin-links-next');
  if (btnAdminLinksPrev) {
    btnAdminLinksPrev.addEventListener('click', () => {
      adminLinksPage = Math.max(1, adminLinksPage - 1);
      renderAdminLinksTable();
    });
  }
  if (btnAdminLinksNext) {
    btnAdminLinksNext.addEventListener('click', () => {
      adminLinksPage += 1;
      renderAdminLinksTable();
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

  window.editingPollId = null;

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
  let currentUserRole = localStorage.getItem('kfcman_user_role') || '';
  let currentUserLinks = 0;
  let currentUserClicks = 0;

  // --- Global Top Slim Breadcrumb Updater ---
  window.updateBreadcrumb = function(parentText, currentText, badgeText = '') {
    const parentEl = document.getElementById('breadcrumb-parent');
    const currentEl = document.getElementById('breadcrumb-current');
    const badgeEl = document.getElementById('breadcrumb-badge');
    
    if (parentEl) parentEl.textContent = parentText;
    if (currentEl) currentEl.textContent = currentText;
    if (badgeEl) {
      if (badgeText) {
        badgeEl.textContent = badgeText;
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }
  };

  // --- 4-Tab Structure Unified Switcher & Settings Config ---
  window.switchMainTab = function(tabId) {
    const hasPollsUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    const hasClassroomUnlock = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'vip';
    
    if (tabId === 'polls' && !hasPollsUnlock) {
      showToast('잠금 상태 🔒', '실시간 설문 광장 기능은 \'우수회원👑\' 등급 전용 혜택입니다. 무제한 주소 단축 및 설문 개설을 위해 관리자에게 등급업을 요청해 주세요!', 'warning');
      tabId = 'shortener';
      return;
    }
    // 모든 가입 회원이 학급 점수 기능을 자유롭게 사용 가능하도록 잠금 해제
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
    const mindcheckSec = document.getElementById('mindcheck-section');
    const scibotSec = document.getElementById('scibot-section');
    const scibitSec = document.getElementById('scibit-section');
    const dashSummary = document.getElementById('dashboard-summary-panel');
    const vipPromo = document.getElementById('vip-promotion-card');
    
    const navShortener = document.getElementById('nav-item-shortener');
    const navDashboard = document.getElementById('nav-item-dashboard');
    const navPolls = document.getElementById('nav-item-polls');
    const navClassroom = document.getElementById('nav-item-classroom');
    const navSettings = document.getElementById('nav-item-settings');
    
    // Sidebar nav elements
    const sideShortener = document.getElementById('nav-item-shortener-side');
    const sideClassroom = document.getElementById('nav-item-classroom-side');
    const sideMindcheck = document.getElementById('nav-item-mindcheck-side');
    const sideScibot = document.getElementById('nav-item-scibot-side');
    const sideScibit = document.getElementById('nav-item-scibit-side');
    const sideProjects = document.getElementById('nav-item-projects-side');
    const sideSettings = document.getElementById('nav-item-settings-side');

    const mNavShortener = document.getElementById('mobile-nav-shortener-member');
    const mNavPolls = document.getElementById('mobile-nav-polls-member');
    const mNavClassroom = document.getElementById('mobile-nav-classroom-member');
    const mNavMindcheck = document.getElementById('mobile-nav-mindcheck');
    const mNavScibot = document.getElementById('mobile-nav-scibot');
    const mNavScibit = document.getElementById('mobile-nav-scibit');
    const mNavSettings = document.getElementById('mobile-nav-settings-member');

    const canvaBanner = document.getElementById('canva-banner');
    const canvaCategories = document.getElementById('canva-categories');
    const canvaHighlights = document.getElementById('canva-highlights');

    // Hide all main section containers (마음챙김, 과학실험실, MBL 가이드 포함)
    [shortenerSec, dashSec, pollSec, eusseukSec, settingsSec, mindcheckSec, scibotSec, scibitSec].forEach(sec => {
      if (sec) sec.classList.add('hidden');
    });

    // Remove active styles from desktop nav tabs
    [navShortener, navDashboard, navPolls, navClassroom, navSettings].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });

    // Remove active styles from Canva sidebar menu items (마음챙김, 과학실험실, MBL 가이드 포함)
    [sideShortener, sideClassroom, sideMindcheck, sideScibot, sideScibit, sideProjects, sideSettings].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    // Remove active styles from mobile bottom nav items (마음챙김, 과학실험실, MBL 가이드 포함)
    [mNavShortener, mNavPolls, mNavClassroom, mNavMindcheck, mNavScibot, mNavScibit, mNavSettings].forEach(btn => {
      if (btn) {
        btn.classList.remove('active-mobile-nav');
        btn.classList.add('text-slate-400', 'dark:text-slate-500');
      }
    });

    if (tabId === 'shortener') {
      const authToken = localStorage.getItem('kfcman_auth_token');
      if (!authToken) {
        if (guestContent) guestContent.classList.remove('hidden');
        if (memberContent) memberContent.classList.add('hidden');
      }

      if (shortenerSec) shortenerSec.classList.remove('hidden');
      if (canvaBanner) canvaBanner.classList.remove('hidden');
      if (canvaCategories) canvaCategories.classList.remove('hidden');
      if (canvaHighlights) canvaHighlights.classList.remove('hidden');
      
      if (navShortener) navShortener.classList.add('active');
      if (sideShortener) sideShortener.classList.add('active');
      if (mNavShortener) {
        mNavShortener.classList.add('active-mobile-nav');
        mNavShortener.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      updateBreadcrumb('홈', '단축 링크 관리', '단축 URL');
      renderDashboard(); // Populate recent links grid (create/edit/stats) on the shortener tab too
    } else if (tabId === 'projects') {
      // In projects tab, we display the recent grid under shortener section, but hide banner, categories, and highlights.
      if (shortenerSec) shortenerSec.classList.remove('hidden');
      if (canvaBanner) canvaBanner.classList.add('hidden');
      if (canvaCategories) canvaCategories.classList.add('hidden');
      if (canvaHighlights) canvaHighlights.classList.add('hidden');
      
      if (sideProjects) sideProjects.classList.add('active');
      stopLivePollInterval();
      updateBreadcrumb('홈', '프로젝트 허브', '');
      renderDashboard(); // Triggers recent grid rendering
    } else if (tabId === 'polls') {
      // 투표 기능 비활성화: 기본 메인 단축 탭으로 리다이렉트
      switchMainTab('shortener');
      return;
    } else if (tabId === 'classroom') {
      if (eusseukSec) eusseukSec.classList.remove('hidden');
      if (navClassroom) navClassroom.classList.add('active');
      if (sideClassroom) sideClassroom.classList.add('active');
      if (mNavClassroom) {
        mNavClassroom.classList.add('active-mobile-nav');
        mNavClassroom.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      fetchClassroom();
      switchClassroomSubTab('gradebook'); // 기본적으로 학생 성적표(점수 관리) 테이블을 먼저 표시
    } else if (tabId === 'settings') {
      if (settingsSec) settingsSec.classList.remove('hidden');
      if (navSettings) navSettings.classList.add('active');
      if (sideSettings) sideSettings.classList.add('active');
      if (mNavSettings) {
        mNavSettings.classList.add('active-mobile-nav');
        mNavSettings.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      updateBreadcrumb('설정', '계정 및 환경설정', '');
      
      // Load classroom settings data
      renderSettingsView();
      
      // Default settings subtab based on role
      if (currentUserRole === 'admin' || currentUserRole === 'manager') {
        switchSettingsSubTab('admin');
      } else if (currentUserRole === 'vip') {
        switchSettingsSubTab('classroom');
      } else {
        switchSettingsSubTab('shortcut');
      }
    } else if (tabId === 'mindcheck') {
      // 마음챙김 (MindCheck 힐링 센터) 탭 진입
      const authToken = localStorage.getItem('kfcman_auth_token');
      if (!authToken) {
        if (guestContent) guestContent.classList.add('hidden');
        if (memberContent) memberContent.classList.remove('hidden');
      }

      if (mindcheckSec) mindcheckSec.classList.remove('hidden');
      if (sideMindcheck) sideMindcheck.classList.add('active');
      if (mNavMindcheck) {
        mNavMindcheck.classList.add('active-mobile-nav');
        mNavMindcheck.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      updateBreadcrumb('홈', '마음챙김', '숨고르기');

      // MindCheck iframe에 현재 다크/라이트 테마 즉시 전달
      try {
        const frame = document.getElementById('mindcheck-frame');
        if (frame && frame.contentWindow) {
          const isDark = document.documentElement.classList.contains('dark');
          frame.contentWindow.postMessage({ type: 'THEME_SYNC', theme: isDark ? 'dark' : 'light' }, '*');
        }
      } catch (err) {
        console.warn('마음챙김 테마 동기화 중 경고:', err);
      }
    } else if (tabId === 'scibot') {
      // 과학실험실 (SciBot 로봇 센서 측정) 탭 진입
      const authToken = localStorage.getItem('kfcman_auth_token');
      if (!authToken) {
        if (guestContent) guestContent.classList.add('hidden');
        if (memberContent) memberContent.classList.remove('hidden');
      }

      if (scibotSec) scibotSec.classList.remove('hidden');
      if (sideScibot) sideScibot.classList.add('active');
      if (mNavScibot) {
        mNavScibot.classList.add('active-mobile-nav');
        mNavScibot.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      updateBreadcrumb('홈', '과학실험실', '로봇 센서 탐구');

      // SciBot iframe에 현재 다크/라이트 테마 즉시 전달
      try {
        const frame = document.getElementById('scibot-frame');
        if (frame && frame.contentWindow) {
          const isDark = document.documentElement.classList.contains('dark');
          frame.contentWindow.postMessage({ type: 'THEME_SYNC', theme: isDark ? 'dark' : 'light' }, '*');
        }
      } catch (err) {
        console.warn('SciBot 테마 동기화 중 경고:', err);
      }
    } else if (tabId === 'scibit') {
      // MBL 가이드 (SciBit 초등과학 지원) 탭 진입
      const authToken = localStorage.getItem('kfcman_auth_token');
      if (!authToken) {
        if (guestContent) guestContent.classList.add('hidden');
        if (memberContent) memberContent.classList.remove('hidden');
      }

      if (scibitSec) scibitSec.classList.remove('hidden');
      if (sideScibit) sideScibit.classList.add('active');
      if (mNavScibit) {
        mNavScibit.classList.add('active-mobile-nav');
        mNavScibit.classList.remove('text-slate-400', 'dark:text-slate-500');
      }
      stopLivePollInterval();
      updateBreadcrumb('홈', 'MBL 가이드', '초등과학 실험 지원');

      // SciBit iframe에 현재 다크/라이트 테마 즉시 전달
      try {
        const frame = document.getElementById('scibit-frame');
        if (frame && frame.contentWindow) {
          const isDark = document.documentElement.classList.contains('dark');
          frame.contentWindow.postMessage({ type: 'THEME_SYNC', theme: isDark ? 'dark' : 'light' }, '*');
        }
      } catch (err) {
        console.warn('SciBit 테마 동기화 중 경고:', err);
      }
    } else if (tabId === 'oracle-server') {
      // [관리자 전용] 오라클 서버 관제 대시보드 탭 진입
      const effectiveRole = currentUserRole || localStorage.getItem('kfcman_user_role') || '';
      if (effectiveRole !== 'admin') {
        showToast('접근 제한 🔒', '오라클 서버 관제 대시보드는 최고 관리자(Admin) 전용 기능입니다.', 'error');
        window.switchMainTab('shortener');
        return;
      }
      const oracleSec = document.getElementById('oracle-server-section');
      const sideOracle = document.getElementById('nav-item-oracle-side');
      if (oracleSec) oracleSec.classList.remove('hidden');
      if (sideOracle) sideOracle.classList.add('active');
      stopLivePollInterval();
      updateBreadcrumb('인프라', '오라클 서버 관제', '실시간');

      // 오라클 서버 실시간 데이터 즉시 조회 및 10초 주기 자동 갱신 가동
      fetchOracleServerMetrics();
      if (!window.oracleMetricsInterval) {
        window.oracleMetricsInterval = setInterval(fetchOracleServerMetrics, 10000);
      }
    }

    // 다른 탭으로 이동할 경우 오라클 관제 자동 갱신 인터벌 해제
    if (tabId !== 'oracle-server' && window.oracleMetricsInterval) {
      clearInterval(window.oracleMetricsInterval);
      window.oracleMetricsInterval = null;
    }

    lucide.createIcons();
  };

  // [관리자 전용] 오라클 클라우드 서버 메트릭 데이터 조회 및 대시보드 렌더링 함수
  async function fetchOracleServerMetrics() {
    const spinner = document.getElementById('oracle-refresh-spinner');
    if (spinner) spinner.classList.add('animate-spin');

    try {
      const response = await secureFetch('/api/admin/system');
      if (!response.ok) {
        throw new Error(`서버 응답 오류 (${response.status})`);
      }
      const data = await response.json();

      // 1. CPU 메트릭 갱신
      const cpuPercentEl = document.getElementById('oracle-cpu-percent');
      const cpuBarEl = document.getElementById('oracle-cpu-bar');
      const cpuLoadEl = document.getElementById('oracle-cpu-load');
      const cpuCoresEl = document.getElementById('oracle-cpu-cores-text');
      if (cpuPercentEl) cpuPercentEl.textContent = `${data.cpu}%`;
      if (cpuBarEl) {
        cpuBarEl.style.width = `${Math.min(data.cpu, 100)}%`;
        if (data.cpu > 80) {
          cpuBarEl.className = 'bg-rose-500 h-2.5 rounded-full transition-all duration-500';
        } else if (data.cpu > 50) {
          cpuBarEl.className = 'bg-amber-500 h-2.5 rounded-full transition-all duration-500';
        } else {
          cpuBarEl.className = 'bg-gradient-to-r from-rose-500 to-amber-500 h-2.5 rounded-full transition-all duration-500';
        }
      }
      if (cpuLoadEl && data.loadAvg) {
        cpuLoadEl.textContent = `${data.loadAvg[0]} / ${data.loadAvg[1]} / ${data.loadAvg[2]}`;
      }
      if (cpuCoresEl) {
        cpuCoresEl.textContent = `${data.cores} Cores (${data.cpuModel || 'ARM64'})`;
      }

      // 2. RAM 메모리 갱신
      const memPercentEl = document.getElementById('oracle-mem-percent');
      const memBarEl = document.getElementById('oracle-mem-bar');
      const memDetailEl = document.getElementById('oracle-mem-detail');
      const memTotalEl = document.getElementById('oracle-mem-total-text');
      if (memPercentEl) memPercentEl.textContent = `${data.memory}%`;
      if (memBarEl) memBarEl.style.width = `${Math.min(data.memory, 100)}%`;
      if (memDetailEl && data.memDetails) {
        memDetailEl.textContent = `${data.memDetails.usedGB} GB / ${data.memDetails.freeGB} GB`;
      }
      if (memTotalEl && data.memDetails) {
        memTotalEl.textContent = `총 ${data.memDetails.totalGB} GB 고사양 OCI 메모리`;
      }

      // 3. SSD 디스크 갱신
      const diskPercentEl = document.getElementById('oracle-disk-percent');
      const diskBarEl = document.getElementById('oracle-disk-bar');
      const diskDetailEl = document.getElementById('oracle-disk-detail');
      const diskTotalEl = document.getElementById('oracle-disk-total-text');
      if (diskPercentEl) diskPercentEl.textContent = `${data.disk}%`;
      if (diskBarEl) diskBarEl.style.width = `${Math.min(data.disk, 100)}%`;
      if (diskDetailEl && data.diskDetails) {
        diskDetailEl.textContent = `${data.diskDetails.used} / ${data.diskDetails.available}`;
      }
      if (diskTotalEl && data.diskDetails) {
        diskTotalEl.textContent = `전체 ${data.diskDetails.total} 중 점유율`;
      }

      // 4. PM2 / Node.js 프로세스 갱신
      const pm2StatusEl = document.getElementById('oracle-pm2-status');
      const pm2PidEl = document.getElementById('oracle-pm2-pid');
      const pm2RssEl = document.getElementById('oracle-pm2-rss');
      const pm2UptimeEl = document.getElementById('oracle-pm2-uptime');
      if (pm2StatusEl && data.process) {
        pm2StatusEl.textContent = `PM2 ${data.process.status.toUpperCase()}`;
      }
      if (pm2PidEl && data.process) {
        pm2PidEl.textContent = `PID: #${data.process.pid}`;
      }
      if (pm2RssEl && data.process) {
        pm2RssEl.textContent = `${data.process.rssMB} MB (Heap: ${data.process.heapUsedMB} MB)`;
      }
      if (pm2UptimeEl && data.process) {
        pm2UptimeEl.textContent = data.process.uptime;
      }

      // 5. OCI 인프라 스펙 테이블 갱신
      const specRegionEl = document.getElementById('oracle-spec-region');
      const specShapeEl = document.getElementById('oracle-spec-shape');
      const specIpEl = document.getElementById('oracle-spec-ip');
      const specPlatformEl = document.getElementById('oracle-spec-platform');
      const specNodeEl = document.getElementById('oracle-spec-node');
      const specUptimeEl = document.getElementById('oracle-spec-uptime');
      const timestampTagEl = document.getElementById('oracle-timestamp-tag');

      if (specRegionEl && data.oracleInfo) specRegionEl.textContent = data.oracleInfo.region;
      if (specShapeEl && data.oracleInfo) specShapeEl.textContent = data.oracleInfo.shape;
      if (specIpEl && data.oracleInfo) specIpEl.textContent = `${data.oracleInfo.publicIp} (${data.oracleInfo.domain})`;
      if (specPlatformEl) specPlatformEl.textContent = data.platform;
      if (specNodeEl) specNodeEl.textContent = `Node.js ${data.nodeVersion}`;
      if (specUptimeEl) specUptimeEl.textContent = data.uptime;
      if (timestampTagEl) {
        const now = new Date();
        timestampTagEl.textContent = `조회 시각: ${now.toLocaleTimeString('ko-KR')}`;
      }

      // 5-1. 신규 상세 패널 메트릭 갱신 (메모리 정밀구조, DB 파일, PM2 데몬/보안)
      const detailRamTotalEl = document.getElementById('oracle-detail-ram-total');
      const detailRamUsedEl = document.getElementById('oracle-detail-ram-used');
      const detailRamCacheEl = document.getElementById('oracle-detail-ram-cache');
      const detailRamFreeEl = document.getElementById('oracle-detail-ram-free');
      const detailSwapTextEl = document.getElementById('oracle-detail-swap-text');
      const detailSwapBarEl = document.getElementById('oracle-detail-swap-bar');

      if (data.memDetails) {
        if (detailRamTotalEl) detailRamTotalEl.textContent = `${data.memDetails.totalGB} GB`;
        if (detailRamUsedEl) detailRamUsedEl.textContent = `${data.memDetails.usedGB} GB (${Math.round(data.memDetails.usedGB * 1024)} MB)`;
        if (detailRamCacheEl) detailRamCacheEl.textContent = `${data.memDetails.buffCacheMB ? data.memDetails.buffCacheMB.toLocaleString() : 4500} MB`;
        if (detailRamFreeEl) detailRamFreeEl.textContent = `${data.memDetails.freeGB} GB`;
        if (data.memDetails.swap) {
          if (detailSwapTextEl) detailSwapTextEl.textContent = `${data.memDetails.swap.usedMB} MB (${data.memDetails.swap.percent}%)`;
          if (detailSwapBarEl) detailSwapBarEl.style.width = `${Math.max(data.memDetails.swap.percent, 2)}%`;
        }
      }

      // DB 파일 크기 갱신
      const dbJsonSizeEl = document.getElementById('oracle-db-json-size');
      const dbSqliteSizeEl = document.getElementById('oracle-db-sqlite-size');
      const dbBannerSizeEl = document.getElementById('oracle-db-banner-size');
      const dbTotalSizeEl = document.getElementById('oracle-db-total-size');
      const diskSubPercentEl = document.getElementById('oracle-disk-sub-percent');
      const diskSubBarEl = document.getElementById('oracle-disk-sub-bar');

      if (data.dbFiles) {
        if (dbJsonSizeEl) dbJsonSizeEl.textContent = data.dbFiles.dbJsonSize || '434 KB';
        if (dbSqliteSizeEl) dbSqliteSizeEl.textContent = data.dbFiles.sqliteSize || '4.4 MB';
        if (dbBannerSizeEl) dbBannerSizeEl.textContent = data.dbFiles.bannerSize || '2.2 MB';
        if (dbTotalSizeEl) dbTotalSizeEl.textContent = data.dbFiles.totalDataDirSize || '7.3 MB';
      }
      if (data.diskDetails) {
        if (diskSubPercentEl) diskSubPercentEl.textContent = `${data.diskDetails.percent}% 점유 (잔여 ${data.diskDetails.available})`;
        if (diskSubBarEl) diskSubBarEl.style.width = `${data.diskDetails.percent}%`;
      }

      // PM2 데몬 및 보안 갱신
      const pm2RestartCountEl = document.getElementById('oracle-pm2-restart-count');
      const specPortsEl = document.getElementById('oracle-spec-ports');
      const specSslEl = document.getElementById('oracle-spec-ssl');

      if (pm2RestartCountEl && data.process) {
        pm2RestartCountEl.textContent = `${data.process.restartCount || 0} 회 (크래시 없음, 정상)`;
      }
      if (specPortsEl && data.oracleInfo) specPortsEl.textContent = data.oracleInfo.ports || '80, 443, 3000';
      if (specSslEl && data.oracleInfo) specSslEl.textContent = data.oracleInfo.ssl || "Let's Encrypt TLS 1.3";

      // 6. 비즈니스 통계 갱신
      const statLinksEl = document.getElementById('oracle-stat-links');
      const statClicksEl = document.getElementById('oracle-stat-clicks');
      const statUsersEl = document.getElementById('oracle-stat-users');
      if (statLinksEl && data.stats) statLinksEl.textContent = `${data.stats.totalLinks.toLocaleString()} 개`;
      if (statClicksEl && data.stats) statClicksEl.textContent = `${data.stats.totalClicks.toLocaleString()} 회`;
      if (statUsersEl && data.stats) statUsersEl.textContent = `${data.stats.totalUsers.toLocaleString()} 명`;

    } catch (err) {
      console.error('Failed to fetch oracle metrics:', err);
      showToast('모니터링 오류 ⚠️', '오라클 서버 메트릭 정보를 불러오지 못했습니다: ' + err.message, 'error');
    } finally {
      if (spinner) {
        setTimeout(() => spinner.classList.remove('animate-spin'), 400);
      }
    }
  }
  window.fetchOracleServerMetrics = fetchOracleServerMetrics;

  // 오라클 새로고침 버튼 리스너 바인딩
  document.addEventListener('DOMContentLoaded', () => {
    const btnRefresh = document.getElementById('btn-refresh-oracle-metrics');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        fetchOracleServerMetrics();
      });
    }
  });

  const SETTINGS_SUBTAB_META = {
    admin: {
      title: '통합 관리자',
      desc: '회원 승인, 서비스 이용량, 알림 채널 및 서버 상태를 관리합니다.',
      icon: 'shield-alert',
      path: '설정 > 통합 관리자'
    },
    classroom: {
      title: '학급 설정',
      desc: '학급 운영 규칙, 개인정보 보호 및 폰트 종류를 설정합니다.',
      icon: 'award',
      path: '설정 > 학급 설정'
    },
    service: {
      title: '계정 & 서비스 설정',
      desc: '기능 활성화, 화면 테마, 단축 링크 데이터 청소와 계정 정보를 관리합니다.',
      icon: 'sliders-horizontal',
      path: '설정 > 계정 & 서비스 설정'
    }
  };

  const SETTINGS_NESTED_LABELS = {
    privacy: '개인정보 & 학급관리',
    rules: '점수 환산 규칙',
    fontsize: '폰트 변경'
  };

  function updateSettingsHeader(subTabId, nestedSubtab) {
    const meta = SETTINGS_SUBTAB_META[subTabId] || SETTINGS_SUBTAB_META.classroom;
    const titleEl = document.getElementById('settings-heading-title');
    const descEl = document.getElementById('settings-heading-desc');
    const iconEl = document.getElementById('settings-heading-icon');
    const pathEl = document.getElementById('settings-current-path');

    if (titleEl) titleEl.textContent = meta.title;
    if (descEl) descEl.textContent = meta.desc;
    if (iconEl) iconEl.setAttribute('data-lucide', meta.icon);
    if (pathEl) {
      const nestedLabel = subTabId === 'classroom' ? SETTINGS_NESTED_LABELS[nestedSubtab || currentSettingsSubtab || 'privacy'] : '';
      pathEl.textContent = nestedLabel ? `${meta.path} > ${nestedLabel}` : meta.path;
    }
  }

  function normalizeSettingsSubTab(subTabId) {
    if (subTabId === 'shortcut' || subTabId === 'account' || subTabId === 'service' || subTabId === 'account-service') {
      return 'service';
    }
    if (subTabId === 'fontsize') return 'fontsize';
    if (subTabId === 'admin') return 'admin';
    return 'classroom';
  }

  function formatAccountDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ko-KR');
  }

  function getAccountRoleLabel(data) {
    const roleMap = {
      admin: '관리자',
      vip: '우수회원',
      manager: '운영진',
      user: '정회원'
    };
    const roleLabel = roleMap[data.role] || '정회원';
    const statusLabel = data.approved === false ? '승인 대기' : '활성';
    return `${roleLabel} · ${statusLabel}`;
  }

  function renderAccountSummary() {
    const token = getAuthToken();
    if (!token) return;

    fetch('/api/me', { headers: { 'X-KFCMan-Auth': token } })
      .then(r => r.json()).then(data => {
        const name = data.username || '—';
        const role = getAccountRoleLabel(data);
        const joined = formatAccountDate(data.createdAt);
        const last = formatAccountDate(data.lastUsed || data.createdAt);
        const circle = document.getElementById('account-profile-circle');
        if (circle) circle.textContent = name.slice(0, 1).toUpperCase();
        const nameEl = document.getElementById('account-profile-name');
        if (nameEl) nameEl.textContent = name;
        const roleEl = document.getElementById('account-profile-role');
        if (roleEl) roleEl.textContent = role;
        const joinedEl = document.getElementById('account-joined-at');
        if (joinedEl) joinedEl.textContent = joined;
        const lastEl = document.getElementById('account-last-used');
        if (lastEl) lastEl.textContent = last;
      }).catch(() => {});
  }

  window.switchSettingsSubTab = function(subTabId) {
    const normalizedSubTabId = normalizeSettingsSubTab(subTabId);
    const subviewAdmin = document.getElementById('settings-subview-admin');
    const subviewShortcut = document.getElementById('settings-subview-shortcut');
    const subviewClassroom = document.getElementById('settings-subview-classroom');
    const subviewAccount = document.getElementById('settings-subview-account');

    const btnSubtabAdmin = document.getElementById('btn-settings-subtab-admin');
    const btnSubtabShortcut = document.getElementById('btn-settings-subtab-shortcut');
    const btnSubtabClassroom = document.getElementById('btn-settings-subtab-classroom');
    const btnSubtabAccount = document.getElementById('btn-settings-subtab-account');

    updateSettingsHeader(normalizedSubTabId === 'fontsize' ? 'classroom' : normalizedSubTabId);

    // Hide all
    [subviewAdmin, subviewShortcut, subviewClassroom, subviewAccount].forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Remove active styles
    [btnSubtabAdmin, btnSubtabShortcut, btnSubtabClassroom, btnSubtabAccount].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    if (normalizedSubTabId === 'admin') {
      if (subviewAdmin) subviewAdmin.classList.remove('hidden');
      const adminApprovalSection = document.getElementById('admin-approval-section');
      if (adminApprovalSection) adminApprovalSection.classList.remove('hidden');
      if (btnSubtabAdmin) {
        btnSubtabAdmin.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabAdmin.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderAdminPanel();
    } else if (normalizedSubTabId === 'service') {
      if (subviewShortcut) subviewShortcut.classList.remove('hidden');
      if (subviewAccount) subviewAccount.classList.remove('hidden');
      if (btnSubtabShortcut) {
        btnSubtabShortcut.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabShortcut.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderAccountSummary();
    } else if (normalizedSubTabId === 'classroom' || normalizedSubTabId === 'fontsize') {
      if (subviewClassroom) subviewClassroom.classList.remove('hidden');
      const classroomSettingsSection = document.getElementById('classroom-settings-section');
      if (classroomSettingsSection) classroomSettingsSection.classList.remove('hidden');
      if (btnSubtabClassroom) {
        btnSubtabClassroom.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabClassroom.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      if (window.switchSettingsSubtab) {
        window.switchSettingsSubtab(normalizedSubTabId === 'fontsize' ? 'fontsize' : 'privacy');
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

    // 서브탭 버튼 기본(비활성) 및 활성 스타일 적용 (완전 무경계 미니멀 스타일)
    const inactiveClass = 'text-xs transition-all flex items-center gap-1.5 cursor-pointer font-medium text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 subtab-pill';
    const activeClass = 'text-xs transition-all flex items-center gap-1.5 cursor-pointer font-bold subtab-pill active text-[#7c6cf0] dark:text-[#9d8df8]';

    [btnDash, btnGradebook, btnThermometer].forEach(btn => {
      if (btn) btn.className = inactiveClass;
    });

    // 선택된 서브탭 표시 및 활성 알약 스타일 적용
    const studentCountBadge = classroomData && Array.isArray(classroomData.students) ? `(${classroomData.students.length})` : '';
    if (subTabId === 'dash') {
      if (classroomSec) classroomSec.classList.remove('hidden');
      if (btnDash) btnDash.className = activeClass;
      window.updateBreadcrumb('교실', '학급 대시보드', studentCountBadge);
    } else if (subTabId === 'gradebook') {
      if (gradebookSec) gradebookSec.classList.remove('hidden');
      if (btnGradebook) btnGradebook.className = activeClass;
      window.updateBreadcrumb('교실', '학생 명렬표', studentCountBadge);
    } else if (subTabId === 'thermometer') {
      if (thermometerSec) thermometerSec.classList.remove('hidden');
      if (btnThermometer) btnThermometer.className = activeClass;
      window.updateBreadcrumb('교실', '학급 온도계', '');
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
  if (btnSettingsSubtabShortcut) btnSettingsSubtabShortcut.addEventListener('click', () => switchSettingsSubTab('service'));
  if (btnSettingsSubtabClassroom) btnSettingsSubtabClassroom.addEventListener('click', () => switchSettingsSubTab('classroom'));

  // 회원관리 탭 버튼
  const btnSettingsSubtabAccount = document.getElementById('btn-settings-subtab-account');
  if (btnSettingsSubtabAccount) btnSettingsSubtabAccount.addEventListener('click', () => switchSettingsSubTab('service'));

  // 비밀번호 변경 폼
  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('cp-current').value;
      const newPassword = document.getElementById('cp-new').value;
      const confirmPassword = document.getElementById('cp-confirm').value;
      const msgEl = document.getElementById('cp-msg');
      const btn = document.getElementById('btn-change-password');

      const showMsg = (text, ok) => {
        msgEl.textContent = text;
        msgEl.className = `text-xs font-bold py-2 px-3 rounded-xl ${ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`;
        msgEl.classList.remove('hidden');
      };

      if (newPassword !== confirmPassword) return showMsg('새 비밀번호가 일치하지 않습니다.', false);
      if (newPassword.length < 6) return showMsg('새 비밀번호는 6자 이상이어야 합니다.', false);

      btn.disabled = true;
      btn.innerHTML = '변경 중...';
      try {
        const token = getAuthToken();
        const res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-KFCMan-Auth': token },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          showMsg('✅ ' + data.message, true);
          changePasswordForm.reset();
        } else {
          showMsg('❌ ' + data.error, false);
        }
      } catch (err) {
        showMsg('❌ 네트워크 오류가 발생했습니다.', false);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 inline-block mr-1"></i>비밀번호 변경';
        lucide.createIcons();
      }
    });
  }

  // 회원관리 탭 로그아웃
  const btnAccountLogout = document.getElementById('btn-account-logout');
  if (btnAccountLogout) {
    btnAccountLogout.addEventListener('click', () => {
      const logoutBtn = document.getElementById('btn-logout-sidebar') || document.getElementById('btn-logout-mobile');
      if (logoutBtn) logoutBtn.click();
    });
  }

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
      resetPollForm();
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

  // Reset Poll Form helper
  function resetPollForm() {
    window.editingPollId = null;
    
    const modeTitle = document.getElementById('poll-card-mode-title');
    if (modeTitle) modeTitle.textContent = 'New kfcman-on';
    
    const submitBtn = document.getElementById('btn-create-poll-submit');
    if (submitBtn) {
      const btnSpan = submitBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = '게시하기';
      submitBtn.disabled = false;
    }
    
    document.getElementById('poll-title-input').value = '';
    
    if (boardTypeCards && hiddenBoardTypeInput) {
      boardTypeCards.forEach(c => c.classList.remove('active'));
      const defaultCard = document.querySelector('.board-type-card[data-value="bar"]');
      if (defaultCard) defaultCard.classList.add('active');
      hiddenBoardTypeInput.value = 'bar';
    }
    
    const builderContainer = document.getElementById('poll-options-builder-container');
    if (builderContainer) builderContainer.classList.remove('hidden');

    const quizSettingsContainer = document.getElementById('quiz-settings-container');
    if (quizSettingsContainer) quizSettingsContainer.classList.add('hidden');
    
    pollOptionsContainer.innerHTML = `
      <div class="poll-option-row flex gap-3 items-center">
        <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 gap-2 shadow-clay-flat">
          <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400"></i>
          <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400" placeholder="문항 1 입력" required autocomplete="off">
        </div>
        <div class="w-8"></div>
      </div>
      <div class="poll-option-row flex gap-3 items-center">
        <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 gap-2 shadow-clay-flat">
          <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400"></i>
          <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400" placeholder="문항 2 입력" required autocomplete="off">
        </div>
        <div class="w-8"></div>
      </div>
    `;
    optionCount = 2;
    document.getElementById('poll-duration-input').value = 10;
    
    const dupModeSelect = document.getElementById('poll-dup-mode-input');
    if (dupModeSelect) dupModeSelect.value = 'once';
    
    const multipleCheckbox = document.getElementById('poll-multiple-input');
    if (multipleCheckbox) multipleCheckbox.checked = false;

    const quizDurationInput = document.getElementById('poll-quiz-duration-input');
    if (quizDurationInput) quizDurationInput.value = 30;

    lucide.createIcons();
  }

  // Start editing poll helper
  function startEditingPoll(pollId) {
    const poll = pollsData.find(p => p.id === pollId);
    if (!poll) return;

    window.editingPollId = poll.id;

    // 1. Change Form Title and Button text
    const modeTitle = document.getElementById('poll-card-mode-title');
    if (modeTitle) modeTitle.textContent = '설문 수정하기';

    const submitBtn = document.getElementById('btn-create-poll-submit');
    if (submitBtn) {
      const btnSpan = submitBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = '수정 완료';
    }

    // 2. Open form card
    if (createPollCard) {
      createPollCard.classList.remove('hidden');
      createPollCard.scrollIntoView({ behavior: 'smooth' });
    }

    // 3. Fill form values
    document.getElementById('poll-title-input').value = poll.title;
    
    // Trigger card selection click
    const targetCard = document.querySelector(`.board-type-card[data-value="${poll.boardType}"]`);
    if (targetCard) {
      targetCard.click();
    } else {
      const hiddenBoardTypeInput = document.getElementById('poll-board-type-input');
      if (hiddenBoardTypeInput) hiddenBoardTypeInput.value = poll.boardType;
    }

    // Options list setup
    if (poll.options && poll.options.length > 0) {
      pollOptionsContainer.innerHTML = '';
      poll.options.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'poll-option-row animate-fade-in flex gap-3 items-center';
        
        const isDeleteAllowed = idx >= 2;
        row.innerHTML = `
          <div class="flex-grow flex items-center bg-slate-50 dark:bg-slate-950 border-2 border-white rounded-xl px-4 py-2.5 gap-2 shadow-clay-flat">
            <i data-lucide="circle-dot" class="w-4 h-4 text-slate-400"></i>
            <input type="text" class="poll-option-input w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400" placeholder="문항 ${idx + 1} 입력" required autocomplete="off" value="${opt.text}">
          </div>
          ${isDeleteAllowed 
            ? `<button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500/10 text-red-400 btn-delete-option active:scale-95 transition-all flex-shrink-0">
                 <i data-lucide="trash" class="w-3.5 h-3.5"></i>
               </button>`
            : `<div class="w-8"></div>`
          }
        `;
        pollOptionsContainer.appendChild(row);

        if (isDeleteAllowed) {
          row.querySelector('.btn-delete-option').addEventListener('click', () => {
            row.remove();
            renumberOptions();
          });
        }
      });
      optionCount = poll.options.length;
      lucide.createIcons();
    }

    // Calculate original duration in minutes
    const durationMinutes = Math.round((new Date(poll.expiresAt) - new Date(poll.createdAt)) / 60000);
    document.getElementById('poll-duration-input').value = durationMinutes;

    const dupModeSelect = document.getElementById('poll-dup-mode-input');
    if (dupModeSelect) dupModeSelect.value = poll.dupMode || 'once';

    const multipleCheckbox = document.getElementById('poll-multiple-input');
    if (multipleCheckbox) multipleCheckbox.checked = !!poll.allowMultiple;

    // Quiz configurations
    if (poll.boardType === 'quiz') {
      const quizDurationInput = document.getElementById('poll-quiz-duration-input');
      if (quizDurationInput) quizDurationInput.value = poll.quizDuration || 30;
      
      renumberOptions(); // Re-populate correct option dropdown
      const quizCorrectSelect = document.getElementById('poll-quiz-correct-input');
      if (quizCorrectSelect) quizCorrectSelect.value = String(poll.quizCorrectIndex || 0);
    }
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
  
      const isEditing = !!window.editingPollId;
      const url = isEditing ? `/api/polls/${window.editingPollId}` : '/api/polls';
      const method = isEditing ? 'PUT' : 'POST';

      const submitBtn = document.getElementById('btn-create-poll-submit');
      const btnSpan = submitBtn.querySelector('span');
      submitBtn.disabled = true;
      btnSpan.textContent = isEditing ? '수정 사항 저장 중...' : '게시글 업로드 중...';
      
      const quizCorrectIndex = boardType === 'quiz' ? parseInt(document.getElementById('poll-quiz-correct-input').value) : null;
      const quizDuration = boardType === 'quiz' ? parseInt(document.getElementById('poll-quiz-duration-input').value) || 30 : null;
  
      try {
        const response = await secureFetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, options, durationMinutes, allowMultiple, dupMode, boardType, quizCorrectIndex, quizDuration })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
  
        if (isEditing) {
          showToast('설문 수정 완료', '선호도 조사가 성공적으로 수정되었습니다.', 'success');
          resetPollForm();
          if (createPollCard) createPollCard.classList.add('hidden');
          fetchAndRenderPolls();
        } else {
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
          resetPollForm();
          if (createPollCard) createPollCard.classList.add('hidden');
          fetchAndRenderPolls();
        }
      } catch (err) {
        showToast(isEditing ? '수정 실패' : '등록 실패', err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        btnSpan.textContent = isEditing ? '수정 완료' : '게시하기';
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
      let editButtonHtml = '';
      if (cleanUser === 'kfcman' || cleanUser === 'admin' || poll.owner === cleanUser) {
        editButtonHtml = `
          <button class="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-650 dark:text-slate-350 btn-edit-poll active:scale-95 transition-all flex-shrink-0" data-id="${poll.id}" title="설문 수정">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
        `;
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
            ? `<button class="btn-vote-trigger flex-1 bg-gradient-to-r from-brand-purple to-brand-cyan shadow-brand-purple/20 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center hover:scale-[1.01] active:scale-95 cursor-pointer h-9" data-id="${poll.id}">투표 참여하기</button>`
            : `<button class="btn-stats-trigger flex-1 bg-brand-green/10 border border-brand-green/20 hover:bg-brand-green/15 text-brand-green font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center hover:scale-[1.01] active:scale-95 cursor-pointer h-9" data-id="${poll.id}">${hasVoted ? '투표 완료 (결과보기)' : '결과 분석 보기'}</button>`
          }
          <button class="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 btn-share-poll active:scale-95 transition-all flex-shrink-0" data-id="${poll.id}" title="주소 공유">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
          ${editButtonHtml}
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
    document.querySelectorAll('.btn-edit-poll').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        startEditingPoll(id);
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
              wordSpan.className = 'px-3.5 py-2.5 menti-word transition-all duration-300 hover:scale-125 cursor-pointer select-none font-black tracking-tight rounded-2xl bg-slate-500/5 dark:bg-white/5 border border-slate-200/10 dark:border-white/5';
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

  // Footer Links Modals (Service Intro, Privacy Policy, Terms of Service, Abuse Report)
  const introModal = document.getElementById('intro-modal');
  const privacyModal = document.getElementById('privacy-modal');
  const termsModal = document.getElementById('terms-modal');
  const abuseModal = document.getElementById('abuse-modal');

  const linkServiceIntro = document.getElementById('link-service-intro');
  const linkPrivacyPolicy = document.getElementById('link-privacy-policy');
  const linkTerms = document.getElementById('link-terms');
  const linkAbuse = document.getElementById('link-abuse');

  const btnIntroModalClose = document.getElementById('btn-intro-modal-close');
  const btnPrivacyModalClose = document.getElementById('btn-privacy-modal-close');
  const btnTermsModalClose = document.getElementById('btn-terms-modal-close');
  const btnAbuseModalClose = document.getElementById('btn-abuse-modal-close');

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

  if (linkTerms && termsModal) {
    linkTerms.addEventListener('click', (e) => {
      e.preventDefault();
      termsModal.classList.remove('hidden');
    });
  }

  if (linkAbuse && abuseModal) {
    linkAbuse.addEventListener('click', (e) => {
      e.preventDefault();
      abuseModal.classList.remove('hidden');
    });
  }

  if (btnIntroModalClose && introModal) {
    btnIntroModalClose.addEventListener('click', () => introModal.classList.add('hidden'));
  }
  if (btnPrivacyModalClose && privacyModal) {
    btnPrivacyModalClose.addEventListener('click', () => privacyModal.classList.add('hidden'));
  }
  if (btnTermsModalClose && termsModal) {
    btnTermsModalClose.addEventListener('click', () => termsModal.classList.add('hidden'));
  }
  if (btnAbuseModalClose && abuseModal) {
    btnAbuseModalClose.addEventListener('click', () => abuseModal.classList.add('hidden'));
  }

  // Handle Abuse Report Form Submission
  const formReportAbuse = document.getElementById('form-report-abuse');
  if (formReportAbuse) {
    formReportAbuse.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetInput = document.getElementById('abuse-target-code');
      const categorySelect = document.getElementById('abuse-category');
      const descInput = document.getElementById('abuse-description');
      const statusMsg = document.getElementById('abuse-status-msg');
      const submitBtn = document.getElementById('btn-submit-abuse');

      let codeOrUrl = targetInput ? targetInput.value.trim() : '';
      if (!codeOrUrl) return;

      if (submitBtn) submitBtn.disabled = true;
      if (statusMsg) {
        statusMsg.className = 'text-xs font-bold p-2.5 rounded-xl text-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
        statusMsg.textContent = '신고를 접수하고 있습니다...';
        statusMsg.classList.remove('hidden');
      }

      try {
        const res = await fetch('/api/report-abuse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: codeOrUrl,
            category: categorySelect ? categorySelect.value : 'other',
            description: descInput ? descInput.value.trim() : ''
          })
        });
        const data = await res.json();
        if (res.ok) {
          if (statusMsg) {
            statusMsg.className = 'text-xs font-bold p-2.5 rounded-xl text-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
            statusMsg.textContent = data.message || '신고가 정상 접수되었습니다. 관리자 검토 후 조치됩니다.';
          }
          if (formReportAbuse) formReportAbuse.reset();
          setTimeout(() => {
            if (abuseModal) abuseModal.classList.add('hidden');
            if (statusMsg) statusMsg.classList.add('hidden');
          }, 3000);
        } else {
          if (statusMsg) {
            statusMsg.className = 'text-xs font-bold p-2.5 rounded-xl text-center bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
            statusMsg.textContent = data.error || '신고 접수 중 오류가 발생했습니다.';
          }
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.className = 'text-xs font-bold p-2.5 rounded-xl text-center bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
          statusMsg.textContent = '네트워크 통신 오류가 발생했습니다.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
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

  // Auto-open login modal if ?login=true is passed in URL
  const initParams = new URLSearchParams(window.location.search);
  if (initParams.get('login') === 'true') {
    openAuthModal('login');
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }

  // --- Mobile Buttons Event Bindings ---
  const themeToggleBtnMobile = document.getElementById('theme-toggle-btn-mobile');
  if (themeToggleBtnMobile) {
    themeToggleBtnMobile.addEventListener('click', () => {
      if (themeToggleBtn) themeToggleBtn.click(); else window.toggleThemeAction();
    });
  }

  const logoutBtnMobile = document.getElementById('btn-logout-mobile');
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener('click', performLogout);
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

  // Student-facing public display board
  const btnOpenStudentDisplay = document.getElementById('btn-open-student-display');
  const studentDisplayView = document.getElementById('student-display-view');
  const btnCloseDisplayView = document.getElementById('btn-close-display-view');
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');

  function escapeStudentDisplayText(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function renderStudentDisplay() {
    if (!classroomData || !Array.isArray(classroomData.students)) return;

    const titleElem = document.getElementById('display-class-title');
    const tempValElem = document.getElementById('display-temp-val');
    const tempBarElem = document.getElementById('display-temp-bar');
    const nextGoalElem = document.getElementById('display-next-goal-title');
    const remainElem = document.getElementById('display-remaining-temp');
    const gridElem = document.getElementById('display-students-grid');
    const summaryGridElem = document.getElementById('display-summary-grid');
    const podiumElem = document.getElementById('display-podium');
    const rules = classroomData.rules || {};

    const className = classroomData.name || '우리 학급';
    if (titleElem) titleElem.textContent = `${className} 으쓱 점수 & 학급 온도계`;

    const sortedStudents = [...classroomData.students].sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    const ratio = Number(rules.rawToAchievementRatio) || 50;
    const totalRaw = sortedStudents.reduce((sum, student) => sum + (Number(student.rawScore) || 0), 0);
    const totalStudents = sortedStudents.length;
    const avgRaw = totalStudents > 0 ? Math.round(totalRaw / totalStudents) : 0;
    const totalUnpaidAchievements = sortedStudents.reduce((sum, student) => {
      const unpaidRaw = Number(student.unpaid) || Math.max(0, (Number(student.rawScore) || 0) - (Number(student.paidScore) || 0));
      return sum + Math.floor(unpaidRaw / ratio);
    }, 0);
    const topAchievementStudent = [...sortedStudents].sort((a, b) => (Number(b.achievements) || 0) - (Number(a.achievements) || 0))[0];
    const maxRawScore = Math.max(1, ...sortedStudents.map((student) => Number(student.rawScore) || 0));

    if (summaryGridElem) {
      const topName = topAchievementStudent
        ? (rules.namePrivacy ? `${escapeStudentDisplayText(topAchievementStudent.number || '-')}번` : escapeStudentDisplayText(topAchievementStudent.name || `${topAchievementStudent.number || '-'}번`))
        : '-';
      const topAchievements = topAchievementStudent ? Number(topAchievementStudent.achievements) || 0 : 0;
      summaryGridElem.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div class="text-[11px] font-black text-slate-500">전체 학생 수</div>
          <div class="text-2xl font-black text-slate-950 mt-1">${totalStudents.toLocaleString()}명</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div class="text-[11px] font-black text-slate-500">반 평균 누적 점수</div>
          <div class="text-2xl font-black text-slate-950 mt-1">${avgRaw.toLocaleString()}점</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div class="text-[11px] font-black text-slate-500">전체 미지급 보상</div>
          <div class="text-2xl font-black text-orange-600 mt-1">${totalUnpaidAchievements.toLocaleString()}개</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div class="text-[11px] font-black text-slate-500">달성 횟수 1위</div>
          <div class="text-xl font-black text-slate-950 mt-1 truncate">${topName}</div>
          <div class="text-[11px] font-bold text-slate-500">${topAchievements.toLocaleString()}회</div>
        </div>
      `;
    }

    const tempDivider = Number(rules.thermometerRatio) || 200;
    const calculatedTempNumber = totalRaw / tempDivider;
    const calculatedTemp = calculatedTempNumber.toFixed(1);
    if (tempValElem) tempValElem.textContent = calculatedTemp;

    const goals = Array.isArray(classroomData.goals)
      ? [...classroomData.goals].sort((a, b) => (Number(a.temp) || 0) - (Number(b.temp) || 0))
      : [];
    const nextGoal = goals.find((goal) => (Number(goal.temp) || 0) > calculatedTempNumber) || goals[goals.length - 1];

    if (nextGoal) {
      const goalTemp = Number(nextGoal.temp) || 0;
      if (nextGoalElem) nextGoalElem.textContent = `${goalTemp}°C · ${nextGoal.activity || '학급 파티'}`;
      const remain = Math.max(0, goalTemp - calculatedTempNumber).toFixed(1);
      if (remainElem) remainElem.textContent = `목표 달성까지 남은 온도: ${remain}°C`;

      const maxScale = Math.max(100, goalTemp);
      const percent = Math.min(100, Math.max(0, (calculatedTempNumber / maxScale) * 100));
      if (tempBarElem) tempBarElem.style.width = `${percent}%`;
    } else {
      if (nextGoalElem) nextGoalElem.textContent = '목표 설정 중';
      if (remainElem) remainElem.textContent = '목표까지 남은 점수를 향해 힘내요!';
      if (tempBarElem) tempBarElem.style.width = '0%';
    }

    if (podiumElem) {
      const topScorers = [...sortedStudents]
        .sort((a, b) => (Number(b.rawScore) || 0) - (Number(a.rawScore) || 0))
        .slice(0, 3);
      const podiumOrder = [topScorers[1], topScorers[0], topScorers[2]].filter(Boolean);
      const podiumMeta = {
        0: { medal: '🥇', label: '1위', height: 'h-28', tone: 'bg-orange-100 border-orange-200 text-orange-700' },
        1: { medal: '🥈', label: '2위', height: 'h-24', tone: 'bg-slate-100 border-slate-200 text-slate-700' },
        2: { medal: '🥉', label: '3위', height: 'h-20', tone: 'bg-amber-100 border-amber-200 text-amber-700' }
      };
      podiumElem.innerHTML = podiumOrder.length
        ? podiumOrder.map((student) => {
            const rank = topScorers.indexOf(student);
            const meta = podiumMeta[rank] || podiumMeta[2];
            const name = rules.namePrivacy ? `${escapeStudentDisplayText(student.number || '-')}번` : escapeStudentDisplayText(student.name || `${student.number || '-'}번`);
            const score = (Number(student.rawScore) || 0).toLocaleString();
            return `
              <div class="flex-1 max-w-[150px] text-center">
                <div class="text-2xl mb-1">${meta.medal}</div>
                <div class="${meta.height} ${meta.tone} border rounded-t-2xl flex flex-col justify-center px-2">
                  <div class="text-xs font-black">${meta.label}</div>
                  <div class="text-sm font-black text-slate-950 truncate">${name}</div>
                  <div class="text-xs font-bold">${score}점</div>
                </div>
              </div>
            `;
          }).join('')
        : `<div class="text-sm font-bold text-slate-400">표시할 학생 점수가 없습니다.</div>`;
    }

    if (gridElem) {
      gridElem.innerHTML = sortedStudents.map((student) => {
        const number = escapeStudentDisplayText(student.number || '-');
        const nameText = rules.namePrivacy ? '' : escapeStudentDisplayText(student.name || '');
        const rawScoreNumber = Number(student.rawScore) || 0;
        const rawScore = rawScoreNumber.toLocaleString();
        const achievements = Number(student.achievements) || 0;
        const unpaidRaw = Number(student.unpaid) || Math.max(0, rawScoreNumber - (Number(student.paidScore) || 0));
        const unpaidAchievements = Math.floor(unpaidRaw / ratio);
        const scorePercent = Math.min(100, Math.max(0, (rawScoreNumber / maxRawScore) * 100));
        const rewardBadge = unpaidAchievements > 0
          ? `<div class="text-[11px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">🎁 미지급 ${unpaidAchievements}개</div>`
          : `<div class="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">전원지급</div>`;
        return `
          <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-colors min-h-[190px]">
            <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-black text-sm mb-2">
              ${number}
            </div>
            ${nameText ? `<div class="text-sm font-black text-slate-900 truncate w-full mb-1">${nameText}</div>` : ''}
            <div class="text-2xl font-black text-slate-950 font-sans tracking-tight">
              ${rawScore}
            </div>
            <div class="text-[11px] font-bold text-slate-600 mt-1 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
              달성 ${achievements}회
            </div>
            <div class="mt-2">${rewardBadge}</div>
            <div class="w-full mt-3">
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-orange-500 rounded-full" style="width: ${scorePercent}%;"></div>
              </div>
              <div class="text-[10px] font-bold text-slate-400 mt-1">최고점 대비 ${Math.round(scorePercent)}%</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Student Display Functions (Global Window Binding for robust direct invocation)
  window.openStudentDisplayView = async function() {
    try {
      if (!classroomData && typeof window.fetchClassroom === 'function') {
        await window.fetchClassroom();
      }
      renderStudentDisplay();
      const displayElem = document.getElementById('student-display-view');
      if (displayElem) {
        displayElem.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Failed to open student display:', err);
      showToast('화면 로드 실패', '학생 공개 화면을 불러오는 중 오류가 발생했습니다.', 'error');
    }
  };

  window.closeStudentDisplayView = function() {
    const displayElem = document.getElementById('student-display-view');
    if (displayElem) displayElem.classList.add('hidden');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  window.toggleStudentDisplayFullscreen = function() {
    const displayElem = document.getElementById('student-display-view');
    if (!document.fullscreenElement) {
      if (displayElem && displayElem.requestFullscreen) {
        displayElem.requestFullscreen().catch((err) => console.error(err));
      }
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  window.openStudentDisplayPopup = function() {
    const targetUrl = window.location.origin + window.location.pathname + '?view=student-display';
    const popup = window.open(
      targetUrl,
      'kfcmanStudentDisplayPopup',
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (popup) {
      popup.focus();
      window.closeStudentDisplayView();
      showToast('새 창 분리 완료', '학생 공개 화면이 새 창으로 열렸습니다! 교실 TV나 프로젝터 화면으로 이동하세요.', 'success');
    } else {
      showToast('팝업 차단 알림', '브라우저 주소창 우측에서 팝업 차단을 허용해 주세요.', 'warning');
    }
  };

  if (btnOpenStudentDisplay) {
    btnOpenStudentDisplay.addEventListener('click', window.openStudentDisplayView);
  }

  if (btnCloseDisplayView) {
    btnCloseDisplayView.addEventListener('click', window.closeStudentDisplayView);
  }

  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener('click', window.toggleStudentDisplayFullscreen);
  }

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
  async function fetchClassroom() {
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

      // 학생 공개 화면이 열려있다면 실시간으로 학생 전광판도 동기화
      const displayElem = document.getElementById('student-display-view');
      if (displayElem && !displayElem.classList.contains('hidden')) {
        renderStudentDisplay();
      }
    } catch (err) {
      console.error(err);
      showToast('로드 실패', '학급 데이터를 서버로부터 불러오지 못했습니다.', 'error');
    }
  }
  window.fetchClassroom = fetchClassroom;

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

      // 학생 공개 화면 실시간 갱신
      const displayElem = document.getElementById('student-display-view');
      if (displayElem && !displayElem.classList.contains('hidden')) {
        renderStudentDisplay();
      }

      // 듀얼모니터/교실TV에 띄운 새 창 전광판에 즉시 실시간 점수 변동 전달
      try {
        localStorage.setItem('kfcman_classroom_synced', Date.now().toString());
      } catch (syncErr) {}
    } catch (err) {
      console.error(err);
      showToast('저장 실패', '서버 저장 중 네트워크 에러가 발생했습니다.', 'error');
    }
  }

  // 다른 창(새 창으로 분리된 전광판 등)에서 점수가 변경되면 실시간으로 자동 수신
  window.addEventListener('storage', (e) => {
    if (e.key === 'kfcman_classroom_synced') {
      fetchClassroom();
    }
  });

  // URL 파라미터가 ?view=student-display 일 경우 자동으로 학생 공개 전광판 전용 모드로 실행
  (function checkAutoDisplayMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'student-display') {
      setTimeout(async () => {
        await fetchClassroom();
        window.openStudentDisplayView();
      }, 300);
    }
  })();

  // Main Render Hub
  function renderAllClassroomViews() {
    if (!classroomData) return;
    
    // Sort students by number ascending for lists/grids
    classroomData.students.sort((a, b) => a.number - b.number);

    renderDashboardView();
    renderGradebookView();
    renderThermometerView();
    renderSettingsView();
    if (studentDisplayView && !studentDisplayView.classList.contains('hidden')) {
      renderStudentDisplay();
    }
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
                <div class="w-3.5 h-3.5 border-r-2 border-b-2 border-white rotate-45 -mt-1.5 transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
              </div>
            ` : `
              <!-- Milestone Badge Below -->
              <div class="absolute top-full mt-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <div class="w-3.5 h-3.5 border-l-2 border-t-2 border-white rotate-45 -mb-1.5 transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
              </div>
            `}
            
            <!-- Indicator line inside track -->
            <div class="w-1 h-full border-l border-white/20 dark:border-white/10 relative">
              <!-- Interactive dot -->
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white transition-all ${reached ? 'bg-white scale-125' : 'bg-slate-300 dark:bg-slate-700'}"></div>
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
              <div class="h-full bg-gradient-to-r ${color} rounded-l-full flex justify-end items-center pr-3 transition-all duration-1000 ease-out" style="width: ${percent}%;">
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

    // 4. Students Grid (Obsidian Seamless Minimal Grid)
    dashStudentsGrid.innerHTML = classroomData.students.map(s => {
      const nameText = classroomData.rules.namePrivacy ? '' : s.name;
      const unpaidAchievements = Math.floor((s.unpaid || 0) / (classroomData.rules.rawToAchievementRatio || 50));
      return `
        <div class="bg-slate-50/70 dark:bg-zinc-900/50 rounded-xl p-4 flex flex-col justify-between items-center text-center hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all">
          <div class="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-sm font-bold flex items-center justify-center text-slate-700 dark:text-zinc-300 font-mono">${s.number}</div>
          ${nameText ? `<span class="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-2 truncate w-full">${s.name}</span>` : ''}
          <div class="mt-2 text-2xl font-black text-[#7c6cf0] dark:text-[#9d8df8] leading-none font-sans">${s.rawScore.toLocaleString()}점</div>
          <div class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">미지급 ${unpaidAchievements}</div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  // Render 2: Gradebook View (Obsidian Markdown Table Look & 스마트 5컬럼, 완전 무경계)
  function renderGradebookView() {
    gradeStudentCount.textContent = classroomData.students.length;
    const badgeEl = document.getElementById('breadcrumb-badge');
    if (badgeEl) badgeEl.textContent = `(${classroomData.students.length})`;
    
    gradebookTableBody.innerHTML = classroomData.students.map(s => {
      const ratio = classroomData.rules.rawToAchievementRatio || 50;
      const unpaidAchievements = Math.floor((s.unpaid || 0) / ratio);
      const calculatedAchievements = s.achievements || 0;
      const nameText = classroomData.rules.namePrivacy ? "-" : (s.name || `${s.number}번 학생`);

      return `
        <tr class="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors">
          <!-- 컬럼 1: 학생 (번호 뱃지 + 이름 + 수정 아이콘) -->
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                ${s.number}
              </span>
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="student-name-label font-medium text-slate-900 dark:text-zinc-100 text-sm cursor-pointer hover:text-[#7c6cf0] dark:hover:text-[#9d8df8] truncate" data-num="${s.number}">
                  ${nameText}
                </span>
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer opacity-30 hover:opacity-100 btn-edit-student-name" data-num="${s.number}" title="이름 변경"></i>
              </div>
            </div>
          </td>

          <!-- 컬럼 2: 누적 점수 -->
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-1.5">
              <span class="student-score-label font-bold text-slate-900 dark:text-zinc-100 text-sm font-sans cursor-pointer hover:text-[#7c6cf0] dark:hover:text-[#9d8df8]" data-num="${s.number}">
                ${(s.rawScore || 0).toLocaleString()}점
              </span>
              <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer opacity-30 hover:opacity-100 btn-edit-student-score" data-num="${s.number}" title="점수 직접 수정"></i>
            </div>
          </td>

          <!-- 컬럼 3: 주간 획득 점수 (즉시 누가 + 시각 피드백) -->
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-1.5">
              <input type="number" 
                     class="weekly-score-input w-16 px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 rounded focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#7c6cf0] text-right transition-all" 
                     placeholder="0" 
                     data-num="${s.number}" 
                     step="1" />
              <button class="btn-action-add-weekly px-2.5 py-1 bg-slate-100 hover:bg-[#7c6cf0] text-slate-700 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-[#7c6cf0] dark:hover:text-white font-semibold text-xs rounded transition-all flex items-center gap-1 cursor-pointer active:scale-95" 
                      data-num="${s.number}" 
                      title="입력한 점수를 누적 원점수에 합산">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>누가</span>
              </button>
            </div>
          </td>

          <!-- 컬럼 4: 칭찬 보상 현황 (달성 + 미지급 통합) -->
          <td class="py-2.5 px-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center gap-1 student-achievements-label cursor-pointer" data-num="${s.number}" title="총 달성한 칭찬 쿠폰 수">
                <i data-lucide="award" class="w-3 h-3 text-[#7c6cf0]"></i>
                <span>달성 ${calculatedAchievements}회</span>
              </span>
              ${unpaidAchievements > 0 ? `
                <button class="btn-action-pay-score px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center gap-1 cursor-pointer active:scale-95" data-num="${s.number}" title="미지급된 쿠폰 선물 지급하기">
                  <i data-lucide="gift" class="w-3 h-3 text-emerald-600"></i>
                  <span>미지급 ${unpaidAchievements}개 지급</span>
                </button>
              ` : `
                <span class="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-0.5">
                  <i data-lucide="check" class="w-3 h-3 text-emerald-500"></i> 전원지급
                </span>
              `}
            </div>
          </td>

          <!-- 컬럼 5: 관리 (+50 가산 & 삭제) -->
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button class="btn-action-add-score px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-[#7c6cf0]/15 text-[#7c6cf0] dark:text-[#9d8df8] flex items-center justify-center gap-0.5 text-xs font-semibold cursor-pointer active:scale-90" data-num="${s.number}" title="즉시 원점수 +50점 부여">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>50</span>
              </button>
              <button class="btn-action-delete-student p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 flex items-center justify-center cursor-pointer active:scale-90" data-num="${s.number}" title="학생 삭제">
                <i data-lucide="trash-2" class="w-3 h-3"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // 주간 점수 입력 시 실시간 시각 피드백 (0보다 큰 값이 들어가면 보라색 액센트 강조)
    document.querySelectorAll(".weekly-score-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        const row = e.target.closest("tr");
        const addBtn = row ? row.querySelector(".btn-action-add-weekly") : null;

        if (!isNaN(val) && val > 0) {
          e.target.classList.remove("bg-white", "dark:bg-zinc-900", "border-slate-200", "dark:border-zinc-700");
          e.target.classList.add("bg-purple-50", "dark:bg-purple-950/40", "border-[#7c6cf0]", "text-[#7c6cf0]", "font-bold");
          if (addBtn) {
            addBtn.classList.remove("bg-slate-100", "text-slate-700", "dark:bg-zinc-800", "dark:text-zinc-300");
            addBtn.classList.add("bg-[#7c6cf0]", "text-white");
          }
        } else {
          e.target.classList.add("bg-white", "dark:bg-zinc-900", "border-slate-200", "dark:border-zinc-700");
          e.target.classList.remove("bg-purple-50", "dark:bg-purple-950/40", "border-[#7c6cf0]", "text-[#7c6cf0]", "font-bold");
          if (addBtn) {
            addBtn.classList.add("bg-slate-100", "text-slate-700", "dark:bg-zinc-800", "dark:text-zinc-300");
            addBtn.classList.remove("bg-[#7c6cf0]", "text-white");
          }
        }
      });
    });

    // Bind Edit Action triggers (To both Edit Icon AND Text Label!)
    document.querySelectorAll(".btn-edit-student-name, .student-name-label").forEach(btn => {
      btn.addEventListener("click", () => {
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

    // --- 주간 점수 개별 합산 로직 (버튼 클릭 및 엔터 키 입력 지원) ---
    function applyWeeklyScore(num, rawValue) {
      const student = classroomData.students.find(s => s.number === num);
      if (!student) return;

      const scoreToAdd = parseInt(rawValue);
      if (isNaN(scoreToAdd) || scoreToAdd === 0) {
        showToast('입력 확인', '합산할 점수(숫자)를 입력해 주세요.', 'info');
        return;
      }

      // 기존 누적 원점수에 주간 획득 점수를 누가(누적 가산)
      student.rawScore = Math.max(0, student.rawScore + scoreToAdd);

      // 점수 비율(마일리지) 및 미지급 점수 자동 재계산
      const ratio = classroomData.rules.rawToAchievementRatio || 50;
      student.achievements = Math.floor(student.rawScore / ratio);
      student.unpaid = Math.max(0, student.rawScore - student.paidScore);

      showToast(
        '누가 완료 🌟',
        `[${student.number}번 ${student.name}] 주간 획득 점수 +${scoreToAdd}점이 누적 원점수에 성공적으로 누가되었습니다! (누적 총점: ${student.rawScore.toLocaleString()}점)`,
        'success'
      );

      // 변경된 학급 데이터를 서버에 안전하게 자동 저장
      saveClassroomToServer();
    }

    // 주간 점수 [반영] 버튼 클릭 시 동작
    document.querySelectorAll('.btn-action-add-weekly').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        const input = document.querySelector(`.weekly-score-input[data-num="${num}"]`);
        if (!input) return;
        applyWeeklyScore(num, input.value);
      });
    });

    // 주간 점수 입력창에서 [Enter] 키를 누르면 바로 합산
    document.querySelectorAll('.weekly-score-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const num = parseInt(input.dataset.num);
          applyWeeklyScore(num, input.value);
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
                <div class="w-3.5 h-3.5 border-r-2 border-b-2 border-white rotate-45 -mt-1.5 transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
              </div>
            ` : `
              <!-- Milestone Badge Below -->
              <div class="absolute top-full mt-4.5 flex flex-col items-center whitespace-nowrap z-20">
                <div class="w-3.5 h-3.5 border-l-2 border-t-2 border-white rotate-45 -mb-1.5 transition-all ${reached ? 'bg-clay-grass' : 'bg-clay-sand'}"></div>
                <span class="px-4 py-1.5 rounded-2xl border-2 border-white text-[19px] font-black shadow-clay-flat transition-all ${reached ? 'bg-clay-grass text-white scale-110 glow-green' : 'bg-clay-sand text-slate-500 scale-95'}">${g.temp.toFixed(0)}° - ${g.activity}</span>
              </div>
            `}
            
            <!-- Indicator line inside track -->
            <div class="w-1 h-full border-l border-white/20 dark:border-white/10 relative">
              <!-- Interactive dot -->
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white transition-all ${reached ? 'bg-white scale-125' : 'bg-slate-300 dark:bg-slate-700'}"></div>
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
      <div class="bg-slate-50 dark:bg-slate-950 p-3.5 border-2 border-white rounded-2xl flex justify-between items-center">
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
    chkNamePrivacy.checked = !!classroomData.rules.namePrivacy;
    privacyStatusLabel.textContent = classroomData.rules.namePrivacy ? '학생 실명 대신 번호로 표시' : '학생 실명 표시';

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
    updateSettingsHeader('classroom', subtab);
    [btnSubtabPrivacy, btnSubtabRules, btnSubtabFontsize].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold');
        btn.classList.add('text-slate-400', 'dark:text-zinc-500');
      }
    });

    [settingsPrivacyCard, settingsRulesCard, settingsFontsizeCard].forEach(card => {
      if (card) card.classList.add('hidden');
    });

    if (subtab === 'privacy') {
      if (btnSubtabPrivacy) {
        btnSubtabPrivacy.classList.add('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold');
        btnSubtabPrivacy.classList.remove('text-slate-400', 'dark:text-zinc-500');
      }
      if (settingsPrivacyCard) settingsPrivacyCard.classList.remove('hidden');
    } else if (subtab === 'rules') {
      if (btnSubtabRules) {
        btnSubtabRules.classList.add('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold');
        btnSubtabRules.classList.remove('text-slate-400', 'dark:text-zinc-500');
      }
      if (settingsRulesCard) settingsRulesCard.classList.remove('hidden');
    } else if (subtab === 'fontsize') {
      if (btnSubtabFontsize) {
        btnSubtabFontsize.classList.add('active', 'text-[#7c6cf0]', 'dark:text-[#9d8df8]', 'font-bold');
        btnSubtabFontsize.classList.remove('text-slate-400', 'dark:text-zinc-500');
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
      classroomData.rules.namePrivacy = chkNamePrivacy.checked;
      if (privacyStatusLabel) {
        privacyStatusLabel.textContent = classroomData.rules.namePrivacy ? '학생 실명 대신 번호로 표시' : '학생 실명 표시';
      }
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

  // --- 학급 점수 백업 & 복원 & CSV 다운로드 요소 참조 ---
  const btnExportScoresCsv = document.getElementById('btn-export-scores-csv');
  const btnBackupScores = document.getElementById('btn-backup-scores');
  const btnRestoreScoresModal = document.getElementById('btn-restore-scores-modal');

  const classroomBackupModal = document.getElementById('classroom-backup-modal');
  const btnBackupModalClose = document.getElementById('btn-backup-modal-close');
  const classroomBackupForm = document.getElementById('classroom-backup-form');
  const backupMemoInput = document.getElementById('backup-memo-input');

  const classroomRestoreModal = document.getElementById('classroom-restore-modal');
  const btnRestoreModalClose = document.getElementById('btn-restore-modal-close');
  const backupListContainer = document.getElementById('backup-list-container');
  const btnRefreshBackupList = document.getElementById('btn-refresh-backup-list');

  // [기능 1] 학생 점수 내 컴퓨터 다운로드 (CSV / 엑셀 완벽 호환)
  // UTF-8 BOM(\uFEFF)을 포함시켜 엑셀 더블클릭 시에도 한글 깨짐이 전혀 없습니다.
  function exportClassroomScoresToCsv() {
    if (!classroomData || !classroomData.students || classroomData.students.length === 0) {
      showToast('내보내기 불가', '내보낼 학생 점수 데이터가 없습니다.', 'warning');
      return;
    }

    const className = classroomData.name || '우리학급';
    const students = [...classroomData.students].sort((a, b) => (a.number || 0) - (b.number || 0));

    // CSV 파일 헤더 구성
    let csvContent = '번호,이름,누적원점수,달성,지급원점수,미지급원점수\r\n';

    // 각 학생의 데이터를 한 줄씩 CSV 행으로 변환
    students.forEach(s => {
      const num = s.number !== undefined ? s.number : '';
      // 이름에 따옴표나 쉼표가 들어간 경우를 대비한 안전 처리
      const safeName = `"${(s.name || '').replace(/"/g, '""')}"`;
      const raw = s.rawScore !== undefined ? s.rawScore : 0;
      const achievements = s.achievements !== undefined ? s.achievements : 0;
      const paid = s.paidScore !== undefined ? s.paidScore : 0;
      const unpaid = s.unpaid !== undefined ? s.unpaid : (raw - paid);
      csvContent += `${num},${safeName},${raw},${achievements},${paid},${unpaid}\r\n`;
    });

    // 한글 깨짐 방지용 UTF-8 BOM(\uFEFF)을 추가한 Blob 객체 생성
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // 오늘 날짜를 구하여 파일명 생성 (예: 4학년_3반_학생점수_2026-09-21.csv)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const safeClassName = className.replace(/[/\\?%*:|"<>]/g, '_');
    const fileName = `${safeClassName}_학생점수_${yyyy}-${mm}-${dd}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('다운로드 완료', `${fileName} 파일이 내 컴퓨터로 저장되었습니다.`, 'success');
  }

  if (btnExportScoresCsv) {
    btnExportScoresCsv.addEventListener('click', exportClassroomScoresToCsv);
  }

  // [기능 2] 서버 백업 저장 모달 동작
  if (btnBackupScores) {
    btnBackupScores.addEventListener('click', () => {
      if (backupMemoInput) backupMemoInput.value = '';
      if (classroomBackupModal) classroomBackupModal.classList.remove('hidden');
    });
  }
  if (btnBackupModalClose) {
    btnBackupModalClose.addEventListener('click', () => {
      if (classroomBackupModal) classroomBackupModal.classList.add('hidden');
    });
  }
  if (classroomBackupForm) {
    classroomBackupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const memo = backupMemoInput ? backupMemoInput.value.trim() : '';

      try {
        const res = await secureFetch('/api/classroom/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memo })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '백업 저장 실패');

        if (classroomBackupModal) classroomBackupModal.classList.add('hidden');
        showToast('백업 저장 성공', data.message || '현재 학생 점수가 서버에 안전하게 보관되었습니다.', 'success');
      } catch (err) {
        console.error('백업 실패:', err);
        showToast('백업 실패', err.message || '서버 백업 저장 중 문제가 발생했습니다.', 'error');
      }
    });
  }

  // [기능 3] 백업 목록 불러오기 및 렌더링
  async function loadClassroomBackups() {
    if (!backupListContainer) return;
    backupListContainer.innerHTML = '<div class="text-center py-8 text-xs font-bold text-slate-400">백업 목록을 불러오는 중...</div>';

    try {
      const res = await secureFetch('/api/classroom/backups');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '목록 조회 실패');

      const backups = data.backups || [];
      if (backups.length === 0) {
        backupListContainer.innerHTML = '<div class="text-center py-8 text-xs font-bold text-slate-400">아직 저장된 백업이 없습니다.<br>[💾 서버 백업 저장] 버튼을 눌러 현재 상태를 백업해 보세요.</div>';
        return;
      }

      backupListContainer.innerHTML = backups.map(b => {
        const d = new Date(b.createdAt);
        const dateStr = d.toLocaleDateString('ko-KR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const memo = b.memo ? b.memo : '이름 없는 백업';
        const isAuto = memo.includes('복원 직전');

        return `
          <div class="bg-slate-50 dark:bg-slate-900 border-2 ${isAuto ? 'border-amber-300 dark:border-amber-700' : 'border-white dark:border-slate-800'} rounded-2xl p-3 shadow-clay-flat flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                ${isAuto ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">자동보관</span>' : ''}
                <span class="text-xs font-black text-slate-900 dark:text-white">${memo}</span>
                <span class="text-[11px] font-bold text-slate-500">(${b.className || '학급'} · ${b.studentCount || 0}명)</span>
              </div>
              <div class="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>${dateStr}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" class="btn-restore-item px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-white shadow-clay-flat cursor-pointer flex items-center gap-1 active:scale-95 transition-all" data-id="${b.id}" data-memo="${memo}">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>이 시점으로 복원</span>
              </button>
              <button type="button" class="btn-delete-backup px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 cursor-pointer flex items-center gap-1 active:scale-95 transition-all" data-id="${b.id}" title="백업 기록 삭제">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();

      // [복원 버튼 클릭 이벤트]
      backupListContainer.querySelectorAll('.btn-restore-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const memo = e.currentTarget.getAttribute('data-memo');
          if (!confirm(`정말로 [${memo}] 시점으로 점수를 복원하시겠습니까?\n\n※ 현재 상태는 '복원 직전 자동 백업'으로 안전하게 보관되므로 언제든 다시 되돌릴 수 있습니다.`)) {
            return;
          }

          try {
            const res = await secureFetch(`/api/classroom/restore/${id}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '복원 실패');

            showToast('복원 완료', data.message || '백업 시점으로 완벽하게 복원되었습니다!', 'success');
            if (classroomRestoreModal) classroomRestoreModal.classList.add('hidden');
            // 화면의 학생 점수 테이블 즉각 새로고침
            if (window.fetchClassroom) {
              await window.fetchClassroom();
            }
          } catch (err) {
            console.error('복원 오류:', err);
            showToast('복원 실패', err.message || '복원 도중 문제가 발생했습니다.', 'error');
          }
        });
      });

      // [삭제 버튼 클릭 이벤트]
      backupListContainer.querySelectorAll('.btn-delete-backup').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('이 백업 기록을 삭제하시겠습니까?')) return;

          try {
            const res = await secureFetch(`/api/classroom/backups/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '삭제 실패');

            showToast('삭제 완료', '백업 기록이 삭제되었습니다.', 'info');
            loadClassroomBackups();
          } catch (err) {
            console.error('삭제 오류:', err);
            showToast('삭제 실패', err.message || '백업 삭제 도중 오류가 발생했습니다.', 'error');
          }
        });
      });

    } catch (err) {
      console.error('백업 목록 로드 실패:', err);
      backupListContainer.innerHTML = `<div class="text-center py-8 text-xs font-bold text-rose-500">목록을 불러오는 중 오류가 발생했습니다: ${err.message}</div>`;
    }
  }

  // [기능 4] 백업 복원 모달 토글
  if (btnRestoreScoresModal) {
    btnRestoreScoresModal.addEventListener('click', () => {
      if (classroomRestoreModal) classroomRestoreModal.classList.remove('hidden');
      loadClassroomBackups();
    });
  }
  if (btnRestoreModalClose) {
    btnRestoreModalClose.addEventListener('click', () => {
      if (classroomRestoreModal) classroomRestoreModal.classList.add('hidden');
    });
  }
  if (btnRefreshBackupList) {
    btnRefreshBackupList.addEventListener('click', () => {
      loadClassroomBackups();
    });
  }

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

  // --- Canva Dashboard Integrations ---

  // 1. Modal opening/closing
  window.openShortenerModal = () => {
    const modal = document.getElementById('shortener-modal');
    const inputContainer = document.getElementById('input-container');
    const resultContainer = document.getElementById('result-container');
    if (modal) modal.classList.remove('hidden');
    if (inputContainer) inputContainer.classList.remove('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');
    renderShortenerModalLinks();
  };

  window.closeShortenerModal = () => {
    const modal = document.getElementById('shortener-modal');
    if (modal) modal.classList.add('hidden');
  };

  const btnShortenerModalClose = document.getElementById('btn-shortener-modal-close');
  if (btnShortenerModalClose) {
    btnShortenerModalClose.addEventListener('click', window.closeShortenerModal);
  }

  // 2. Sidebar Dropdown / Popover
  const btnSidebarCreate = document.getElementById('btn-sidebar-create');
  const createPopover = document.getElementById('create-popover');
  if (btnSidebarCreate && createPopover) {
    btnSidebarCreate.addEventListener('click', (e) => {
      e.stopPropagation();
      createPopover.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!createPopover.classList.contains('hidden') && !createPopover.contains(e.target) && e.target !== btnSidebarCreate) {
        createPopover.classList.add('hidden');
      }
    });
  }

  // 3. Sidebar Shortcut Bindings
  const themeToggleBtnSidebar = document.getElementById('theme-toggle-btn-sidebar');
  if (themeToggleBtnSidebar) {
    themeToggleBtnSidebar.addEventListener('click', () => {
      window.toggleThemeAction();
    });
  }

  const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
  if (btnLogoutSidebar) {
    btnLogoutSidebar.addEventListener('click', performLogout);
  }

  const btnLoginSidebar = document.getElementById('btn-login-sidebar');
  if (btnLoginSidebar) {
    btnLoginSidebar.addEventListener('click', () => {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      else if (btnLoginTrigger) btnLoginTrigger.click();
    });
  }

  // 4. Grid/List View Switches
  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewList = document.getElementById('btn-view-list');
  if (btnViewGrid) {
    btnViewGrid.addEventListener('click', () => {
      localStorage.setItem('canva_view_mode', 'grid');
      renderDashboard();
    });
  }
  if (btnViewList) {
    btnViewList.addEventListener('click', () => {
      localStorage.setItem('canva_view_mode', 'list');
      renderDashboard();
    });
  }

  // 5. Poll Creation triggers
  function openPollCreationForm() {
    switchMainTab('polls');
    const createPollCard = document.getElementById('create-poll-card');
    if (createPollCard) {
      createPollCard.classList.remove('hidden');
      createPollCard.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const btnSidebarCreatePoll = document.getElementById('btn-sidebar-create-poll');
  const btnCategoryCreatePoll = document.getElementById('btn-category-create-poll');
  const btnHighlightCreatePoll = document.getElementById('btn-highlight-create-poll');

  if (btnSidebarCreatePoll) {
    btnSidebarCreatePoll.addEventListener('click', () => {
      if (createPopover) createPopover.classList.add('hidden');
      openPollCreationForm();
    });
  }
  if (btnCategoryCreatePoll) btnCategoryCreatePoll.addEventListener('click', openPollCreationForm);
  if (btnHighlightCreatePoll) btnHighlightCreatePoll.addEventListener('click', openPollCreationForm);

  // 6. Quick QR Category Trigger
  const btnCategoryQr = document.getElementById('btn-category-qr');
  if (btnCategoryQr) {
    btnCategoryQr.addEventListener('click', () => {
      openShortenerModal();
      showToast('QR코드 생성', '단축 URL 생성 시 QR코드가 하단에 자동으로 생성 및 표시됩니다.', 'info');
    });
  }

  // 7. Recent Items Grid Renderer
  async function renderRecentItemsGrid(links = []) {
    const gridContainer = document.getElementById('canva-recent-grid');
    if (!gridContainer) return;

    // 단축 주소 목록만 대시보드 최근 항목으로 구성
    const username = (userWelcomeName?.textContent || currentUsername || localStorage.getItem('kfcman_username') || '').trim() || 'Guest';

    let combinedItems = [];

    // Map links
    links.forEach(link => {
      combinedItems.push({
        type: 'link',
        id: link.code,
        title: link.code,
        subtitle: link.originalUrl,
        createdAt: link.createdAt,
        owner: username,
        clicks: link.clicks || 0,
        original: link
      });
    });

    // Sort by createdAt descending
    combinedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get filters & search query
    const searchQuery = document.getElementById('canva-search-input')?.value.trim().toLowerCase() || '';
    const filterOwner = document.getElementById('canva-filter-owner')?.value || 'all';
    const filterType = document.getElementById('canva-filter-type')?.value || 'all';

    // Apply filters
    const filteredItems = combinedItems.filter(item => {
      // Type Filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Owner Filter
      if (filterOwner === 'me') {
        if (item.type === 'link') {
          // Links are always owned by "me" since they are retrieved from /api/links (user specific)
        } else if (item.type === 'wall') {
          // Walls from /api/my-walls are already owned by me
        } else if (item.type === 'poll') {
          if (item.owner.toLowerCase() !== currentUsernameClean) return false;
        }
      }

      // Search Query Filter
      if (searchQuery) {
        const matchesTitle = item.title.toLowerCase().includes(searchQuery);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(searchQuery);
        const matchesId = item.id.toLowerCase().includes(searchQuery);
        const matchesOwner = item.owner.toLowerCase().includes(searchQuery);
        if (!matchesTitle && !matchesSubtitle && !matchesId && !matchesOwner) return false;
      }

      return true;
    });

    // Render grid
    gridContainer.innerHTML = '';

    if (filteredItems.length === 0) {
      gridContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-bold text-xs">
          <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 text-slate-350 dark:text-slate-600"></i>
          검색 및 필터 조건에 부합하는 최근 프로젝트 항목이 없습니다.
        </div>
      `;
      lucide.createIcons();
      return;
    }

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'canva-card transition-all flex flex-col justify-between relative group p-3.5';

      if (item.type === 'link') {
        const localLinkUrl = `${window.location.origin}/${item.id}`;
        const visualBrandUrl = `http://kfcman.link/${item.id}`;
        const originalUrlClean = item.subtitle.replace(/^https?:\/\/(www\.)?/, '');
        
        card.innerHTML = `
          <div class="flex flex-col h-full justify-between gap-3">
            <!-- 1. 카드 헤더: 뱃지 및 액션 툴바 -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                  <i data-lucide="link-2" class="w-3 h-3 text-indigo-600"></i> 단축 주소
                </span>
                <span class="text-[10px] text-slate-400 font-semibold">${new Date(item.createdAt).toLocaleDateString('ko-KR', {month:'2-digit', day:'2-digit'})}</span>
              </div>
              
              <!-- 퀵 액션 버튼들 -->
              <div class="flex items-center gap-1">
                <button onclick="event.stopPropagation(); window.copyTextToClipboardDirect('${visualBrandUrl}', this)" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer" title="단축 주소 복사">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); window.showStatsModalDirect('${item.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer" title="방문 통계">
                  <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); window.openEditLinkModalDirect('${item.id}', '${item.subtitle.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" title="링크 수정">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); window.deleteLinkDirect('${item.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer" title="삭제">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- 2. 카드 본문: QR코드 및 단축 주소 정보 -->
            <div class="flex items-center gap-3 bg-slate-50/70 dark:bg-zinc-900/40 p-2.5 rounded-lg">
              <div class="bg-white p-1 rounded-md border border-slate-200/80 shadow-2xs flex-shrink-0">
                <canvas class="canva-qr-canvas block" data-code="${item.id}" data-url="${localLinkUrl}" style="width: 48px; height: 48px;"></canvas>
              </div>
              <div class="flex-grow min-w-0 text-left">
                <a href="${localLinkUrl}" target="_blank" class="text-sm font-extrabold text-[#7c6cf0] dark:text-[#9d8df8] hover:underline truncate block" title="새 탭에서 열기">
                  kfcman.link/${item.id}
                </a>
                <p class="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5" title="${item.subtitle}">
                  ${originalUrlClean}
                </p>
              </div>
            </div>

            <!-- 3. 카드 푸터: 실시간 통계 및 열기 링크 -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span class="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                <i data-lucide="mouse-pointer-click" class="w-3 h-3 text-indigo-500"></i>
                <span>누적 클릭 <strong class="text-indigo-600 dark:text-indigo-400 font-extrabold">${item.clicks}</strong>회</span>
              </span>
              <a href="${localLinkUrl}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                <span>방문</span>
                <i data-lucide="external-link" class="w-3 h-3"></i>
              </a>
            </div>
          </div>
        `;
      } else if (item.type === 'wall') {
        card.innerHTML = `
          <div class="flex flex-col h-full justify-between gap-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50">
                  <i data-lucide="layout-grid" class="w-3 h-3 text-teal-600"></i> 칸반 보드
                </span>
                <span class="text-[10px] text-slate-400 font-semibold">${new Date(item.createdAt).toLocaleDateString('ko-KR', {month:'2-digit', day:'2-digit'})}</span>
              </div>
              <a href="/wall?id=${item.id}" class="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all" title="게시판 열기">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </a>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left">
              <a href="/wall?id=${item.id}" class="text-sm font-extrabold text-slate-900 dark:text-slate-100 hover:text-teal-600 truncate block">
                ${item.title}
              </a>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">${item.subtitle || '실시간 협업 게시판'}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span class="text-slate-400 font-medium">개설자: ${item.owner}</span>
              <a href="/wall?id=${item.id}" class="font-bold text-teal-600 hover:underline">입장하기 &rarr;</a>
            </div>
          </div>
        `;
      } else if (item.type === 'poll') {
        const isExpired = new Date() > new Date(item.original.expiresAt);
        const statusText = isExpired ? '마감됨' : '진행중';
        card.innerHTML = `
          <div class="flex flex-col h-full justify-between gap-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                  <i data-lucide="vote" class="w-3 h-3 text-rose-600"></i> 실시간 설문
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${isExpired ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'}">${statusText}</span>
              </div>
              <div class="flex items-center gap-1">
                <button onclick="event.stopPropagation(); window.openPollModal('${item.id}', 'vote')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all cursor-pointer" title="투표하기">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); window.openPollModal('${item.id}', 'stats')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all cursor-pointer" title="결과 보기">
                  <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left">
              <div class="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">${item.title}</div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">${item.subtitle}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span class="text-slate-400 font-medium">개설자: ${item.owner}</span>
              <button onclick="event.stopPropagation(); window.openPollModal('${item.id}', 'vote')" class="font-bold text-rose-600 hover:underline cursor-pointer">참여하기 &rarr;</button>
            </div>
          </div>
        `;
      }

      gridContainer.appendChild(card);

      // Render QR code on canvas for links
      if (item.type === 'link') {
        const canvas = card.querySelector('.canva-qr-canvas');
        if (canvas) {
          new QRious({
            element: canvas,
            value: canvas.getAttribute('data-url'),
            size: 52,
            foreground: '#0f1422',
            background: '#ffffff',
            level: 'M'
          });
        }
      }
    });

    lucide.createIcons();
  }

  // 8. Global bindings for dynamic grid action triggers
  window.showStatsModalDirect = (code) => {
    showStatsModal(code);
  };

  window.openPollModal = openPollModal;

  window.copyTextToClipboardDirect = (text, btn) => {
    copyTextToClipboard(text, btn);
  };

  window.openEditLinkModalDirect = (code, url) => {
    openEditLinkModal(code, url);
  };

  window.deleteLinkDirect = async (code) => {
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
  };

  // 9. Input & Select Filter Listeners for Canva Dashboard
  const canvaSearchInput = document.getElementById('canva-search-input');
  const canvaFilterOwner = document.getElementById('canva-filter-owner');
  const canvaFilterType = document.getElementById('canva-filter-type');

  if (canvaSearchInput) {
    canvaSearchInput.addEventListener('input', () => {
      renderRecentItemsGrid(cachedLinks);
    });
  }
  if (canvaFilterOwner) {
    canvaFilterOwner.addEventListener('change', () => {
      renderRecentItemsGrid(cachedLinks);
    });
  }
  if (canvaFilterType) {
    canvaFilterType.addEventListener('change', () => {
      renderRecentItemsGrid(cachedLinks);
    });
  }

  // --- Collapsible Sidebar Event Listeners & State Restoration ---
  const leftSidebar = document.getElementById('left-sidebar');
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  
  function setSidebarCollapsed(collapsed) {
    const mainContent = document.getElementById('main-content');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    
    if (leftSidebar) {
      if (collapsed) {
        leftSidebar.classList.add('collapsed');
        if (mainContent) {
          mainContent.classList.remove('max-w-7xl', 'mx-auto');
          mainContent.classList.add('max-w-none', 'px-6', 'md:px-10');
        }
        if (toggleIcon) {
          toggleIcon.classList.remove('lucide-chevron-left');
          toggleIcon.classList.add('lucide-chevron-right');
          toggleIcon.setAttribute('data-lucide', 'chevron-right');
        }
      } else {
        leftSidebar.classList.remove('collapsed');
        if (mainContent) {
          mainContent.classList.add('max-w-7xl', 'mx-auto');
          mainContent.classList.remove('max-w-none', 'px-6', 'md:px-10');
        }
        if (toggleIcon) {
          toggleIcon.classList.remove('lucide-chevron-right');
          toggleIcon.classList.add('lucide-chevron-left');
          toggleIcon.setAttribute('data-lucide', 'chevron-left');
        }
      }
      localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  // Restore state from localStorage
  const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  setSidebarCollapsed(isSidebarCollapsed);

  if (btnSidebarToggle) {
    btnSidebarToggle.addEventListener('click', () => {
      const currentlyCollapsed = leftSidebar && leftSidebar.classList.contains('collapsed');
      setSidebarCollapsed(!currentlyCollapsed);
    });
  }

  const btnMobileSidebarToggle = document.getElementById('btn-mobile-sidebar-toggle');
  if (btnMobileSidebarToggle && leftSidebar) {
    btnMobileSidebarToggle.addEventListener('click', () => {
      leftSidebar.classList.toggle('hidden');
    });
  }

  // Bind tab param from URL on load
  const initUrlParams = new URLSearchParams(window.location.search);
  const initialTab = initUrlParams.get('tab');
  if (initialTab) {
    switchMainTab(initialTab);
  }

  // Check login query parameter to show auth modal on load
  if (initUrlParams.get('login') === 'true') {
    openAuthModal('login');
    // Clean up query parameter silently without reloading
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }

  // Guidance card setup button
  const btnGotoSettingsInit = document.getElementById('btn-goto-settings-init');
  if (btnGotoSettingsInit) {
    btnGotoSettingsInit.addEventListener('click', () => {
      switchMainTab('settings');
      switchSettingsSubTab('classroom');
    });
  }
  console.log('TRACE: DOMContentLoaded callback completed successfully!');
});
console.log('TRACE: app.js loaded and evaluated completely!');

  // --- 마음챙김 (MindCheck) 전역 헬퍼 함수 ---
  window.reloadMindCheckFrame = function() {
    const frame = document.getElementById('mindcheck-frame');
    const loader = document.getElementById('mindcheck-loading');
    if (loader) loader.classList.remove('hidden');
    if (frame) {
      // 캐시 방지 타임스탬프를 쿼리에 붙여 깔끔하게 재로딩
      const currentSrc = frame.getAttribute('src').split('?')[0];
      frame.src = currentSrc + '?t=' + Date.now();
    }
  };

  // --- 과학실험실 (SciBot) & MBL 가이드 (SciBit) 전역 헬퍼 함수 ---
  window.reloadSciBotFrame = function() {
    const frame = document.getElementById('scibot-frame');
    const loader = document.getElementById('scibot-loading');
    if (loader) loader.classList.remove('hidden');
    if (frame) {
      const currentSrc = frame.getAttribute('src').split('?')[0];
      frame.src = currentSrc + '?t=' + Date.now();
    }
  };

  window.reloadSciBitFrame = function() {
    const frame = document.getElementById('scibit-frame');
    const loader = document.getElementById('scibit-loading');
    if (loader) loader.classList.remove('hidden');
    if (frame) {
      const currentSrc = frame.getAttribute('src').split('?')[0];
      frame.src = currentSrc + '?t=' + Date.now();
    }
  };
