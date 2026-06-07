const fs = require('fs');
const indexHtml = fs.readFileSync('C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html', 'utf8');

const lines = indexHtml.split('\n');
console.log("Searching for <style> or css styles for '.active' in index.html:");
let insideStyle = false;
lines.forEach((line, idx) => {
  if (line.includes('<style')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
    insideStyle = true;
  }
  if (insideStyle) {
    if (line.includes('.active') || line.includes('active-') || line.includes('nav-item')) {
      console.log(`Line ${idx+1}: ${line.trim()}`);
    }
  }
  if (line.includes('</style>')) {
    insideStyle = false;
  }
});
