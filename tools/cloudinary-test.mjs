import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.argv[2] || 'http://localhost:8787';
assert(new URL(base).hostname === 'localhost' || new URL(base).hostname === '127.0.0.1', 'Chỉ chạy với backend dev trên máy');
const secrets = JSON.parse(await readFile(new URL('../secrets.json', import.meta.url), 'utf8'));
const login = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@sotayai.vn', password: 'admin123' }) });
assert.equal(login.status, 200);
const { token } = await login.json(), headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
let media;
try {
  const response = await fetch(base + '/api/admin/media', { method: 'POST', headers, body: JSON.stringify({ file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=' }) });
  const data = await response.json();
  assert.equal(response.status, 200, data.error);
  media = data;
  assert.equal((await fetch(data.secureUrl)).status, 200);
  const list = await (await fetch(base + '/api/admin/media', { headers })).json();
  assert(list.items.some(item => item.publicId === data.publicId));
  console.log('PASS: Worker uploads image to Cloudinary, URL serves image, D1 stores metadata');
} finally {
  if (media) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHash('sha256').update(`public_id=${media.publicId}&timestamp=${timestamp}${secrets.CLOUDINARY_API_SECRET}`).digest('hex');
    const form = new URLSearchParams({ public_id: media.publicId, timestamp, signature, api_key: secrets.CLOUDINARY_API_KEY });
    const removed = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(secrets.CLOUDINARY_CLOUD_NAME)}/image/destroy`, { method: 'POST', body: form });
    assert.equal(removed.status, 200); assert.equal((await removed.json()).result, 'ok');
    assert.equal((await fetch(base + '/api/admin/reset', { method: 'POST', headers, body: '{}' })).status, 200);
    console.log('PASS: removed temporary Cloudinary image and reset dev data');
  } else await fetch(base + '/api/logout', { method: 'POST', headers, body: '{}' });
}
