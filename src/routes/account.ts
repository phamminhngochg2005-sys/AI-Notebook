import { Hono } from 'hono';
import type { Bindings, Row } from '../types';
import { need, str, iso, HOUR } from '../lib/http';
import { first, count, insert, run, update } from '../lib/db';
import { rid, hashPassword, verifyPassword, sha256Hex } from '../lib/crypto';
import { requireAuth, session } from '../lib/auth';
import { pubUser } from '../lib/present';
import { profileFields } from '../lib/validation';
import { iterations } from '../seed/bootstrap';
import { limit } from '../lib/ratelimit';
export const accountRoutes = new Hono<Bindings>();
accountRoutes.post('/register', async c => {
  const b = c.get('body'), db = c.env.DB;
  need(c.get('settings').allowRegistration, 403, 'Sổ tay đang tạm dừng đăng ký tài khoản mới');
  await limit(db, 'reg:' + (c.req.header('CF-Connecting-IP') || ''), 5, HOUR);
  const email = str(b.email, 120).toLowerCase();
  need(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), 400, 'Email không hợp lệ');
  need(String(b.password || '').length >= 6, 400, 'Mật khẩu cần ít nhất 6 ký tự');
  need(!await first(db, 'SELECT id FROM users WHERE email=?', [email]), 409, 'Email này đã được đăng ký');
  const u: Row = { id: rid('u_'), email, name: '', school: '', province: '', subjects: [], grades: [], role: 'teacher', status: 'active', lockReason: '', passHash: '', createdAt: iso(), lastActiveAt: iso() };
  profileFields({ name: b.name, school: b.school, province: b.province, subjects: b.subjects, grades: b.grades }, u);
  u.passHash = await hashPassword(String(b.password), iterations(c.env));
  try { await insert(db, 'users', u).run(); } catch (error) { if (await first(db, 'SELECT id FROM users WHERE email=?', [email])) need(false, 409, 'Email này đã được đăng ký'); throw error; }
  return c.json({ token: await session(db, u), me: pubUser(u, u) });
});
accountRoutes.post('/login', async c => {
  const b = c.get('body'), db = c.env.DB;
  let email = str(b.email ?? b.username, 120).toLowerCase();
  if (c.env.APP_ENV !== 'dev' && email === (c.env.ADMIN_USERNAME || 'ADMIN').toLowerCase()) email = (c.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@sotayai.vn').toLowerCase();
  await limit(db, 'login:' + (c.req.header('CF-Connecting-IP') || '') + ':' + email, 10, 600000);
  const u = await first(db, 'SELECT * FROM users WHERE email=?', [email]);
  need(u && await verifyPassword(String(b.password || ''), u.passHash), 401, 'Email hoặc mật khẩu không đúng');
  need(u.status !== 'locked', 403, 'Tài khoản đã bị khoá' + (u.lockReason ? ': ' + u.lockReason : ''));
  u.lastActiveAt = iso();
  await run(db, 'UPDATE users SET last_active_at=? WHERE id=?', [u.lastActiveAt, u.id]);
  return c.json({ token: await session(db, u), me: pubUser(u, u) });
});
accountRoutes.post('/logout', async c => { await run(c.env.DB, 'DELETE FROM sessions WHERE token_hash=?', [await sha256Hex(c.get('token'))]); return c.json({ ok: true }); });
accountRoutes.get('/me', async c => {
  const me = c.get('me'); if (!me) return c.json({ me: null });
  const counts = Object.fromEntries(await Promise.all(['bookmarks', 'profiles', 'plans'].map(async t => [t, await count(c.env.DB, `SELECT COUNT(*) n FROM ${t} WHERE user_id=?`, [me.id])])));
  return c.json({ me: pubUser(me, me), counts });
});
accountRoutes.put('/me', async c => {
  const u = { ...requireAuth(c) }; profileFields(c.get('body'), u);
  const { name, school, province, subjects, grades } = u;
  await update(c.env.DB, 'users', { name, school, province, subjects, grades }, 'id=?', [u.id]).run();
  return c.json({ me: pubUser(u, u) });
});
accountRoutes.post('/auth/change-password', async c => {
  const u = requireAuth(c), b = c.get('body');
  need(await verifyPassword(String(b.current || ''), u.passHash), 400, 'Mật khẩu hiện tại không đúng');
  need(String(b.next || '').length >= 6, 400, 'Mật khẩu mới cần ít nhất 6 ký tự');
  await c.env.DB.batch([
    update(c.env.DB, 'users', { passHash: await hashPassword(String(b.next), iterations(c.env)) }, 'id=?', [u.id]),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(u.id, await sha256Hex(c.get('token')))
  ]);
  return c.json({ ok: true });
});
