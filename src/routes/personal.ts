import { Hono } from 'hono';
import type { Bindings, Row } from '../types';
import { requireAuth } from '../lib/auth';
import { all, byId, first, insert, update, run, count } from '../lib/db';
import { need, str, iso, MSG } from '../lib/http';
import { rid } from '../lib/crypto';
import { profileData, planFields } from '../lib/validation';
import { outPlan, outProfile, isStaff } from '../lib/present';
import { contentPresenter } from '../lib/usage';
export const personalRoutes = new Hono<Bindings>();
personalRoutes.get('/me/bookmarks', async c => {
  const u = requireAuth(c), db = c.env.DB;
  const rows = await all(db, 'SELECT * FROM bookmarks WHERE user_id=? ORDER BY created_at DESC', [u.id]);
  const present = await contentPresenter(db, u);
  const [prompts, lessons] = await Promise.all([
    all(db, "SELECT * FROM prompts WHERE id IN (SELECT target_id FROM bookmarks WHERE user_id=? AND kind='prompt')", [u.id]),
    all(db, "SELECT * FROM lessons WHERE id IN (SELECT target_id FROM bookmarks WHERE user_id=? AND kind='lesson')", [u.id])
  ]);
  const items = rows.map(b => {
    const item = (b.kind === 'prompt' ? prompts : lessons).find(p => p.id === b.targetId);
    return { kind: b.kind, targetId: b.targetId, createdAt: b.createdAt, item: item && (item.status === 'published' || isStaff(u)) ? present(item, b.kind) : null };
  });
  return c.json({ items });
});
personalRoutes.put('/me/bookmarks/:kind/:id', async c => {
  const u = requireAuth(c), { kind, id } = c.req.param();
  need(['prompt', 'lesson'].includes(kind), 400, 'Loại mục lưu không hợp lệ');
  const t = await byId(c.env.DB, kind === 'prompt' ? 'prompts' : 'lessons', id);
  need(t && t.status === 'published', 404, MSG.notFound);
  await run(c.env.DB, 'INSERT OR IGNORE INTO bookmarks(user_id,kind,target_id,created_at) VALUES(?,?,?,?)', [u.id, kind, id, iso()]);
  return c.json({ ok: true, bookmarked: true });
});
personalRoutes.delete('/me/bookmarks/:kind/:id', async c => {
  const u = requireAuth(c), { kind, id } = c.req.param();
  await run(c.env.DB, 'DELETE FROM bookmarks WHERE user_id=? AND kind=? AND target_id=?', [u.id, kind, id]);
  return c.json({ ok: true, bookmarked: false });
});
for (const table of ['profiles', 'plans']) {
  const profile = table === 'profiles', message = profile ? 'Không tìm thấy hồ sơ lớp' : 'Không tìm thấy kế hoạch';
  personalRoutes.get('/me/' + table, async c => {
    const u = requireAuth(c);
    const rows = await all(c.env.DB, `SELECT * FROM ${table} WHERE user_id=? ORDER BY updated_at DESC`, [u.id]);
    return c.json({ items: rows.map(p => profile ? outProfile(p) : outPlan(p)) });
  });
  personalRoutes.post('/me/' + table, async c => {
    const u = requireAuth(c), db = c.env.DB, b = c.get('body'), max = c.get('settings')[profile ? 'maxProfilesPerUser' : 'maxPlansPerUser'];
    const error = `Mỗi tài khoản lưu tối đa ${max} ${profile ? 'hồ sơ lớp' : 'kế hoạch'}`;
    need(await count(db, `SELECT COUNT(*) n FROM ${table} WHERE user_id=?`, [u.id]) < max, 409, error);
    const p: Row = { id: rid(profile ? 'cp_' : 'pl_'), userId: u.id };
    if (profile) {
      p.name = str(b.name, 80); need(p.name.length >= 2, 400, 'Đặt tên hồ sơ lớp, ví dụ "Lớp 3A"'); p.data = profileData(b.data);
      if (p.data.base && !await byId(db, 'prompts', p.data.base)) p.data.base = null;
    } else {
      Object.assign(p, { title: '', subject: '', grade: 1, basePromptId: null, promptText: '', aiResult: '', note: '', checks: [], status: 'draft' });
      planFields({ checks: [], status: 'draft', aiResult: '', note: '', basePromptId: null, ...b }, p, true);
      if (p.basePromptId && !await byId(db, 'prompts', p.basePromptId)) p.basePromptId = null;
      need(p.promptText.length >= 10, 400, 'Kế hoạch cần có câu lệnh đã tạo');
    }
    p.createdAt = p.updatedAt = iso();
    const result = await insert(db, table, p, `WHERE (SELECT COUNT(*) FROM ${table} WHERE user_id=?) < ?`, [u.id, max]).run();
    need(result.meta.changes, 409, error);
    return c.json(profile ? outProfile(p) : outPlan(p, true));
  });
  personalRoutes.put('/me/' + table + '/:id', async c => {
    const u = requireAuth(c), b = c.get('body'), db = c.env.DB;
    const p = await first(db, `SELECT * FROM ${table} WHERE id=? AND user_id=?`, [c.req.param('id'), u.id]); need(p, 404, message);
    if (profile) {
      if ('name' in b) { p.name = str(b.name, 80); need(p.name.length >= 2, 400, 'Đặt tên hồ sơ lớp, ví dụ "Lớp 3A"'); }
      if ('data' in b) { p.data = profileData(b.data); if (p.data.base && !await byId(db, 'prompts', p.data.base)) p.data.base = null; }
    } else { planFields(b, p, false); if (p.basePromptId && !await byId(db, 'prompts', p.basePromptId)) p.basePromptId = null; }
    p.updatedAt = iso();
    await update(db, table, p, 'id=? AND user_id=?', [p.id, u.id]).run();
    return c.json(profile ? outProfile(p) : outPlan(p, true));
  });
  personalRoutes.delete('/me/' + table + '/:id', async c => {
    const u = requireAuth(c);
    const r = await run(c.env.DB, `DELETE FROM ${table} WHERE id=? AND user_id=?`, [c.req.param('id'), u.id]); need(r.meta.changes, 404, message);
    return c.json({ ok: true });
  });
}
personalRoutes.get('/me/plans/:id', async c => {
  const u = requireAuth(c), p = await first(c.env.DB, 'SELECT * FROM plans WHERE id=? AND user_id=?', [c.req.param('id'), u.id]); need(p, 404, 'Không tìm thấy kế hoạch');
  return c.json(outPlan(p, true));
});
