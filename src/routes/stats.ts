import type { Context } from 'hono';
import type { Bindings, Row } from '../types';
import seed from '../../public/js/mock/seed-data.js';
import { all, count, first } from '../lib/db';
import { DAY } from '../lib/http';
import { usage, feedbackSelect, outFeedback } from '../lib/usage';
const vnDate = (ms: number) => new Date(ms + 7 * 3600000).toISOString().slice(0, 10);
export async function stats(c: Context<Bindings>) {
  const db = c.env.DB, days = Math.min(90, Math.max(7, Math.floor(Number(c.req.query('days')) || 14))), now = Date.now();
  const dates = Array.from({ length: days }, (_, i) => vnDate(now - (days - 1 - i) * DAY)), from = dates[0], to = dates.at(-1)!;
  const since7 = new Date(now - 7 * DAY).toISOString(), start = from + 'T00:00:00+07:00', end = new Date(new Date(to + 'T00:00:00+07:00').getTime() + DAY).toISOString();
  const [totals, range, teachers, feedback, sizes, prompts, lessons, us, recent] = await Promise.all([
    all(db, 'SELECT type,COUNT(*) n,SUM(created_at>=?) recent,COUNT(DISTINCT visitor_id) visitors,COUNT(DISTINCT CASE WHEN created_at>=? THEN visitor_id END) visitors7 FROM events GROUP BY type', [since7, since7]),
    all(db, "SELECT date(created_at,'+7 hours') date,type,target_id,COUNT(*) n FROM events WHERE created_at>=? AND created_at<? GROUP BY date,type,target_id", [new Date(start).toISOString(), end]),
    first(db, "SELECT COUNT(*) n,SUM(created_at>=?) new7,SUM(last_active_at>=?) active7 FROM users WHERE role='teacher'", [since7, since7]),
    first(db, "SELECT COUNT(*) n,SUM(status='new') new_count,ROUND(100.0*SUM(kind='prompt' AND rating=1)/NULLIF(SUM(kind='prompt'),0)) helpful_rate,ROUND(AVG(CASE WHEN kind='lesson' THEN rating END),1) lesson_rating FROM feedback"),
    first(db, 'SELECT (SELECT COUNT(*) FROM plans) plans,(SELECT COUNT(*) FROM profiles) profiles,(SELECT COUNT(*) FROM bookmarks) bookmarks'),
    all(db, 'SELECT id,title,subject,grade,purpose,status FROM prompts'), all(db, 'SELECT id,title,subject,grade,status FROM lessons'), usage(db), all(db, feedbackSelect + ' ORDER BY f.created_at DESC LIMIT 6')
  ]);
  const series: Row = Object.fromEntries(dates.map(date => [date, { date, visits: 0, promptCopies: 0, customCopies: 0, lessonViews: 0, registrations: 0, feedback: 0 }]));
  const copies: Row = {}, views: Row = {}, lessonViews: Row = {}, lessonCopies: Row = {};
  const eventKeys = { visit: 'visits', prompt_copy: 'promptCopies', custom_copy: 'customCopies', lesson_view: 'lessonViews' };
  for (const e of range) {
    if (eventKeys[e.type] && series[e.date]) series[e.date][eventKeys[e.type]] += e.n;
    const map = e.type === 'prompt_copy' ? copies : e.type === 'prompt_view' ? views : e.type === 'lesson_view' ? lessonViews : e.type === 'lesson_copy' ? lessonCopies : null;
    if (map) map[e.targetId] = (map[e.targetId] || 0) + e.n;
  }
  for (const [table, key, extra] of [['users', 'registrations', " AND role='teacher'"], ['feedback', 'feedback', '']]) {
    for (const row of await all(db, `SELECT date(created_at,'+7 hours') date,COUNT(*) n FROM ${table} WHERE created_at>=? AND created_at<?${extra} GROUP BY date`, [new Date(start).toISOString(), end])) if (series[row.date]) series[row.date][key] = row.n;
  }
  const get = type => totals.find(e => e.type === type) || { n: 0, recent: 0, visitors: 0, visitors7: 0 };
  const topPrompts = Object.entries(copies).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 8).map(([id, copies]) => {
    const p = prompts.find(p => p.id === id), s = us.prompt[id];
    return { id, title: p?.title || 'Câu lệnh đã xoá', subject: p?.subject || '', grade: p?.grade || null, exists: !!p, copies, views: views[id] || 0, helpful: s?.helpful || 0, notHelpful: s?.notHelpful || 0 };
  });
  const bySubject = seed.meta.subjects.map(subject => ({ subject, prompts: prompts.filter(p => p.subject === subject && p.status === 'published').length, copies: prompts.filter(p => p.subject === subject).reduce((n, p) => n + (copies[p.id] || 0), 0) })).filter(p => p.prompts || p.copies).sort((a, b) => b.copies - a.copies);
  const byPurpose = seed.meta.purposes.map(p => ({ purpose: p.id, name: p.name, copies: prompts.filter(x => x.purpose === p.id).reduce((n, p) => n + (copies[p.id] || 0), 0) }));
  const topLessons = lessons.map(l => { const s = us.lesson[l.id]; return { id: l.id, title: l.title, subject: l.subject, grade: l.grade, views: lessonViews[l.id] || 0, copies: lessonCopies[l.id] || 0, ratingAvg: s?.ratingCount ? Math.round(s.ratingSum / s.ratingCount * 10) / 10 : null, ratingCount: s?.ratingCount || 0 }; }).sort((a, b) => b.views - a.views);
  return c.json({ days, from, to, kpis: {
    teachers: teachers?.n || 0, newTeachers7d: teachers?.new7 || 0, activeTeachers7d: teachers?.active7 || 0,
    visits: get('visit').n, visits7d: get('visit').recent, visitors: get('visit').visitors, visitors7d: get('visit').visitors7,
    promptCopies: get('prompt_copy').n, promptCopies7d: get('prompt_copy').recent, customCopies: get('custom_copy').n, lessonViews: get('lesson_view').n, lessonCopies: get('lesson_copy').n, toolOpens: get('tool_open').n,
    ...sizes, feedback: feedback?.n || 0, feedbackNew: feedback?.newCount || 0, helpfulRate: feedback?.helpfulRate ?? null, lessonRating: feedback?.lessonRating ?? null,
    promptsPublished: prompts.filter(p => p.status === 'published').length, lessonsPublished: lessons.filter(l => l.status === 'published').length
  }, series: dates.map(d => series[d]), topPrompts, bySubject, byPurpose, topLessons, recentFeedback: recent.map(outFeedback) });
}
