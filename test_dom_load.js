const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const htmlPath = path.join(__dirname, 'public', 'index.html');
const jsPath = path.join(__dirname, 'public', 'js', 'app.js');

const rawHtml = fs.readFileSync(htmlPath, 'utf8');
const htmlContent = rawHtml.replace(/<script[^>]*src=["']\/js\/app\.js[^>]*><\/script>/gi, '');
console.log('Original HTML has app.js tag:', rawHtml.includes('/js/app.js'));
console.log('Replaced HTML has app.js tag:', htmlContent.includes('/js/app.js'));
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Inject console.log at the very top of app.js
jsContent = "console.log('JS: Script file starts evaluating!');\n" + jsContent;

// Inject console.log into openAuthModal
jsContent = jsContent.replace(
  /function openAuthModal\s*\(\s*mode\s*=\s*'login'\s*\)\s*\{/gi,
  "function openAuthModal(mode = 'login') { console.log('JS: openAuthModal executed', mode);"
);

// Inject console.log at DOMContentLoaded start
jsContent = jsContent.replace(
  "document.addEventListener('DOMContentLoaded', () => {",
  "document.addEventListener('DOMContentLoaded', () => { console.log('JS: DOMContentLoaded listener started!');"
);

// Inject logs for listener bindings and authModal status
jsContent = jsContent.replace(
  "btnLoginTrigger.addEventListener('click', () => openAuthModal('login'));",
  "console.log('JS: Binding btnLoginTrigger listener, authModal is: ' + (authModal !== null)); btnLoginTrigger.addEventListener('click', () => openAuthModal('login'));"
);

jsContent = jsContent.replace(
  "btnHeroStart.addEventListener('click', () => openAuthModal('register'));",
  "btnHeroStart.customMarkerProp = 'verified_in_app'; console.log('JS: Set customMarkerProp on btnHeroStart'); btnHeroStart.addEventListener('click', () => { console.log('JS: btnHeroStart click listener callback invoked!'); openAuthModal('register'); });"
);

const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => {
  console.error("JSDOM Error:", error.stack || error.message || error);
});
virtualConsole.on("error", (...args) => {
  console.error("Browser Console Error:", ...args);
});
virtualConsole.on("log", (...args) => {
  console.log("Browser Console Log:", ...args);
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

dom.window.addEventListener('unhandledrejection', (event) => {
  console.error("JSDOM Window Unhandled Rejection:", event.reason ? event.reason.stack || event.reason.message || event.reason : event);
});

dom.virtualConsole.on("log", (msg) => {
  console.log("Browser Console Log:", msg);
});

// Mock Lucide global variable
dom.window.lucide = {
  createIcons: () => {
    // console.log("MOCKED lucide.createIcons called");
  }
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

// Mock Element.prototype.addEventListener to trace registrations
const originalElementAddEventListener = dom.window.Element.prototype.addEventListener;
dom.window.Element.prototype.addEventListener = function(type, listener, options) {
  console.log(`[LISTEN] Element #${this.id || '(no-id)'} (${this.tagName}) added listener for '${type}'`);
  originalElementAddEventListener.call(this, type, listener, options);
};

// Mock addEventListener for DOMContentLoaded to run immediately
const originalAddEventListener = dom.window.document.addEventListener;
dom.window.document.addEventListener = function(type, listener, options) {
  if (type === 'DOMContentLoaded') {
    console.log("Mocked addEventListener: DOMContentLoaded registered, running immediately!");
    try {
      listener();
    } catch (e) {
      console.error("Error during DOMContentLoaded listener execution:", e);
    }
  } else {
    originalAddEventListener.call(dom.window.document, type, listener, options);
  }
};

console.log("Running app.js inside JSDOM...");

try {
  // Inject the js script
  const scriptElement = dom.window.document.createElement("script");
  scriptElement.textContent = jsContent;
  dom.window.document.body.appendChild(scriptElement);

  // Trigger DOMContentLoaded after a delay, then do testing
  setTimeout(() => {
    // Trigger DOMContentLoaded
    const event = dom.window.document.createEvent("Event");
    event.initEvent("DOMContentLoaded", true, true);
    dom.window.document.dispatchEvent(event);

    console.log("DOMContentLoaded event triggered.");
    
    // Test clicking the landing page buttons
    const btnHeroStart = dom.window.document.getElementById('btn-hero-start');
    const btnHeroLogin = dom.window.document.getElementById('btn-hero-login');
    
    console.log("Hero start button:", btnHeroStart ? "Found" : "Null");
    console.log("Hero login button:", btnHeroLogin ? "Found" : "Null");
    console.log("btnHeroStart customMarkerProp:", btnHeroStart.customMarkerProp);
    console.log("Is btnHeroStart connected?", btnHeroStart ? btnHeroStart.isConnected : "null");
    
    if (btnHeroStart) {
      console.log("Adding manual test click listener to btnHeroStart...");
      btnHeroStart.addEventListener('click', () => {
        console.log("TEST: Manual click listener on btnHeroStart fired successfully!");
      });
      console.log("Clicking hero start via dispatchEvent...");
      const clickEv = dom.window.document.createEvent("MouseEvent");
      clickEv.initEvent("click", true, true);
      btnHeroStart.dispatchEvent(clickEv);
      const authModal = dom.window.document.getElementById('auth-modal');
      console.log("authModal classes after hero start click:", authModal ? authModal.className : "null");
    }
    
    if (btnHeroLogin) {
      console.log("Clicking hero login via dispatchEvent...");
      const clickEv = dom.window.document.createEvent("MouseEvent");
      clickEv.initEvent("click", true, true);
      btnHeroLogin.dispatchEvent(clickEv);
      const authModal = dom.window.document.getElementById('auth-modal');
      console.log("authModal classes after hero login click:", authModal ? authModal.className : "null");
    }
    
    // Do not exit, let it run
    console.log("TEST completed. Waiting...");
  }, 1000);

} catch (err) {
  console.error("Execution Exception:", err);
}
