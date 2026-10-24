import { Hono } from 'hono';
import seed from '../../public/js/mock/seed-data.js';
import type { Bindings, Row } from '../types';
import { all, byId, count, first, insert, update, run, searchText } from '../lib/db';
import { need, str, norm, iso } from '../lib/http';
import { rid, randomHex } from '../lib/crypto';
import { requireStaff, requireAdmin } from '../lib/auth';
import { pubUser, outPlan } from '../lib/present';
import { contentPresenter, feedbackSelect, outFeedback, targetOf } from '../lib/usage';
import { promptFields, lessonFields } from '../lib/validation';
import { seedDatabase } from '../seed/bootstrap';
import { listContent } from './public';
import { contentRoutes } from './content';
import { stats } from './stats';
export const adminRoutes = new Hono<Bindings>();
adminRoutes.use('*', async (c, next) => { if (c.req.path.endsWith('/admin/reset')) need(c.env.APP_ENV === 'dev', 404, 'Không tìm thấy'); requireStaff(c); await next(); });
adminRoutes.route('/', contentRoutes);
adminRoutes.get('/stats', stats);
for (const [table, kind, message] of [['prompts', 'prompt', 'Không tìm thấy câu lệnh'], ['lessons', 'lesson', 'Không tìm thấy bài dạy mẫu']]) {
  adminRoutes.get('/' + table, c => listContent(c, table, true));
  adminRoutes.get('/' + table + '/:id', async c => {
    const p = await byId(c.env.DB, table, c.req.param('id')!); need(p, 404, message);
    return c.json((await contentPresenter(c.env.DB, c.get('me')))(p, kind, true));
  });
  adminRoutes.post('/' + table, async c => {
    const b = c.get('body'), db = c.env.DB;
    let id = rid('p_');
    if (kind === 'lesson') {
      id = norm(b.title || 'bai-mau').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'bai-mau';
      if (await byId(db, table, id)) id += '-' + randomHex(4);
    }
    const p: Row = { id, status: 'published', order: await count(db, `SELECT MAX(sort_order) n FROM ${table}`) + 1, createdAt: iso(), updatedAt: iso() };
    if (kind === 'prompt') promptFields({ desc: '', howto: '', conditions: [], status: 'published', ...b }, p, true);
    else lessonFields({ summary: '', conditions: [], goals: '', materials: [], worksheet: '', questions: [], adaptations: [], review: [], status: 'published', duration: 35, ...b }, p, true);
    p.searchText = searchText(p, table); await insert(db, table, p).run();
    return c.json((await contentPresenter(db, c.get('me')))(p, kind, true));
  });
  adminRoutes.put('/' + table + '/:id', async c => {
    const db = c.env.DB, p = await byId(db, table, c.req.param('id')!); need(p, 404, message);
    (kind === 'prompt' ? promptFields : lessonFields)(c.get('body'), p, false);
    p.updatedAt = iso(); p.searchText = searchText(p, table);
    await update(db, table, p, 'id=?', [p.id]).run();
    return c.json((await contentPresenter(db, c.get('me')))(p, kind, true));
  });
  adminRoutes.delete('/' + table + '/:id', async c => {
    const id = c.req.param('id')!, db = c.env.DB; need(await byId(db, table, id), 404, message);
    await db.batch([db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id), db.prepare('DELETE FROM bookmarks WHERE kind=? AND target_id=?').bind(kind, id)]);
    return c.json({ ok: true });
  });
}
const userSelect = "SELECT u.*,(SELECT COUNT(*) FROM plans WHERE user_id=u.id) count_plans,(SELECT COUNT(*) FROM profiles WHERE user_id=u.id) count_profiles,(SELECT COUNT(*) FROM bookmarks WHERE user_id=u.id) count_bookmarks,(SELECT COUNT(*) FROM feedback WHERE user_id=u.id) count_feedback,(SELECT COUNT(*) FROM events WHERE user_id=u.id AND type IN ('prompt_copy','custom_copy')) count_copies FROM users u";
async function userCounts(db: D1Database, id: string) {
  const row = await first(db, userSelect + ' WHERE u.id=?', [id]);
  return countsOf(row!);
}
function countsOf(row: Row) { return { plans: row.countPlans, profiles: row.countProfiles, bookmarks: row.countBookmarks, feedback: row.countFeedback, copies: row.countCopies }; }
adminRoutes.get('/users', async c => {
  const q = c.req.query(), where: string[] = [], values: unknown[] = [];
  for (const key of ['role', 'status', 'province']) if (q[key]) { where.push(`${key}=?`); values.push(q[key]); }
  let users = await all(c.env.DB, `${userSelect} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${q.sort === 'name' ? 'name COLLATE NOCASE' : q.sort === 'joined' ? 'created_at DESC' : 'last_active_at DESC'}`, values);
  if (q.q) { const words = norm(q.q).split(/\s+/).filter(Boolean); users = users.filter(u => words.every(w => norm([u.name, u.email, u.school, u.province].join(' ')).includes(w))); }
  const items = users.map(u => ({ ...pubUser(u, c.get('me')), counts: countsOf(u) }));
  return c.json({ items, total: items.length });
});
adminRoutes.get('/users/:id', async c => {
  const db = c.env.DB, id = c.req.param('id'), u = await byId(db, 'users', id); need(u, 404, 'Không tìm thấy tài khoản');
  const [plans, profiles, bookmarks, feedback] = await Promise.all([
    all(db, 'SELECT * FROM plans WHERE user_id=?', [id]), all(db, 'SELECT id,name,updated_at FROM profiles WHERE user_id=?', [id]),
    all(db, 'SELECT kind,target_id,created_at FROM bookmarks WHERE user_id=?', [id]), all(db, feedbackSelect + ' WHERE f.user_id=?', [id])
  ]);
  return c.json({ user: { ...pubUser(u, c.get('me')), counts: await userCounts(db, id) }, plans: plans.map(p => outPlan(p)), profiles, bookmarks: await Promise.all(bookmarks.map(async b => ({ ...b, target: await targetOf(db, b.kind, b.targetId) }))), feedback: feedback.map(outFeedback) });
});
adminRoutes.post('/users/:id/lock', async c => {
  const me = requireStaff(c), db = c.env.DB, b = c.get('body'), u = await byId(db, 'users', c.req.param('id')); need(u, 404, 'Không tìm thấy tài khoản');
  need(u.id !== me.id, 400, 'Không thể tự khoá tài khoản của mình');
  need(me.role === 'admin' || u.role === 'teacher', 403, 'Biên tập viên chỉ khoá được tài khoản giáo viên');
  const patch = { status: b.lock ? 'locked' : 'active', lockReason: b.lock ? str(b.reason, 200) || 'Vi phạm quy định sử dụng' : '' };
  await db.batch([update(db, 'users', patch, 'id=?', [u.id]), ...(b.lock ? [db.prepare('DELETE FROM sessions WHERE user_id=?').bind(u.id)] : [])]);
  return c.json({ ok: true, user: { ...pubUser({ ...u, ...patch }, me), counts: await userCounts(db, u.id) } });
});
adminRoutes.post('/users/:id/role', async c => {
  const me = requireAdmin(c), db = c.env.DB, b = c.get('body'), u = await byId(db, 'users', c.req.param('id')); need(u, 404, 'Không tìm thấy tài khoản');
  need(u.id !== me.id, 400, 'Không thể tự đổi vai trò của mình'); need(seed.meta.roles.some(r => r.id === b.role), 400, 'Vai trò không hợp lệ');
  await update(db, 'users', { role: b.role }, 'id=?', [u.id]).run();
  return c.json({ ok: true, user: { ...pubUser({ ...u, role: b.role }, me), counts: await userCounts(db, u.id) } });
});
adminRoutes.get('/feedback', async c => {
  const q = c.req.query(), where: string[] = [], values: unknown[] = [];
  for (const [key, col] of [['kind', 'kind'], ['status', 'status'], ['targetId', 'target_id']]) if (q[key]) { where.push('f.' + col + '=?'); values.push(q[key]); }
  let items = (await all(c.env.DB, feedbackSelect + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY f.created_at DESC', values)).map(outFeedback);
  if (q.q) items = items.filter(f => norm(q.q).split(/\s+/).filter(Boolean).every(w => norm([f.comment, f.adminNote, f.target?.title || '', f.user?.name || ''].join(' ')).includes(w)));
  return c.json({ items, total: items.length, newCount: await count(c.env.DB, "SELECT COUNT(*) n FROM feedback WHERE status='new'") });
});
adminRoutes.put('/feedback/:id', async c => {
  const db = c.env.DB, b = c.get('body'), f = await byId(db, 'feedback', c.req.param('id')); need(f, 404, 'Không tìm thấy góp ý');
  const patch: Row = { updatedAt: iso() };
  if ('status' in b) { need(['new', 'handled'].includes(b.status), 400, 'Trạng thái không hợp lệ'); patch.status = b.status; }
  if ('adminNote' in b) patch.adminNote = str(b.adminNote, 1000);
  await update(db, 'feedback', patch, 'id=?', [f.id]).run();
  return c.json(outFeedback((await first(db, feedbackSelect + ' WHERE f.id=?', [f.id]))!));
});
adminRoutes.delete('/feedback/:id', async c => { requireAdmin(c); const r = await run(c.env.DB, 'DELETE FROM feedback WHERE id=?', [c.req.param('id')]); need(r.meta.changes, 404, 'Không tìm thấy góp ý'); return c.json({ ok: true }); });
adminRoutes.get('/events', async c => {
  const q = c.req.query(), where: string[] = [], values: unknown[] = [];
  if (q.type) { const types = q.type.split(','); where.push(`type IN (${types.map(() => '?').join(',')})`); values.push(...types); }
  for (const [key, op] of [['from', '>='], ['to', '<=']]) if (q[key]) { where.push(`date(created_at,'+7 hours')${op}?`); values.push(q[key]); }
  const filter = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.min(5000, Math.max(1, Math.floor(Number(q.limit) || 500))), offset = Math.max(0, Math.floor(Number(q.offset) || 0));
  const items = await all(c.env.DB, 'SELECT * FROM events' + filter + ' ORDER BY created_at DESC LIMIT ? OFFSET ?', [...values, limit, offset]);
  return c.json({ items, total: await count(c.env.DB, 'SELECT COUNT(*) n FROM events' + filter, values), limit, offset });
});
adminRoutes.post('/reset', async c => { requireAdmin(c); await seedDatabase(c.env, true); return c.json({ ok: true }); });
