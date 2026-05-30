const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\index.html";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes("eusseuk") || 
      line.includes("classroom") || 
      line.includes("btn-classroom-subtab") ||
      line.includes("subtab") ||
      line.includes("mobile-nav-member-group") ||
      line.includes("nav-item-classroom") ||
      line.includes("gradebook-section") ||
      line.includes("thermometer-section") ||
      line.includes("classroom-settings-section")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
