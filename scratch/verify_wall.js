const http = require('http');

const data = JSON.stringify({
  title: "테스트 게시판",
  description: "실시간 연동 확인용"
});

const options = {
  hostname: '140.245.76.33',
  port: 80,
  path: '/api/wall',
  method: 'POST',
  headers: {
    'Host': 'kfcman.link',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
