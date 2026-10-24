// Kiểm thử hợp đồng API của Sổ tay AI.
//   node tools/api-test.mjs http://localhost:8080   (server mẫu Node)
//   node tools/api-test.mjs http://localhost:8787   (wrangler dev — backend Cloudflare)
// Yêu cầu APP_ENV=dev (có dữ liệu mẫu + /api/admin/reset). Bộ test tự reset dữ liệu ở đầu và cuối.
const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
let pass = 0, fail = 0;
const fails = [];

async function call(method, path, body, token, raw) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + '/api' + path, { method, headers, body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined });
  let data = null; const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
async function t(name, fn) {
  try { await fn(); pass++; console.log('PASS', name); }
  catch (e) { fail++; fails.push(name); console.log('FAIL', name, '—', e.message); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'điều kiện sai'); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg || ''} mong đợi ${JSON.stringify(b)}, nhận ${JSON.stringify(a)}`); }
const hasError = r => typeof r.data?.error === 'string' && r.data.error.length > 0;

const V = 'v_apitest' + Math.random().toString(36).slice(2, 8);
let admin, editor, lan, fresh, freshId, newPlanId, newProfileId, newPromptId, newLessonId;

const login = async (email, password) => { const r = await call('POST', '/login', { email, password }); eq(r.status, 200, `đăng nhập ${email}`); return r.data.token; };

// ---------- Chuẩn bị ----------
await t('admin đăng nhập + reset dữ liệu mẫu', async () => {
  admin = await login('admin@sotayai.vn', 'admin123');
  const r = await call('POST', '/admin/reset', {}, admin); eq(r.status, 200); eq(r.data.ok, true);
  admin = await login('admin@sotayai.vn', 'admin123');
});

// ---------- Công khai ----------
await t('GET /meta trả nội dung sổ tay', async () => {
  const r = await call('GET', '/meta'); eq(r.status, 200);
  ok(r.data.handbook.productTitle.length > 10, 'thiếu productTitle'); eq(r.data.counts.prompts, 80, 'counts.prompts');
  eq(r.data.counts.lessons, 6, 'counts.lessons'); eq(r.data.guide.steps.length, 5, 'guide.steps'); eq(r.data.checklist.length, 7, 'checklist');
  ok(Array.isArray(r.data.purposes) && r.data.purposes.length === 4, 'purposes'); eq(r.data.config.allowRegistration, true);
});
await t('GET /prompts trả 80 câu lệnh theo thứ tự', async () => {
  const r = await call('GET', '/prompts'); eq(r.status, 200); eq(r.data.total, 80); eq(r.data.items[0].id, 'p01');
  const p = r.data.items[0]; ok('stats' in p && 'copies' in p.stats, 'thiếu stats'); eq(p.bookmarked, false);
});
await t('GET /prompts?q= tìm không dấu', async () => {
  const r = await call('GET', '/prompts?q=' + encodeURIComponent('chu vi hinh')); ok(r.data.items.some(p => p.id === 'p07'), 'không thấy p07');
});
await t('GET /prompts lọc môn + lớp', async () => {
  const r = await call('GET', '/prompts?subject=' + encodeURIComponent('Toán') + '&grade=3'); ok(r.data.total > 0); ok(r.data.items.every(p => p.subject === 'Toán' && p.grade === 3));
});
await t('GET /prompts lọc mục đích + điều kiện', async () => {
  const r = await call('GET', '/prompts?purpose=review&cond=' + encodeURIComponent('Không máy chiếu')); ok(r.data.items.every(p => p.purpose === 'review' && p.conditions.includes('Không máy chiếu')));
});
await t('GET /prompts/:id chi tiết', async () => {
  const r = await call('GET', '/prompts/p07'); eq(r.status, 200); ok(r.data.text.length > 50); eq(r.data.myFeedback, null);
});
await t('GET /prompts/:id không tồn tại → 404', async () => { const r = await call('GET', '/prompts/khong-co'); eq(r.status, 404); ok(hasError(r)); });
await t('GET /lessons trả 6 bài', async () => {
  const r = await call('GET', '/lessons'); eq(r.data.total, 6); ok(!('activities' in r.data.items[0]), 'danh sách không trả activities');
});
await t('GET /lessons/:id có hoạt động + đánh giá', async () => {
  const r = await call('GET', '/lessons/toan-3-chu-vi'); eq(r.status, 200); eq(r.data.activities.length, 4); ok(r.data.stats.ratingAvg >= 1, 'ratingAvg');
});

// ---------- Sự kiện & góp ý ----------
await t('POST /events loại sai → 400', async () => { const r = await call('POST', '/events', { type: 'abc', visitorId: V }); eq(r.status, 400); ok(hasError(r)); });
await t('POST /events thiếu visitorId → 400', async () => { const r = await call('POST', '/events', { type: 'visit' }); eq(r.status, 400); });
await t('POST /events prompt_copy tăng lượt sao chép', async () => {
  const before = (await call('GET', '/prompts/p07')).data.stats.copies;
  const r = await call('POST', '/events', { type: 'prompt_copy', targetId: 'p07', visitorId: V }); eq(r.status, 200);
  eq((await call('GET', '/prompts/p07')).data.stats.copies, before + 1);
});
await t('POST /events câu lệnh không tồn tại → 404', async () => { const r = await call('POST', '/events', { type: 'prompt_view', targetId: 'zzz', visitorId: V }); eq(r.status, 404); });
await t('POST /feedback khách: đánh giá câu lệnh', async () => {
  const r = await call('POST', '/feedback', { kind: 'prompt', targetId: 'p07', rating: 1, visitorId: V }); eq(r.status, 200); eq(r.data.feedback.rating, 1);
});
await t('POST /feedback khách gửi lại → cập nhật, không tạo mới', async () => {
  const before = (await call('GET', '/prompts/p07')).data.stats;
  await call('POST', '/feedback', { kind: 'prompt', targetId: 'p07', rating: -1, comment: 'Thử', visitorId: V });
  const after = (await call('GET', '/prompts/p07?visitorId=' + V)).data;
  eq(after.stats.helpful + after.stats.notHelpful, before.helpful + before.notHelpful, 'tổng số đánh giá'); eq(after.myFeedback.rating, -1, 'myFeedback');
});
await t('POST /feedback bài mẫu sao ngoài 1–5 → 400', async () => { const r = await call('POST', '/feedback', { kind: 'lesson', targetId: 'toan-3-chu-vi', rating: 7, visitorId: V }); eq(r.status, 400); });
await t('POST /feedback góp ý chung quá ngắn → 400', async () => { const r = await call('POST', '/feedback', { kind: 'general', comment: 'ok', visitorId: V }); eq(r.status, 400); });
await t('POST /feedback góp ý chung hợp lệ', async () => { const r = await call('POST', '/feedback', { kind: 'general', rating: 5, comment: 'Sổ tay rất hữu ích cho lớp ghép.', visitorId: V }); eq(r.status, 200); });

// ---------- Tài khoản ----------
const email = `gv${Date.now()}@test.vn`;
await t('POST /register email sai → 400', async () => { const r = await call('POST', '/register', { email: 'abc', password: '123456', name: 'Thử', school: 'TH A', province: 'Lào Cai' }); eq(r.status, 400); ok(hasError(r)); });
await t('POST /register mật khẩu ngắn → 400', async () => { const r = await call('POST', '/register', { email, password: '123', name: 'Thử', school: 'TH A', province: 'Lào Cai' }); eq(r.status, 400); });
await t('POST /register thiếu trường → 400', async () => { const r = await call('POST', '/register', { email, password: '123456', name: 'Thử', province: 'Lào Cai' }); eq(r.status, 400); });
await t('POST /register email trùng → 409', async () => { const r = await call('POST', '/register', { email: 'lan.gv@sotayai.vn', password: '123456', name: 'Thử', school: 'TH A', province: 'Lào Cai' }); eq(r.status, 409); });
await t('POST /register thành công', async () => {
  const r = await call('POST', '/register', { email, password: '123456', name: 'Giáo viên Thử', school: 'TH Thử', province: 'Lào Cai', subjects: ['Toán', 'Không có'], grades: [3, 9] });
  eq(r.status, 200); ok(r.data.token?.length >= 32, 'token'); eq(r.data.me.role, 'teacher'); eq(r.data.me.email, email);
  ok(!('passHash' in r.data.me), 'lộ passHash'); eq(JSON.stringify(r.data.me.subjects), '["Toán"]'); eq(JSON.stringify(r.data.me.grades), '[3]');
  fresh = r.data.token; freshId = r.data.me.id;
});
await t('GET /me có token', async () => { const r = await call('GET', '/me', undefined, fresh); eq(r.data.me.id, freshId); eq(r.data.counts.plans, 0); });
await t('GET /me không token → me null', async () => { const r = await call('GET', '/me'); eq(r.status, 200); eq(r.data.me, null); });
await t('PUT /me tên quá ngắn → 400', async () => { const r = await call('PUT', '/me', { name: 'A' }, fresh); eq(r.status, 400); });
await t('PUT /me cập nhật hồ sơ', async () => { const r = await call('PUT', '/me', { school: 'TH Thử mới', grades: [4, 5] }, fresh); eq(r.data.me.school, 'TH Thử mới'); eq(r.data.me.grades.length, 2); });
await t('POST /login sai mật khẩu → 401', async () => { const r = await call('POST', '/login', { email: 'lan.gv@sotayai.vn', password: 'sai' }); eq(r.status, 401); ok(hasError(r)); });
await t('POST /login tài khoản bị khoá → 403', async () => { const r = await call('POST', '/login', { email: 'khoa.test@sotayai.vn', password: '123456' }); eq(r.status, 403); });
await t('POST /auth/change-password sai mật khẩu cũ → 400', async () => { const r = await call('POST', '/auth/change-password', { current: 'x', next: '654321' }, fresh); eq(r.status, 400); });
await t('POST /auth/change-password thành công', async () => {
  const r = await call('POST', '/auth/change-password', { current: '123456', next: '654321' }, fresh); eq(r.status, 200);
  eq((await call('POST', '/login', { email, password: '654321' })).status, 200);
});

// ---------- Sổ tay của tôi ----------
await t('GET /me/plans không đăng nhập → 401', async () => { const r = await call('GET', '/me/plans'); eq(r.status, 401); });
await t('GET /me/plans của cô Lan có 2 kế hoạch', async () => { lan = await login('lan.gv@sotayai.vn', '123456'); const r = await call('GET', '/me/plans', undefined, lan); eq(r.data.items.length, 2); ok(!('aiResult' in r.data.items[0]), 'danh sách không trả aiResult'); });
await t('GET /me/plans/:id chi tiết', async () => { const r = await call('GET', '/me/plans/pl_lan1', undefined, lan); eq(r.status, 200); ok(r.data.aiResult.length > 20); eq(r.data.checks.length, 7); });
await t('GET /me/plans/:id của người khác → 404', async () => { const r = await call('GET', '/me/plans/pl_minh1', undefined, lan); eq(r.status, 404); });
await t('POST /me/plans thiếu câu lệnh → 400', async () => { const r = await call('POST', '/me/plans', { title: 'Thử' }, lan); eq(r.status, 400); });
await t('POST + PUT /me/plans', async () => {
  const r = await call('POST', '/me/plans', { title: 'Toán 3 thử', subject: 'Toán', grade: 3, promptText: 'Bạn là chuyên gia… NHIỆM VỤ: soạn bài thử', basePromptId: 'p07' }, lan);
  eq(r.status, 200); eq(r.data.status, 'draft'); newPlanId = r.data.id;
  const u = await call('PUT', '/me/plans/' + newPlanId, { checks: [true, true, false], status: 'reviewed', aiResult: 'Kết quả AI' }, lan);
  eq(u.data.status, 'reviewed'); eq(u.data.checked, 2); eq(u.data.aiResult, 'Kết quả AI');
});
await t('DELETE /me/plans/:id', async () => { eq((await call('DELETE', '/me/plans/' + newPlanId, undefined, lan)).status, 200); eq((await call('GET', '/me/plans/' + newPlanId, undefined, lan)).status, 404); });
await t('Hồ sơ lớp: danh sách, tạo (chuẩn hoá dữ liệu), xoá', async () => {
  eq((await call('GET', '/me/profiles', undefined, lan)).data.items.length, 2);
  eq((await call('POST', '/me/profiles', { name: 'A' }, lan)).status, 400, 'tên ngắn');
  const r = await call('POST', '/me/profiles', { name: 'Lớp 4C', data: { subject: 'Toán', grade: 4, size: 'abc', lang: 'xyz', equip: ['Bảng, phấn'], base: 'khong-co' } }, lan);
  eq(r.status, 200); eq(r.data.data.grade, '4'); eq(r.data.data.size, ''); eq(r.data.data.lang, 'Một số em cần hỗ trợ'); eq(r.data.data.base, null); newProfileId = r.data.id;
  eq((await call('PUT', '/me/profiles/' + newProfileId, { name: 'Lớp 4C mới' }, lan)).data.name, 'Lớp 4C mới');
  eq((await call('DELETE', '/me/profiles/' + newProfileId, undefined, lan)).status, 200);
});
await t('Câu lệnh đã lưu: lưu, kiểm tra, bỏ lưu', async () => {
  eq((await call('PUT', '/me/bookmarks/prompt/p01', undefined, lan)).data.bookmarked, true);
  eq((await call('GET', '/prompts/p01', undefined, lan)).data.bookmarked, true);
  ok((await call('GET', '/me/bookmarks', undefined, lan)).data.items.some(b => b.targetId === 'p01' && b.item?.id === 'p01'));
  eq((await call('DELETE', '/me/bookmarks/prompt/p01', undefined, lan)).data.bookmarked, false);
  eq((await call('PUT', '/me/bookmarks/abc/p01', undefined, lan)).status, 400);
});
await t('Góp ý khi đăng nhập gắn với tài khoản', async () => {
  const r = await call('POST', '/feedback', { kind: 'lesson', targetId: 'toan-4-phan-so', rating: 4, comment: 'Tốt' }, lan); eq(r.status, 200);
  eq((await call('GET', '/lessons/toan-4-phan-so', undefined, lan)).data.myFeedback.rating, 4);
});

// ---------- Quản trị ----------
await t('/admin/stats: khách → 401, giáo viên → 403', async () => { eq((await call('GET', '/admin/stats')).status, 401); eq((await call('GET', '/admin/stats', undefined, lan)).status, 403); });
await t('GET /admin/stats', async () => {
  const r = await call('GET', '/admin/stats', undefined, admin); eq(r.status, 200); eq(r.data.series.length, 14);
  ok(r.data.kpis.teachers >= 6, 'teachers'); ok(r.data.kpis.promptCopies > 0, 'promptCopies'); ok(r.data.topPrompts.length > 0, 'topPrompts');
  eq((await call('GET', '/admin/stats?days=30', undefined, admin)).data.series.length, 30);
});
await t('PUT /admin/handbook đổi tên sản phẩm → /meta cập nhật', async () => {
  editor = await login('bientap@sotayai.vn', '123456');
  eq((await call('PUT', '/admin/handbook', { productTitle: 'ab' }, editor)).status, 400);
  const r = await call('PUT', '/admin/handbook', { productTitle: 'Sổ tay AI – tên mới để kiểm thử', groupName: '' }, editor); eq(r.status, 200); eq(r.data.handbook.groupName, 'Đang cập nhật');
  eq((await call('GET', '/meta')).data.handbook.productTitle, 'Sổ tay AI – tên mới để kiểm thử');
});
await t('PUT /admin/guide kiểm tra https', async () => {
  eq((await call('PUT', '/admin/guide', { tools: [{ name: 'X', url: 'http://x.vn' }] }, editor)).status, 400);
  const r = await call('PUT', '/admin/guide', { video: { title: 'Video', url: 'https://example.com/v', duration: '05:00' } }, editor); eq(r.data.guide.video.url, 'https://example.com/v');
});
await t('PUT /admin/checklist ít hơn 3 mục → 400', async () => { eq((await call('PUT', '/admin/checklist', { items: [{ title: 'Một mục' }] }, editor)).status, 400); });
await t('Quản lý câu lệnh: tạo, ẩn khỏi trang công khai, xoá', async () => {
  eq((await call('POST', '/admin/prompts', { title: 'Thử', subject: 'Không có', grade: 3, purpose: 'draft', text: 'x'.repeat(30) }, editor)).status, 400);
  const r = await call('POST', '/admin/prompts', { title: 'Câu lệnh kiểm thử', subject: 'Tin học', grade: 3, purpose: 'materials', text: 'Soạn hoạt động [tên bài] cho lớp 3, không cần Internet.', conditions: ['Không Internet trong giờ'] }, editor);
  eq(r.status, 200); newPromptId = r.data.id; eq(r.data.status, 'published');
  eq((await call('GET', '/meta')).data.counts.prompts, 81);
  await call('PUT', '/admin/prompts/' + newPromptId, { status: 'hidden' }, editor);
  eq((await call('GET', '/prompts/' + newPromptId)).status, 404, 'khách thấy câu lệnh ẩn');
  eq((await call('GET', '/admin/prompts/' + newPromptId, undefined, editor)).status, 200);
  eq((await call('GET', '/admin/prompts?status=hidden', undefined, editor)).data.total, 1);
  eq((await call('DELETE', '/admin/prompts/' + newPromptId, undefined, editor)).status, 200);
});
await t('Quản lý bài mẫu: tạo, sửa, xoá', async () => {
  eq((await call('POST', '/admin/lessons', { title: 'Bài thử', subject: 'Toán', grade: 2, activities: [] }, editor)).status, 400);
  const r = await call('POST', '/admin/lessons', { title: 'Bài kiểm thử', subject: 'Toán', grade: 2, duration: 35, activities: [{ name: 'Khởi động', minutes: 5, teacher: 'GV', students: 'HS', evidence: '' }] }, editor);
  eq(r.status, 200); newLessonId = r.data.id; eq(r.data.activities.length, 1);
  eq((await call('PUT', '/admin/lessons/' + newLessonId, { duration: 40 }, editor)).data.duration, 40);
  eq((await call('DELETE', '/admin/lessons/' + newLessonId, undefined, editor)).status, 200);
});
await t('PUT /admin/settings: biên tập viên → 403; tắt đăng ký → /register 403', async () => {
  eq((await call('PUT', '/admin/settings', { allowRegistration: false }, editor)).status, 403);
  eq((await call('PUT', '/admin/settings', { allowRegistration: false }, admin)).data.settings.allowRegistration, false);
  eq((await call('POST', '/register', { email: 'x' + email, password: '123456', name: 'Thử', school: 'TH', province: 'Lào Cai' })).status, 403);
  await call('PUT', '/admin/settings', { allowRegistration: true }, admin);
});
await t('Tắt góp ý ẩn danh → khách gửi góp ý 401', async () => {
  await call('PUT', '/admin/settings', { allowAnonymousFeedback: false }, admin);
  eq((await call('POST', '/feedback', { kind: 'general', comment: 'Góp ý thử nghiệm', visitorId: V })).status, 401);
  await call('PUT', '/admin/settings', { allowAnonymousFeedback: true }, admin);
});
await t('Khoá / mở khoá giáo viên', async () => {
  const r = await call('POST', `/admin/users/${freshId}/lock`, { lock: true, reason: 'Kiểm thử' }, editor); eq(r.data.user.status, 'locked');
  eq((await call('GET', '/me', undefined, fresh)).data.me, null, 'phiên cũ phải bị huỷ');
  eq((await call('POST', '/login', { email, password: '654321' })).status, 403);
  eq((await call('POST', `/admin/users/${freshId}/lock`, { lock: false }, editor)).data.user.status, 'active');
  eq((await call('POST', '/admin/users/u_admin/lock', { lock: true }, editor)).status, 403, 'biên tập viên khoá admin');
});
await t('Đổi vai trò: chỉ admin, không tự đổi', async () => {
  eq((await call('POST', `/admin/users/${freshId}/role`, { role: 'editor' }, editor)).status, 403);
  eq((await call('POST', `/admin/users/${freshId}/role`, { role: 'editor' }, admin)).data.user.role, 'editor');
  eq((await call('POST', '/admin/users/u_admin/role', { role: 'teacher' }, admin)).status, 400);
});
await t('GET /admin/users + chi tiết', async () => {
  const r = await call('GET', '/admin/users?q=' + encodeURIComponent('lan'), undefined, editor); ok(r.data.items.some(u => u.id === 'u_lan'));
  const d = await call('GET', '/admin/users/u_lan', undefined, editor); eq(d.data.plans.length, 2); ok('counts' in d.data.user); ok(d.data.user.email, 'staff thấy email');
});
await t('Góp ý: danh sách, đánh dấu đã xử lý', async () => {
  const r = await call('GET', '/admin/feedback?status=new', undefined, editor); ok(r.data.total > 0);
  const f = r.data.items[0]; ok(f.target === null || 'title' in f.target);
  eq((await call('PUT', '/admin/feedback/' + f.id, { status: 'handled', adminNote: 'Đã xem' }, editor)).data.status, 'handled');
});
await t('GET /admin/events lọc + phân trang', async () => {
  const r = await call('GET', '/admin/events?type=visit&limit=5', undefined, editor); eq(r.data.items.length, 5); ok(r.data.total > 5); ok(r.data.items.every(e => e.type === 'visit'));
});

// ---------- Khác ----------
await t('JSON hỏng → 400', async () => { const r = await call('POST', '/login', undefined, undefined, '{abc'); eq(r.status, 400); ok(hasError(r)); });
await t('Đường dẫn không tồn tại → 404', async () => { const r = await call('GET', '/khong-co'); eq(r.status, 404); ok(hasError(r)); });
await t('POST /logout huỷ phiên', async () => { await call('POST', '/logout', {}, lan); eq((await call('GET', '/me', undefined, lan)).data.me, null); });
await t('POST /admin/reset khôi phục dữ liệu mẫu', async () => {
  eq((await call('POST', '/admin/reset', {}, admin)).status, 200);
  eq((await call('GET', '/meta')).data.counts.prompts, 80);
  lan = await login('lan.gv@sotayai.vn', '123456'); eq((await call('GET', '/me/plans', undefined, lan)).data.items.length, 2);
});

console.log(`\n${pass} PASS, ${fail} FAIL`);
if (fail) { console.log('Lỗi:', fails.join(' | ')); process.exit(1); }
