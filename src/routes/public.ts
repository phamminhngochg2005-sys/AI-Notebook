import { Hono } from 'hono';
import seed from '../../public/js/mock/seed-data.js';
import type { Bindings, Row } from '../types';
import { all, byId, count, first, insert, run } from '../lib/db';
import { need, str, norm, iso, VISITOR_RE, HOUR } from '../lib/http';
import { rid } from '../lib/crypto';
import { contentPresenter } from '../lib/usage';
import { isStaff } from '../lib/present';
import { limit } from '../lib/ratelimit';
import { maintainOnVisit } from '../lib/maintenance';
export const publicRoutes = new Hono<Bindings>();
publicRoutes.get('/meta', async c => {
  c.executionCtx.waitUntil(maintainOnVisit(c.env.DB));
  const prompts = await all(c.env.DB, "SELECT subject,conditions FROM prompts WHERE status='published'");
  const activeSubjects = seed.meta.subjects.filter(s => prompts.some(p => p.subject === s));
  const { eventTypes, ...meta } = seed.meta;
  const { handbook, guide, checklist } = c.get('content');
  const settings = c.get('settings');
  return c.json({ ...meta, handbook, guide, checklist, activeSubjects, conditions: [...new Set(prompts.flatMap(p => p.conditions))], config: { allowRegistration: !!settings.allowRegistration, allowAnonymousFeedback: !!settings.allowAnonymousFeedback }, counts: { prompts: prompts.length, lessons: await count(c.env.DB, "SELECT COUNT(*) n FROM lessons WHERE status='published'"), subjects: activeSubjects.length } });
});
export async function listContent(c, table: string, admin = false) {
  const q = c.req.query(), values: unknown[] = [], where: string[] = [];
  const fields = table === 'prompts' ? ['subject', 'grade', 'purpose'] : ['subject', 'grade'];
  for (const k of fields) if (q[k]) { where.push(`${k}=?`); values.push(q[k]); }
  if (!admin) where.push("status='published'");
  else if (q.status) { where.push('status=?'); values.push(q.status); }
  if (table === 'prompts' && q.cond) { where.push('EXISTS (SELECT 1 FROM json_each(conditions) WHERE value=?)'); values.push(q.cond); }
  for (const word of norm(q.q || '').split(/\s+/).filter(Boolean)) { where.push("search_text LIKE ? ESCAPE '\\'"); values.push('%' + word.replace(/[\\%_]/g, '\\$&') + '%'); }
  const rows = await all(c.env.DB, `SELECT * FROM ${table} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY sort_order,created_at`, values);
  const present = await contentPresenter(c.env.DB, c.get('me'));
  return c.json({ items: rows.map(p => present(p, table === 'prompts' ? 'prompt' : 'lesson')), total: rows.length, ...(admin ? { all: await count(c.env.DB, `SELECT COUNT(*) n FROM ${table}`) } : {}) });
}
for (const [table, kind, message] of [['prompts', 'prompt', 'Không tìm thấy câu lệnh'], ['lessons', 'lesson', 'Không tìm thấy bài dạy mẫu']]) {
  publicRoutes.get('/' + table, c => listContent(c, table));
  publicRoutes.get('/' + table + '/:id', async c => {
    const p = await byId(c.env.DB, table, c.req.param('id')!);
    need(p && (p.status === 'published' || isStaff(c.get('me'))), 404, message);
    const visitor = c.req.query('visitorId') || '';
    const present = await contentPresenter(c.env.DB, c.get('me'), VISITOR_RE.test(visitor) ? visitor : undefined);
    return c.json(present(p, kind, true));
  });
}
publicRoutes.post('/events', async c => {
  const b = c.get('body'), db = c.env.DB;
  need(seed.meta.eventTypes.includes(b.type), 400, 'Loại sự kiện không hợp lệ');
  need(VISITOR_RE.test(String(b.visitorId || '')), 400, 'Mã khách truy cập không hợp lệ');
  await limit(db, 'ev:' + b.visitorId, 600, HOUR);
  let targetId: string | null = null;
  if (b.type.startsWith('prompt_')) { need(await byId(db, 'prompts', b.targetId), 404, 'Không tìm thấy câu lệnh'); targetId = b.targetId; }
  else if (b.type.startsWith('lesson_')) { need(await byId(db, 'lessons', b.targetId), 404, 'Không tìm thấy bài dạy mẫu'); targetId = b.targetId; }
  else if (b.type === 'tool_open') targetId = str(b.targetId, 40) || null;
  await insert(db, 'events', { id: rid('ev_'), type: b.type, targetId, visitorId: b.visitorId, userId: c.get('me')?.id || null, createdAt: iso() }).run();
  return c.json({ ok: true });
});
publicRoutes.post('/feedback', async c => {
  const b = c.get('body'), db = c.env.DB, me = c.get('me'), kind = b.kind;
  need(['prompt', 'lesson', 'general'].includes(kind), 400, 'Loại góp ý không hợp lệ');
  if (!me) { need(c.get('settings').allowAnonymousFeedback, 401, 'Vui lòng đăng nhập để gửi góp ý'); need(VISITOR_RE.test(String(b.visitorId || '')), 400, 'Mã khách truy cập không hợp lệ'); }
  await limit(db, 'fb:' + (me?.id || b.visitorId), 30, HOUR);
  const comment = str(b.comment, 1000), rating = b.rating == null || b.rating === '' ? null : Number(b.rating);
  let targetId: string | null = null;
  if (kind === 'prompt') { need(await byId(db, 'prompts', b.targetId), 404, 'Không tìm thấy câu lệnh'); need(rating === 1 || rating === -1, 400, 'Vui lòng chọn Hữu ích hoặc Chưa hữu ích'); targetId = b.targetId; }
  if (kind === 'lesson') { need(await byId(db, 'lessons', b.targetId), 404, 'Không tìm thấy bài dạy mẫu'); need(rating !== null && Number.isInteger(rating) && rating >= 1 && rating <= 5, 400, 'Vui lòng chọn từ 1 đến 5 sao'); targetId = b.targetId; }
  if (kind === 'general') { need(comment.length >= 5, 400, 'Nội dung góp ý cần ít nhất 5 ký tự'); need(rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5), 400, 'Đánh giá từ 1 đến 5 sao'); }
  const f: Row = { id: rid('fb_'), userId: me?.id || null, visitorId: me ? null : b.visitorId, kind, targetId, rating, comment, status: 'new', adminNote: '', createdAt: iso(), updatedAt: iso() };
  const cols = ['id', 'user_id', 'visitor_id', 'kind', 'target_id', 'rating', 'comment', 'status', 'admin_note', 'created_at', 'updated_at'];
  const conflict = kind === 'general' ? '' : me ? "ON CONFLICT(user_id,kind,target_id) WHERE user_id IS NOT NULL AND kind <> 'general'" : "ON CONFLICT(visitor_id,kind,target_id) WHERE user_id IS NULL AND kind <> 'general'";
  const saved = await first(db, `INSERT INTO feedback (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')}) ${conflict ? conflict + " DO UPDATE SET rating=excluded.rating,comment=excluded.comment,status='new',updated_at=excluded.updated_at" : ''} RETURNING id,rating,comment,created_at`, Object.values(f));
  return c.json({ ok: true, feedback: saved });
});
