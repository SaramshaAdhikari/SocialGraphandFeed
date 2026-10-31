// Production single-origin server for SocialGraphandFeed.
// Serves the built Vite frontend and proxies /api and /uploads to the
// Fastify backend. This keeps session cookies and credentials same-origin,
// which is how the frontend's LiveClient (baseUrl = '') expects to work.
// No secrets are read from or written to this file; all configuration
// comes from environment variables set on the hosting platform.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
const DIST = path.join(__dirname, 'packages/frontend/dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function proxy(req, res) {
  const target = new URL(req.url, BACKEND_URL);
  const headers = { ...req.headers, host: target.host };
  delete headers['content-length'];
  const upstream = http.request(
    { hostname: target.hostname, port: target.port, path: target.pathname + target.search, method: req.method, headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Backend unavailable' }));
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return proxy(req, res);
  }
  let filePath = path.join(DIST, url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server listening on http://0.0.0.0:${PORT}, proxying /api to ${BACKEND_URL}`);
});
