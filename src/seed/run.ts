import SEED from '../../public/js/mock/seed-data.js';
import type { Row } from '../types';
import { randomHex } from '../lib/crypto';
const DAY = 86400000, HOUR = 3600000;
const clone = o => structuredClone(o);
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function buildSeed(deps) {
      const t = Date.now();
      const ago = (d = 0, h = 0) => new Date(t - d * DAY - h * HOUR).toISOString();
      const isDev = deps.env === 'dev';
      const d: Row = {
        version: SEED.version,
        kv: { handbook: clone(SEED.handbook), guide: clone(SEED.guide), checklist: clone(SEED.checklist), settings: clone(SEED.settings) },
        users: [], sessions: [], prompts: [], lessons: [], profiles: [], plans: [], bookmarks: [], feedback: [], events: [],
      };
      d.prompts = SEED.prompts.map(p => ({ ...clone(p), createdAt: ago(30), updatedAt: ago(30) }));
      d.lessons = SEED.lessons.map(l => ({ ...clone(l), createdAt: ago(30), updatedAt: ago(30) }));
      if (!isDev) { // production: chỉ nội dung + admin đầu tiên từ biến môi trường (PLAN.md 11.2)
        const b = deps.bootstrap || {};
        if (b.email && b.password) d.users.push({ id: 'u_' + randomHex(10), email: String(b.email).toLowerCase(), name: 'Quản trị viên', school: 'Nhóm nghiên cứu', province: 'Tỉnh/thành khác', subjects: [], grades: [], role: 'admin', status: 'active', lockReason: '', passHash: deps.hashPassword(String(b.password)), createdAt: ago(), lastActiveAt: ago() });
        return d;
      }

      const hAdmin = deps.hashPassword('admin123'), hUser = deps.hashPassword('123456');
      d.users = SEED.users.map(u => ({
        id: u.id, email: u.email, name: u.name, school: u.school, province: u.province,
        subjects: [...u.subjects], grades: [...u.grades], role: u.role, status: u.status, lockReason: u.lockReason || '',
        passHash: u.id === 'u_admin' ? hAdmin : hUser, createdAt: ago(u.daysAgo, 3), lastActiveAt: u.status === 'locked' ? ago(u.daysAgo) : ago(Math.max(0, Math.floor(u.daysAgo / 4)), 2),
      }));
      d.profiles = SEED.profiles.map(p => ({ id: p.id, userId: p.userId, name: p.name, data: clone(p.data), createdAt: ago(p.daysAgo), updatedAt: ago(p.daysAgo) }));
      d.plans = SEED.plans.map(p => ({ id: p.id, userId: p.userId, title: p.title, subject: p.subject, grade: p.grade, basePromptId: p.basePromptId, promptText: p.promptText, aiResult: p.aiResult, note: p.note, checks: [...p.checks], status: p.status, createdAt: ago(p.daysAgo), updatedAt: ago(p.updatedDaysAgo) }));
      d.bookmarks = SEED.bookmarks.map(b => ({ userId: b.userId, kind: b.kind, targetId: b.targetId, createdAt: ago(b.daysAgo) }));
      d.feedback = SEED.feedback.map((f, i) => ({ id: 'fb_seed' + String(i + 1).padStart(2, '0'), userId: f.userId, visitorId: f.visitorId || null, kind: f.kind, targetId: f.targetId, rating: f.rating, comment: f.comment, status: f.status, adminNote: f.adminNote, createdAt: ago(f.daysAgo, 5), updatedAt: ago(f.daysAgo, 5) }));

      // Sự kiện sử dụng 21 ngày gần nhất (giả lập, cố định nhờ hạt giống ngẫu nhiên)
      const rnd = mulberry32(2026);
      const pick = (arr, w) => { let x = rnd() * w.total; for (let i = 0; i < arr.length; i++) { x -= w.list[i]; if (x <= 0) return arr[i]; } return arr[arr.length - 1]; };
      const weights = list => ({ list, total: list.reduce((a, b) => a + b, 0) });
      const pIds = d.prompts.map(p => p.id), lIds = d.lessons.map(l => l.id);
      const pW = weights(pIds.map((_, i) => 1 / (1 + ((i * 37) % 80) * 0.12)));
      const lW = weights(lIds.map((_, i) => 6 - i));
      const teacherIds = d.users.filter(u => u.role === 'teacher' && u.status === 'active').map(u => u.id);
      let n = 0;
      const ev = (type, targetId, visitorId, userId, ms) => d.events.push({ id: 'ev_s' + (++n), type, targetId, visitorId, userId, createdAt: new Date(ms).toISOString() });
      const scale = deps.eventScale ?? 1;
      for (let day = 20; day >= 0; day--) {
        const base = t - day * DAY;
        const visits = Math.round((10 + (20 - day) * 1.1 + rnd() * 9) * scale);
        for (let v = 0; v < visits; v++) {
          const ms = base - Math.floor(rnd() * 13 * HOUR) - HOUR;
          const vid = 'v_seed' + Math.floor(rnd() * 400).toString(36).padStart(4, '0');
          const uid = rnd() < 0.22 ? teacherIds[Math.floor(rnd() * teacherIds.length)] : null;
          ev('visit', null, vid, uid, ms);
          const views = 1 + Math.floor(rnd() * 3);
          for (let k = 0; k < views; k++) { const pid = pick(pIds, pW); ev('prompt_view', pid, vid, uid, ms + 60000 * (k + 1)); if (rnd() < 0.55) ev('prompt_copy', pid, vid, uid, ms + 60000 * (k + 1) + 20000); }
          if (rnd() < 0.25) ev('custom_copy', null, vid, uid, ms + 6 * 60000);
          if (rnd() < 0.35) { const lid = pick(lIds, lW); ev('lesson_view', lid, vid, uid, ms + 8 * 60000); if (rnd() < 0.3) ev('lesson_copy', lid, vid, uid, ms + 9 * 60000); }
          if (rnd() < 0.15) ev('tool_open', ['chatgpt', 'gemini', 'copilot'][Math.floor(rnd() * 3)], vid, uid, ms + 7 * 60000);
        }
      }
      d.events.sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
      return d;
    }

