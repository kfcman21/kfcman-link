const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const jsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8')
  .replace(/<script[^>]*src=["']\/js\/app\.js[^>]*><\/script>/gi, '');

let jsContent = fs.readFileSync(jsPath, 'utf8');

// Inject console logs inside app.js for tracing using regex to handle CRLF
jsContent = jsContent.replace(
  /function\s+openAuthModal\s*\(\s*mode\s*=\s*'login'\s*\)\s*\{/i,
  "function openAuthModal(mode = 'login') { console.log('TRACE: openAuthModal called with mode =', mode, 'authModal exists:', !!authModal);"
);

jsContent = jsContent.replace(
  /btnHeroStart\.addEventListener\s*\(\s*'click'\s*,\s*\(\)\s*=>\s*openAuthModal\('register'\)\)/i,
  "console.log('TRACE: Binding click listener to btnHeroStart'); btnHeroStart.addEventListener('click', () => { console.log('TRACE: btnHeroStart clicked!'); openAuthModal('register'); })"
);

// Append trace log at the very end of app.js
jsContent += "\nconsole.log('TRACE: app.js fully evaluated to the end!');\n";

const virtualConsole = new VirtualConsole();
virtualConsole.on("log", (...args) => {
  console.log("BROWSER LOG:", ...args);
});
virtualConsole.on("error", (...args) => {
  console.error("BROWSER ERROR:", ...args);
});
virtualConsole.on("warn", (...args) => {
  console.warn("BROWSER WARN:", ...args);
});

const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost/",
  virtualConsole
});

dom.window.addEventListener('error', (event) => {
  console.error("JSDOM Window Error:", event.error ? event.error.stack : event.message);
});

// Mock Lucide global variable
dom.window.lucide = {
  createIcons: () => {}
};

// Mock QRious global variable
dom.window.QRious = function() {
  this.set = () => {};
};

// Define global fetch mock
dom.window.fetch = () => {
  return Promise.resolve({
    ok: false,
    status: 401,
    json: () => Promise.resolve({})
  });
};

// Inject the js script
const scriptElement = dom.window.document.createElement("script");
scriptElement.textContent = jsContent;
dom.window.document.body.appendChild(scriptElement);

// Wait a bit and trigger DOMContentLoaded
setTimeout(() => {
  console.log("Triggering DOMContentLoaded...");
  const event = dom.window.document.createEvent("Event");
  event.initEvent("DOMContentLoaded", true, true);
  dom.window.document.dispatchEvent(event);

  const btnHeroStart = dom.window.document.getElementById('btn-hero-start');
  const btnHeroLogin = dom.window.document.getElementById('btn-hero-login');
  const authModal = dom.window.document.getElementById('auth-modal');

  console.log("DOM check: btnHeroStart exists:", !!btnHeroStart);
  console.log("DOM check: btnHeroLogin exists:", !!btnHeroLogin);
  console.log("DOM check: authModal exists:", !!authModal, "classes:", authModal ? authModal.className : "N/A");

  if (btnHeroStart) {
    console.log("Simulating click on btnHeroStart...");
    btnHeroStart.click();
    console.log("After click: authModal classes:", authModal ? authModal.className : "N/A");
  }
}, 500);
