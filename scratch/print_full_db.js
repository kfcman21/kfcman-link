const fs = require('fs');

const dbPath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\data\\db.json";
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  console.log("Full db.json content length:", content.length);
  // parse and print top-level keys
  try {
    const data = JSON.parse(content);
    console.log("Keys:", Object.keys(data));
    if (data.users) {
      console.log("Users keys:", Object.keys(data.users));
      Object.keys(data.users).forEach(k => {
        console.log(`User: ${k}, Approved: ${data.users[k].approved}, Role: ${data.users[k].role}`);
      });
    }
  } catch (e) {
    console.log("Error parsing:", e.message);
  }
} else {
  console.log("File does not exist.");
}
