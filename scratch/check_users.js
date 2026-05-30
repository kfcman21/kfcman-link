const fs = require('fs');

const dbPath = "C:\\Users\\박찬규\\.gemini\\antigravity\\scratch\\kfcman-link\\data\\db.json";
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  try {
    const data = JSON.parse(content);
    if (data.users) {
      console.log("Users inside db.json:");
      Object.keys(data.users).forEach(u => {
        console.log(`Username: ${u}, Role: ${data.users[u].role}, Password Hash: ${data.users[u].password}`);
      });
    } else {
      console.log("No users table in db.json.");
    }
  } catch (e) {
    console.log("Failed to parse db.json");
  }
} else {
  console.log("db.json does not exist.");
}
