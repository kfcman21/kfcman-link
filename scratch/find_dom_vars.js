const fs = require('fs');

const filepath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\public\\js\\app.js";
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes("classroomSection") || 
      line.includes("gradebookSection") || 
      line.includes("thermometerSection") || 
      line.includes("classroomSettingsSection")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
