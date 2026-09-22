const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const routes = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/wall', 'wall.html'],
  ['/wall.html', 'wall.html'],
  ['/js/app.js', 'app.js'],
  ['/js/wall.js', 'wall.js'],
  ['/password-util.js', 'password-util.js'],
]);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const vendorStubs = {
  '/js/lucide.min.js': 'window.lucide=window.lucide||{createIcons:function(){}};',
  '/js/qrious.min.js': 'window.QRious=window.QRious||function QRious(){return this;};',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  if (vendorStubs[pathname]) {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(vendorStubs[pathname]);
    return;
  }

  // Minimal API stubs so client screens render in preview without the real backend.
  if (pathname.startsWith('/api/')) {
    const json = (obj) => {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(obj));
    };
    if (pathname === '/api/me') return json({ username: 'preview', role: 'admin', id: 1 });
    return json([]);
  }

  // Proxy /mindcheck/, /scibot/, /scibit/ to actual deployment server so preview works seamlessly
  if (pathname.startsWith('/mindcheck') || pathname.startsWith('/scibot') || pathname.startsWith('/scibit')) {
    const https = require('https');
    const proxyReq = https.request(`https://kfcman.link${req.url}`, {
      headers: { ...req.headers, host: 'kfcman.link' }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (e) => {
      res.writeHead(502);
      res.end('Proxy Error: ' + e.message);
    });
    req.pipe(proxyReq);
    return;
  }

  const relativePath = routes.get(pathname) || pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Static assets (images, uploads, etc.) live under public/ in production.
  // Fall back to public/ so the preview matches the real server.
  const publicFilePath = path.resolve(root, 'public', relativePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (publicFilePath.startsWith(path.resolve(root, 'public'))) {
        fs.readFile(publicFilePath, (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, {
            'content-type': types[path.extname(publicFilePath).toLowerCase()] || 'application/octet-stream',
            'cache-control': 'no-store',
          });
          res.end(data2);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'content-type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Preview server: http://localhost:${port}`);
  console.log(`Wall preview:    http://localhost:${port}/wall`);
});
