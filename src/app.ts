import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Bindings } from './types';
import { ApiError, iso } from './lib/http';
import { all, run } from './lib/db';
import { currentUser } from './lib/auth';
import { bootstrap } from './seed/bootstrap';
import { publicRoutes } from './routes/public';
import { accountRoutes } from './routes/account';
import { personalRoutes } from './routes/personal';
import { adminRoutes } from './routes/admin';
import { integrationRoutes } from './routes/integrations';
export const app = new Hono<Bindings>().basePath('/api');
app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store'); c.header('X-Content-Type-Options', 'nosniff'); c.header('Referrer-Policy', 'strict-origin-when-cross-origin'); c.header('X-Frame-Options', 'SAMEORIGIN');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});
app.use('*', bodyLimit({ maxSize: 2 * 1024 * 1024, onError: c => c.json({ error: 'Dữ liệu gửi lên quá lớn' }, 413) }));
app.use('*', async (c, next) => {
  await bootstrap(c.env);
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/, '') || '';
  const me = await currentUser(c.env.DB, token);
  c.set('token', token); c.set('me', me);
  if (me && Date.now() - new Date(me.lastActiveAt || 0).getTime() > 60000) await run(c.env.DB, 'UPDATE users SET last_active_at=? WHERE id=?', [iso(), me.id]);
  const content = Object.fromEntries((await all(c.env.DB, 'SELECT key,value FROM kv_store')).map(k => [k.key, k.value]));
  c.set('content', content); c.set('settings', content.settings);
  let body = {};
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    const raw = await c.req.text();
    if (raw.trim()) { try { const b = JSON.parse(raw); body = b && typeof b === 'object' && !Array.isArray(b) ? b : {}; } catch { throw new ApiError(400, 'Dữ liệu gửi lên không phải JSON hợp lệ'); } }
  }
  c.set('body', body);
  await next();
});
app.route('/', publicRoutes).route('/', accountRoutes).route('/', personalRoutes).route('/admin', adminRoutes).route('/', integrationRoutes);
app.notFound(c => {
  const path = c.req.path.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const exists = app.routes.some(r => r.method !== 'ALL' && r.path.replace(/^\/api/, '').split('/').length === path.split('/').length && r.path.replace(/^\/api/, '').split('/').every((p, i) => p.startsWith(':') || p === path.split('/')[i]));
  return c.json({ error: exists ? 'Phương thức không được hỗ trợ' : 'Không tìm thấy đường dẫn API' }, exists ? 405 : 404);
});
app.onError((error, c) => {
  if (error instanceof ApiError) return c.json({ error: error.message }, error.status as 400);
  console.error({ message: 'API request failed', path: c.req.path, error: error.name });
  return c.json({ error: 'Lỗi máy chủ, vui lòng thử lại' }, 500);
});
