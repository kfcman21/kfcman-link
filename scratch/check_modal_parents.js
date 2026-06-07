const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('public/index.html', 'utf8');
const dom = new JSDOM(htmlContent);
const doc = dom.window.document;

const modals = doc.querySelectorAll('.modal-overlay');
console.log(`Found ${modals.length} modal-overlay elements:`);

modals.forEach(modal => {
  let p = modal;
  let path = [];
  while(p) {
    path.push(p.tagName + (p.id ? '#' + p.id : ''));
    p = p.parentElement;
  }
  console.log(`- Modal: ${modal.tagName}#${modal.id || '(no-id)'} -> Path: ${path.reverse().join(' -> ')}`);
});
