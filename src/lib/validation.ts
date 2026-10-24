import seed from '../../public/js/mock/seed-data.js';
import { need, str } from './http';
const META = seed.meta, PURPOSE_IDS = META.purposes.map(p => p.id);
    const arrStr = (v, maxItems, maxLen) => (Array.isArray(v) ? v : []).map(x => str(x, maxLen)).filter(Boolean).slice(0, maxItems);
    export function cleanSubjects(v) { return [...new Set((Array.isArray(v) ? v : []).filter(s => META.subjects.includes(s)))]; }
    export function cleanGrades(v) { return [...new Set((Array.isArray(v) ? v : []).map(Number).filter(g => META.grades.includes(g)))].sort(); }
    export function profileFields(b, u) {
      if ('name' in b) { u.name = str(b.name, 60); need(u.name.length >= 2, 400, 'Họ tên cần ít nhất 2 ký tự'); }
      if ('school' in b) { u.school = str(b.school, 120); need(u.school.length >= 2, 400, 'Vui lòng nhập tên trường'); }
      if ('province' in b) { u.province = str(b.province, 60); need(u.province, 400, 'Vui lòng chọn tỉnh/thành'); }
      if ('subjects' in b) u.subjects = cleanSubjects(b.subjects);
      if ('grades' in b) u.grades = cleanGrades(b.grades);
    }
    export function promptFields(b, p, creating) {
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
    export function lessonFields(b, l, creating) {
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
    export function profileData(v) {
      const b = v && typeof v === 'object' ? v : {};
      const base = b.base || null;
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
    export function planFields(b, p, creating) {
      const has = k => creating || k in b;
      if (has('title')) { p.title = str(b.title, 150); need(p.title.length >= 2, 400, 'Đặt tên cho kế hoạch'); }
      if (has('subject')) p.subject = META.subjects.includes(b.subject) ? b.subject : (p.subject || META.subjects[0]);
      if (has('grade')) p.grade = META.grades.includes(Number(b.grade)) ? Number(b.grade) : (p.grade || 1);
      if (has('promptText')) p.promptText = str(b.promptText, 8000);
      if (has('aiResult')) p.aiResult = str(b.aiResult, 20000);
      if (has('note')) p.note = str(b.note, 3000);
      if (has('checks')) p.checks = (Array.isArray(b.checks) ? b.checks : []).slice(0, 12).map(Boolean);
      if (has('status')) p.status = META.planStatuses.some(s => s.id === b.status) ? b.status : 'draft';
      if (has('basePromptId')) p.basePromptId = b.basePromptId || null;
    }
