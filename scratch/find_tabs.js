const fs = require('fs');
const path = require('path');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\js\\app.js";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes("switchClassroomTab") || 
      line.includes("nav-item-shortener") || 
      line.includes("nav-item-polls") || 
      line.includes("nav-item-classroom") || 
      line.includes("switchMainTab") ||
      line.includes("showPollsTab") ||
      line.includes("showShortenerTab")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
