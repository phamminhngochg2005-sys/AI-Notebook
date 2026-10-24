import { all, first } from './db';
import type { Row } from '../types';
export async function usage(db: D1Database) {
  const [events, feedback] = await Promise.all([
    all(db, 'SELECT target_id,type,COUNT(*) n FROM events WHERE target_id IS NOT NULL GROUP BY type,target_id'),
    all(db, 'SELECT kind,target_id,SUM(rating=1) helpful,SUM(rating=-1) not_helpful,SUM(rating) rating_sum,COUNT(rating) rating_count FROM feedback WHERE kind<>? GROUP BY kind,target_id', ['general'])
  ]);
  const stats: Row = { prompt: {}, lesson: {} };
  const get = (kind, id) => stats[kind][id] ||= { views: 0, copies: 0, helpful: 0, notHelpful: 0, ratingSum: 0, ratingCount: 0 };
  for (const e of events) {
    const [kind, action] = e.type.split('_');
    if (stats[kind] && ['view', 'copy'].includes(action)) get(kind, e.targetId)[action === 'view' ? 'views' : 'copies'] = e.n;
  }
  for (const f of feedback) Object.assign(get(f.kind, f.targetId), { helpful: f.helpful, notHelpful: f.notHelpful, ratingSum: f.ratingSum, ratingCount: f.ratingCount });
  return stats;
}
export async function contentPresenter(db: D1Database, me: Row | null, visitorId?: string) {
  const [stats, bookmarks, feedback] = await Promise.all([
    usage(db), me ? all(db, 'SELECT kind,target_id FROM bookmarks WHERE user_id=?', [me.id]) : [],
    me ? all(db, 'SELECT * FROM feedback WHERE user_id=?', [me.id]) : visitorId ? all(db, 'SELECT * FROM feedback WHERE user_id IS NULL AND visitor_id=?', [visitorId]) : []
  ]);
  return (row: Row, kind: string, full = false) => {
    const s = stats[kind][row.id] || { views: 0, copies: 0, helpful: 0, notHelpful: 0, ratingSum: 0, ratingCount: 0 };
    const o: Row = { ...row, bookmarked: bookmarks.some(b => b.kind === kind && b.targetId === row.id) };
    delete o.searchText;
    if (kind === 'prompt') o.stats = { views: s.views, copies: s.copies, helpful: s.helpful, notHelpful: s.notHelpful };
    else {
      o.stats = { views: s.views, copies: s.copies, ratingAvg: s.ratingCount ? Math.round(s.ratingSum / s.ratingCount * 10) / 10 : null, ratingCount: s.ratingCount };
      o.activityCount = row.activities.length; o.adaptationCount = row.adaptations.length;
      if (!full) for (const key of ['goals', 'materials', 'activities', 'worksheet', 'questions', 'adaptations', 'review']) delete o[key];
    }
    if (full) { const f = feedback.find(f => f.kind === kind && f.targetId === row.id); o.myFeedback = f ? { id: f.id, rating: f.rating, comment: f.comment, createdAt: f.createdAt } : null; }
    return o;
  };
}
export async function targetOf(db: D1Database, kind: string, id: string) {
  if (!['prompt', 'lesson'].includes(kind)) return null;
  const p = await first(db, `SELECT id,title,subject,grade FROM ${kind === 'prompt' ? 'prompts' : 'lessons'} WHERE id=?`, [id]);
  return { type: kind, id, title: p?.title || (kind === 'prompt' ? 'Câu lệnh đã xoá' : 'Bài mẫu đã xoá'), exists: !!p, ...(p ? { subject: p.subject, grade: p.grade } : {}) };
}
export const feedbackSelect = `SELECT f.*,u.name user_name,u.school user_school,u.role user_role,p.title prompt_title,p.subject prompt_subject,p.grade prompt_grade,l.title lesson_title,l.subject lesson_subject,l.grade lesson_grade FROM feedback f LEFT JOIN users u ON u.id=f.user_id LEFT JOIN prompts p ON f.kind='prompt' AND p.id=f.target_id LEFT JOIN lessons l ON f.kind='lesson' AND l.id=f.target_id`;
export function outFeedback(f: Row) {
  const title = f.kind === 'prompt' ? f.promptTitle : f.lessonTitle;
  return { id: f.id, kind: f.kind, targetId: f.targetId, rating: f.rating, comment: f.comment, status: f.status, adminNote: f.adminNote, createdAt: f.createdAt, updatedAt: f.updatedAt, anonymous: !f.userId,
    user: f.userName ? { id: f.userId, name: f.userName, role: f.userRole, school: f.userSchool } : null,
    target: f.kind === 'general' ? null : { type: f.kind, id: f.targetId, title: title || (f.kind === 'prompt' ? 'Câu lệnh đã xoá' : 'Bài mẫu đã xoá'), exists: !!title, ...(title ? { subject: f.kind === 'prompt' ? f.promptSubject : f.lessonSubject, grade: f.kind === 'prompt' ? f.promptGrade : f.lessonGrade } : {}) }
  };
}
