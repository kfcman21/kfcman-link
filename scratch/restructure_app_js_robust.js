const fs = require('fs');

const filepath = "public/js/app.js";
let content = fs.readFileSync(filepath, 'utf8');

console.log("Original app.js size:", content.length);

// 1. Declare currentUserRole globally near currentUsername (around line 1543)
const oldUsernameDecl = "  let currentUsername = '';";
const newUsernameDecl = "  let currentUsername = '';\n  let currentUserRole = '';";

if (content.includes(oldUsernameDecl)) {
  content = content.replace(oldUsernameDecl, newUsernameDecl);
  console.log("currentUserRole variable declared globally!");
} else {
  console.log("Error: could not find username declaration block!");
  process.exit(1);
}

// 2. Replace checkLoginState admin authorization handling to update settings subtab visibility instead
const oldAdminCheck = `        // Admin authorization check
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
        
        renderDashboard();`;

const newAdminCheck = `        // Admin authorization check & Settings Tab Control
        currentUserRole = data.role;
        const btnSettingsSubtabAdmin = document.getElementById('btn-settings-subtab-admin');
        if (data.role === 'admin') {
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
        
        renderDashboard();`;

if (content.includes(oldAdminCheck)) {
  content = content.replace(oldAdminCheck, newAdminCheck);
  console.log("checkLoginState admin check updated!");
} else {
  console.log("Error: could not find old admin check in checkLoginState!");
  process.exit(1);
}

// 3. Replace switchMainTab, switchClassroomSubTab and main tab listeners with 4-tab system
const oldMainTabBlock = `  // --- 3-Tab Structure Unified Switcher ---
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
  }

  // Collapsible Form card triggers`;

const newMainTabBlock = `  // --- 4-Tab Structure Unified Switcher & Settings Config ---
  window.switchMainTab = function(tabId) {
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
      
      // Default to Admin subtab if admin, otherwise classroom settings subtab
      if (currentUserRole === 'admin') {
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
    if (subviewAdmin) subviewAdmin.classList.add('hidden');
    if (subviewShortcut) subviewShortcut.classList.add('hidden');
    if (subviewClassroom) subviewClassroom.classList.add('hidden');

    // Remove active styles
    [btnSubtabAdmin, btnSubtabShortcut, btnSubtabClassroom].forEach(btn => {
      if (btn) {
        btn.classList.remove('active', 'bg-clay-purple', 'text-white');
        btn.classList.add('bg-clay-sand', 'text-slate-800');
      }
    });

    if (subTabId === 'admin') {
      if (subviewAdmin) subviewAdmin.classList.remove('hidden');
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
    } else if (subTabId === 'classroom') {
      if (subviewClassroom) subviewClassroom.classList.remove('hidden');
      if (btnSubtabClassroom) {
        btnSubtabClassroom.classList.add('active', 'bg-clay-purple', 'text-white');
        btnSubtabClassroom.classList.remove('bg-clay-sand', 'text-slate-800');
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

  // Collapsible Form card triggers`;

if (content.includes(oldMainTabBlock)) {
  content = content.replace(oldMainTabBlock, newMainTabBlock);
  console.log("switchMainTab block restructured successfully!");
} else {
  console.log("Error: could not find old main tab block in app.js!");
  process.exit(1);
}

// 4. Update the classroom switch class/tab legacy block at the bottom
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
  });`;

if (content.includes(oldClassroomSwitcher)) {
  content = content.replace(oldClassroomSwitcher, newClassroomSwitcher);
  console.log("Classroom subtab switcher block updated successfully!");
} else {
  console.log("Error: could not find old classroom subtab switcher block in app.js!");
  process.exit(1);
}

// 5. Replace switchClassroomTab('classroom-section') inside welcome check with switchMainTab('classroom')
content = content.replace(/switchClassroomTab\('classroom-section'\);/g, "switchMainTab('classroom');");

// 6. Replace references of guest state hiders so that settings-section gets hidden on guest state
content = content.replace(
  "if (classroomSettingsSection) classroomSettingsSection.classList.add('hidden');",
  "if (classroomSettingsSection) classroomSettingsSection.classList.add('hidden');\n    const settingsSection = document.getElementById('settings-section');\n    if (settingsSection) settingsSection.classList.add('hidden');"
);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Robust app.js update completed successfully!");
