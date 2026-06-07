const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const ids = ['btn-reset', 'btn-login-trigger', 'btn-register-trigger', 'btn-hero-start', 'auth-modal', 'btn-auth-modal-close', 'tab-login-trigger', 'tab-register-trigger', 'btn-login-sidebar'];
ids.forEach(id => {
  const exists = indexHtmlContent.includes(id);
  console.log(`ID '${id}' exists? ${exists}`);
});
