const fs = require('fs');
const path = require('path');

const envPath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\.env";
if (fs.existsSync(envPath)) {
  console.log(".env file exists!");
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0]) {
      console.log(`Key: ${parts[0].trim()}`);
    }
  });
} else {
  console.log(".env file does not exist.");
}
