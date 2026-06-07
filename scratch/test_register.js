const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', console.error);
const randomUser = 'testuser_' + Math.random().toString(36).substring(2, 8);
req.write(JSON.stringify({ username: randomUser, password: 'password123' }));
req.end();
