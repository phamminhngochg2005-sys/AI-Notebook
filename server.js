/* Sổ tay AI — server mẫu Node (không cần cài thư viện).
 * Phục vụ public/ + API /api/* bằng lõi tham chiếu public/js/mock/api-core.js, lưu dữ liệu ở data/db.json.
 * Dùng để: chạy thử trên máy, gửi khách xem qua Cloudflare Tunnel, làm chuẩn hành vi cho backend Cloudflare (PLAN.md).
 *
 *   node server.js                 → http://localhost:8080  (sổ tay)  và  /admin (quản trị)
 *   PORT=4178 node server.js       → đổi cổng
 *   APP_ENV=production node server.js → không nạp dữ liệu mẫu, không có /api/admin/reset
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createApi } = require('./public/js/mock/api-core.js');
const seed = require('./public/js/mock/seed-data.js');

const PORT = Number(process.env.PORT) || 8080;
const ENV = process.env.APP_ENV === 'production' ? 'production' : 'dev';
const ROOT = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA, 'db.json');
const ITER = Number(process.env.PBKDF2_ITERATIONS) || 100000;
const MAX_BODY = 2 * 1024 * 1024;

fs.mkdirSync(DATA, { recursive: true });
let saveTimer = null;
const api = createApi({
  seed,
  env: ENV,
  bootstrap: { email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD },
  now: () => Date.now(),
  randomHex: n => crypto.randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n),
  hashToken: t => crypto.createHash('sha256').update(String(t)).digest('hex'),
  hashPassword: pw => {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(pw, salt, ITER, 32, 'sha256');
    return `pbkdf2$${ITER}$${salt.toString('base64')}$${hash.toString('base64')}`;
  },
  verifyPassword: (pw, stored) => {
    const [kind, iter, salt, hash] = String(stored || '').split('$');
    if (kind !== 'pbkdf2') return false;
    const got = crypto.pbkdf2Sync(pw, Buffer.from(salt, 'base64'), Number(iter), 32, 'sha256');
    const want = Buffer.from(hash, 'base64');
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  },
  load: () => { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return null; } },
  save: db => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db)); fs.renameSync(DB_FILE + '.tmp', DB_FILE); }, 150);
  },
});

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' };

function sendJson(res, status, body) {
  const data = body == null ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SEC });
  res.end(data);
}

function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p === '/' ) p = '/index.html';
  if (p === '/admin' || p === '/admin/') p = '/admin.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || path.basename(file).startsWith('_')) { res.writeHead(404, SEC); return res.end('Không tìm thấy'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SEC }); return res.end('Không tìm thấy'); }
    const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SEC };
    if (p === '/admin.html') { headers['X-Robots-Tag'] = 'noindex, nofollow'; headers['Cache-Control'] = 'no-store'; }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/') && url.pathname !== '/api') return serveStatic(req, res, url.pathname);
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > MAX_BODY) { sendJson(res, 413, { error: 'Dữ liệu gửi lên quá lớn' }); req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    if (res.writableEnded) return;
    let body;
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw.trim()) { try { body = JSON.parse(raw); } catch { body = '__INVALID_JSON__'; } }
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '';
    const out = api.handle({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body, token, ip });
    sendJson(res, out.status, out.body);
  });
});

server.listen(PORT, () => {
  console.log(`Sổ tay AI (${ENV}) đang chạy: http://localhost:${PORT}  ·  Quản trị: http://localhost:${PORT}/admin`);
  if (ENV === 'dev') console.log('Tài khoản mẫu: admin@sotayai.vn / admin123 · bientap@sotayai.vn / 123456 · lan.gv@sotayai.vn / 123456');
});
