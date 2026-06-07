const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

let failures = 0;

function logPass(msg) {
  console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
}

function logFail(msg) {
  console.error(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
  failures++;
}

function logInfo(msg) {
  console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`);
}

// -------------------------------------------------------------
// 1. Sync check (public vs www)
// -------------------------------------------------------------
function runSyncCheck() {
  logInfo("Starting Synchronized Folder Check (public/ vs www/)...");
  
  const filesToSync = [
    { src: 'public/index.html', dest: 'www/index.html' },
    { src: 'public/wall.html', dest: 'www/wall.html' },
    { src: 'public/docs.html', dest: 'www/docs.html' },
    { src: 'public/js/app.js', dest: 'www/js/app.js' },
    { src: 'public/js/wall.js', dest: 'www/js/wall.js' },
    { src: 'public/js/docs.js', dest: 'www/js/docs.js' },
    { src: 'public/js/lucide.min.js', dest: 'www/js/lucide.min.js' },
    { src: 'public/js/qrious.min.js', dest: 'www/js/qrious.min.js' },
    { src: 'public/js/jszip.min.js', dest: 'www/js/jszip.min.js' }
  ];

  for (const file of filesToSync) {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(__dirname, file.dest);

    if (!fs.existsSync(srcPath)) {
      logFail(`Source file does not exist: ${file.src}`);
      continue;
    }
    if (!fs.existsSync(destPath)) {
      logFail(`Destination file does not exist: ${file.dest}`);
      continue;
    }

    const srcContent = fs.readFileSync(srcPath);
    const destContent = fs.readFileSync(destPath);

    if (!srcContent.equals(destContent)) {
      logFail(`File mismatch! '${file.src}' is not identical to '${file.dest}'.`);
    } else {
      logPass(`'${file.src}' and '${file.dest}' are perfectly in sync.`);
    }
  }
}

// -------------------------------------------------------------
// 2. CDN Check (No external scripts for core libs)
// -------------------------------------------------------------
function runCDNCheck() {
  logInfo("Starting External CDN Script Check...");
  
  const htmlFiles = [
    'public/index.html',
    'public/wall.html',
    'public/docs.html',
    'www/index.html',
    'www/wall.html',
    'www/docs.html'
  ];

  const blockedCDNDomains = [
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'rawgit.com'
  ];

  for (const relativePath of htmlFiles) {
    const filePath = path.join(__dirname, relativePath);
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');
    
    // Find all script tags
    const scriptRegex = /<script\b[^>]*src=["']([^"']+)["']/gi;
    let match;
    let fileHasCdnError = false;

    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[1];
      const hasBlockedDomain = blockedCDNDomains.some(domain => src.includes(domain));
      
      // Specifically target core libs: lucide, qrious, jszip
      const isCoreLib = src.includes('lucide') || src.includes('qrious') || src.includes('jszip');
      
      if (hasBlockedDomain && isCoreLib) {
        logFail(`External CDN usage detected in ${relativePath}: "${src}"`);
        fileHasCdnError = true;
      }
    }

    if (!fileHasCdnError) {
      logPass(`No blocked CDNs for core libraries in ${relativePath}.`);
    }
  }
}

// -------------------------------------------------------------
// 3. HTML Nesting Check (Modal Parent Nesting check)
// -------------------------------------------------------------
function runNestingCheck() {
  logInfo("Starting HTML Nesting/Hierarchy Check...");
  
  const htmlFiles = [
    'public/index.html',
    'www/index.html'
  ];

  const modalIds = [
    'auth-modal',
    'qr-modal',
    'stats-modal',
    'intro-modal',
    'privacy-modal',
    'shortener-modal'
  ];

  for (const relativePath of htmlFiles) {
    const filePath = path.join(__dirname, relativePath);
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    let hasNestingError = false;

    for (const modalId of modalIds) {
      const modalEl = doc.getElementById(modalId);
      if (!modalEl) {
        // Some modals might not exist on all pages, but should exist in index.html
        if (relativePath.includes('index.html')) {
          logFail(`Required modal element #${modalId} not found in ${relativePath}`);
          hasNestingError = true;
        }
        continue;
      }

      // Check if parent element is <body> (direct child check)
      const parentTagName = modalEl.parentElement ? modalEl.parentElement.tagName.toLowerCase() : 'none';
      if (parentTagName !== 'body') {
        logFail(`Nesting Bug! Modal #${modalId} in ${relativePath} is child of <${parentTagName}> instead of <body>! Parent details: id="${modalEl.parentElement.id || ''}", class="${modalEl.parentElement.className || ''}"`);
        hasNestingError = true;
      }
    }

    if (!hasNestingError) {
      logPass(`All core modals in ${relativePath} are properly positioned as direct children of <body>.`);
    }
  }
}

// -------------------------------------------------------------
// 4. Cache-Control Configuration Checks
// -------------------------------------------------------------
function runCachingCheck() {
  logInfo("Starting Cache-Control Header Checks...");

  // Check Express server caching
  const serverPath = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverPath)) {
    const serverCode = fs.readFileSync(serverPath, 'utf8');
    const hasExpressCacheHeaders = serverCode.includes('Cache-Control') && 
                                   serverCode.includes('no-cache, no-store, must-revalidate') &&
                                   serverCode.includes('.html');
    if (hasExpressCacheHeaders) {
      logPass("Express server static file headers correctly set Cache-Control for HTML files.");
    } else {
      logFail("Express server static file config is MISSING proper Cache-Control headers for HTML files.");
    }
  }

  // Check Nginx/Apache .htaccess configuration
  const htaccessPath = path.join(__dirname, 'www', '.htaccess');
  if (fs.existsSync(htaccessPath)) {
    const htaccessCode = fs.readFileSync(htaccessPath, 'utf8');
    const hasHtaccessCacheHeaders = htaccessCode.includes('Cache-Control') && 
                                    htaccessCode.includes('no-cache') &&
                                    htaccessCode.includes('FilesMatch');
    if (hasHtaccessCacheHeaders) {
      logPass("Apache .htaccess is correctly configured to set Cache-Control for HTML files.");
    } else {
      logFail("Apache .htaccess is MISSING proper Cache-Control configuration for HTML files.");
    }
  }
}

// -------------------------------------------------------------
// 5. JSDOM Execution Verification
// -------------------------------------------------------------
function verifyPageExecution(htmlName, jsName, btnIdsToCheck) {
  return new Promise((resolve) => {
    logInfo(`Verifying client runtime execution for ${htmlName}...`);
    
    const htmlPath = path.join(__dirname, 'public', htmlName);
    const jsPath = path.join(__dirname, 'public', jsName);

    if (!fs.existsSync(htmlPath) || !fs.existsSync(jsPath)) {
      logFail(`Required files for ${htmlName} execution check are missing.`);
      resolve();
      return;
    }

    const rawHtml = fs.readFileSync(htmlPath, 'utf8');
    // Remove the app.js/docs.js/wall.js script tag
    let cleanedHtml = rawHtml.replace(/<script[^>]*src=["'][^"']*(?:app|docs|wall)\.js[^"']*["'][^>]*><\/script>/gi, '');
    // Remove stylesheet links and external script tags to avoid network delays
    cleanedHtml = cleanedHtml.replace(/<link\b[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<script\b[^>]*src=["']https?:\/\/[^"']+["'][^>]*><\/script>/gi, '');

    let jsContent = fs.readFileSync(jsPath, 'utf8');
    console.log(`[DEBUG] Loaded JS from ${jsPath}, size: ${jsContent.length} bytes`);

    const virtualConsole = new VirtualConsole();
    let runtimeErrors = [];
    let consoleLogs = [];

    virtualConsole.on("jsdomError", (error) => {
      runtimeErrors.push(`JSDOM internal: ${error.stack || error.message}`);
    });
    virtualConsole.on("error", (...args) => {
      runtimeErrors.push(`Console error: ${args.join(' ')}`);
    });
    virtualConsole.on("log", (...args) => {
      consoleLogs.push(`Console log: ${args.join(' ')}`);
    });

    const dom = new JSDOM('', {
      runScripts: "dangerously",
      url: "http://localhost/",
      virtualConsole
    });

    // Mock required global features before parsing HTML
    dom.window.tailwind = { config: {} };
    dom.window.matchMedia = dom.window.matchMedia || function() {
      return {
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      };
    };
    dom.window.lucide = { createIcons: () => {} };
    dom.window.QRious = function() { this.set = () => {}; };
    dom.window.fetch = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });

    // Listen for window errors
    dom.window.addEventListener('error', (event) => {
      runtimeErrors.push(`Unhandled error: ${event.error ? event.error.stack || event.error.message : event.message}`);
    });

    // Parse HTML using document.write
    dom.window.document.write(cleanedHtml);

    // Capture registered event listeners
    const listenersAdded = {};
    const originalElementAddEventListener = dom.window.Element.prototype.addEventListener;
    dom.window.Element.prototype.addEventListener = function(type, listener, options) {
      if (this.id) {
        listenersAdded[this.id] = listenersAdded[this.id] || [];
        listenersAdded[this.id].push(type);
      }
      originalElementAddEventListener.call(this, type, listener, options);
    };

    // Trigger DOMContentLoaded immediately upon registration
    const originalDocumentAddEventListener = dom.window.document.addEventListener;
    let initCallbackRegistered = false;
    dom.window.document.addEventListener = function(type, listener, options) {
      console.log(`[DEBUG_ADD_EV] document.addEventListener called with: ${type}`);
      if (type === 'DOMContentLoaded') {
        initCallbackRegistered = true;
        if (typeof listener === 'function') {
          try {
            listener();
          } catch (e) {
            runtimeErrors.push(`DOMContentLoaded callback error: ${e.stack || e.message}`);
          }
        } else if (listener && typeof listener.handleEvent === 'function') {
          try {
            listener.handleEvent({ type: 'DOMContentLoaded' });
          } catch (e) {
            runtimeErrors.push(`DOMContentLoaded handleEvent error: ${e.stack || e.message}`);
          }
        }
      } else {
        originalDocumentAddEventListener.call(dom.window.document, type, listener, options);
      }
    };

    // Trigger window load immediately upon registration
    const originalWindowAddEventListener = dom.window.addEventListener;
    dom.window.addEventListener = function(type, listener, options) {
      console.log(`[DEBUG_ADD_EV] window.addEventListener called with: ${type}`);
      if (type === 'load') {
        initCallbackRegistered = true;
        if (typeof listener === 'function') {
          try {
            listener();
          } catch (e) {
            runtimeErrors.push(`window load callback error: ${e.stack || e.message}`);
          }
        } else if (listener && typeof listener.handleEvent === 'function') {
          try {
            listener.handleEvent({ type: 'load' });
          } catch (e) {
            runtimeErrors.push(`window load handleEvent error: ${e.stack || e.message}`);
          }
        }
      } else {
        originalWindowAddEventListener.call(dom.window, type, listener, options);
      }
    };

    try {
      // Evaluate the JS in the JSDOM context
      const scriptElement = dom.window.document.createElement("script");
      jsContent = `console.log("TRACE: Evaluation started for ${jsName}");\n` + jsContent;
      scriptElement.textContent = jsContent;
      dom.window.document.body.appendChild(scriptElement);

      setTimeout(() => {
        if (!initCallbackRegistered) {
          logFail(`Initialization callback (DOMContentLoaded or load) was never registered in ${jsName}!`);
        }

        // Check for runtime errors
        if (runtimeErrors.length > 0) {
          logFail(`Runtime errors encountered while executing ${jsName} on ${htmlName}:`);
          runtimeErrors.forEach(err => console.error(`  - ${err}`));
        } else {
          logPass(`No runtime errors encountered during initial evaluation of ${htmlName}.`);
        }

        if (consoleLogs.length > 0) {
          console.log(`--- Console Logs for ${htmlName} ---`);
          consoleLogs.forEach(log => console.log(`  ${log}`));
          console.log(`-----------------------------------`);
        }

        // Check specific elements event listener binding
        let elementBindingFail = false;
        btnIdsToCheck.forEach(id => {
          const el = dom.window.document.getElementById(id);
          if (!el) {
            logFail(`Target button element #${id} not found in ${htmlName} during runtime test!`);
            elementBindingFail = true;
            return;
          }
          const hasClick = listenersAdded[id] && listenersAdded[id].includes('click');
          if (!hasClick) {
            logFail(`Target button element #${id} has NO 'click' event listener registered!`);
            elementBindingFail = true;
          }
        });

        if (!elementBindingFail && btnIdsToCheck.length > 0) {
          logPass(`All target buttons in ${htmlName} correctly bound with click event listeners.`);
        }

        resolve();
      }, 500);

    } catch (ex) {
      logFail(`Exception thrown during validation execution: ${ex.message}`);
      resolve();
    }
  });
}

async function runVerificationTests() {
  await verifyPageExecution('index.html', 'js/app.js', ['btn-hero-start', 'btn-hero-login']);
  await verifyPageExecution('wall.html', 'js/wall.js', []);
  await verifyPageExecution('docs.html', 'js/docs.js', []);
}

// -------------------------------------------------------------
// Main execution
// -------------------------------------------------------------
async function main() {
  console.log("=== RUNNING KFCMAN-LINK HEALTH CHECK & DIAGNOSTICS ===\n");
  
  runSyncCheck();
  console.log("");
  
  runCDNCheck();
  console.log("");
  
  runNestingCheck();
  console.log("");
  
  runCachingCheck();
  console.log("");
  
  await runVerificationTests();
  console.log("");

  console.log("=== HEALTH CHECK SUMMARY ===");
  if (failures === 0) {
    console.log("\x1b[32m\x1b[1mALL TESTS PASSED! The project is healthy and completely free of previous landing page/modal errors.\x1b[0m");
    process.exit(0);
  } else {
    console.error(`\x1b[31m\x1b[1mHEALTH CHECK FAILED with ${failures} error(s). Please fix the issues before deploying!\x1b[0m`);
    process.exit(1);
  }
}

main();
