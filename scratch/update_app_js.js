const fs = require('fs');

const filePath = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/js/app.js';
let js = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
const isCrlf = js.includes('\r\n');
js = js.replace(/\r\n/g, '\n');

const targetStr = `  // --- 1. Theme Module (Light / Dark Mode Option) ---
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

  initTheme();`;

const replacementStr = `  // --- 1. Theme Module (Light / Dark Mode Option) ---
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
    updateThemeRadioState(isLight);
    showToast(
      isLight ? '화이트 테마 활성화' : '블랙 테마 활성화',
      isLight ? '눈이 편안한 밝은 화이트 모드로 전환되었습니다.' : '세련되고 깊이 있는 다크 모드로 전환되었습니다.',
      'info'
    );
  });

  initTheme();

  // Theme settings radio change listeners
  document.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'theme-preference') {
      const selectedTheme = e.target.value;
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      
      if ((selectedTheme === 'light' && !isCurrentlyLight) || (selectedTheme === 'dark' && isCurrentlyLight)) {
        themeToggleBtn.click(); // Trigger the existing toggle logic
      }
    }
  });`;

if (js.includes(targetStr)) {
  js = js.replace(targetStr, replacementStr);
  if (isCrlf) {
    js = js.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, js, 'utf8');
  console.log("Successfully updated theme logic in app.js!");
} else {
  console.log("Error: Target theme code block not found in app.js!");
}
