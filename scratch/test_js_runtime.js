const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Parse index.html to find all IDs present
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(indexHtmlContent)) !== null) {
  htmlIds.add(match[1]);
}

console.log(`Parsed ${htmlIds.size} IDs from index.html`);

// Create Mock DOM elements
class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.classList = {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {}
    };
    this.style = {};
    this.value = '';
    this.innerHTML = '';
    this.textContent = '';
    this.disabled = false;
  }
  
  addEventListener(event, callback) {
    // Just mock
  }

  querySelector(selector) {
    return new MockElement(null);
  }

  querySelectorAll(selector) {
    return [new MockElement(null)];
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  getAttribute(name) {
    return this[name] || '';
  }

  focus() {}
}

const mockDocument = {
  body: new MockElement('body', 'body'),
  documentElement: new MockElement('html', 'html'),

  getElementById(id) {
    if (htmlIds.has(id)) {
      return new MockElement(id);
    }
    // Return null to simulate missing DOM element in browser
    return null;
  },

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      if (htmlIds.has(id)) return new MockElement(id);
      return null;
    }
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      if (indexHtmlContent.includes(className)) return new MockElement(null);
      return null;
    }
    return new MockElement(null);
  },

  querySelectorAll(selector) {
    return [];
  },

  addEventListener(event, callback) {
    if (event === 'DOMContentLoaded') {
      console.log('MockDOM: Triggering DOMContentLoaded callback');
      try {
        callback();
      } catch (err) {
        console.error('CRASH DETECTED IN DOMContentLoaded:', err);
      }
    }
  }
};

const mockWindow = {
  location: {
    origin: 'http://localhost:3000',
    pathname: '/'
  },
  lucide: {
    createIcons: () => {}
  },
  QRious: function() {
    this.set = () => {};
  },
  addEventListener: (event, callback) => {}
};

// Create a sandbox execution environment
const sandbox = {
  window: mockWindow,
  document: mockDocument,
  console: console,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  setTimeout: setTimeout,
  setInterval: setInterval,
  lucide: mockWindow.lucide,
  QRious: mockWindow.QRious,
  URLSearchParams: URLSearchParams
};

// Expose variables as globals in execution scope
const vm = require('vm');
const script = new vm.Script(appJsContent, { filename: 'app.js' });
const context = vm.createContext(sandbox);

try {
  script.runInContext(context);
  console.log('Script loaded successfully in sandbox!');
} catch (err) {
  console.error('CRASH DETECTED ON SCRIPT LOAD:', err);
}
