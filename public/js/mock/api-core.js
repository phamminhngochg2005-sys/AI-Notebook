/* Sổ tay AI — lõi API tham chiếu (một nguồn logic, chạy ở hai nơi).
 *  - server.js (Node): lưu data/db.json, băm mật khẩu PBKDF2.
 *  - Trình duyệt (chế độ xem thử, js/core.js): lưu localStorage khi không có backend.
 * Backend thật trên Cloudflare (Codex viết trong src/) phải giữ đúng hành vi của file này — xem PLAN.md.
 *
 * createApi(deps).handle({ method, path, query, body, token, ip }) → { status, body }
 * deps: { seed, load(), save(db), hashPassword(pw), verifyPassword(pw, hash), hashToken(token),
 *         randomHex(n), now() → ms, env: 'dev' | 'production' }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SotayApiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const need = (cond, status, msg) => { if (!cond) throw new ApiError(status, msg); };
  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();
  const clone = o => JSON.parse(JSON.stringify(o));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const VISITOR_RE = /^v_[a-z0-9]{6,40}$/;
  const DAY = 86400000, HOUR = 3600000;
  const SESSION_DAYS = 30;
  const MSG = {
    auth: 'Vui lòng đăng nhập để tiếp tục',
    staff: 'Bạn không có quyền truy cập trang quản trị',
    admin: 'Chỉ quản trị viên được thực hiện thao tác này',
    notFound: 'Không tìm thấy dữ liệu',
    rate: 'Bạn thao tác quá nhanh, thử lại sau ít phút',
  };

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const vnDate = (iso) => new Date(new Date(iso).getTime() + 7 * HOUR).toISOString().slice(0, 10);

  function createApi(deps) {
    const SEED = deps.seed;
    const META = SEED.meta;
    const PURPOSE_IDS = META.purposes.map(p => p.id);
    const now = () => deps.now();
    const iso = (ms) => new Date(ms ?? now()).toISOString();
    const rid = (prefix) => prefix + deps.randomHex(10);
    const rate = new Map();
    let db = null;

    function persist() { deps.save(db); }
    function loadDb() {
      db = deps.load();
      if (!db || db.version !== SEED.version) { db = buildSeed(); persist(); }
    }

    /* ================= Dữ liệu mẫu ================= */
    function buildSeed() {
      const t = now();
      const ago = (d = 0, h = 0) => iso(t - d * DAY - h * HOUR);
      const isDev = deps.env === 'dev';
      const d = {
        version: SEED.version,
        kv: { handbook: clone(SEED.handbook), guide: clone(SEED.guide), checklist: clone(SEED.checklist), settings: clone(SEED.settings) },
        users: [], sessions: [], prompts: [], lessons: [], profiles: [], plans: [], bookmarks: [], feedback: [], events: [],
      };
      d.prompts = SEED.prompts.map(p => ({ ...clone(p), createdAt: ago(30), updatedAt: ago(30) }));
      d.lessons = SEED.lessons.map(l => ({ ...clone(l), createdAt: ago(30), updatedAt: ago(30) }));
      if (!isDev) { // production: chỉ nội dung + admin đầu tiên từ biến môi trường (PLAN.md 11.2)
        const b = deps.bootstrap || {};
        if (b.email && b.password) d.users.push({ id: rid('u_'), email: String(b.email).toLowerCase(), name: 'Quản trị viên', school: 'Nhóm nghiên cứu', province: 'Tỉnh/thành khác', subjects: [], grades: [], role: 'admin', status: 'active', lockReason: '', passHash: deps.hashPassword(String(b.password)), createdAt: ago(), lastActiveAt: ago() });
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
      const ev = (type, targetId, visitorId, userId, ms) => d.events.push({ id: 'ev_s' + (++n), type, targetId, visitorId, userId, createdAt: iso(ms) });
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

    /* ================= Tiện ích truy vấn ================= */
    const kv = k => db.kv[k];
    const userById = id => db.users.find(u => u.id === id) || null;
    const promptById = id => db.prompts.find(p => p.id === id) || null;
    const lessonById = id => db.lessons.find(l => l.id === id) || null;
    const isStaff = u => !!u && (u.role === 'editor' || u.role === 'admin');
    const isAdmin = u => !!u && u.role === 'admin';

    function currentUser(token) {
      if (!token) return null;
      const h = deps.hashToken(token);
      const s = db.sessions.find(x => x.tokenHash === h);
      if (!s) return null;
      if (new Date(s.expiresAt).getTime() < now()) { db.sessions = db.sessions.filter(x => x !== s); persist(); return null; }
      const u = userById(s.userId);
      if (!u || u.status === 'locked') return null;
      return u;
    }
    function requireAuth(ctx) { need(ctx.me, 401, MSG.auth); return ctx.me; }
    function requireStaff(ctx) { need(ctx.me, 401, MSG.auth); need(isStaff(ctx.me), 403, MSG.staff); return ctx.me; }
    function requireAdmin(ctx) { requireStaff(ctx); need(isAdmin(ctx.me), 403, MSG.admin); return ctx.me; }
    function touch(u) {
      if (!u) return;
      const last = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      if (now() - last > 60000) { u.lastActiveAt = iso(); persist(); }
    }
    function limit(key, max, windowMs) {
      const t = now(); const arr = (rate.get(key) || []).filter(x => t - x < windowMs);
      need(arr.length < max, 429, MSG.rate);
      arr.push(t); rate.set(key, arr);
    }
    function newSession(u) {
      const token = deps.randomHex(48);
      db.sessions.push({ tokenHash: deps.hashToken(token), userId: u.id, createdAt: iso(), expiresAt: iso(now() + SESSION_DAYS * DAY) });
      return token;
    }

    /* Số liệu sử dụng: tính một lần mỗi request khi cần */
    function usage() {
      const m = { prompt: {}, lesson: {} };
      const bump = (kind, id, key) => { const o = m[kind][id] || (m[kind][id] = { views: 0, copies: 0, helpful: 0, notHelpful: 0, ratingSum: 0, ratingCount: 0 }); o[key]++; return o; };
      for (const e of db.events) {
        if (e.type === 'prompt_view') bump('prompt', e.targetId, 'views');
        else if (e.type === 'prompt_copy') bump('prompt', e.targetId, 'copies');
        else if (e.type === 'lesson_view') bump('lesson', e.targetId, 'views');
        else if (e.type === 'lesson_copy') bump('lesson', e.targetId, 'copies');
      }
      for (const f of db.feedback) {
        if (f.kind === 'prompt' && f.rating === 1) bump('prompt', f.targetId, 'helpful');
        else if (f.kind === 'prompt' && f.rating === -1) bump('prompt', f.targetId, 'notHelpful');
        else if (f.kind === 'lesson' && f.rating) { const o = bump('lesson', f.targetId, 'ratingCount'); o.ratingSum += f.rating; }
      }
      return m;
    }
    const EMPTY_STATS = { views: 0, copies: 0, helpful: 0, notHelpful: 0, ratingSum: 0, ratingCount: 0 };

    /* ================= Định dạng trả về ================= */
    function pubUser(u, viewer) {
      if (!u) return { id: null, name: 'Tài khoản đã xoá', role: 'teacher', status: 'deleted' };
      const o = { id: u.id, name: u.name, school: u.school, province: u.province, subjects: [...u.subjects], grades: [...u.grades], role: u.role, status: u.status, joinedAt: u.createdAt };
      if (viewer && (viewer.id === u.id || isStaff(viewer))) { o.email = u.email; o.lastActiveAt = u.lastActiveAt; }
      if (isStaff(viewer)) o.lockReason = u.lockReason || '';
      return o;
    }
    const mini = u => u ? { id: u.id, name: u.name, role: u.role, school: u.school } : null;
    function myFeedback(ctx, kind, targetId) {
      const f = db.feedback.find(x => x.kind === kind && x.targetId === targetId && (ctx.me ? x.userId === ctx.me.id : (ctx.visitorId && !x.userId && x.visitorId === ctx.visitorId)));
      return f ? { id: f.id, rating: f.rating, comment: f.comment, createdAt: f.createdAt } : null;
    }
    const isBookmarked = (ctx, kind, id) => !!ctx.me && db.bookmarks.some(b => b.userId === ctx.me.id && b.kind === kind && b.targetId === id);
    function outPrompt(p, ctx, us, full) {
      const s = (us || usage()).prompt[p.id] || EMPTY_STATS;
      const o = { id: p.id, title: p.title, subject: p.subject, grade: p.grade, purpose: p.purpose, desc: p.desc, howto: p.howto, conditions: [...p.conditions], text: p.text, status: p.status, order: p.order, createdAt: p.createdAt, updatedAt: p.updatedAt,
        stats: { views: s.views, copies: s.copies, helpful: s.helpful, notHelpful: s.notHelpful }, bookmarked: isBookmarked(ctx, 'prompt', p.id) };
      if (full) o.myFeedback = myFeedback(ctx, 'prompt', p.id);
      return o;
    }
    function lessonStats(id, us) {
      const s = (us || usage()).lesson[id] || EMPTY_STATS;
      return { views: s.views, copies: s.copies, ratingAvg: s.ratingCount ? Math.round(s.ratingSum / s.ratingCount * 10) / 10 : null, ratingCount: s.ratingCount };
    }
    function outLesson(l, ctx, us, full) {
      const o = { id: l.id, title: l.title, subject: l.subject, grade: l.grade, duration: l.duration, summary: l.summary, conditions: [...l.conditions], status: l.status, order: l.order, createdAt: l.createdAt, updatedAt: l.updatedAt,
        activityCount: l.activities.length, adaptationCount: l.adaptations.length, stats: lessonStats(l.id, us), bookmarked: isBookmarked(ctx, 'lesson', l.id) };
      if (full) Object.assign(o, { goals: l.goals, materials: [...l.materials], activities: clone(l.activities), worksheet: l.worksheet, questions: [...l.questions], adaptations: [...l.adaptations], review: [...l.review], myFeedback: myFeedback(ctx, 'lesson', l.id) });
      return o;
    }
    const outProfile = p => ({ id: p.id, name: p.name, data: clone(p.data), createdAt: p.createdAt, updatedAt: p.updatedAt });
    const outPlan = (p, full) => {
      const o = { id: p.id, title: p.title, subject: p.subject, grade: p.grade, basePromptId: p.basePromptId, status: p.status, checks: [...p.checks], checked: p.checks.filter(Boolean).length, hasResult: !!p.aiResult, createdAt: p.createdAt, updatedAt: p.updatedAt };
      if (full) Object.assign(o, { promptText: p.promptText, aiResult: p.aiResult, note: p.note });
      return o;
    };
    function targetOf(kind, id) {
      if (kind === 'prompt') { const p = promptById(id); return { type: 'prompt', id, title: p ? p.title : 'Câu lệnh đã xoá', exists: !!p, subject: p?.subject, grade: p?.grade }; }
      if (kind === 'lesson') { const l = lessonById(id); return { type: 'lesson', id, title: l ? l.title : 'Bài mẫu đã xoá', exists: !!l, subject: l?.subject, grade: l?.grade }; }
      return null;
    }
    const outFeedback = f => ({ id: f.id, kind: f.kind, targetId: f.targetId, rating: f.rating, comment: f.comment, status: f.status, adminNote: f.adminNote, createdAt: f.createdAt, updatedAt: f.updatedAt,
      user: mini(userById(f.userId)), anonymous: !f.userId, target: targetOf(f.kind, f.targetId) });

    function publicMeta() {
      const pub = db.prompts.filter(p => p.status === 'published');
      const subjects = META.subjects.filter(s => pub.some(p => p.subject === s));
      return {
        handbook: clone(kv('handbook')), guide: clone(kv('guide')), checklist: clone(kv('checklist')),
        subjects: META.subjects, activeSubjects: subjects, grades: META.grades, purposes: META.purposes,
        conditions: [...new Set(pub.flatMap(p => p.conditions))],
        langLevels: META.langLevels, equipment: META.equipment, classConditions: META.classConditions, durations: META.durations,
        planStatuses: META.planStatuses, provinces: META.provinces, visuals: META.visuals, roles: META.roles, feedbackKinds: META.feedbackKinds,
        config: { allowRegistration: !!kv('settings').allowRegistration, allowAnonymousFeedback: !!kv('settings').allowAnonymousFeedback },
        counts: { prompts: pub.length, lessons: db.lessons.filter(l => l.status === 'published').length, subjects: subjects.length },
      };
    }

    /* ================= Kiểm tra dữ liệu ================= */
    const arrStr = (v, maxItems, maxLen) => (Array.isArray(v) ? v : []).map(x => str(x, maxLen)).filter(Boolean).slice(0, maxItems);
    function cleanSubjects(v) { return [...new Set((Array.isArray(v) ? v : []).filter(s => META.subjects.includes(s)))]; }
    function cleanGrades(v) { return [...new Set((Array.isArray(v) ? v : []).map(Number).filter(g => META.grades.includes(g)))].sort(); }
    function profileFields(b, u) {
      if ('name' in b) { u.name = str(b.name, 60); need(u.name.length >= 2, 400, 'Họ tên cần ít nhất 2 ký tự'); }
      if ('school' in b) { u.school = str(b.school, 120); need(u.school.length >= 2, 400, 'Vui lòng nhập tên trường'); }
      if ('province' in b) { u.province = str(b.province, 60); need(u.province, 400, 'Vui lòng chọn tỉnh/thành'); }
      if ('subjects' in b) u.subjects = cleanSubjects(b.subjects);
      if ('grades' in b) u.grades = cleanGrades(b.grades);
    }
    function promptFields(b, p, creating) {
      const has = k => creating || k in b;
      if (has('title')) { p.title = str(b.title, 120); need(p.title.length >= 3, 400, 'Tên câu lệnh cần ít nhất 3 ký tự'); }
      if (has('subject')) { p.subject = str(b.subject, 60); need(META.subjects.includes(p.subject), 400, 'Môn học không hợp lệ'); }
      if (has('grade')) { p.grade = Number(b.grade); need(META.grades.includes(p.grade), 400, 'Khối lớp không hợp lệ'); }
      if (has('purpose')) { p.purpose = str(b.purpose, 20); need(PURPOSE_IDS.includes(p.purpose), 400, 'Mục đích sử dụng không hợp lệ'); }
      if (has('desc')) p.desc = str(b.desc, 300);
      if (has('howto')) p.howto = str(b.howto, 1500);
      if (has('conditions')) p.conditions = arrStr(b.conditions, 8, 40);
      if (has('text')) { p.text = str(b.text, 4000); need(p.text.length >= 20, 400, 'Nội dung câu lệnh cần ít nhất 20 ký tự'); }
      if (has('status')) { p.status = b.status === 'hidden' ? 'hidden' : 'published'; }
      if ('order' in b) { const o = Number(b.order); need(Number.isFinite(o), 400, 'Thứ tự không hợp lệ'); p.order = o; }
    }
    function lessonFields(b, l, creating) {
      const has = k => creating || k in b;
      if (has('title')) { l.title = str(b.title, 150); need(l.title.length >= 3, 400, 'Tên bài cần ít nhất 3 ký tự'); }
      if (has('subject')) { l.subject = str(b.subject, 60); need(META.subjects.includes(l.subject), 400, 'Môn học không hợp lệ'); }
      if (has('grade')) { l.grade = Number(b.grade); need(META.grades.includes(l.grade), 400, 'Khối lớp không hợp lệ'); }
      if (has('duration')) { l.duration = Number(b.duration); need(Number.isInteger(l.duration) && l.duration >= 10 && l.duration <= 140, 400, 'Thời lượng từ 10 đến 140 phút'); }
      if (has('summary')) l.summary = str(b.summary, 400);
      if (has('conditions')) l.conditions = arrStr(b.conditions, 8, 40);
      if (has('goals')) l.goals = str(b.goals, 3000);
      if (has('materials')) l.materials = arrStr(b.materials, 20, 400);
      if (has('activities')) {
        need(Array.isArray(b.activities) && b.activities.length >= 1 && b.activities.length <= 12, 400, 'Bài dạy cần từ 1 đến 12 hoạt động');
        l.activities = b.activities.map(a => {
          const x = { name: str(a?.name, 120), minutes: Number(a?.minutes), teacher: str(a?.teacher, 1500), students: str(a?.students, 1500), evidence: str(a?.evidence, 1000) };
          need(x.name, 400, 'Mỗi hoạt động cần có tên'); need(Number.isInteger(x.minutes) && x.minutes >= 1 && x.minutes <= 120, 400, 'Số phút của hoạt động từ 1 đến 120');
          return x;
        });
      }
      if (has('worksheet')) l.worksheet = str(b.worksheet, 6000);
      if (has('questions')) l.questions = arrStr(b.questions, 20, 400);
      if (has('adaptations')) l.adaptations = arrStr(b.adaptations, 15, 600);
      if (has('review')) l.review = arrStr(b.review, 15, 600);
      if (has('status')) l.status = b.status === 'hidden' ? 'hidden' : 'published';
      if ('order' in b) { const o = Number(b.order); need(Number.isFinite(o), 400, 'Thứ tự không hợp lệ'); l.order = o; }
    }
    function profileData(v) {
      const b = v && typeof v === 'object' ? v : {};
      const base = b.base && promptById(b.base) ? b.base : null;
      return {
        subject: META.subjects.includes(b.subject) ? b.subject : META.subjects[0],
        grade: META.grades.includes(Number(b.grade)) ? String(Number(b.grade)) : '1',
        title: str(b.title, 150), goal: str(b.goal, 1000), traits: str(b.traits, 1000),
        lang: META.langLevels.includes(b.lang) ? b.lang : META.langLevels[1], home: str(b.home, 60),
        equip: arrStr(b.equip, 20, 60), equipNote: str(b.equipNote, 300),
        size: /^\d{1,3}$/.test(String(b.size ?? '').trim()) ? String(b.size).trim() : '',
        conds: arrStr(b.conds, 10, 60), condNote: str(b.condNote, 300),
        dur: META.durations.includes(String(b.dur)) ? String(b.dur) : '35',
        purpose: PURPOSE_IDS.includes(b.purpose) ? b.purpose : 'draft', source: str(b.source, 4000), base,
      };
    }
    function sortByOrder(a, b) { return (a.order ?? 0) - (b.order ?? 0) || (a.createdAt < b.createdAt ? -1 : 1); }
    function matchQuery(text, q) { const t = norm(text); return norm(q).split(/\s+/).filter(Boolean).every(w => t.includes(w)); }
    function filterPrompts(list, q) {
      return list.filter(p => (!q.subject || p.subject === q.subject) && (!q.grade || String(p.grade) === String(q.grade)) && (!q.purpose || p.purpose === q.purpose)
        && (!q.cond || p.conditions.includes(q.cond)) && (!q.status || p.status === q.status)
        && (!q.q || matchQuery([p.title, p.desc, p.subject, 'lop ' + p.grade, p.howto, p.conditions.join(' '), p.text].join(' '), q.q)));
    }
    function filterLessons(list, q) {
      return list.filter(l => (!q.subject || l.subject === q.subject) && (!q.grade || String(l.grade) === String(q.grade)) && (!q.status || l.status === q.status)
        && (!q.q || matchQuery([l.title, l.summary, l.subject, 'lop ' + l.grade, l.conditions.join(' ')].join(' '), q.q)));
    }

    /* ================= Routes ================= */
    const routes = [];
    const on = (method, pattern, fn) => routes.push({ method, parts: pattern.split('/').filter(Boolean), fn });

    /* ----- Công khai ----- */
    on('GET', '/meta', () => publicMeta());

    on('GET', '/prompts', ctx => {
      const us = usage();
      const items = filterPrompts(db.prompts.filter(p => p.status === 'published'), { ...ctx.query, status: '' }).sort(sortByOrder).map(p => outPrompt(p, ctx, us));
      return { items, total: items.length };
    });
    on('GET', '/prompts/:id', (ctx, { id }) => {
      const p = promptById(id); need(p && (p.status === 'published' || isStaff(ctx.me)), 404, 'Không tìm thấy câu lệnh');
      return outPrompt(p, ctx, null, true);
    });
    on('GET', '/lessons', ctx => {
      const us = usage();
      const items = filterLessons(db.lessons.filter(l => l.status === 'published'), { ...ctx.query, status: '' }).sort(sortByOrder).map(l => outLesson(l, ctx, us));
      return { items, total: items.length };
    });
    on('GET', '/lessons/:id', (ctx, { id }) => {
      const l = lessonById(id); need(l && (l.status === 'published' || isStaff(ctx.me)), 404, 'Không tìm thấy bài dạy mẫu');
      return outLesson(l, ctx, null, true);
    });

    on('POST', '/events', ctx => {
      const b = ctx.body;
      need(META.eventTypes.includes(b.type), 400, 'Loại sự kiện không hợp lệ');
      need(VISITOR_RE.test(String(b.visitorId || '')), 400, 'Mã khách truy cập không hợp lệ');
      limit('ev:' + b.visitorId, 600, HOUR);
      let targetId = null;
      if (b.type.startsWith('prompt_')) { need(promptById(b.targetId), 404, 'Không tìm thấy câu lệnh'); targetId = b.targetId; }
      else if (b.type.startsWith('lesson_')) { need(lessonById(b.targetId), 404, 'Không tìm thấy bài dạy mẫu'); targetId = b.targetId; }
      else if (b.type === 'tool_open') { targetId = str(b.targetId, 40) || null; }
      db.events.push({ id: rid('ev_'), type: b.type, targetId, visitorId: b.visitorId, userId: ctx.me?.id || null, createdAt: iso() });
      persist();
      return { ok: true };
    });

    on('POST', '/feedback', ctx => {
      const b = ctx.body;
      const kind = b.kind;
      need(['prompt', 'lesson', 'general'].includes(kind), 400, 'Loại góp ý không hợp lệ');
      if (!ctx.me) {
        need(kv('settings').allowAnonymousFeedback, 401, 'Vui lòng đăng nhập để gửi góp ý');
        need(VISITOR_RE.test(String(b.visitorId || '')), 400, 'Mã khách truy cập không hợp lệ');
      }
      limit('fb:' + (ctx.me?.id || b.visitorId), 30, HOUR);
      const comment = str(b.comment, 1000);
      let rating = b.rating == null || b.rating === '' ? null : Number(b.rating);
      let targetId = null;
      if (kind === 'prompt') { need(promptById(b.targetId), 404, 'Không tìm thấy câu lệnh'); need(rating === 1 || rating === -1, 400, 'Vui lòng chọn Hữu ích hoặc Chưa hữu ích'); targetId = b.targetId; }
      if (kind === 'lesson') { need(lessonById(b.targetId), 404, 'Không tìm thấy bài dạy mẫu'); need(Number.isInteger(rating) && rating >= 1 && rating <= 5, 400, 'Vui lòng chọn từ 1 đến 5 sao'); targetId = b.targetId; }
      if (kind === 'general') { need(comment.length >= 5, 400, 'Nội dung góp ý cần ít nhất 5 ký tự'); need(rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5), 400, 'Đánh giá từ 1 đến 5 sao'); }
      const owner = ctx.me ? { userId: ctx.me.id, visitorId: null } : { userId: null, visitorId: b.visitorId };
      let f = kind === 'general' ? null : db.feedback.find(x => x.kind === kind && x.targetId === targetId && (owner.userId ? x.userId === owner.userId : (!x.userId && x.visitorId === owner.visitorId)));
      if (f) { Object.assign(f, { rating, comment, status: 'new', updatedAt: iso() }); }
      else { f = { id: rid('fb_'), ...owner, kind, targetId, rating, comment, status: 'new', adminNote: '', createdAt: iso(), updatedAt: iso() }; db.feedback.push(f); }
      persist();
      return { ok: true, feedback: { id: f.id, rating: f.rating, comment: f.comment, createdAt: f.createdAt } };
    });

    /* ----- Tài khoản ----- */
    on('POST', '/register', ctx => {
      const b = ctx.body;
      need(kv('settings').allowRegistration, 403, 'Sổ tay đang tạm dừng đăng ký tài khoản mới');
      limit('reg:' + (ctx.req.ip || ''), 5, HOUR);
      const email = str(b.email, 120).toLowerCase();
      need(EMAIL_RE.test(email), 400, 'Email không hợp lệ');
      need(String(b.password || '').length >= 6, 400, 'Mật khẩu cần ít nhất 6 ký tự');
      need(!db.users.some(u => u.email === email), 409, 'Email này đã được đăng ký');
      const u = { id: rid('u_'), email, name: '', school: '', province: '', subjects: [], grades: [], role: 'teacher', status: 'active', lockReason: '', passHash: '', createdAt: iso(), lastActiveAt: iso() };
      profileFields({ name: b.name, school: b.school, province: b.province, subjects: b.subjects, grades: b.grades }, u);
      u.passHash = deps.hashPassword(String(b.password));
      db.users.push(u);
      const token = newSession(u);
      persist();
      return { token, me: pubUser(u, u) };
    });
    on('POST', '/login', ctx => {
      const b = ctx.body; const email = str(b.email, 120).toLowerCase();
      limit('login:' + (ctx.req.ip || '') + ':' + email, 10, 10 * 60000);
      const u = db.users.find(x => x.email === email);
      need(u && deps.verifyPassword(String(b.password || ''), u.passHash), 401, 'Email hoặc mật khẩu không đúng');
      need(u.status !== 'locked', 403, 'Tài khoản đã bị khoá' + (u.lockReason ? ': ' + u.lockReason : ''));
      const token = newSession(u); u.lastActiveAt = iso();
      persist();
      return { token, me: pubUser(u, u) };
    });
    on('POST', '/logout', ctx => {
      if (ctx.req.token) { const h = deps.hashToken(ctx.req.token); db.sessions = db.sessions.filter(s => s.tokenHash !== h); persist(); }
      return { ok: true };
    });
    on('GET', '/me', ctx => {
      if (!ctx.me) return { me: null };
      const id = ctx.me.id;
      return { me: pubUser(ctx.me, ctx.me), counts: { bookmarks: db.bookmarks.filter(b => b.userId === id).length, profiles: db.profiles.filter(p => p.userId === id).length, plans: db.plans.filter(p => p.userId === id).length } };
    });
    on('PUT', '/me', ctx => {
      const u = requireAuth(ctx); const copy = { ...u };
      profileFields(ctx.body, copy);
      Object.assign(u, { name: copy.name, school: copy.school, province: copy.province, subjects: copy.subjects, grades: copy.grades });
      persist();
      return { me: pubUser(u, u) };
    });
    on('POST', '/auth/change-password', ctx => {
      const u = requireAuth(ctx); const b = ctx.body;
      need(deps.verifyPassword(String(b.current || ''), u.passHash), 400, 'Mật khẩu hiện tại không đúng');
      need(String(b.next || '').length >= 6, 400, 'Mật khẩu mới cần ít nhất 6 ký tự');
      u.passHash = deps.hashPassword(String(b.next));
      const h = deps.hashToken(ctx.req.token);
      db.sessions = db.sessions.filter(s => s.userId !== u.id || s.tokenHash === h);
      persist();
      return { ok: true };
    });

    /* ----- Sổ tay của tôi ----- */
    on('GET', '/me/bookmarks', ctx => {
      const u = requireAuth(ctx); const us = usage();
      const items = db.bookmarks.filter(b => b.userId === u.id).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).map(b => {
        const t = b.kind === 'prompt' ? promptById(b.targetId) : lessonById(b.targetId);
        const visible = t && (t.status === 'published' || isStaff(u));
        return { kind: b.kind, targetId: b.targetId, createdAt: b.createdAt, item: visible ? (b.kind === 'prompt' ? outPrompt(t, ctx, us) : outLesson(t, ctx, us)) : null };
      });
      return { items };
    });
    on('PUT', '/me/bookmarks/:kind/:id', (ctx, { kind, id }) => {
      const u = requireAuth(ctx);
      need(kind === 'prompt' || kind === 'lesson', 400, 'Loại mục lưu không hợp lệ');
      const t = kind === 'prompt' ? promptById(id) : lessonById(id);
      need(t && t.status === 'published', 404, MSG.notFound);
      if (!db.bookmarks.some(b => b.userId === u.id && b.kind === kind && b.targetId === id)) { db.bookmarks.push({ userId: u.id, kind, targetId: id, createdAt: iso() }); persist(); }
      return { ok: true, bookmarked: true };
    });
    on('DELETE', '/me/bookmarks/:kind/:id', (ctx, { kind, id }) => {
      const u = requireAuth(ctx);
      db.bookmarks = db.bookmarks.filter(b => !(b.userId === u.id && b.kind === kind && b.targetId === id)); persist();
      return { ok: true, bookmarked: false };
    });

    on('GET', '/me/profiles', ctx => {
      const u = requireAuth(ctx);
      return { items: db.profiles.filter(p => p.userId === u.id).sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1).map(outProfile) };
    });
    on('POST', '/me/profiles', ctx => {
      const u = requireAuth(ctx);
      need(db.profiles.filter(p => p.userId === u.id).length < kv('settings').maxProfilesPerUser, 409, `Mỗi tài khoản lưu tối đa ${kv('settings').maxProfilesPerUser} hồ sơ lớp`);
      const name = str(ctx.body.name, 80); need(name.length >= 2, 400, 'Đặt tên hồ sơ lớp, ví dụ "Lớp 3A"');
      const p = { id: rid('cp_'), userId: u.id, name, data: profileData(ctx.body.data), createdAt: iso(), updatedAt: iso() };
      db.profiles.push(p); persist();
      return outProfile(p);
    });
    on('PUT', '/me/profiles/:id', (ctx, { id }) => {
      const u = requireAuth(ctx);
      const p = db.profiles.find(x => x.id === id && x.userId === u.id); need(p, 404, 'Không tìm thấy hồ sơ lớp');
      if ('name' in ctx.body) { const name = str(ctx.body.name, 80); need(name.length >= 2, 400, 'Đặt tên hồ sơ lớp, ví dụ "Lớp 3A"'); p.name = name; }
      if ('data' in ctx.body) p.data = profileData(ctx.body.data);
      p.updatedAt = iso(); persist();
      return outProfile(p);
    });
    on('DELETE', '/me/profiles/:id', (ctx, { id }) => {
      const u = requireAuth(ctx);
      const before = db.profiles.length; db.profiles = db.profiles.filter(x => !(x.id === id && x.userId === u.id));
      need(db.profiles.length < before, 404, 'Không tìm thấy hồ sơ lớp'); persist();
      return { ok: true };
    });

    on('GET', '/me/plans', ctx => {
      const u = requireAuth(ctx);
      return { items: db.plans.filter(p => p.userId === u.id).sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1).map(p => outPlan(p)) };
    });
    on('GET', '/me/plans/:id', (ctx, { id }) => {
      const u = requireAuth(ctx);
      const p = db.plans.find(x => x.id === id && x.userId === u.id); need(p, 404, 'Không tìm thấy kế hoạch');
      return outPlan(p, true);
    });
    function planFields(b, p, creating) {
      const has = k => creating || k in b;
      if (has('title')) { p.title = str(b.title, 150); need(p.title.length >= 2, 400, 'Đặt tên cho kế hoạch'); }
      if (has('subject')) p.subject = META.subjects.includes(b.subject) ? b.subject : (p.subject || META.subjects[0]);
      if (has('grade')) p.grade = META.grades.includes(Number(b.grade)) ? Number(b.grade) : (p.grade || 1);
      if (has('promptText')) p.promptText = str(b.promptText, 8000);
      if (has('aiResult')) p.aiResult = str(b.aiResult, 20000);
      if (has('note')) p.note = str(b.note, 3000);
      if (has('checks')) p.checks = (Array.isArray(b.checks) ? b.checks : []).slice(0, 12).map(Boolean);
      if (has('status')) p.status = META.planStatuses.some(s => s.id === b.status) ? b.status : 'draft';
      if (has('basePromptId')) p.basePromptId = b.basePromptId && promptById(b.basePromptId) ? b.basePromptId : null;
    }
    on('POST', '/me/plans', ctx => {
      const u = requireAuth(ctx);
      need(db.plans.filter(p => p.userId === u.id).length < kv('settings').maxPlansPerUser, 409, `Mỗi tài khoản lưu tối đa ${kv('settings').maxPlansPerUser} kế hoạch`);
      const p = { id: rid('pl_'), userId: u.id, title: '', subject: '', grade: 1, basePromptId: null, promptText: '', aiResult: '', note: '', checks: [], status: 'draft', createdAt: iso(), updatedAt: iso() };
      planFields({ checks: [], status: 'draft', aiResult: '', note: '', basePromptId: null, ...ctx.body }, p, true);
      need(p.promptText.length >= 10, 400, 'Kế hoạch cần có câu lệnh đã tạo');
      db.plans.push(p); persist();
      return outPlan(p, true);
    });
    on('PUT', '/me/plans/:id', (ctx, { id }) => {
      const u = requireAuth(ctx);
      const p = db.plans.find(x => x.id === id && x.userId === u.id); need(p, 404, 'Không tìm thấy kế hoạch');
      planFields(ctx.body, p, false); p.updatedAt = iso(); persist();
      return outPlan(p, true);
    });
    on('DELETE', '/me/plans/:id', (ctx, { id }) => {
      const u = requireAuth(ctx);
      const before = db.plans.length; db.plans = db.plans.filter(x => !(x.id === id && x.userId === u.id));
      need(db.plans.length < before, 404, 'Không tìm thấy kế hoạch'); persist();
      return { ok: true };
    });

    /* ----- Quản trị ----- */
    on('GET', '/admin/stats', ctx => {
      requireStaff(ctx);
      const days = Math.min(90, Math.max(7, Number(ctx.query.days) || 14));
      const t = now();
      const today = vnDate(iso(t));
      const dates = []; for (let i = days - 1; i >= 0; i--) dates.push(vnDate(iso(t - i * DAY)));
      const from = dates[0];
      const series = Object.fromEntries(dates.map(d => [d, { date: d, visits: 0, promptCopies: 0, customCopies: 0, lessonViews: 0, registrations: 0, feedback: 0 }]));
      const since7 = t - 7 * DAY;
      const visitors = new Set(), visitors7 = new Set();
      const k = { visits: 0, visits7d: 0, promptCopies: 0, promptCopies7d: 0, customCopies: 0, lessonViews: 0, lessonCopies: 0, toolOpens: 0 };
      const copiesInRange = {}, viewsInRange = {}, lessonViewsRange = {}, lessonCopiesRange = {};
      for (const e of db.events) {
        const d = vnDate(e.createdAt); const ms = new Date(e.createdAt).getTime(); const s = series[d]; const recent = ms >= since7;
        if (e.type === 'visit') { k.visits++; visitors.add(e.visitorId); if (recent) { k.visits7d++; visitors7.add(e.visitorId); } if (s) s.visits++; }
        else if (e.type === 'prompt_copy') { k.promptCopies++; if (recent) k.promptCopies7d++; if (s) { s.promptCopies++; copiesInRange[e.targetId] = (copiesInRange[e.targetId] || 0) + 1; } }
        else if (e.type === 'prompt_view') { if (s) viewsInRange[e.targetId] = (viewsInRange[e.targetId] || 0) + 1; }
        else if (e.type === 'custom_copy') { k.customCopies++; if (s) s.customCopies++; }
        else if (e.type === 'lesson_view') { k.lessonViews++; if (s) { s.lessonViews++; lessonViewsRange[e.targetId] = (lessonViewsRange[e.targetId] || 0) + 1; } }
        else if (e.type === 'lesson_copy') { k.lessonCopies++; if (s) lessonCopiesRange[e.targetId] = (lessonCopiesRange[e.targetId] || 0) + 1; }
        else if (e.type === 'tool_open') k.toolOpens++;
      }
      const teachers = db.users.filter(u => u.role === 'teacher');
      for (const u of teachers) { const s = series[vnDate(u.createdAt)]; if (s) s.registrations++; }
      for (const f of db.feedback) { const s = series[vnDate(f.createdAt)]; if (s) s.feedback++; }
      const pr = db.feedback.filter(f => f.kind === 'prompt');
      const helpful = pr.filter(f => f.rating === 1).length;
      const lr = db.feedback.filter(f => f.kind === 'lesson' && f.rating);
      const us = usage();
      const topPrompts = Object.entries(copiesInRange).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, copies]) => {
        const p = promptById(id); const s = us.prompt[id] || EMPTY_STATS;
        return { id, title: p ? p.title : 'Câu lệnh đã xoá', subject: p?.subject || '', grade: p?.grade || null, exists: !!p, copies, views: viewsInRange[id] || 0, helpful: s.helpful, notHelpful: s.notHelpful };
      });
      const bySubject = META.subjects.map(sj => ({ subject: sj, prompts: db.prompts.filter(p => p.subject === sj && p.status === 'published').length, copies: Object.entries(copiesInRange).filter(([id]) => promptById(id)?.subject === sj).reduce((a, [, c]) => a + c, 0) })).filter(x => x.prompts || x.copies).sort((a, b) => b.copies - a.copies);
      const byPurpose = META.purposes.map(pp => ({ purpose: pp.id, name: pp.name, copies: Object.entries(copiesInRange).filter(([id]) => promptById(id)?.purpose === pp.id).reduce((a, [, c]) => a + c, 0) }));
      const topLessons = db.lessons.map(l => ({ id: l.id, title: l.title, subject: l.subject, grade: l.grade, views: lessonViewsRange[l.id] || 0, copies: lessonCopiesRange[l.id] || 0, ...(({ ratingAvg, ratingCount }) => ({ ratingAvg, ratingCount }))(lessonStats(l.id, us)) })).sort((a, b) => b.views - a.views);
      return {
        days, from, to: today,
        kpis: {
          teachers: teachers.length, newTeachers7d: teachers.filter(u => new Date(u.createdAt).getTime() >= since7).length,
          activeTeachers7d: teachers.filter(u => u.lastActiveAt && new Date(u.lastActiveAt).getTime() >= since7).length,
          visits: k.visits, visits7d: k.visits7d, visitors: visitors.size, visitors7d: visitors7.size,
          promptCopies: k.promptCopies, promptCopies7d: k.promptCopies7d, customCopies: k.customCopies, lessonViews: k.lessonViews, lessonCopies: k.lessonCopies, toolOpens: k.toolOpens,
          plans: db.plans.length, profiles: db.profiles.length, bookmarks: db.bookmarks.length,
          feedback: db.feedback.length, feedbackNew: db.feedback.filter(f => f.status === 'new').length,
          helpfulRate: pr.length ? Math.round(helpful / pr.length * 100) : null,
          lessonRating: lr.length ? Math.round(lr.reduce((a, f) => a + f.rating, 0) / lr.length * 10) / 10 : null,
          promptsPublished: db.prompts.filter(p => p.status === 'published').length, lessonsPublished: db.lessons.filter(l => l.status === 'published').length,
        },
        series: dates.map(d => series[d]), topPrompts, bySubject, byPurpose, topLessons,
        recentFeedback: [...db.feedback].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 6).map(outFeedback),
      };
    });

    on('GET', '/admin/content', ctx => { requireStaff(ctx); return { handbook: clone(kv('handbook')), guide: clone(kv('guide')), checklist: clone(kv('checklist')), settings: clone(kv('settings')) }; });
    const HB_FIELDS = { productTitle: [300, 10], shortName: [40, 2], researchTitle: [400, 10], groupName: [150, 0], members: [400, 0], advisor: [150, 0], organization: [200, 0], year: [20, 0], applicationArea: [200, 0], applicationDescription: [1500, 0], introduction: [2000, 0] };
    const HB_LABEL = { productTitle: 'Tên sản phẩm', shortName: 'Tên ngắn', researchTitle: 'Tên đề tài' };
    on('PUT', '/admin/handbook', ctx => {
      requireStaff(ctx); const b = ctx.body; const h = clone(kv('handbook'));
      for (const [k, [max, min]] of Object.entries(HB_FIELDS)) if (k in b) {
        h[k] = str(b[k], max);
        if (min) need(h[k].length >= min, 400, `${HB_LABEL[k]} cần ít nhất ${min} ký tự`);
        else if (!h[k]) h[k] = 'Đang cập nhật';
      }
      if ('announcement' in b) h.announcement = { enabled: !!b.announcement?.enabled, text: str(b.announcement?.text, 300) };
      need(!h.announcement.enabled || h.announcement.text.length >= 5, 400, 'Nhập nội dung thông báo hoặc tắt thông báo');
      db.kv.handbook = h; persist();
      return { handbook: clone(h) };
    });
    on('PUT', '/admin/guide', ctx => {
      requireStaff(ctx); const b = ctx.body; const g = clone(kv('guide'));
      if ('steps' in b) {
        need(Array.isArray(b.steps) && b.steps.length >= 1 && b.steps.length <= 8, 400, 'Hướng dẫn cần từ 1 đến 8 bước');
        const visualIds = META.visuals.map(v => v.id);
        g.steps = b.steps.map((s, i) => {
          const x = { id: str(s?.id, 20) || 's' + (i + 1), title: str(s?.title, 80), summary: str(s?.summary, 160), visual: visualIds.includes(s?.visual) ? s.visual : 'none', points: arrStr(s?.points, 6, 300) };
          need(x.title.length >= 3, 400, `Bước ${i + 1} cần có tiêu đề`); need(x.points.length >= 1, 400, `Bước ${i + 1} cần ít nhất 1 ý hướng dẫn`);
          return x;
        });
      }
      if ('tools' in b) {
        need(Array.isArray(b.tools) && b.tools.length <= 6, 400, 'Tối đa 6 công cụ AI');
        g.tools = b.tools.map((t, i) => {
          const x = { id: str(t?.id, 30) || norm(t?.name || 'tool' + i).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tool' + i, name: str(t?.name, 40), url: str(t?.url, 200) };
          need(x.name, 400, 'Mỗi công cụ cần có tên'); need(/^https:\/\/[^\s]+$/.test(x.url), 400, `Địa chỉ của ${x.name} phải bắt đầu bằng https://`);
          return x;
        });
      }
      if ('video' in b) {
        const v = b.video || {};
        g.video = { title: str(v.title, 120), url: str(v.url, 300), duration: str(v.duration, 10), note: str(v.note, 200) };
        need(!g.video.url || /^https:\/\/[^\s]+$/.test(g.video.url), 400, 'Đường dẫn video phải bắt đầu bằng https://');
      }
      db.kv.guide = g; persist();
      return { guide: clone(g) };
    });
    on('PUT', '/admin/checklist', ctx => {
      requireStaff(ctx); const b = ctx.body;
      need(Array.isArray(b.items) && b.items.length >= 3 && b.items.length <= 12, 400, 'Danh mục kiểm tra cần từ 3 đến 12 mục');
      const items = b.items.map((x, i) => { const o = { title: str(x?.title, 100), detail: str(x?.detail, 300) }; need(o.title.length >= 3, 400, `Mục ${i + 1} cần có tiêu đề`); return o; });
      db.kv.checklist = items; persist();
      return { checklist: clone(items) };
    });
    on('PUT', '/admin/settings', ctx => {
      requireAdmin(ctx); const b = ctx.body; const s = clone(kv('settings'));
      if ('allowRegistration' in b) s.allowRegistration = !!b.allowRegistration;
      if ('allowAnonymousFeedback' in b) s.allowAnonymousFeedback = !!b.allowAnonymousFeedback;
      if ('maxPlansPerUser' in b) { const n = Number(b.maxPlansPerUser); need(Number.isInteger(n) && n >= 1 && n <= 500, 400, 'Số kế hoạch tối đa từ 1 đến 500'); s.maxPlansPerUser = n; }
      if ('maxProfilesPerUser' in b) { const n = Number(b.maxProfilesPerUser); need(Number.isInteger(n) && n >= 1 && n <= 100, 400, 'Số hồ sơ lớp tối đa từ 1 đến 100'); s.maxProfilesPerUser = n; }
      db.kv.settings = s; persist();
      return { settings: clone(s) };
    });

    on('GET', '/admin/prompts', ctx => {
      requireStaff(ctx); const us = usage();
      const items = filterPrompts(db.prompts, ctx.query).sort(sortByOrder).map(p => outPrompt(p, ctx, us));
      return { items, total: items.length, all: db.prompts.length };
    });
    on('GET', '/admin/prompts/:id', (ctx, { id }) => { requireStaff(ctx); const p = promptById(id); need(p, 404, 'Không tìm thấy câu lệnh'); return outPrompt(p, ctx, null, true); });
    on('POST', '/admin/prompts', ctx => {
      requireStaff(ctx);
      const p = { id: rid('p_'), status: 'published', order: Math.max(0, ...db.prompts.map(x => x.order || 0)) + 1, desc: '', howto: '', conditions: [], createdAt: iso(), updatedAt: iso() };
      promptFields({ desc: '', howto: '', conditions: [], status: 'published', ...ctx.body }, p, true);
      db.prompts.push(p); persist();
      return outPrompt(p, ctx, null, true);
    });
    on('PUT', '/admin/prompts/:id', (ctx, { id }) => {
      requireStaff(ctx); const p = promptById(id); need(p, 404, 'Không tìm thấy câu lệnh');
      const copy = clone(p); promptFields(ctx.body, copy, false); Object.assign(p, copy, { updatedAt: iso() }); persist();
      return outPrompt(p, ctx, null, true);
    });
    on('DELETE', '/admin/prompts/:id', (ctx, { id }) => {
      requireStaff(ctx); need(promptById(id), 404, 'Không tìm thấy câu lệnh');
      db.prompts = db.prompts.filter(p => p.id !== id);
      db.bookmarks = db.bookmarks.filter(b => !(b.kind === 'prompt' && b.targetId === id));
      persist(); return { ok: true };
    });

    on('GET', '/admin/lessons', ctx => {
      requireStaff(ctx); const us = usage();
      const items = filterLessons(db.lessons, ctx.query).sort(sortByOrder).map(l => outLesson(l, ctx, us));
      return { items, total: items.length, all: db.lessons.length };
    });
    on('GET', '/admin/lessons/:id', (ctx, { id }) => { requireStaff(ctx); const l = lessonById(id); need(l, 404, 'Không tìm thấy bài dạy mẫu'); return outLesson(l, ctx, null, true); });
    on('POST', '/admin/lessons', ctx => {
      requireStaff(ctx);
      const base = norm(ctx.body.title || 'bai-mau').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'bai-mau';
      const l = { id: db.lessons.some(x => x.id === base) ? base + '-' + deps.randomHex(4) : base, status: 'published', order: Math.max(0, ...db.lessons.map(x => x.order || 0)) + 1, createdAt: iso(), updatedAt: iso() };
      lessonFields({ summary: '', conditions: [], goals: '', materials: [], worksheet: '', questions: [], adaptations: [], review: [], status: 'published', duration: 35, ...ctx.body }, l, true);
      db.lessons.push(l); persist();
      return outLesson(l, ctx, null, true);
    });
    on('PUT', '/admin/lessons/:id', (ctx, { id }) => {
      requireStaff(ctx); const l = lessonById(id); need(l, 404, 'Không tìm thấy bài dạy mẫu');
      const copy = clone(l); lessonFields(ctx.body, copy, false); Object.assign(l, copy, { updatedAt: iso() }); persist();
      return outLesson(l, ctx, null, true);
    });
    on('DELETE', '/admin/lessons/:id', (ctx, { id }) => {
      requireStaff(ctx); need(lessonById(id), 404, 'Không tìm thấy bài dạy mẫu');
      db.lessons = db.lessons.filter(l => l.id !== id);
      db.bookmarks = db.bookmarks.filter(b => !(b.kind === 'lesson' && b.targetId === id));
      persist(); return { ok: true };
    });

    function userCounts(u) {
      return {
        plans: db.plans.filter(p => p.userId === u.id).length, profiles: db.profiles.filter(p => p.userId === u.id).length,
        bookmarks: db.bookmarks.filter(b => b.userId === u.id).length, feedback: db.feedback.filter(f => f.userId === u.id).length,
        copies: db.events.filter(e => e.userId === u.id && (e.type === 'prompt_copy' || e.type === 'custom_copy')).length,
      };
    }
    on('GET', '/admin/users', ctx => {
      requireStaff(ctx); const q = ctx.query;
      let list = db.users.filter(u => (!q.role || u.role === q.role) && (!q.status || u.status === q.status) && (!q.province || u.province === q.province)
        && (!q.q || matchQuery([u.name, u.email, u.school, u.province].join(' '), q.q)));
      const sort = q.sort || 'recent';
      list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'vi') : sort === 'joined' ? (a.createdAt < b.createdAt ? 1 : -1) : ((a.lastActiveAt || '') < (b.lastActiveAt || '') ? 1 : -1));
      const items = list.map(u => ({ ...pubUser(u, ctx.me), counts: userCounts(u) }));
      return { items, total: items.length };
    });
    on('GET', '/admin/users/:id', (ctx, { id }) => {
      requireStaff(ctx); const u = userById(id); need(u, 404, 'Không tìm thấy tài khoản');
      return {
        user: { ...pubUser(u, ctx.me), counts: userCounts(u) },
        plans: db.plans.filter(p => p.userId === id).map(p => outPlan(p)),
        profiles: db.profiles.filter(p => p.userId === id).map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt })),
        bookmarks: db.bookmarks.filter(b => b.userId === id).map(b => ({ kind: b.kind, targetId: b.targetId, createdAt: b.createdAt, target: targetOf(b.kind, b.targetId) })),
        feedback: db.feedback.filter(f => f.userId === id).map(outFeedback),
      };
    });
    on('POST', '/admin/users/:id/lock', (ctx, { id }) => {
      const me = requireStaff(ctx); const u = userById(id); need(u, 404, 'Không tìm thấy tài khoản');
      need(u.id !== me.id, 400, 'Không thể tự khoá tài khoản của mình');
      need(isAdmin(me) || u.role === 'teacher', 403, 'Biên tập viên chỉ khoá được tài khoản giáo viên');
      if (ctx.body.lock) { u.status = 'locked'; u.lockReason = str(ctx.body.reason, 200) || 'Vi phạm quy định sử dụng'; db.sessions = db.sessions.filter(s => s.userId !== u.id); }
      else { u.status = 'active'; u.lockReason = ''; }
      persist();
      return { ok: true, user: { ...pubUser(u, me), counts: userCounts(u) } };
    });
    on('POST', '/admin/users/:id/role', (ctx, { id }) => {
      const me = requireAdmin(ctx); const u = userById(id); need(u, 404, 'Không tìm thấy tài khoản');
      need(u.id !== me.id, 400, 'Không thể tự đổi vai trò của mình');
      need(META.roles.some(r => r.id === ctx.body.role), 400, 'Vai trò không hợp lệ');
      u.role = ctx.body.role; persist();
      return { ok: true, user: { ...pubUser(u, me), counts: userCounts(u) } };
    });

    on('GET', '/admin/feedback', ctx => {
      requireStaff(ctx); const q = ctx.query;
      const items = db.feedback.filter(f => (!q.kind || f.kind === q.kind) && (!q.status || f.status === q.status) && (!q.targetId || f.targetId === q.targetId)
        && (!q.q || matchQuery([f.comment, f.adminNote, targetOf(f.kind, f.targetId)?.title || '', userById(f.userId)?.name || ''].join(' '), q.q)))
        .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).map(outFeedback);
      return { items, total: items.length, newCount: db.feedback.filter(f => f.status === 'new').length };
    });
    on('PUT', '/admin/feedback/:id', (ctx, { id }) => {
      requireStaff(ctx); const f = db.feedback.find(x => x.id === id); need(f, 404, 'Không tìm thấy góp ý');
      if ('status' in ctx.body) { need(['new', 'handled'].includes(ctx.body.status), 400, 'Trạng thái không hợp lệ'); f.status = ctx.body.status; }
      if ('adminNote' in ctx.body) f.adminNote = str(ctx.body.adminNote, 1000);
      f.updatedAt = iso(); persist();
      return outFeedback(f);
    });
    on('DELETE', '/admin/feedback/:id', (ctx, { id }) => {
      requireAdmin(ctx); need(db.feedback.some(f => f.id === id), 404, 'Không tìm thấy góp ý');
      db.feedback = db.feedback.filter(f => f.id !== id); persist(); return { ok: true };
    });

    on('GET', '/admin/events', ctx => {
      requireStaff(ctx); const q = ctx.query;
      const types = q.type ? String(q.type).split(',') : null;
      const lim = Math.min(5000, Math.max(1, Number(q.limit) || 500)), off = Math.max(0, Number(q.offset) || 0);
      const list = db.events.filter(e => (!types || types.includes(e.type)) && (!q.from || vnDate(e.createdAt) >= q.from) && (!q.to || vnDate(e.createdAt) <= q.to))
        .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
      return { items: list.slice(off, off + lim).map(e => ({ ...e })), total: list.length, limit: lim, offset: off };
    });

    on('POST', '/admin/reset', ctx => {
      need(deps.env === 'dev', 404, 'Không tìm thấy');
      requireAdmin(ctx);
      db = buildSeed(); persist();
      return { ok: true };
    });

    /* ================= Bộ định tuyến ================= */
    function match(method, path) {
      const parts = path.split('/').filter(Boolean);
      let methodMismatch = false;
      for (const r of routes) {
        if (r.parts.length !== parts.length) continue;
        const params = {}; let ok = true;
        for (let i = 0; i < parts.length; i++) {
          if (r.parts[i].startsWith(':')) params[r.parts[i].slice(1)] = decodeURIComponent(parts[i]);
          else if (r.parts[i] !== parts[i]) { ok = false; break; }
        }
        if (!ok) continue;
        if (r.method !== method) { methodMismatch = true; continue; }
        return { route: r, params };
      }
      return methodMismatch ? 'method' : null;
    }

    function handle(req) {
      try {
        if (!db) loadDb();
        const method = String(req.method || 'GET').toUpperCase();
        const path = String(req.path || '/').replace(/^\/api/, '').replace(/\/+$/, '') || '/';
        if (method === 'OPTIONS') return { status: 204, body: null };
        const m = match(method, path);
        need(m !== 'method', 405, 'Phương thức không được hỗ trợ');
        need(m, 404, 'Không tìm thấy đường dẫn API');
        if (req.body === '__INVALID_JSON__') throw new ApiError(400, 'Dữ liệu gửi lên không phải JSON hợp lệ');
        const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
        const ctx = { req, query: req.query || {}, body, me: currentUser(req.token), visitorId: VISITOR_RE.test(String((req.query || {}).visitorId || '')) ? req.query.visitorId : null };
        touch(ctx.me);
        const out = m.route.fn(ctx, m.params);
        return { status: 200, body: out };
      } catch (e) {
        if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
        if (typeof console !== 'undefined') console.error(e);
        return { status: 500, body: { error: 'Lỗi máy chủ, vui lòng thử lại' } };
      }
    }

    return { handle, reload: loadDb, _db: () => db };
  }

  return { createApi, norm, ApiError };
});
