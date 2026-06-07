const fs = require('fs');

const filePath = 'C:/Users/박찬규/.gemini/antigravity/scratch/kfcman-link/public/index.html';
if (fs.existsSync(filePath)) {
  let html = fs.readFileSync(filePath, 'utf8');
  const isCrlf = html.includes('\r\n');
  html = html.replace(/\r\n/g, '\n');

  // Replace outer container class to remove flex centering and padding
  const target = `class="modal-overlay hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="shortener-modal"`;
  const replacement = `class="modal-overlay hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in" id="shortener-modal"`;

  if (html.includes(target)) {
    html = html.replace(target, replacement);
    console.log("Successfully updated the shortener modal container class!");
  } else {
    console.log("Warning: Target not found. Let's do a loose replace.");
    html = html.replace(
      /class="modal-overlay hidden fixed inset-0 z-\[100\] flex items-center justify-center bg-black\/60 backdrop-blur-sm p-4 animate-fade-in"\s+id="shortener-modal"/g,
      `class="modal-overlay hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in" id="shortener-modal"`
    );
  }

  if (isCrlf) {
    html = html.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, html, 'utf8');
}
