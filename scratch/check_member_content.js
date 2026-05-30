const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

// member-content div doesn't close!
// Let's verify by looking at all divs and their closes
const memberIdx = html.indexOf('id="member-content"');
console.log('member-content at char:', memberIdx);
console.log('Context:', html.substring(memberIdx - 30, memberIdx + 100));

// Count divs from member-content start to end
const memberStart = html.lastIndexOf('<div', memberIdx);
let divDepth = 0;
let memberCloseChar = -1;
let i = memberStart;
let safetyCount = 0;

while (i < html.length && safetyCount < 1000000) {
  safetyCount++;
  if (html.substring(i, i+4) === '<div') {
    divDepth++;
    i += 4;
  } else if (html.substring(i, i+6) === '</div>') {
    divDepth--;
    if (divDepth === 0) {
      memberCloseChar = i;
      break;
    }
    i += 6;
  } else {
    i++;
  }
}

console.log('member-content div depth at end:', divDepth);
console.log('member-content closes at char:', memberCloseChar);
if (memberCloseChar > 0) {
  console.log('member-content close context:', html.substring(memberCloseChar - 100, memberCloseChar + 50));
}
