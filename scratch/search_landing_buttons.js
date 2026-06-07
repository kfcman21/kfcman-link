const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\www\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('무료로 가입하고') || line.includes('기존 회원 로그인') || line.includes('btn-hero-login') || line.includes('btnHeroStart')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
