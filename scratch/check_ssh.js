const fs = require('fs');
const path = require('path');

const sshDir = "C:\\Users\\박찬규\\.ssh";
if (fs.existsSync(sshDir)) {
  console.log(".ssh directory exists!");
  const files = fs.readdirSync(sshDir);
  console.log("Files inside .ssh:", files);
} else {
  console.log(".ssh directory does not exist.");
}
