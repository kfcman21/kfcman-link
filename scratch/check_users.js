const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../data/db.json');
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  try {
    const data = JSON.parse(content);
    if (data.users) {
      console.log("Users inside db.json:");
      Object.keys(data.users).forEach(u => {
        const user = { ...data.users[u] };
        delete user.salt;
        delete user.hash;
        console.log(u, JSON.stringify(user));
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
