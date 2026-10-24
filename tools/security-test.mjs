import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:8787';
async function call(path, method = 'GET', body, token) {
  const res = await fetch(base + path, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
}
const login = async email => {
  const r = await call('/api/login', 'POST', { email, password: email === 'admin@sotayai.vn' ? 'admin123' : '123456' });
  assert.equal(r.status, 200); return r.data.token;
};
const admin = await login('admin@sotayai.vn'), editor = await login('bientap@sotayai.vn'), lan = await login('lan.gv@sotayai.vn');
assert.equal((await call('/api/admin/media')).status, 401);
assert.equal((await call('/api/admin/media', 'GET', undefined, editor)).status, 403);
assert.equal((await call('/api/admin/media', 'POST', { file: 'https://example.com/private.png' }, admin)).status, 400);
assert.equal((await call('/api/me/profiles/cp_lan1', 'PUT', { name: 'Invalid ownership' }, editor)).status, 404);
const detail = await call('/api/admin/users/u_lan', 'GET', undefined, admin);
for (const plan of detail.data.plans) for (const field of ['promptText', 'aiResult', 'note']) assert.equal(field in plan, false);
for (const profile of detail.data.profiles) assert.equal('data' in profile, false);
const prompt = await call('/api/prompts/p07');
assert.equal(prompt.headers.get('cache-control'), 'no-store');
assert.equal((await call('/api/meta', 'POST', {})).status, 405);
assert.equal((await call('/api/unknown')).status, 404);
for (const path of ['/secrets.json', '/.dev.vars', '/js/mock/api-core.js', '/js/mock/seed-data.js']) assert.equal((await fetch(base + path)).status, 404);
const anonymous = await call('/api/me', 'GET', undefined, 'invalid-token'); assert.equal(anonymous.data.me, null);
const before = (await call('/api/prompts/p07?visitorId=v_concurrenttest')).data.stats;
const replies = await Promise.all([1, -1].map(rating => call('/api/feedback', 'POST', { kind: 'prompt', targetId: 'p07', visitorId: 'v_concurrenttest', rating })));
assert(replies.every(r => r.status === 200));
const after = (await call('/api/prompts/p07?visitorId=v_concurrenttest')).data.stats;
assert.equal(after.helpful + after.notHelpful, before.helpful + before.notHelpful + 1);
for (const token of [admin, editor, lan]) await call('/api/logout', 'POST', {}, token);
console.log('PASS: media permissions, ownership, privacy, security headers, 404/405, secret isolation, concurrent feedback');
