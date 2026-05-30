const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\js\\app.js";
let content = fs.readFileSync(filepath, 'utf8');

// 1. Replace showShortenerTab and showPollsTab definitions and listeners
const oldNavBlock = `  // SPA Navigation Toggling
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
      dashboardSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (navItemPolls) {
    navItemPolls.addEventListener('click', (e) => {
      e.preventDefault();
      showPollsTab();
    });
  }

  function showShortenerTab() {
    if (navItemShortener) navItemShortener.classList.add('active');
    if (navItemPolls) navItemPolls.classList.remove('active');
    
    if (shortenerSection) shortenerSection.classList.remove('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    if (pollsSection) pollsSection.classList.add('hidden');
    
    // Stop live polling if active
    stopLivePollInterval();
  }

  function showPollsTab() {
    if (navItemShortener) navItemShortener.classList.remove('active');
    if (navItemPolls) navItemPolls.classList.add('active');
    
    if (shortenerSection) shortenerSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
    if (pollsSection) pollsSection.classList.remove('hidden');
    
    // Fetch and render polls
    fetchAndRenderPolls();
  }`;

const newNavBlock = `  // --- 3-Tab Structure Unified Switcher ---
  window.switchMainTab = function(tabId) {
    const shortenerSec = document.getElementById('shortener-section');
    const dashSec = document.getElementById('dashboard-section');
    const pollSec = document.getElementById('polls-section');
    const eusseukSec = document.getElementById('eusseuk-section');
    
    const navShortener = document.getElementById('nav-item-shortener');
    const navPolls = document.getElementById('nav-item-polls');
    const navClassroom = document.getElementById('nav-item-classroom');
    
    const mNavShortener = document.getElementById('mobile-nav-shortener-member');
    const mNavPolls = document.getElementById('mobile-nav-polls-member');
    const mNavClassroom = document.getElementById('mobile-nav-classroom');

    // Hide all
    if (shortenerSec) shortenerSec.classList.add('hidden');
    if (dashSec) dashSec.classList.add('hidden');
    if (pollSec) pollSec.classList.add('hidden');
    if (eusseukSec) eusseukSec.classList.add('hidden');

    // Remove active styles from desktop header
    [navShortener, navPolls, navClassroom].forEach(el => {
      if (el) el.classList.remove('active');
    });
    // Remove active styles from mobile navigation bar
    [mNavShortener, mNavPolls, mNavClassroom].forEach(el => {
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
    }

    lucide.createIcons();
  };

  window.switchClassroomSubTab = function(subTabId) {
    const classroomSec = document.getElementById('classroom-section');
    const gradebookSec = document.getElementById('gradebook-section');
    const thermometerSec = document.getElementById('thermometer-section');
    const settingsSec = document.getElementById('classroom-settings-section');

    const btnDash = document.getElementById('btn-classroom-subtab-dash');
    const btnGradebook = document.getElementById('btn-classroom-subtab-gradebook');
    const btnThermometer = document.getElementById('btn-classroom-subtab-thermometer');
    const btnSettings = document.getElementById('btn-classroom-subtab-settings');

    // Hide all sub-views
    if (classroomSec) classroomSec.classList.add('hidden');
    if (gradebookSec) gradebookSec.classList.add('hidden');
    if (thermometerSec) thermometerSec.classList.add('hidden');
    if (settingsSec) settingsSec.classList.add('hidden');

    // Remove active styles from sub-tab buttons
    [btnDash, btnGradebook, btnThermometer, btnSettings].forEach(btn => {
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
    } else if (subTabId === 'settings') {
      if (settingsSec) settingsSec.classList.remove('hidden');
      if (btnSettings) {
        btnSettings.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSettings.classList.remove('bg-clay-sand', 'text-slate-800');
      }
      renderSettingsView();
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
  }`;

// 2. Replace old switchClassroomTab definition and listeners (lines 2562-2650)
const oldClassroomSwitcher = `  // Unified Section Switcher
  window.switchClassroomTab = function(sectionId) {
    const allSections = [
      document.getElementById('shortener-section'),
      document.getElementById('dashboard-section'),
      document.getElementById('polls-section'),
      document.getElementById('admin-approval-section'),
      classroomSection,
      gradebookSection,
      thermometerSection,
      classroomSettingsSection
    ];
    const allHeaderNavs = [
      document.getElementById('nav-item-shortener'),
      document.getElementById('nav-item-dashboard'),
      document.getElementById('nav-item-polls'),
      navItemClassroom,
      navItemGradebook,
      navItemThermometer,
      navItemClassroomSettings
    ];
    const allMobileNavs = [
      document.getElementById('mobile-nav-shortener'),
      document.getElementById('mobile-nav-dashboard'),
      document.getElementById('mobile-nav-polls'),
      mobileNavClassroom,
      mobileNavGradebook,
      mobileNavThermometer,
      mobileNavClassroomSettings
    ];

    // Hide all member sub-sections
    allSections.forEach(sec => {
      if (sec) sec.classList.add('hidden');
    });

    // Remove active style from desktop nav
    allHeaderNavs.forEach(nav => {
      if (nav) nav.classList.remove('active');
    });

    // Remove active style from mobile nav
    allMobileNavs.forEach(nav => {
      if (nav) {
        nav.classList.remove('active-mobile-nav');
        nav.classList.add('text-slate-400', 'dark:text-slate-500');
      }
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.remove('hidden');

    // Highlight target nav
    const activeHeaderId = 'nav-item-' + sectionId.replace('-section', '');
    const activeHeaderNav = document.getElementById(activeHeaderId);
    if (activeHeaderNav) activeHeaderNav.classList.add('active');

    const activeMobileId = 'mobile-nav-' + sectionId.replace('-section', '');
    const activeMobileNav = document.getElementById(activeMobileId);
    if (activeMobileNav) {
      activeMobileNav.classList.add('active-mobile-nav');
      activeMobileNav.classList.remove('text-slate-400', 'dark:text-slate-500');
    }

    lucide.createIcons();
  };

  // Bind Switchers
  if (navItemClassroom) navItemClassroom.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('classroom-section'); });
  if (navItemGradebook) navItemGradebook.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('gradebook-section'); });
  if (navItemThermometer) navItemThermometer.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('thermometer-section'); });
  if (navItemClassroomSettings) navItemClassroomSettings.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('classroom-settings-section'); });

  if (mobileNavClassroom) mobileNavClassroom.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('classroom-section'); });
  if (mobileNavGradebook) mobileNavGradebook.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('gradebook-section'); });
  if (mobileNavThermometer) mobileNavThermometer.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('thermometer-section'); });
  if (mobileNavClassroomSettings) mobileNavClassroomSettings.addEventListener('click', (e) => { e.preventDefault(); switchClassroomTab('classroom-settings-section'); });

  // Grid / Race click-redirects
  const btnRaceGotoGradebook = document.getElementById('btn-race-goto-gradebook');
  const btnGridGotoGradebook = document.getElementById('btn-grid-goto-gradebook');
  const btnPrivacyGotoGradebook = document.getElementById('btn-privacy-goto-gradebook');
  const btnSettingsGotoGradebook = document.getElementById('btn-settings-goto-gradebook');

  if (btnRaceGotoGradebook) btnRaceGotoGradebook.addEventListener('click', () => switchClassroomTab('gradebook-section'));
  if (btnGridGotoGradebook) btnGridGotoGradebook.addEventListener('click', () => switchClassroomTab('gradebook-section'));
  if (btnPrivacyGotoGradebook) btnPrivacyGotoGradebook.addEventListener('click', () => switchClassroomTab('gradebook-section'));
  if (btnSettingsGotoGradebook) btnSettingsGotoGradebook.addEventListener('click', () => switchClassroomTab('gradebook-section'));`;

const newClassroomSwitcher = `  // Unified Section Switcher
  window.switchClassroomTab = function(sectionId) {
    // Legacy support for API / direct calls
    if (sectionId === 'classroom-section') switchClassroomSubTab('dash');
    else if (sectionId === 'gradebook-section') switchClassroomSubTab('gradebook');
    else if (sectionId === 'thermometer-section') switchClassroomSubTab('thermometer');
    else if (sectionId === 'classroom-settings-section') switchClassroomSubTab('settings');
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
  const btnSubtabSettings = document.getElementById('btn-classroom-subtab-settings');

  if (btnSubtabDash) btnSubtabDash.addEventListener('click', () => switchClassroomSubTab('dash'));
  if (btnSubtabGradebook) btnSubtabGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnSubtabThermometer) btnSubtabThermometer.addEventListener('click', () => switchClassroomSubTab('thermometer'));
  if (btnSubtabSettings) btnSubtabSettings.addEventListener('click', () => switchClassroomSubTab('settings'));

  // Grid / Race click-redirects to sub-tabs
  const btnRaceGotoGradebook = document.getElementById('btn-race-goto-gradebook');
  const btnGridGotoGradebook = document.getElementById('btn-grid-goto-gradebook');
  const btnPrivacyGotoGradebook = document.getElementById('btn-privacy-goto-gradebook');
  const btnSettingsGotoGradebook = document.getElementById('btn-settings-goto-gradebook');

  if (btnRaceGotoGradebook) btnRaceGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnGridGotoGradebook) btnGridGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnPrivacyGotoGradebook) btnPrivacyGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));
  if (btnSettingsGotoGradebook) btnSettingsGotoGradebook.addEventListener('click', () => switchClassroomSubTab('gradebook'));`;

if (content.includes(oldNavBlock)) {
  content = content.replace(oldNavBlock, newNavBlock);
  console.log("NAV BLOCK REPLACED SUCCESSFULLY!");
} else {
  console.log("OLD NAV BLOCK NOT FOUND IN APP.JS!");
}

if (content.includes(oldClassroomSwitcher)) {
  content = content.replace(oldClassroomSwitcher, newClassroomSwitcher);
  console.log("CLASSROOM SWITCHER REPLACED SUCCESSFULLY!");
} else {
  console.log("OLD CLASSROOM SWITCHER NOT FOUND IN APP.JS!");
}

// 3. Make sure welcome check defaults to switchMainTab instead of old direct calls
content = content.replace("switchClassroomTab('classroom-section');", "switchMainTab('classroom');");

fs.writeFileSync(filepath, content, 'utf8');
console.log("Done updating app.js!");
