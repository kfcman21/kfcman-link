const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../data/db.json');
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  try {
    const data = JSON.parse(content);
    if (data.users) {
      console.log("User Hashes Check:");
      Object.keys(data.users).forEach(u => {
        const uObj = data.users[u];
        console.log(`${u}: approved=${uObj.approved}, saltLen=${uObj.salt ? uObj.salt.length : 0}, hashLen=${uObj.hash ? uObj.hash.length : 0}`);
      });
    }
  } catch (e) {
    console.log(e);
  }
}
