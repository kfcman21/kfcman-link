const fs = require('fs');

const hostsPath = "C:\\Windows\\System32\\drivers\\etc\\hosts";
if (fs.existsSync(hostsPath)) {
  const content = fs.readFileSync(hostsPath, 'utf8');
  console.log("Hosts file content:");
  console.log(content);
} else {
  console.log("Hosts file does not exist.");
}
