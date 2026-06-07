const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const jsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Extract the body of the DOMContentLoaded callback
// It starts with document.addEventListener('DOMContentLoaded', () => {
// and ends with the matching closing brace.
const startMarker = "document.addEventListener('DOMContentLoaded', () => {";
const startIndex = jsContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Could not find DOMContentLoaded start in app.js");
  process.exit(1);
}

// Find matching closing brace for the callback
let braceCount = 1;
let index = startIndex + startMarker.length;
let callbackBody = "";

while (braceCount > 0 && index < jsContent.length) {
  const char = jsContent[index];
  if (char === '{') {
    braceCount++;
  } else if (char === '}') {
    braceCount--;
  }
  if (braceCount > 0) {
    callbackBody += char;
  }
  index++;
}

console.log("Extracted callback body length:", callbackBody.length);

const dom = new JSDOM(htmlContent, {
  runScripts: "outside-only",
  url: "http://localhost/"
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

// We will execute the callback body in the context of the window
console.log("Executing callback inside JSDOM window context...");
try {
  dom.window.eval(`
    (function() {
      ${callbackBody}
    })();
  `);
  console.log("Callback executed successfully!");
} catch (e) {
  console.error("Error during callback execution:", e);
}

const btnHeroStart = dom.window.document.getElementById('btn-hero-start');
const authModal = dom.window.document.getElementById('auth-modal');

if (btnHeroStart) {
  console.log("Simulating click on btnHeroStart...");
  btnHeroStart.click();
  console.log("authModal classes after click:", authModal ? authModal.className : "N/A");
}
