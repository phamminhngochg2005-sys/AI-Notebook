/* Sổ tay AI — trang sổ tay (index.html).
 * Dạng sổ lật trang: 8 trải trang (bìa + 7 chương). Dữ liệu lấy từ API (/api/*) qua js/core.js.
 * Chương: 1 Giới thiệu · 2 Thư viện câu lệnh · 3 Cá nhân hóa · 4 Hướng dẫn · 5 Bài mẫu · 6 Đối chiếu · 7 Sổ tay của tôi */
(() => {
'use strict';
const { CFG, store, visitorId, GET, POST, PUT, DEL, track, setToken, $, $$, E, norm, I, toast, fail, copyText, qrSvg, fmtDate, ago, initials, debounce } = window.Sotay;

/* ================= Trạng thái ================= */
let M = null;                 // /api/meta
let P = [], L = [];           // câu lệnh, bài mẫu (danh sách)
const LD = {};                // chi tiết bài mẫu đã tải
const PF = {};                // đánh giá của tôi cho từng câu lệnh (đã tải)
let ME = null, COUNTS = { plans: 0, bookmarks: 0, profiles: 0 };
let PLANS = null, BOOKMARKS = null, PROFILES = null, PLAN = null;

const CH = [
  { id: 'bia', t: 'Trang bìa', s: 'Bìa' },
  { id: 'gioi-thieu', t: 'Giới thiệu đề tài', s: 'Giới thiệu', sub: 'Tên đề tài, mục tiêu, nơi ứng dụng' },
  { id: 'cau-lenh', t: 'Thư viện câu lệnh AI', s: 'Câu lệnh', sub: 'Tìm, lọc theo môn, lớp, mục đích và sao chép' },
  { id: 'ca-nhan-hoa', t: 'Cá nhân hóa kế hoạch bài dạy', s: 'Cá nhân hóa', sub: 'Nhập bối cảnh lớp học thật, nhận câu lệnh riêng' },
  { id: 'huong-dan', t: 'Hướng dẫn từng bước', s: 'Hướng dẫn', sub: 'Từ truy cập công cụ AI đến hoàn thiện kế hoạch' },
  { id: 'bai-mau', t: 'Kho kế hoạch bài dạy mẫu', s: 'Bài mẫu', sub: 'Theo định hướng CV 2345, có điều chỉnh vùng cao' },
  { id: 'doi-chieu', t: 'Đối chiếu & chỉnh sửa kết quả AI', s: 'Đối chiếu', sub: 'Danh mục kiểm tra, phụ lục và góp ý' },
  { id: 'cua-toi', t: 'Sổ tay của tôi', s: 'Của tôi', sub: 'Kế hoạch, câu lệnh đã lưu, hồ sơ lớp' },
];
const LAST = CH.length - 1;

const B_EXAMPLE = {
  subject: 'Toán', grade: '3', title: 'Chu vi hình chữ nhật',
  goal: 'Nhận biết chu vi hình chữ nhật là độ dài đường bao; tính được chu vi khi biết chiều dài, chiều rộng cùng đơn vị đo.',
  traits: "Lớp có 18/24 em là học sinh dân tộc H'Mông, rụt rè khi nói trước lớp; 5 em đọc chậm; các em hiểu nhanh khi được thao tác với đồ vật thật.",
  lang: 'Nhiều em cần hỗ trợ', home: "Tiếng H'Mông",
  equip: ['Bảng, phấn', 'Sách giáo khoa', 'Vật thật địa phương', 'Máy tính giáo viên'],
  equipNote: 'Mỗi nhóm có 1 thước kẻ; có bìa cát-tông cũ để cắt hình chữ nhật.',
  size: '24', conds: ['Phòng học hẹp', 'Điện không ổn định'], condNote: '', dur: '35', purpose: 'draft', source: '', base: 'p07',
};
const B_EMPTY = { subject: 'Toán', grade: '1', title: '', goal: '', traits: '', lang: 'Một số em cần hỗ trợ', home: '', equip: ['Bảng, phấn', 'Sách giáo khoa'], equipNote: '', size: '', conds: [], condNote: '', dur: '35', purpose: 'draft', source: '', base: null };
const clone = o => JSON.parse(JSON.stringify(o));

const S = {
  spread: 0,
  q: '', subj: '', grade: '', purpose: '', cond: '',
  pid: store.get('pid', 'p07'),
  b: Object.assign(clone(B_EXAMPLE), store.get('b', {})),
  bIsExample: store.get('bex', true),
  profileId: null,
  step: 0,
  lid: null, ltab: 'plan', lsubj: '',
  checks: store.get('checks', []),
  myTab: 'plans', planId: null, myProfileId: null, auth: 'login',
  promptExpanded: false,
};
const purposeName = id => (M.purposes.find(p => p.id === id) || {}).name || id;
const isStaff = () => ME && (ME.role === 'editor' || ME.role === 'admin');
const hb = k => E(M.handbook[k] || '');
const pend = k => { const v = String(M.handbook[k] || '').trim(); return !v || v === 'Đang cập nhật' ? '<span class="pending">Đang cập nhật</span>' : E(v); };
const ph = s => E(s).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');

/* ================= Hình minh họa bìa ================= */
const ART = `<svg class="art" viewBox="0 0 400 250" role="img" aria-label="Minh họa cuốn sách mở với mạng nơ-ron AI bay lên từ trang sách">
<defs><radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#12AFD3" stop-opacity=".3"/><stop offset="1" stop-color="#12AFD3" stop-opacity="0"/></radialGradient>
<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE0F7"/></linearGradient></defs>
<ellipse cx="200" cy="236" rx="160" ry="9" fill="#283078" opacity=".18"/>
<path d="M200 128 C158 112 92 108 36 120 L36 232 C92 220 158 222 200 236 Z" fill="#7F88D8"/><path d="M200 128 C242 112 308 108 364 120 L364 232 C308 220 242 222 200 236 Z" fill="#9AA2E0"/>
<path d="M200 122 C160 106 96 102 42 114 L42 226 C96 214 160 216 200 230 Z" fill="url(#pg)"/><path d="M200 122 C240 106 304 102 358 114 L358 226 C304 214 240 216 200 230 Z" fill="url(#pg)"/>
<path d="M200 122 V230" stroke="#7F88D8" stroke-width="2"/>
<g stroke="#B7BDE8" stroke-width="3" stroke-linecap="round" fill="none"><path d="M62 138 C100 130 150 132 180 142"/><path d="M62 154 C100 146 150 148 180 158"/><path d="M62 170 C100 162 140 164 168 172"/><path d="M62 186 C100 178 150 180 180 190"/><path d="M62 202 C96 194 130 196 150 202"/></g>
<rect x="220" y="134" width="118" height="70" rx="9" fill="#1B2066" transform="rotate(-4 279 169)"/>
<g transform="rotate(-4 279 169)" stroke-linecap="round"><path d="M232 150h40" stroke="#5CE8FF" stroke-width="3"/><path d="M232 162h88" stroke="#AEB4EC" stroke-width="3"/><path d="M232 174h70" stroke="#AEB4EC" stroke-width="3"/><rect x="232" y="184" width="44" height="10" rx="5" fill="#FFE45C"/></g>
<circle cx="200" cy="64" r="58" fill="url(#gl)"/><path class="flow" d="M200 124 C200 108 200 96 200 84"/>
<g class="ln"><path d="M200 64 L132 40"/><path d="M200 64 L160 12"/><path d="M200 64 L240 12"/><path d="M200 64 L268 40"/><path d="M200 64 L112 86"/><path d="M200 64 L288 86"/><path d="M132 40 L160 12"/><path d="M240 12 L268 40"/><path d="M112 86 L132 40"/><path d="M268 40 L288 86"/><path d="M160 12 L240 12"/><path d="M112 86 L70 66"/><path d="M288 86 L330 66"/><path d="M132 40 L84 24"/><path d="M268 40 L316 24"/></g>
<g class="n"><circle cx="132" cy="40" r="5" class="pulse"/><circle cx="160" cy="12" r="4"/><circle cx="240" cy="12" r="4" class="pulse"/><circle cx="268" cy="40" r="5"/><circle cx="112" cy="86" r="4.5"/><circle cx="288" cy="86" r="4.5" class="pulse"/><circle cx="70" cy="66" r="3"/><circle cx="330" cy="66" r="3"/><circle cx="84" cy="24" r="3" class="pulse"/><circle cx="316" cy="24" r="3"/></g>
<rect x="176" y="42" width="48" height="44" rx="12" fill="#1B2066" stroke="#5CE8FF" stroke-width="2.5"/>
<text x="200" y="72" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="20" fill="#FFFFFF">AI</text>
<path d="M344 128 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#FFE45C"/><path d="M52 92 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#FFE45C"/>
</svg>`;

/* ================= Nội dung từng trang ================= */
function runhead(sp, side) {
  if (side === 'L' || side === 'M') return `<div class="runhead"><span><b>Chương ${String(sp).padStart(2, '0')}</b> · ${E(CH[sp].s)}</span><span>${E(M.handbook.shortName || 'Sổ tay AI')}</span></div>`;
  return `<div class="runhead"><span>${E(CH[sp].t)}</span><span><b>●</b> AI</span></div>`;
}
const pageNo = (sp, side) => side === 'L' ? 2 * sp - 1 : 2 * sp;

function coverHTML() {
  const title = hb('productTitle').replace(/\bAI\b/, '<span class="hl">AI</span>');
  return `<div class="cover-frame"></div><div class="cover-in">
    <div class="cover-top"><span class="badge">Sản phẩm nghiên cứu khoa học</span><span>${hb('year')}</span></div>
    ${ART}
    <h1>${title}</h1>
    <div class="cover-meta"><div><small>Nhóm nghiên cứu</small><b>${hb('groupName')}</b></div><div><small>Đơn vị thực hiện</small><b>${hb('organization')}</b></div></div>
    <div class="cover-actions"><button class="btn btn-signal" type="button" data-go="1">Mở sổ tay ${I('arrow')}</button><button class="btn btn-line" type="button" data-go="2">Bắt đầu sử dụng</button></div>
    <div class="cover-foot"><span>${M.counts.prompts} câu lệnh AI</span><span>${M.counts.subjects} môn · lớp 1–5</span><span>${M.counts.lessons} bài dạy mẫu</span></div>
  </div>`;
}

function introHTML() {
  return `<header class="ph-head"><p class="eyebrow">Lời giới thiệu</p><h2 class="pt">Về đề tài nghiên cứu</h2></header>
  <div class="titlebox"><small>Tên đề tài</small><div class="rt">${hb('researchTitle')}</div><small style="margin-top:6px">Sản phẩm</small><div>${hb('productTitle')}</div></div>
  <section class="sec"><h3>Mục tiêu</h3><p class="lede" style="margin:0">${hb('introduction')}</p></section>
  <section class="sec"><div class="where-card">
    <div><h4>${I('map')} Ứng dụng tại</h4><p><b style="color:var(--ink)">${hb('applicationArea')}</b>. ${hb('applicationDescription')}</p></div>
    <div><h4>${I('users')} Người sử dụng</h4><p>Giáo viên Tiểu học dạy lớp 1–5, tổ trưởng chuyên môn và cán bộ quản lý dùng khi xây dựng, góp ý kế hoạch bài dạy.</p></div>
  </div></section>
  <section class="sec"><h3>Sổ tay gồm</h3><div class="stats">
    <div class="stat"><b>${M.counts.prompts}</b><small>câu lệnh AI mẫu</small></div>
    <div class="stat"><b>${M.counts.subjects}</b><small>môn học, lớp 1–5</small></div>
    <div class="stat"><b>${M.counts.lessons}</b><small>kế hoạch bài dạy mẫu</small></div>
    <div class="stat"><b>${M.guide.steps.length}</b><small>bước hướng dẫn sử dụng</small></div>
  </div></section>
  <section class="sec"><h3>Thực hiện</h3><dl class="info">
    <div><dt>Nhóm nghiên cứu</dt><dd>${pend('groupName')}</dd></div>
    <div><dt>Thành viên</dt><dd>${pend('members')}</dd></div>
    <div><dt>Giảng viên hướng dẫn</dt><dd>${pend('advisor')}</dd></div>
    <div><dt>Đơn vị thực hiện</dt><dd>${pend('organization')}</dd></div>
  </dl></section>`;
}
function tocHTML() {
  return `<header class="ph-head"><p class="eyebrow">Mục lục</p><h2 class="pt">Trong sổ tay này</h2></header>
  <ol class="toc">${CH.slice(1).map((c, i) => `<li><button type="button" data-go="${i + 1}"><span class="tn">${String(i + 1).padStart(2, '0')}</span><span><b>${E(c.t)}</b><small>${E(c.sub)}</small></span><span class="pg">tr. ${pageNo(i + 1, 'L')}</span></button></li>`).join('')}</ol>
  <section class="sec"><h3>Cách lật sổ</h3><div class="keys">
    <div><kbd>←</kbd><kbd>→</kbd> Phím mũi tên để lật trang</div>
    <div><span class="tag">Góc trang</span> Bấm góc dưới của trang để lật</div>
    <div><span class="tag">Dấu trang</span> Chọn dấu trang màu bên mép sổ để tới chương</div>
  </div></section>
  <section class="sec"><div class="okbox"><b>Nguyên tắc:</b> AI gợi ý, giáo viên quyết định. Mọi nội dung AI tạo ra cần được giáo viên kiểm tra, chỉnh sửa trước khi dạy.</div></section>`;
}

/* --- Thư viện câu lệnh --- */
function filtered() {
  const q = norm(S.q.trim()).split(/\s+/).filter(Boolean);
  return P.filter(p => (!S.subj || p.subject === S.subj) && (!S.grade || String(p.grade) === S.grade) && (!S.purpose || p.purpose === S.purpose) && (!S.cond || p.conditions.includes(S.cond))
    && (!q.length || (t => q.every(w => t.includes(w)))(norm([p.title, p.desc, p.subject, 'lop ' + p.grade, purposeName(p.purpose), p.howto, p.conditions.join(' '), p.text].join(' ')))));
}
function pcard(p) {
  return `<article class="pcard${p.id === S.pid ? ' on' : ''}" data-pc="${E(p.id)}">
    <div class="pc-top"><span class="tag subj">${E(p.subject)}</span><span class="tag">Lớp ${p.grade}</span><span class="tag pur-${E(p.purpose)}">${E(purposeName(p.purpose))}</span>${p.bookmarked ? `<span class="tag" style="background:var(--hl-tint);border-color:var(--hl)">${I('bookmark')} Đã lưu</span>` : ''}<span class="id">${p.stats.copies} lượt chép</span></div>
    <h3>${E(p.title)}</h3><p>${E(p.desc)}</p>
    <div class="pc-act"><button class="lnk" type="button" data-pick="${E(p.id)}">Xem hướng dẫn ${I('arrow')}</button><button class="btn btn-sm" type="button" data-copy="${E(p.id)}">${I('copy')}<span>Sao chép câu lệnh</span></button></div>
  </article>`;
}
const plistHTML = () => { const f = filtered(); return f.length ? f.map(pcard).join('') : `<div class="empty"><b>Không tìm thấy câu lệnh phù hợp.</b><br><span class="small">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</span><br><button class="lnk" type="button" data-reset-filter style="margin-top:8px">Xóa bộ lọc</button></div>`; };
const countHTML = () => `<span>Hiển thị ${filtered().length}/${P.length} câu lệnh</span>${(S.q || S.subj || S.grade || S.purpose || S.cond) ? '<button class="lnk" type="button" data-reset-filter>Xóa bộ lọc</button>' : ''}`;
function libraryHTML() {
  const opt = (v, cur, label) => `<option value="${E(v)}"${String(v) === String(cur) ? ' selected' : ''}>${E(label)}</option>`;
  return `<header class="ph-head" style="margin-bottom:6px"><p class="eyebrow">${P.length} câu lệnh mẫu · ${M.counts.subjects} môn</p><h2 class="pt">Thư viện câu lệnh AI</h2><p class="lede">Chọn câu lệnh theo môn, lớp và mục đích. Mỗi câu lệnh có hướng dẫn và chỗ trống <span class="mark">[trong ngoặc vuông]</span> để điền thông tin lớp thật.</p></header>
  <div class="filters">
    <label class="search"><span class="sr">Tìm câu lệnh</span>${I('search')}<input class="in" id="q" type="search" autocomplete="off" placeholder="Tìm: phân số, đọc hiểu, không máy chiếu…" value="${E(S.q)}"></label>
    <div class="grid3">
      <select class="in" id="fSubj" aria-label="Môn học">${opt('', S.subj, 'Tất cả môn')}${M.activeSubjects.map(s => opt(s, S.subj, s)).join('')}</select>
      <select class="in" id="fGrade" aria-label="Khối lớp">${opt('', S.grade, 'Mọi khối lớp')}${M.grades.map(g => opt(String(g), S.grade, 'Lớp ' + g)).join('')}</select>
      <select class="in" id="fPurpose" aria-label="Mục đích sử dụng">${opt('', S.purpose, 'Mọi mục đích')}${M.purposes.map(p => opt(p.id, S.purpose, p.name)).join('')}</select>
    </div>
    <div class="chips" id="fCond" aria-label="Điều kiện lớp học">${M.conditions.map(c => `<button type="button" class="chip${S.cond === c ? ' on' : ''}" data-cond="${E(c)}">${E(c)}</button>`).join('')}</div>
  </div>
  <div class="count" id="count">${countHTML()}</div>
  <div class="plist" id="plist">${plistHTML()}</div>`;
}
function promptFbHTML(p) {
  const mine = PF[p.id];
  const r = mine?.rating;
  return `<h4>Câu lệnh này có hữu ích với thầy cô?</h4>
    <div class="rate"><button type="button" class="${r === 1 ? 'on' : ''}" data-prate="1" aria-pressed="${r === 1}">${I('thumb')} Hữu ích</button><button type="button" class="${r === -1 ? 'on neg' : ''}" data-prate="-1" aria-pressed="${r === -1}">${I('thumbdown')} Chưa hữu ích</button></div>
    ${r ? `<label class="field"><span>Nhận xét thêm (không bắt buộc)</span><textarea class="in" id="pfbText" rows="2" placeholder="AI trả về chưa đúng ở đâu? Cần sửa câu lệnh thế nào?">${E(mine.comment || '')}</textarea></label>
    <div class="row" style="justify-content:space-between"><span class="fb-done">${I('check')} Đã ghi nhận đánh giá</span><button class="btn btn-sm" type="button" data-pfb-send>Gửi nhận xét</button></div>` : ''}`;
}
function detailHTML() {
  const p = P.find(x => x.id === S.pid) || P[0];
  if (!p) return `<div class="empty-state">${I('search')}<b>Chưa có câu lệnh</b></div>`;
  const steps = p.howto.split(/\s*\d\.\s+/).filter(Boolean);
  return `<header class="ph-head"><p class="eyebrow">${E(p.subject)} · Lớp ${p.grade} · ${E(purposeName(p.purpose))}</p><h2 class="pt" style="font-size:clamp(22px,2vw,28px)">${E(p.title)}</h2><p class="lede">${E(p.desc)}</p></header>
  <div class="chips">${p.conditions.map(c => `<span class="tag">${E(c)}</span>`).join('')}</div>
  <div class="stat-line"><span><b>${p.stats.copies}</b> lượt sao chép</span><span><b>${p.stats.views}</b> lượt xem</span><span><b>${p.stats.helpful}</b> đánh giá hữu ích</span></div>
  <section class="sec"><h3>Hướng dẫn sử dụng</h3><ol class="howto">${steps.map(s => `<li><span>${E(s)}</span></li>`).join('')}</ol></section>
  <section class="sec"><h3>Câu lệnh</h3><div class="term"><div class="term-bar"><i></i><i></i><i></i><span>cau-lenh-${E(p.id)}.txt</span></div><pre>${ph(p.text)}</pre></div></section>
  <div class="row" style="margin-top:14px"><button class="btn btn-primary" type="button" data-copy="${E(p.id)}">${I('copy')}<span>Sao chép câu lệnh</span></button><button class="btn" type="button" data-use="${E(p.id)}">${I('spark')} Cá nhân hóa</button><button class="btn${p.bookmarked ? ' on' : ''}" type="button" data-bm="prompt:${E(p.id)}" aria-pressed="${p.bookmarked}">${I('bookmark')} ${p.bookmarked ? 'Đã lưu' : 'Lưu'}</button></div>
  <p class="note">Phần <mark style="background:var(--hl-tint);color:inherit">[trong ngoặc vuông]</mark> cần thay bằng thông tin thật. Câu lệnh là mẫu minh họa, giáo viên kiểm tra kết quả trước khi dùng.</p>
  <section class="sec"><div class="fb" id="pfb">${promptFbHTML(p)}</div></section>`;
}

/* --- Cá nhân hóa --- */
function profileBarHTML() {
  if (!ME) return `<div class="profile-bar"><div class="row" style="justify-content:space-between"><span class="small">${I('save')} Đăng nhập để lưu nhiều hồ sơ lớp và kế hoạch bài dạy.</span><button class="lnk" type="button" data-auth="login">Đăng nhập ${I('arrow')}</button></div></div>`;
  const list = PROFILES || [];
  const cur = list.find(p => p.id === S.profileId);
  return `<div class="profile-bar">
    <div class="row"><select class="in" id="profSel" aria-label="Hồ sơ lớp đã lưu"><option value="">${list.length ? '— Chọn hồ sơ lớp đã lưu —' : 'Chưa có hồ sơ lớp đã lưu'}</option>${list.map(p => `<option value="${E(p.id)}"${p.id === S.profileId ? ' selected' : ''}>${E(p.name)}</option>`).join('')}</select></div>
    <div class="row"><input class="in sm" id="profName" maxlength="80" placeholder="Tên hồ sơ, VD: Lớp 3A" value="${E(cur ? cur.name : '')}"><button class="btn btn-sm" type="button" data-prof-save>${I('save')} ${cur ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ lớp'}</button></div>
  </div>`;
}
function builderHTML() {
  const b = S.b;
  const opt = (v, cur, label) => `<option value="${E(v)}"${String(v) === String(cur) ? ' selected' : ''}>${E(label ?? v)}</option>`;
  const chip = (attr, v, on) => `<button type="button" class="chip${on ? ' on' : ''}" ${attr}="${E(v)}" aria-pressed="${on}">${E(v)}</button>`;
  const needSrc = b.purpose === 'adapt' || b.purpose === 'review';
  return `<header class="ph-head" style="margin-bottom:10px"><p class="eyebrow">Bối cảnh lớp học thật</p><h2 class="pt">Cá nhân hóa kế hoạch bài dạy</h2><p class="lede">Nhập thông tin thực tế của lớp. Câu lệnh cá nhân hóa tự cập nhật theo từng ô bạn điền.</p></header>
  <div class="example-bar">${S.bIsExample ? `<span>${I('spark')} Đang hiển thị <b>ví dụ: lớp 3 vùng cao</b></span>` : `<span>Thông tin đang nhập được giữ trên máy này</span>`}<span class="row" style="gap:12px"><button class="lnk" type="button" data-bclear>Nhập mới</button><button class="lnk" type="button" data-bexample>Dùng ví dụ</button></span></div>
  <div id="profileBar">${profileBarHTML()}</div>
  <form id="bForm" autocomplete="off" onsubmit="return false">
    <div class="fgroup"><div class="fg-h"><span class="num">1</span> Bài học</div>
      <div class="grid2"><label class="field"><span>Môn học</span><select class="in" id="b_subject" data-b="subject">${M.subjects.map(s => opt(s, b.subject)).join('')}</select></label>
      <label class="field"><span>Lớp</span><select class="in" id="b_grade" data-b="grade">${M.grades.map(g => opt(g, b.grade, 'Lớp ' + g)).join('')}</select></label></div>
      <label class="field"><span>Tên bài <em>*</em></span><input class="in" id="b_title" data-b="title" maxlength="150" value="${E(b.title)}" placeholder="VD: Chu vi hình chữ nhật"></label>
      <label class="field"><span>Yêu cầu cần đạt (theo chương trình, SGK)</span><textarea class="in" id="b_goal" data-b="goal" rows="2" maxlength="1000" placeholder="Dán yêu cầu cần đạt kèm nguồn, trang">${E(b.goal)}</textarea></label>
    </div>
    <div class="fgroup"><div class="fg-h"><span class="num">2</span> Học sinh</div>
      <label class="field"><span>Đặc điểm học sinh</span><textarea class="in" id="b_traits" data-b="traits" rows="3" maxlength="1000" placeholder="Mức độ tiếp thu, số em cần hỗ trợ, điểm mạnh… (không ghi tên học sinh)">${E(b.traits)}</textarea></label>
      <div class="field"><span class="flabel">Năng lực tiếng Việt</span><div class="seg" role="group" aria-label="Năng lực tiếng Việt">${M.langLevels.map(l => `<button type="button" class="${b.lang === l ? 'on' : ''}" data-lang="${E(l)}" aria-pressed="${b.lang === l}">${E(l)}</button>`).join('')}</div></div>
      <label class="field"><span>Ngôn ngữ học sinh dùng ở nhà</span><input class="in" id="b_home" data-b="home" maxlength="60" value="${E(b.home)}" placeholder="VD: Tiếng H'Mông, tiếng Dao, tiếng Thái…"></label>
    </div>
    <div class="fgroup"><div class="fg-h"><span class="num">3</span> Thiết bị, học liệu đang có</div>
      <div class="chips">${M.equipment.map(e => chip('data-equip', e, b.equip.includes(e))).join('')}</div>
      <label class="field"><span>Ghi chú học liệu</span><input class="in" id="b_equipNote" data-b="equipNote" maxlength="300" value="${E(b.equipNote)}" placeholder="VD: mỗi nhóm có 1 thước kẻ, có bìa cát-tông cũ"></label>
    </div>
    <div class="fgroup"><div class="fg-h"><span class="num">4</span> Lớp học</div>
      <div class="grid2"><label class="field"><span>Sĩ số</span><input class="in" id="b_size" data-b="size" type="number" min="1" max="999" inputmode="numeric" value="${E(b.size)}" placeholder="VD: 24"></label>
      <label class="field"><span>Thời lượng</span><select class="in" id="b_dur" data-b="dur">${opt('35', b.dur, '35 phút (1 tiết)')}${opt('40', b.dur, '40 phút')}${opt('70', b.dur, '70 phút (2 tiết)')}</select></label></div>
      <div class="field"><span class="flabel">Điều kiện lớp học</span><div class="chips">${M.classConditions.map(c => chip('data-bcond', c, b.conds.includes(c))).join('')}</div></div>
      <label class="field"><span>Điều kiện khác</span><input class="in" id="b_condNote" data-b="condNote" maxlength="300" value="${E(b.condNote)}" placeholder="VD: mùa mưa nhiều em đến muộn"></label>
    </div>
    <div class="fgroup"><div class="fg-h"><span class="num">5</span> Mục đích</div>
      <select class="in" id="b_purpose" data-b="purpose" aria-label="Mục đích">${M.purposes.map(p => opt(p.id, b.purpose, p.name)).join('')}</select>
      <label class="field" ${needSrc ? '' : 'hidden'} id="srcField"><span>Dán kế hoạch / hoạt động cần ${b.purpose === 'review' ? 'rà soát' : 'điều chỉnh'}</span><textarea class="in" id="b_source" data-b="source" rows="4" maxlength="4000" placeholder="Dán bản dự thảo hiện có…">${E(b.source)}</textarea></label>
    </div>
  </form>`;
}
function buildPrompt() {
  const b = S.b, base = b.base && P.find(p => p.id === b.base);
  const v = (x, phd) => (x && String(x).trim()) ? String(x).trim() : `[${phd}]`;
  const lacks = ['Máy chiếu / Tivi', 'Máy in', 'Internet ổn định'].filter(x => !b.equip.includes(x));
  const task = { draft: 'Soạn bản dự thảo kế hoạch bài dạy', adapt: 'Điều chỉnh kế hoạch bài dạy dưới đây cho phù hợp điều kiện thực tế', review: 'Rà soát kế hoạch bài dạy dưới đây, chỉ ra điểm cần sửa và đề xuất cách sửa', materials: 'Thiết kế phiếu học tập, câu hỏi và học liệu đơn giản' }[b.purpose];
  const lines = [
    'Bạn là chuyên gia hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy theo Chương trình GDPT 2018 và khung kế hoạch bài dạy tham khảo tại Phụ lục 3, Công văn 2345/BGDĐT-GDTH.', '',
    `NHIỆM VỤ: ${task} cho bài "${v(b.title, 'tên bài')}", môn ${b.subject}, lớp ${b.grade}, thời lượng ${b.dur} phút.`,
    `YÊU CẦU CẦN ĐẠT: ${v(b.goal, 'dán yêu cầu cần đạt kèm nguồn')}`, '',
    'BỐI CẢNH LỚP HỌC THỰC TẾ:',
    `- Sĩ số: ${v(b.size, 'sĩ số')} học sinh${b.conds.length ? '; điều kiện: ' + b.conds.join(', ').toLowerCase() : ''}${b.condNote ? '; ' + b.condNote : ''}.`,
    `- Đặc điểm học sinh: ${v(b.traits, 'đặc điểm học sinh')}`,
    `- Năng lực tiếng Việt: ${b.lang.toLowerCase()}${b.home ? '; ngôn ngữ ở nhà: ' + b.home : ''}.`,
    `- Thiết bị, học liệu đang có: ${b.equip.length ? b.equip.join(', ') : '[liệt kê học liệu]'}${b.equipNote ? '. ' + b.equipNote : ''}.`,
    lacks.length ? `- KHÔNG có: ${lacks.join(', ')}.` : null,
    (b.purpose === 'adapt' || b.purpose === 'review') ? `\nKẾ HOẠCH HIỆN CÓ:\n${v(b.source, 'dán kế hoạch hoặc hoạt động hiện có')}` : null,
    base ? `\nTHAM KHẢO CÂU LỆNH MẪU "${base.title}":\n${base.text}` : null, '',
    'TRÌNH BÀY: I. Yêu cầu cần đạt; II. Đồ dùng dạy học; III. Các hoạt động dạy học chủ yếu (mỗi hoạt động ghi thời gian, việc của giáo viên, việc của học sinh, sản phẩm/cách đánh giá); IV. Điều chỉnh sau bài dạy (để trống).',
    `RÀNG BUỘC: chỉ dùng thiết bị, học liệu đã liệt kê; tổng thời gian đúng ${b.dur} phút; câu chỉ dẫn ngắn, có khung câu hỗ trợ tiếng Việt; ví dụ gần gũi với đời sống địa phương; không tự bịa số trang, số liệu. Nếu thiếu thông tin, hãy hỏi lại tôi trước khi soạn.`,
    'Tôi sẽ kiểm tra, chỉnh sửa trước khi sử dụng.',
  ];
  return lines.filter(x => x !== null).join('\n');
}
function fillScore() { const b = S.b; const k = [b.title, b.goal, b.traits, b.size, b.home, b.equip.length, b.lang]; return Math.round(k.filter(Boolean).length / k.length * 100); }
function toolLinks() { return `<div class="ai-links">${M.guide.tools.map(t => `<a href="${E(t.url)}" target="_blank" rel="noopener" data-tool="${E(t.id)}">${E(t.name)} ${I('ext')}</a>`).join('')}</div>`; }
function outHTML() {
  const b = S.b, base = b.base && P.find(p => p.id === b.base), sc = fillScore();
  const txt = E(buildPrompt()).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>').replace(/^(NHIỆM VỤ|YÊU CẦU CẦN ĐẠT|BỐI CẢNH LỚP HỌC THỰC TẾ|KẾ HOẠCH HIỆN CÓ|THAM KHẢO CÂU LỆNH MẪU|TRÌNH BÀY|RÀNG BUỘC)/gm, '<span class="k">$1</span>');
  return `<div class="field"><span class="flabel">Mức đầy đủ thông tin: ${sc}%</span><div class="meter"><i style="width:${sc}%"></i></div></div>
  <div class="base-pill" style="margin-top:12px">${base ? `<span>Câu lệnh nền: <b>${E(base.title)}</b></span><button class="lnk" type="button" data-unbase>Bỏ</button>` : `<span>Chưa chọn câu lệnh nền từ thư viện</span><button class="lnk" type="button" data-go="2">Chọn ${I('arrow')}</button>`}</div>
  <section class="sec" style="margin-top:14px"><div class="term"><div class="term-bar"><i></i><i></i><i></i><span>cau-lenh-ca-nhan-hoa.txt</span></div><pre id="outText">${txt}</pre></div></section>
  <div class="row" style="margin-top:14px"><button class="btn btn-primary" type="button" data-copy-out>${I('copy')}<span>Sao chép câu lệnh</span></button><button class="btn" type="button" data-save-plan>${I('save')} Lưu vào Kế hoạch của tôi</button></div>
  <section class="sec"><h3>Dán vào công cụ AI</h3>${toolLinks()}</section>`;
}
function outPageHTML() {
  return `<header class="ph-head" style="margin-bottom:10px"><p class="eyebrow">Kết quả</p><h2 class="pt" style="font-size:clamp(22px,2vw,28px)">Câu lệnh dành riêng cho lớp của bạn</h2></header>
  <div id="out">${outHTML()}</div>
  <section class="sec"><h3>AI sẽ trả về khung kế hoạch</h3><ul class="outline"><li><b>I.</b>Yêu cầu cần đạt</li><li><b>II.</b>Đồ dùng dạy học</li><li><b>III.</b>Các hoạt động dạy học chủ yếu</li><li><b>IV.</b>Điều chỉnh sau bài dạy</li></ul></section>
  <section class="sec"><div class="warn"><b>Bảo vệ thông tin học sinh.</b> Không nhập họ tên, ảnh, hoàn cảnh gia đình cụ thể của học sinh vào công cụ AI.</div></section>`;
}

/* --- Hướng dẫn --- */
function visualHTML(step) {
  switch (step.visual) {
    case 'ai-tools': return `<div class="shot"><div class="shot-bar"><span class="url">gemini.google.com</span></div><div class="shot-body"><div class="bubble ai"><b>Gemini</b><br>Xin chào cô giáo! Tôi có thể giúp gì cho bài dạy hôm nay?</div><div class="bubble me">Tôi cần soạn kế hoạch bài dạy Toán lớp 3…</div></div></div>
      <div class="qrs" style="margin-top:14px">${M.guide.tools.map(t => `<a class="qr" href="${E(t.url)}" target="_blank" rel="noopener" data-tool="${E(t.id)}"><span class="qbox">${qrSvg(t.url)}</span>${E(t.name)}<small>${E(t.url.replace(/^https:\/\//, ''))}</small></a>`).join('')}</div>`;
    case 'library': return `<div class="shot"><div class="shot-bar"><span class="url">Sổ tay AI › Thư viện câu lệnh</span></div><div class="shot-body"><div class="chips"><span class="chip on">Toán</span><span class="chip on">Lớp 3</span><span class="chip">Xây dựng kế hoạch</span></div><div class="pcard on" style="box-shadow:none"><h3>Chu vi hình chữ nhật từ tấm bìa</h3><p>Đo bìa, đi theo đường bao và tìm cách tính chu vi.</p><div class="pc-act"><span class="lnk">Xem hướng dẫn</span><span class="btn btn-sm btn-primary">${I('copy')} Sao chép câu lệnh</span></div></div></div></div>`;
    case 'context': return `<div class="shot"><div class="shot-bar"><span class="url">Sổ tay AI › Cá nhân hóa</span></div><div class="shot-body"><div class="term" style="box-shadow:none"><pre>NHIỆM VỤ: Soạn kế hoạch bài "<mark>[tên bài]</mark>"…
            ↓
NHIỆM VỤ: Soạn kế hoạch bài "Chu vi hình chữ nhật", lớp 3, 35 phút.
- Sĩ số: 24; KHÔNG có máy chiếu, máy in.</pre></div></div></div>`;
    case 'chat': return `<div class="shot"><div class="shot-bar"><span class="url">chatgpt.com</span></div><div class="shot-body"><div class="bubble ai"><b>III. Hoạt động 2 (12 phút):</b> Chiếu video về cách đo chu vi…</div><div class="bubble me">Lớp không có máy chiếu. Thay bằng hoạt động đo tấm bìa theo nhóm 4, rút còn 8 phút.</div><div class="bubble ai">Đã điều chỉnh: <b>Hoạt động 2 (8 phút)</b> — mỗi nhóm đo bìa 8 cm × 5 cm…</div></div></div>`;
    case 'review': return `<div class="shot"><div class="shot-bar"><span class="url">Sổ tay AI › Đối chiếu</span></div><div class="shot-body"><div class="row"><span class="verdict v-keep">GIỮ</span> Thảo luận nhóm 4, thêm khung câu</div><div class="row"><span class="verdict v-edit">SỬA</span> Phiếu in màu → chép 3 câu lên bảng</div><div class="row"><span class="verdict v-drop">BỎ</span> Chiếu video vì lớp không có máy chiếu</div></div></div>`;
    default: return '';
  }
}
function stepsHTML() {
  const v = M.guide.video, steps = M.guide.steps;
  return `<header class="ph-head"><p class="eyebrow">${steps.length} bước sử dụng</p><h2 class="pt">Hướng dẫn sử dụng từng bước</h2><p class="lede">Từ lúc mở công cụ AI đến khi có kế hoạch bài dạy dùng được trên lớp.</p></header>
  <ol class="steps" id="steps">${steps.map((s, i) => `<li><button type="button" class="step-btn${i === S.step ? ' on' : ''}" data-step="${i}" aria-pressed="${i === S.step}"><span class="sn">${i + 1}</span><span><b>${E(s.title)}</b><small>${E(s.summary)}</small></span></button></li>`).join('')}</ol>
  <section class="sec"><h3>Video hướng dẫn</h3><button type="button" class="video" data-video aria-label="Phát video hướng dẫn"><span class="vtitle">${E(v.title || 'Video hướng dẫn')}</span><span class="play">${I('play')}</span><span class="vcap"><span>${E(v.url ? 'Bấm để xem video' : (v.note || 'Đang cập nhật'))}</span><span>${E(v.duration || '')}</span></span></button></section>`;
}
function stepDetailHTML() {
  const steps = M.guide.steps; const s = steps[Math.min(S.step, steps.length - 1)]; const n = steps.length;
  const vis = visualHTML(s);
  return `<div class="row" style="align-items:flex-end;gap:14px"><span class="big-n">${String(S.step + 1).padStart(2, '0')}</span><div><p class="eyebrow">Bước ${S.step + 1}/${n}</p><h2 class="pt" style="font-size:clamp(21px,2vw,27px);margin-top:2px">${E(s.title)}</h2></div></div>
  <section class="sec"><ul class="tips">${s.points.map(x => `<li>${I('check')}<span>${E(x)}</span></li>`).join('')}</ul></section>
  ${vis ? `<section class="sec"><h3>Minh họa</h3>${vis}</section>` : ''}
  <div class="row" style="margin-top:16px;justify-content:space-between">${S.step > 0 ? `<button class="lnk" type="button" data-step="${S.step - 1}">${I('back')} Bước trước</button>` : '<span></span>'}${S.step < n - 1 ? `<button class="btn btn-sm" type="button" data-step="${S.step + 1}">Bước tiếp theo ${I('arrow')}</button>` : `<button class="btn btn-sm btn-hl" type="button" data-go="6">Mở danh mục đối chiếu ${I('arrow')}</button>`}</div>`;
}

/* --- Kho bài mẫu --- */
function lessonListHTML() {
  const subs = [...new Set(L.map(l => l.subject))];
  const list = L.filter(l => !S.lsubj || l.subject === S.lsubj);
  return `<header class="ph-head"><p class="eyebrow">${L.length} bài tham khảo</p><h2 class="pt">Kho kế hoạch bài dạy mẫu</h2><p class="lede">Bài dạy minh họa theo định hướng Công văn 2345/BGDĐT-GDTH, mỗi bài có phương án điều chỉnh cho điều kiện vùng cao.</p></header>
  <div class="chips" style="margin-bottom:12px"><button type="button" class="chip${!S.lsubj ? ' on' : ''}" data-lsubj="">Tất cả</button>${subs.map(s => `<button type="button" class="chip${S.lsubj === s ? ' on' : ''}" data-lsubj="${E(s)}">${E(s)}</button>`).join('')}</div>
  <div class="plist" id="llist">${list.map(l => `<button type="button" class="lcard${l.id === S.lid ? ' on' : ''}" data-lesson="${E(l.id)}"><span class="pc-top"><span class="tag subj">${E(l.subject)}</span><span class="tag">Lớp ${l.grade}</span><span class="tag">${l.duration} phút</span>${l.adaptationCount ? '<span class="tag alt">Vùng cao</span>' : ''}${l.bookmarked ? `<span class="tag" style="background:var(--hl-tint);border-color:var(--hl)">${I('bookmark')}</span>` : ''}</span><h3>${E(l.title)}</h3><p>${E(l.summary)}</p><small class="stat-line" style="margin:0">${l.stats.ratingAvg ? `<span><b>${l.stats.ratingAvg}</b>/5 (${l.stats.ratingCount} đánh giá)</span>` : ''}<span><b>${l.stats.views}</b> lượt xem</span></small></button>`).join('') || '<div class="empty">Chưa có bài mẫu.</div>'}</div>
  <section class="sec"><div class="cv-box"><b>Khung kế hoạch bài dạy tham khảo</b> <span class="small muted">(Phụ lục 3, CV 2345/BGDĐT-GDTH ngày 07/6/2021)</span><ol><li>Yêu cầu cần đạt</li><li>Đồ dùng dạy học</li><li>Các hoạt động dạy học chủ yếu</li><li>Điều chỉnh sau bài dạy (nếu có)</li></ol></div></section>`;
}
function starsHTML(val, attr) {
  return `<span class="stars" role="group" aria-label="Chọn số sao">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${val >= n ? 'on' : ''}" ${attr}="${n}" aria-label="${n} sao" aria-pressed="${val === n}"><svg viewBox="0 0 24 24">${'<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>'}</svg></button>`).join('')}</span>`;
}
function lessonFbHTML(l) {
  const mine = l.myFeedback; const r = mine?.rating || 0;
  return `<h4>Thầy cô đánh giá bài mẫu này</h4>${starsHTML(r, 'data-lrate')}
  ${r ? `<label class="field"><span>Nhận xét (không bắt buộc)</span><textarea class="in" id="lfbText" rows="2" placeholder="Bài mẫu đã dùng được trên lớp chưa? Cần điều chỉnh gì?">${E(mine.comment || '')}</textarea></label>
  <div class="row" style="justify-content:space-between"><span class="fb-done">${I('check')} Đã ghi nhận ${r} sao</span><button class="btn btn-sm" type="button" data-lfb-send>Gửi nhận xét</button></div>` : ''}`;
}
function lessonDetailHTML() {
  const l = LD[S.lid];
  if (!l) return `<div class="empty-state" style="margin-top:40px"><div class="boot" style="position:static"><div><i></i>Đang tải bài mẫu…</div></div></div>`;
  const tabs = [['plan', 'Kế hoạch'], ['sheet', 'Phiếu học tập'], ['q', 'Câu hỏi'], ['alt', 'Vùng cao'], ['rev', 'Rà soát AI']];
  let body = '';
  if (S.ltab === 'plan') {
    body = `<h4 class="roman"><span>I.</span>Yêu cầu cần đạt</h4><div class="goals">${E(l.goals)}</div>
    <h4 class="roman"><span>II.</span>Đồ dùng dạy học</h4><ul class="plain">${l.materials.map(m => `<li>${E(m)}</li>`).join('')}</ul>
    <h4 class="roman"><span>III.</span>Các hoạt động dạy học chủ yếu</h4>${l.activities.map(a => `<div class="act"><div class="act-h"><b>${E(a.name)}</b><span class="min">${a.minutes} phút</span></div><dl><div><dt>Giáo viên</dt><dd>${E(a.teacher)}</dd></div><div><dt>Học sinh</dt><dd>${E(a.students)}</dd></div>${a.evidence ? `<div><dt>Sản phẩm, quan sát</dt><dd>${E(a.evidence)}</dd></div>` : ''}</dl></div>`).join('')}
    <h4 class="roman"><span>IV.</span>Điều chỉnh sau bài dạy</h4><div class="blank-lines" aria-label="Giáo viên ghi sau tiết dạy"></div>`;
  } else if (S.ltab === 'sheet') body = l.worksheet ? `<div class="sheet">${E(l.worksheet)}</div>` : '<p class="muted">Bài này chưa có phiếu học tập.</p>';
  else if (S.ltab === 'q') body = `<ol class="qlist">${l.questions.map(q => `<li>${E(q)}</li>`).join('')}</ol>`;
  else if (S.ltab === 'alt') body = `<p class="muted small" style="margin-bottom:10px">Phương án chuẩn bị trước cho lớp thiếu thiết bị, học sinh cần hỗ trợ tiếng Việt, không gian hẹp.</p><ul class="tips">${l.adaptations.map(a => `<li>${I('map')}<span>${E(a)}</span></li>`).join('')}</ul>`;
  else body = `<ul class="tips">${l.review.map(a => `<li>${I('shield')}<span>${E(a)}</span></li>`).join('')}</ul>`;
  const total = l.activities.reduce((s, a) => s + a.minutes, 0);
  return `<div class="khbd-h"><small>Kế hoạch bài dạy · minh họa</small><h3>${E(l.title)}</h3><div class="khbd-meta"><span>Môn: <b>${E(l.subject)}</b></span><span>Lớp: <b>${l.grade}</b></span><span>Thời lượng: <b>${l.duration} phút</b></span><span>Hoạt động: <b>${l.activities.length} (${total}′)</b></span></div></div>
  <div class="chips" style="margin-top:10px;justify-content:center">${l.conditions.map(c => `<span class="tag">${E(c)}</span>`).join('')}</div>
  <div class="ltabs" role="tablist">${tabs.map(([k, v]) => `<button type="button" role="tab" aria-selected="${S.ltab === k}" class="${S.ltab === k ? 'on' : ''}" data-ltab="${k}">${v}</button>`).join('')}</div>
  <div id="lbody">${body}</div>
  <div class="row" style="margin-top:16px"><button class="btn btn-sm" type="button" data-copy-lesson>${I('copy')}<span>Sao chép kế hoạch</span></button><button class="btn btn-sm${l.bookmarked ? ' on' : ''}" type="button" data-bm="lesson:${E(l.id)}" aria-pressed="${l.bookmarked}">${I('bookmark')} ${l.bookmarked ? 'Đã lưu' : 'Lưu'}</button><span class="small muted">Nội dung minh họa, chưa thẩm định chuyên môn.</span></div>
  <section class="sec"><div class="fb" id="lfb">${lessonFbHTML(l)}</div></section>`;
}
function lessonText(l) {
  return [`KẾ HOẠCH BÀI DẠY (minh họa) — ${l.title}`, `Môn: ${l.subject} — Lớp ${l.grade} — ${l.duration} phút`, '', 'I. YÊU CẦU CẦN ĐẠT', l.goals, '', 'II. ĐỒ DÙNG DẠY HỌC', ...l.materials.map(m => '- ' + m), '', 'III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU',
    ...l.activities.flatMap(a => [`${a.name} (${a.minutes} phút)`, `  Giáo viên: ${a.teacher}`, `  Học sinh: ${a.students}`, a.evidence ? `  Sản phẩm: ${a.evidence}` : null].filter(Boolean)), '', 'IV. ĐIỀU CHỈNH SAU BÀI DẠY', '........................................', '', 'ĐIỀU CHỈNH VÙNG CAO', ...l.adaptations.map(a => '- ' + a)].join('\n');
}

/* --- Đối chiếu & phụ lục --- */
function checksHTML() {
  const C = M.checklist; const n = C.filter((_, i) => S.checks[i]).length;
  return `<header class="ph-head"><p class="eyebrow">Trước khi dùng</p><h2 class="pt">Đối chiếu & chỉnh sửa kết quả AI</h2><p class="lede">Đánh dấu từng mục sau khi đã kiểm tra bản kế hoạch do AI hỗ trợ soạn.</p></header>
  <div class="field" id="chkMeter"><span class="flabel">Đã kiểm tra ${n}/${C.length} mục</span><div class="meter"><i style="width:${n / C.length * 100}%"></i></div></div>
  <div style="display:grid;gap:8px;margin-top:12px">${C.map((c, i) => `<label class="check"><input type="checkbox" data-check="${i}"${S.checks[i] ? ' checked' : ''}><span><b>${E(c.title)}</b><small>${E(c.detail)}</small></span></label>`).join('')}</div>
  <section class="sec"><h3>Giữ – Sửa – Bỏ: ví dụ đối chiếu</h3><div class="tbl-wrap"><table class="ksb"><thead><tr><th>AI đề xuất</th><th>Quyết định</th><th>Lý do, cách sửa</th></tr></thead><tbody>
    <tr><td>Chiếu video vòng đời của cây (5 phút)</td><td><span class="verdict v-drop">BỎ</span></td><td>Lớp không có máy chiếu. Thay bằng quan sát cây thật ở vườn trường.</td></tr>
    <tr><td>Phát phiếu học tập in màu cho từng em</td><td><span class="verdict v-edit">SỬA</span></td><td>Không có máy in. Chép 3 câu hỏi lên bảng, học sinh làm vào vở.</td></tr>
    <tr><td>Thảo luận nhóm 4, đại diện trình bày</td><td><span class="verdict v-keep">GIỮ</span></td><td>Phù hợp sĩ số 24. Bổ sung khung câu "Em thấy… vì…" hỗ trợ tiếng Việt.</td></tr>
  </tbody></table></div></section>`;
}
function backHTML() {
  const canFb = ME || M.config.allowAnonymousFeedback;
  return `<header class="ph-head"><p class="eyebrow">Phụ lục</p><h2 class="pt">Thông tin & góp ý</h2></header>
  <dl class="info">
    <div><dt>Sản phẩm</dt><dd>${hb('productTitle')}</dd></div>
    <div><dt>Đề tài</dt><dd>${hb('researchTitle')}</dd></div>
    <div><dt>Nhóm nghiên cứu</dt><dd>${pend('groupName')}</dd></div>
    <div><dt>Đơn vị thực hiện</dt><dd>${pend('organization')}</dd></div>
    <div><dt>Ứng dụng tại</dt><dd>${hb('applicationArea')}</dd></div>
    <div><dt>Năm</dt><dd>${hb('year')}</dd></div>
  </dl>
  <section class="sec"><h3>Căn cứ</h3><ul class="tips">
    <li>${I('book')}<span>Chương trình giáo dục phổ thông 2018 (Thông tư 32/2018/TT-BGDĐT).</span></li>
    <li>${I('book')}<span><a href="https://thnguyentruongto.hcm.edu.vn/van-ban-cac-cap/cong-van-2345bgddt-gdth-ngay-07-thang-6-nam-2021-cua-bo-giao-duc-va-dao-tao/ct/80817/883672" target="_blank" rel="noopener">Công văn 2345/BGDĐT-GDTH ngày 07/6/2021</a> về xây dựng kế hoạch giáo dục nhà trường cấp Tiểu học, Phụ lục 3.</span></li>
  </ul></section>
  <section class="sec"><div class="fb" id="gfb"><h4>${I('msg')} Góp ý cho nhóm nghiên cứu</h4>
    ${canFb ? `<div class="row small muted">Mức độ hài lòng: ${starsHTML(S.gRate || 0, 'data-grate')}</div>
    <textarea class="in" id="gfbText" rows="3" maxlength="1000" placeholder="Thầy cô thấy sổ tay dùng được ở đâu, cần bổ sung gì?"></textarea>
    <div class="row" style="justify-content:space-between"><span class="small muted">${ME ? 'Gửi với tài khoản ' + E(ME.name) : 'Gửi ẩn danh'}</span><button class="btn btn-sm btn-primary" type="button" data-gfb-send>Gửi góp ý</button></div>`
    : `<p class="small">Vui lòng <button class="lnk" type="button" data-auth="login">đăng nhập</button> để gửi góp ý.</p>`}
  </div></section>
  <section class="sec"><div class="warn"><b>Lưu ý.</b> Câu lệnh và bài dạy trong sổ tay là mẫu minh họa, cần rà soát chuyên môn. Giao diện công cụ AI có thể thay đổi theo thời gian.</div></section>
  <div class="fin"><span class="orn">— HẾT PHẦN NỘI DUNG —</span><div class="row" style="justify-content:center"><button class="lnk" type="button" data-go="0">${I('back')} Gập sổ, về bìa</button><button class="lnk" type="button" data-go="7">Sổ tay của tôi ${I('arrow')}</button></div></div>`;
}

/* --- Sổ tay của tôi --- */
function authHTML() {
  const reg = S.auth === 'register';
  const opt = (v, label) => `<option value="${E(v)}">${E(label ?? v)}</option>`;
  return `<header class="ph-head"><p class="eyebrow">Tài khoản giáo viên</p><h2 class="pt">${reg ? 'Tạo tài khoản' : 'Đăng nhập'}</h2><p class="lede">${reg ? 'Miễn phí, chỉ cần email. Tài khoản giúp lưu kế hoạch, câu lệnh và hồ sơ lớp.' : 'Đăng nhập để mở kế hoạch và hồ sơ lớp đã lưu.'}</p></header>
  <div class="auth-switch" role="tablist"><button type="button" role="tab" class="${!reg ? 'on' : ''}" aria-selected="${!reg}" data-auth="login">Đăng nhập</button><button type="button" role="tab" class="${reg ? 'on' : ''}" aria-selected="${reg}" data-auth="register">Tạo tài khoản</button></div>
  ${reg ? `<form class="form" id="regForm" autocomplete="on">
      ${M.config.allowRegistration ? '' : '<p class="err">Sổ tay đang tạm dừng đăng ký tài khoản mới.</p>'}
      <label class="field"><span>Họ và tên <em>*</em></span><input class="in" id="r_name" name="name" autocomplete="name" maxlength="60" required></label>
      <label class="field"><span>Email <em>*</em></span><input class="in" id="r_email" name="email" type="email" autocomplete="email" maxlength="120" required></label>
      <label class="field"><span>Mật khẩu (ít nhất 6 ký tự) <em>*</em></span><input class="in" id="r_pass" name="password" type="password" autocomplete="new-password" minlength="6" required></label>
      <label class="field"><span>Trường đang dạy <em>*</em></span><input class="in" id="r_school" name="school" maxlength="120" required placeholder="VD: Trường Tiểu học …"></label>
      <label class="field"><span>Tỉnh/thành <em>*</em></span><select class="in" id="r_province" name="province" required>${opt('', '— Chọn tỉnh/thành —')}${M.provinces.map(p => opt(p)).join('')}</select></label>
      <div class="field"><span class="flabel">Khối lớp đang dạy</span><div class="chips">${M.grades.map(g => `<button type="button" class="chip" data-rgrade="${g}" aria-pressed="false">Lớp ${g}</button>`).join('')}</div></div>
      <p class="err" id="regErr" hidden></p>
      <button class="btn btn-primary" type="submit"${M.config.allowRegistration ? '' : ' disabled'}>${I('user')} Tạo tài khoản</button>
    </form>`
  : `<form class="form" id="loginForm" autocomplete="on">
      <label class="field"><span>Email</span><input class="in" id="l_email" name="email" type="email" autocomplete="username" required></label>
      <label class="field"><span>Mật khẩu</span><input class="in" id="l_pass" name="password" type="password" autocomplete="current-password" required></label>
      <p class="err" id="loginErr" hidden></p>
      <button class="btn btn-primary" type="submit">${I('arrow')} Đăng nhập</button>
    </form>`}`;
}
function perksHTML() {
  const demo = CFG.DEMO ? `<section class="sec"><h3>Tài khoản dùng thử</h3><div class="demo-acc">
    <button type="button" data-demo="lan.gv@sotayai.vn|123456"><span class="avatar">LL</span><span><b>Cô Lò Thị Lan</b><small>Giáo viên · đã có kế hoạch, hồ sơ lớp</small></span><span class="tag">Dùng</span></button>
    <button type="button" data-demo="bientap@sotayai.vn|123456"><span class="avatar" style="background:var(--signal)">TH</span><span><b>Trần Thu Hà</b><small>Biên tập viên · vào được trang quản trị</small></span><span class="tag">Dùng</span></button>
    <button type="button" data-demo="admin@sotayai.vn|admin123"><span class="avatar" style="background:var(--ink)">QT</span><span><b>Quản trị viên</b><small>Toàn quyền quản trị</small></span><span class="tag">Dùng</span></button>
  </div><p class="note">Chỉ hiện ở bản xem thử.</p></section>` : '';
  return `<header class="ph-head"><p class="eyebrow">Vì sao nên có tài khoản</p><h2 class="pt" style="font-size:clamp(22px,2vw,28px)">Sổ tay riêng của từng thầy cô</h2></header>
  <ul class="perks">
    <li><span>${I('file')}</span><span><b>Kế hoạch của tôi</b>Lưu câu lệnh đã tạo, dán kết quả AI, đánh dấu danh mục đối chiếu và ghi chú sau tiết dạy.</span></li>
    <li><span>${I('bookmark')}</span><span><b>Câu lệnh, bài mẫu đã lưu</b>Đánh dấu những câu lệnh hay dùng để mở lại nhanh.</span></li>
    <li><span>${I('users')}</span><span><b>Hồ sơ lớp</b>Lưu sĩ số, đặc điểm học sinh, học liệu của từng lớp, không phải nhập lại.</span></li>
  </ul>
  <p class="note">Không có tài khoản vẫn dùng được toàn bộ thư viện câu lệnh, cá nhân hóa, hướng dẫn và bài mẫu.</p>${demo}`;
}
function meCardHTML() {
  const role = (M.roles.find(r => r.id === ME.role) || {}).name || '';
  return `<div class="me-card"><span class="avatar lg">${E(initials(ME.name))}</span><span style="min-width:0"><b>${E(ME.name)}</b><small>${E(ME.school)} · ${E(ME.province)}</small><small>${E(role)}${ME.grades?.length ? ' · Lớp ' + ME.grades.join(', ') : ''}</small></span></div>
  <div class="mytabs" role="tablist">${[['plans', 'Kế hoạch', COUNTS.plans], ['saved', 'Đã lưu', COUNTS.bookmarks], ['profiles', 'Hồ sơ lớp', COUNTS.profiles], ['account', 'Tài khoản', null]].map(([k, v, n]) => `<button type="button" role="tab" aria-selected="${S.myTab === k}" class="${S.myTab === k ? 'on' : ''}" data-mytab="${k}">${v}${n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>`;
}
const statusName = id => (M.planStatuses.find(s => s.id === id) || {}).name || id;
function miniMeter(checks) { const n = M.checklist.length; return `<span class="mini-meter" aria-label="Đã đối chiếu ${checks.filter(Boolean).length}/${n}">${M.checklist.map((_, i) => `<i class="${checks[i] ? 'on' : ''}"></i>`).join('')}</span>`; }
function myLeftHTML() {
  if (!ME) return authHTML();
  let list = '';
  if (S.myTab === 'plans') {
    list = PLANS == null ? '<p class="muted small">Đang tải…</p>' : PLANS.length ? `<div class="mlist">${PLANS.map(p => `<button type="button" class="mitem${p.id === S.planId ? ' on' : ''}" data-plan="${E(p.id)}"><b>${E(p.title)}</b><span class="row"><span class="st st-${E(p.status)}">${E(statusName(p.status))}</span>${miniMeter(p.checks)}<small>${E(p.subject)} · Lớp ${p.grade} · sửa ${E(ago(p.updatedAt))}</small></span></button>`).join('')}</div>`
      : `<div class="empty-state">${I('file')}<b>Chưa có kế hoạch nào</b><span class="small">Tạo câu lệnh ở chương Cá nhân hóa rồi bấm "Lưu vào Kế hoạch của tôi".</span><button class="btn btn-sm" type="button" data-go="3">${I('spark')} Mở Cá nhân hóa</button></div>`;
    if (PLANS?.length) list += `<button class="btn btn-sm btn-ghost" type="button" data-go="3" style="margin-top:12px">${I('plus')} Tạo kế hoạch mới</button>`;
  } else if (S.myTab === 'saved') {
    const ps = (BOOKMARKS || []).filter(b => b.kind === 'prompt'), ls = (BOOKMARKS || []).filter(b => b.kind === 'lesson');
    const row = b => b.item ? `<div class="mitem"><b>${E(b.item.title)}</b><span class="row"><span class="tag subj">${E(b.item.subject)}</span><span class="tag">Lớp ${b.item.grade}</span><small>lưu ${E(ago(b.createdAt))}</small></span><span class="row" style="justify-content:space-between"><button class="lnk" type="button" data-open="${b.kind}:${E(b.targetId)}">Mở ${I('arrow')}</button>${b.kind === 'prompt' ? `<button class="btn btn-sm" type="button" data-copy="${E(b.targetId)}">${I('copy')}<span>Sao chép</span></button>` : ''}<button class="lnk" type="button" data-bm="${b.kind}:${E(b.targetId)}" style="color:var(--stamp)">Bỏ lưu</button></span></div>`
      : `<div class="mitem"><b class="muted">Nội dung đã bị gỡ</b><button class="lnk" type="button" data-bm="${b.kind}:${E(b.targetId)}">Bỏ khỏi danh sách</button></div>`;
    list = BOOKMARKS == null ? '<p class="muted small">Đang tải…</p>' : BOOKMARKS.length ? `<h3 class="flabel" style="margin-bottom:8px">Câu lệnh (${ps.length})</h3><div class="mlist">${ps.map(row).join('') || '<p class="small muted">Chưa lưu câu lệnh nào.</p>'}</div><h3 class="flabel" style="margin:16px 0 8px">Bài mẫu (${ls.length})</h3><div class="mlist">${ls.map(row).join('') || '<p class="small muted">Chưa lưu bài mẫu nào.</p>'}</div>`
      : `<div class="empty-state">${I('bookmark')}<b>Chưa lưu mục nào</b><span class="small">Bấm nút "Lưu" ở câu lệnh hoặc bài mẫu để thêm vào đây.</span><button class="btn btn-sm" type="button" data-go="2">Mở thư viện</button></div>`;
  } else if (S.myTab === 'profiles') {
    list = PROFILES == null ? '<p class="muted small">Đang tải…</p>' : PROFILES.length ? `<div class="mlist">${PROFILES.map(p => `<button type="button" class="mitem${p.id === S.myProfileId ? ' on' : ''}" data-myprof="${E(p.id)}"><b>${E(p.name)}</b><span class="row"><span class="tag subj">${E(p.data.subject)}</span><span class="tag">Lớp ${E(p.data.grade)}</span>${p.data.size ? `<span class="tag">${E(p.data.size)} HS</span>` : ''}<small>sửa ${E(ago(p.updatedAt))}</small></span></button>`).join('')}</div>`
      : `<div class="empty-state">${I('users')}<b>Chưa có hồ sơ lớp</b><span class="small">Nhập bối cảnh lớp ở chương Cá nhân hóa rồi bấm "Lưu hồ sơ lớp".</span><button class="btn btn-sm" type="button" data-go="3">Mở Cá nhân hóa</button></div>`;
  } else {
    list = `<dl class="info"><div><dt>Email</dt><dd>${E(ME.email)}</dd></div><div><dt>Tham gia</dt><dd>${E(fmtDate(ME.joinedAt))}</dd></div><div><dt>Môn dạy</dt><dd>${ME.subjects?.length ? E(ME.subjects.join(', ')) : '<span class="pending">Chưa chọn</span>'}</dd></div></dl>
      ${isStaff() ? `<a class="btn btn-sm" href="admin.html" style="margin-top:14px">${I('gear')} Mở trang quản trị</a>` : ''}`;
  }
  return `<header class="ph-head" style="margin-bottom:12px"><p class="eyebrow">Sổ tay của tôi</p></header>${meCardHTML()}<div id="mylist">${list}</div>`;
}
function planEditorHTML() {
  const p = PLAN;
  if (!p) return `<div class="empty-state" style="margin-top:30px">${I('file')}<b>Chọn một kế hoạch để mở</b><span class="small">Mỗi kế hoạch gồm câu lệnh đã gửi AI, kết quả AI trả về, danh mục đối chiếu và ghi chú điều chỉnh.</span></div>`;
  const C = M.checklist; const n = C.filter((_, i) => p.checks[i]).length;
  return `<div class="row" style="justify-content:space-between"><p class="eyebrow">Kế hoạch của tôi</p><span class="save-state" id="saveState">${I('check')} Đã lưu ${E(ago(p.updatedAt))}</span></div>
  <input class="plan-title" id="pl_title" data-pl="title" maxlength="150" value="${E(p.title)}" aria-label="Tên kế hoạch">
  <p class="small muted" style="margin-top:6px">${E(p.subject)} · Lớp ${p.grade} · tạo ${E(fmtDate(p.createdAt))}</p>
  <div class="field" style="margin-top:12px"><span class="flabel">Trạng thái</span><div class="seg" role="group" aria-label="Trạng thái kế hoạch">${M.planStatuses.map(s => `<button type="button" class="${p.status === s.id ? 'on' : ''}" data-plstatus="${s.id}" aria-pressed="${p.status === s.id}">${E(s.name)}</button>`).join('')}</div></div>
  <section class="sec"><h3><span class="num">1</span> Câu lệnh đã gửi AI</h3><div class="term${S.promptExpanded ? '' : ' clip'}"><div class="term-bar"><i></i><i></i><i></i><span>cau-lenh.txt</span></div><pre>${ph(p.promptText)}</pre></div>
    <div class="row" style="margin-top:10px"><button class="btn btn-sm" type="button" data-copy-planprompt>${I('copy')}<span>Sao chép câu lệnh</span></button><button class="lnk" type="button" data-expand>${S.promptExpanded ? 'Thu gọn' : 'Xem đầy đủ'}</button></div>
    <div style="margin-top:10px">${toolLinks()}</div></section>
  <section class="sec"><h3><span class="num">2</span> Kết quả AI trả về</h3><textarea class="in tall" id="pl_aiResult" data-pl="aiResult" maxlength="20000" placeholder="Dán toàn bộ kế hoạch AI đã soạn vào đây để đối chiếu, chỉnh sửa.">${E(p.aiResult)}</textarea></section>
  <section class="sec"><h3><span class="num">3</span> Đối chiếu trước khi dùng</h3>
    <div class="field" id="plMeter"><span class="flabel">Đã kiểm tra ${n}/${C.length} mục</span><div class="meter"><i style="width:${n / C.length * 100}%"></i></div></div>
    <div style="display:grid;gap:6px;margin-top:10px">${C.map((c, i) => `<label class="check"><input type="checkbox" data-plcheck="${i}"${p.checks[i] ? ' checked' : ''}><span><b>${E(c.title)}</b><small>${E(c.detail)}</small></span></label>`).join('')}</div></section>
  <section class="sec"><h3><span class="num">4</span> Ghi chú điều chỉnh</h3><textarea class="in" id="pl_note" data-pl="note" rows="4" maxlength="3000" placeholder="Đề xuất nào của AI đã giữ, sửa, bỏ? Sau tiết dạy cần điều chỉnh gì?">${E(p.note)}</textarea></section>
  <div class="row" style="margin-top:16px;justify-content:space-between"><button class="btn btn-sm" type="button" data-copy-plan>${I('copy')}<span>Sao chép kế hoạch</span></button><span id="delPlanBox"><button class="lnk" type="button" data-del-plan style="color:var(--stamp)">${I('trash')} Xoá kế hoạch</button></span></div>`;
}
function myProfileHTML() {
  const p = (PROFILES || []).find(x => x.id === S.myProfileId);
  if (!p) return `<div class="empty-state" style="margin-top:30px">${I('users')}<b>Chọn một hồ sơ lớp</b><span class="small">Hồ sơ lớp giữ sẵn sĩ số, đặc điểm học sinh, học liệu. Bấm "Dùng hồ sơ này" để điền nhanh trang Cá nhân hóa.</span></div>`;
  const d = p.data;
  return `<header class="ph-head"><p class="eyebrow">Hồ sơ lớp</p><h2 class="pt" style="font-size:clamp(21px,2vw,27px)">${E(p.name)}</h2></header>
  <dl class="info">
    <div><dt>Môn, lớp</dt><dd>${E(d.subject)} · Lớp ${E(d.grade)}${d.title ? ' · ' + E(d.title) : ''}</dd></div>
    <div><dt>Sĩ số</dt><dd>${d.size ? E(d.size) + ' học sinh' : '<span class="pending">Chưa nhập</span>'}</dd></div>
    <div><dt>Đặc điểm</dt><dd>${E(d.traits) || '<span class="pending">Chưa nhập</span>'}</dd></div>
    <div><dt>Tiếng Việt</dt><dd>${E(d.lang)}${d.home ? ' · ở nhà dùng ' + E(d.home) : ''}</dd></div>
    <div><dt>Học liệu</dt><dd>${E(d.equip.join(', '))}${d.equipNote ? '. ' + E(d.equipNote) : ''}</dd></div>
    <div><dt>Điều kiện</dt><dd>${d.conds.length ? E(d.conds.join(', ')) : '—'}${d.condNote ? '. ' + E(d.condNote) : ''}</dd></div>
  </dl>
  <div class="row" style="margin-top:16px;justify-content:space-between"><button class="btn btn-primary btn-sm" type="button" data-useprof="${E(p.id)}">${I('spark')} Dùng hồ sơ này</button><span id="delProfBox"><button class="lnk" type="button" data-del-prof="${E(p.id)}" style="color:var(--stamp)">${I('trash')} Xoá hồ sơ</button></span></div>`;
}
function accountHTML() {
  const chips = (attr, list, on, label = x => x) => list.map(x => `<button type="button" class="chip${on.includes(x) ? ' on' : ''}" ${attr}="${E(x)}" aria-pressed="${on.includes(x)}">${E(label(x))}</button>`).join('');
  return `<header class="ph-head"><p class="eyebrow">Tài khoản</p><h2 class="pt" style="font-size:clamp(21px,2vw,27px)">Thông tin của tôi</h2></header>
  <form class="form" id="meForm">
    <label class="field"><span>Họ và tên</span><input class="in" id="m_name" maxlength="60" value="${E(ME.name)}"></label>
    <label class="field"><span>Trường</span><input class="in" id="m_school" maxlength="120" value="${E(ME.school)}"></label>
    <label class="field"><span>Tỉnh/thành</span><select class="in" id="m_province">${M.provinces.map(p => `<option${p === ME.province ? ' selected' : ''}>${E(p)}</option>`).join('')}</select></label>
    <div class="field"><span class="flabel">Khối lớp đang dạy</span><div class="chips" id="m_grades">${chips('data-mgrade', M.grades.map(String), (ME.grades || []).map(String), g => 'Lớp ' + g)}</div></div>
    <div class="field"><span class="flabel">Môn dạy</span><div class="chips" id="m_subjects">${chips('data-msubj', M.subjects, ME.subjects || [])}</div></div>
    <button class="btn btn-primary btn-sm" type="submit" style="justify-self:start">${I('save')} Lưu thông tin</button>
  </form>
  <section class="sec"><h3>Đổi mật khẩu</h3><form class="form" id="pwForm" autocomplete="off">
    <div class="grid2"><label class="field"><span>Mật khẩu hiện tại</span><input class="in" id="pw_cur" type="password" autocomplete="current-password"></label><label class="field"><span>Mật khẩu mới</span><input class="in" id="pw_new" type="password" autocomplete="new-password" minlength="6"></label></div>
    <button class="btn btn-sm" type="submit" style="justify-self:start">${I('lock')} Đổi mật khẩu</button></form></section>
  <section class="sec"><button class="btn btn-sm btn-ghost" type="button" data-logout>${I('logout')} Đăng xuất</button></section>`;
}
function savedSideHTML() {
  return `<header class="ph-head"><p class="eyebrow">Mẹo dùng nhanh</p><h2 class="pt" style="font-size:clamp(21px,2vw,27px)">Bộ câu lệnh của riêng thầy cô</h2></header>
  <ul class="tips"><li>${I('check')}<span>Lưu những câu lệnh hay dùng theo môn, lớp để mở lại trong một chạm.</span></li><li>${I('check')}<span>Bấm "Cá nhân hóa" trên câu lệnh đã lưu để ghép với hồ sơ lớp, tạo câu lệnh sát với lớp thật.</span></li><li>${I('check')}<span>Đánh giá "Hữu ích / Chưa hữu ích" giúp nhóm nghiên cứu cải thiện câu lệnh.</span></li></ul>
  <div class="row" style="margin-top:16px"><button class="btn btn-sm" type="button" data-go="2">${I('search')} Mở thư viện câu lệnh</button><button class="btn btn-sm" type="button" data-go="5">${I('book')} Mở kho bài mẫu</button></div>`;
}
function myRightHTML() {
  if (!ME) return perksHTML();
  if (S.myTab === 'plans') return `<div id="planBox">${planEditorHTML()}</div>`;
  if (S.myTab === 'profiles') return myProfileHTML();
  if (S.myTab === 'account') return accountHTML();
  return savedSideHTML();
}

const CONTENT = [
  [() => '', () => coverHTML()],
  [introHTML, tocHTML],
  [libraryHTML, () => `<div id="pdetail">${detailHTML()}</div>`],
  [builderHTML, outPageHTML],
  [stepsHTML, () => `<div id="stepDetail">${stepDetailHTML()}</div>`],
  [lessonListHTML, () => `<div id="ldetail">${lessonDetailHTML()}</div>`],
  [checksHTML, backHTML],
  [() => `<div id="myLeft">${myLeftHTML()}</div>`, () => `<div id="myRight">${myRightHTML()}</div>`],
];

/* ================= Dựng trang & lật trang ================= */
const book = $('#book'), pL = $('#pL'), pR = $('#pR');
const mqWide = matchMedia('(min-width: 960px)');
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isWide = () => mqWide.matches;
let busy = false;

const pageClass = (sp, side) => sp === 0 ? (side === 'L' ? 'endpaper' : 'cover') : '';
function pageInner(sp, side) {
  if (sp === 0) return side === 'L' ? `<div class="endpaper-in">${E(M.handbook.shortName || 'Sổ tay AI')}</div>` : coverHTML();
  const corner = side === 'L' ? `<button class="corner prev" type="button" data-go="${sp - 1}" aria-label="Lật về trang trước"></button>` : side === 'R' && sp < LAST ? `<button class="corner next" type="button" data-go="${sp + 1}" aria-label="Lật sang trang sau"></button>` : '';
  const inner = side === 'M' ? `<div>${CONTENT[sp][0]()}</div><hr style="border:0;border-top:1.5px dashed var(--line);margin:28px 0"><div>${CONTENT[sp][1]()}</div>` : CONTENT[sp][side === 'L' ? 0 : 1]();
  const folio = side === 'M' ? `<div class="folio"><span>${E(CH[sp].s)}</span><span>tr. ${pageNo(sp, 'L')}–${pageNo(sp, 'R')}</span></div>`
    : side === 'L' ? `<div class="folio"><span>${pageNo(sp, 'L')}</span><span>${E(CH[sp].s)}</span></div>` : `<div class="folio"><span>${E(CH[sp].s)}</span><span>${pageNo(sp, 'R')}</span></div>`;
  return `<div class="scroll">${runhead(sp, side)}${inner}</div>${folio}${corner}`;
}
function paint(el, sp, side) {
  const real = side === 'L' ? 'left' : 'right';
  el.className = `page ${real} ${pageClass(sp, side === 'M' ? (sp === 0 ? 'R' : 'M') : side)}`.trim();
  el.innerHTML = pageInner(sp, side === 'M' && sp === 0 ? 'R' : side);
}
function render() {
  book.classList.toggle('closed', S.spread === 0);
  if (isWide()) { paint(pL, S.spread, 'L'); paint(pR, S.spread, 'R'); }
  else { paint(pR, S.spread, 'M'); pL.innerHTML = ''; }
  chrome();
}
function chrome() {
  const sp = S.spread;
  $('#whereT').textContent = CH[sp].t;
  $('#whereP').textContent = sp === 0 ? 'TRANG BÌA' : `TRANG ${pageNo(sp, 'L')}–${pageNo(sp, 'R')} / ${pageNo(LAST, 'R')}`;
  $('#prev').disabled = sp === 0; $('#next').disabled = sp === LAST;
  $('#dots').innerHTML = CH.map((c, i) => `<button type="button" class="${i === sp ? 'on' : ''}" data-go="${i}" aria-label="${E(c.t)}"></button>`).join('');
  $('#nav').innerHTML = CH.slice(1).map((c, i) => `<button type="button" class="${i + 1 === sp ? 'on' : ''}" data-go="${i + 1}">${E(c.s)}</button>`).join('');
  $('#tabs').innerHTML = CH.slice(1).map((c, i) => `<button type="button" class="tab${i + 1 === sp ? ' on' : ''}" data-go="${i + 1}">${E(c.s)}</button>`).join('');
  $('#menu').innerHTML = CH.map((c, i) => `<button type="button" class="${i === sp ? 'on' : ''}" data-go="${i}"><small>${i ? String(i).padStart(2, '0') : '—'}</small>${E(c.t)}</button>`).join('');
  const sn = M.handbook.shortName || 'Sổ tay AI';
  $('#shortName').innerHTML = /\sAI$/.test(sn) ? `${E(sn.replace(/\sAI$/, ''))} <span>AI</span>` : E(sn);
  $('#productSmall').textContent = M.handbook.productTitle;
  document.title = sn + ' giáo viên Tiểu học';
  $('#userArea').innerHTML = ME
    ? `${isStaff() ? `<a class="bar-btn" href="admin.html">${I('gear')}<span class="lbl">Quản trị</span></a>` : ''}<button class="bar-user" type="button" data-go="7" aria-label="Sổ tay của tôi"><span class="avatar">${E(initials(ME.name))}</span><span>${E(ME.name)}</span></button>`
    : `<a class="bar-btn" href="/admin" aria-label="Đăng nhập admin" title="Đăng nhập admin">${I('gear')}<span class="lbl">Đăng nhập admin</span></a><button class="bar-btn" type="button" data-auth="login">${I('user')}<span class="lbl">Đăng nhập</span></button>`;
}
function makeFace(html, cls, back) {
  const f = document.createElement('div');
  f.className = `face ${cls}${back ? ' back' : ''}`;
  f.innerHTML = html + '<div class="shade"></div>';
  f.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  return f;
}
function cloneFace(el, cls) {
  const st = el.querySelector('.scroll, .cover-in')?.scrollTop || 0;
  const f = makeFace(el.innerHTML, cls, false);
  requestAnimationFrame(() => { const s = f.querySelector('.scroll, .cover-in'); if (s) s.scrollTop = st; });
  return f;
}
const sideCls = (sp, side) => `${side === 'L' ? 'left' : 'right'} ${pageClass(sp, side)}`.trim();

/* Tải trước dữ liệu cần cho trang đích để mặt sau của lá đang lật có nội dung */
async function prepare(sp) {
  const jobs = [];
  if (sp === 5 && S.lid && !LD[S.lid]) jobs.push(loadLesson(S.lid));
  if (sp === 7 && ME) jobs.push(loadMine());
  if (sp === 3 && ME && PROFILES == null) jobs.push(loadProfiles());
  if (!jobs.length) return;
  await Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, 1500))]);
}
async function go(to) {
  to = Math.max(0, Math.min(LAST, +to));
  $('#menu').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false');
  if (to === S.spread || busy) return;
  busy = true;
  await prepare(to);
  const from = S.spread; S.spread = to; setHash();
  if (to === 2) track('prompt_view', S.pid);
  if (reduce()) { render(); busy = false; return; }
  isWide() ? flipWide(from, to) : flipSolo(from, to);
}
function flipWide(from, to) {
  const fwd = to > from;
  const leaf = document.createElement('div');
  leaf.className = 'leaf ' + (fwd ? 'fwd' : 'bwd'); leaf.setAttribute('aria-hidden', 'true');
  const front = cloneFace(fwd ? pR : pL, fwd ? sideCls(from, 'R') : sideCls(from, 'L'));
  const back = makeFace(pageInner(to, fwd ? 'L' : 'R'), fwd ? sideCls(to, 'L') : sideCls(to, 'R'), true);
  leaf.append(front, back); book.appendChild(leaf);
  if (fwd) paint(pR, to, 'R'); else paint(pL, to, 'L');
  if (from === 0) book.classList.remove('closed');
  if (to === 0) book.classList.add('closed');
  const dur = (from === 0 || to === 0) ? 950 : 820;
  const anim = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${fwd ? -180 : 180}deg)` }], { duration: dur, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
  front.querySelector('.shade').animate([{ opacity: 0 }, { opacity: .55 }], { duration: dur / 2, fill: 'forwards' });
  back.querySelector('.shade').animate([{ opacity: .55 }, { opacity: .55, offset: .5 }, { opacity: 0 }], { duration: dur, fill: 'forwards' });
  chrome();
  anim.onfinish = () => { if (fwd) paint(pL, to, 'L'); else paint(pR, to, 'R'); leaf.remove(); busy = false; chrome(); };
}
function flipSolo(from, to) {
  const fwd = to > from;
  const leaf = document.createElement('div');
  leaf.className = 'leaf solo'; leaf.setAttribute('aria-hidden', 'true');
  if (fwd) {
    leaf.appendChild(cloneFace(pR, sideCls(from, 'R')));
    book.appendChild(leaf); paint(pR, to, 'M'); book.classList.toggle('closed', to === 0);
    const a = leaf.animate([{ transform: 'rotateY(0)', opacity: 1 }, { transform: 'rotateY(-95deg)', opacity: 1, offset: .85 }, { transform: 'rotateY(-110deg)', opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    leaf.firstChild.querySelector('.shade').animate([{ opacity: 0 }, { opacity: .5 }], { duration: 640, fill: 'forwards' });
    a.onfinish = () => { leaf.remove(); busy = false; chrome(); };
  } else {
    leaf.appendChild(makeFace(pageInner(to, to === 0 ? 'R' : 'M'), to === 0 ? 'right cover' : 'right', false)); book.appendChild(leaf);
    const a = leaf.animate([{ transform: 'rotateY(-110deg)', opacity: 0 }, { transform: 'rotateY(-95deg)', opacity: 1, offset: .15 }, { transform: 'rotateY(0)', opacity: 1 }], { duration: 640, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    a.onfinish = () => { paint(pR, to, 'M'); book.classList.toggle('closed', to === 0); leaf.remove(); busy = false; chrome(); };
  }
  chrome();
}
function rerenderSpread() {
  if (busy) return;
  const keep = $$('#pL .scroll, #pR .scroll').map(s => s.scrollTop);
  render();
  $$('#pL .scroll, #pR .scroll').forEach((s, i) => { s.scrollTop = keep[i] || 0; });
}
const rightScrollTop = () => { const s = (isWide() ? pR : pR).querySelector('.scroll'); if (s && isWide()) s.scrollTop = 0; };
function setHtml(sel, html) { const el = $(sel); if (el) el.innerHTML = html; return el; }

/* hash */
function setHash() { const id = CH[S.spread].id; if (location.hash !== '#' + id) { try { history.replaceState(null, '', '#' + id); } catch { location.hash = id; } } }
addEventListener('hashchange', () => { const i = CH.findIndex(c => c.id === location.hash.slice(1)); if (i >= 0 && i !== S.spread) go(i); });

/* ================= Tải dữ liệu ================= */
async function loadMe() {
  try { const r = await GET('/me'); ME = r.me; COUNTS = r.counts || { plans: 0, bookmarks: 0, profiles: 0 }; }
  catch { ME = null; }
}
async function loadLists() {
  const [pr, ls] = await Promise.all([GET('/prompts'), GET('/lessons')]);
  P = pr.items; L = ls.items;
  if (!P.some(p => p.id === S.pid) && P[0]) S.pid = P[0].id;
  if (!S.lid || !L.some(l => l.id === S.lid)) S.lid = L[0]?.id || null;
}
async function loadLesson(id) { try { LD[id] = await GET('/lessons/' + encodeURIComponent(id) + '?visitorId=' + visitorId); } catch (e) { fail(e); } }
async function loadPromptFb(id) {
  try { const r = await GET('/prompts/' + encodeURIComponent(id) + '?visitorId=' + visitorId); PF[id] = r.myFeedback; const i = P.findIndex(p => p.id === id); if (i >= 0) P[i] = { ...P[i], stats: r.stats, bookmarked: r.bookmarked }; }
  catch {}
}
async function loadProfiles() { try { PROFILES = (await GET('/me/profiles')).items; COUNTS.profiles = PROFILES.length; } catch (e) { PROFILES = []; } }
async function loadMine() {
  const jobs = [];
  if (S.myTab === 'plans') { jobs.push(GET('/me/plans').then(r => { PLANS = r.items; COUNTS.plans = PLANS.length; if (!S.planId && PLANS[0]) S.planId = PLANS[0].id; })); }
  if (S.myTab === 'saved') jobs.push(GET('/me/bookmarks').then(r => { BOOKMARKS = r.items; COUNTS.bookmarks = BOOKMARKS.length; }));
  if (S.myTab === 'profiles') jobs.push(loadProfiles().then(() => { if (!S.myProfileId && PROFILES[0]) S.myProfileId = PROFILES[0].id; }));
  await Promise.allSettled(jobs);
  if (S.myTab === 'plans' && S.planId && (!PLAN || PLAN.id !== S.planId)) { try { PLAN = await GET('/me/plans/' + S.planId); } catch { PLAN = null; S.planId = null; } }
}
function resetMine() { PLANS = BOOKMARKS = PROFILES = PLAN = null; S.planId = null; S.myProfileId = null; S.profileId = null; }

/* ================= Cập nhật cục bộ ================= */
function refreshLibrary() {
  setHtml('#plist', plistHTML()); setHtml('#count', countHTML());
  $$('#fCond .chip').forEach(b => b.classList.toggle('on', b.dataset.cond === S.cond));
}
function refreshDetail(scrollTop) {
  setHtml('#pdetail', detailHTML());
  $$('[data-pc]').forEach(c => c.classList.toggle('on', c.dataset.pc === S.pid));
  if (scrollTop) rightScrollTop();
}
function refreshOut() { setHtml('#out', outHTML()); store.set('b', S.b); store.set('bex', S.bIsExample); }
async function refreshMine() { await loadMine(); setHtml('#myLeft', myLeftHTML()); setHtml('#myRight', myRightHTML()); }

/* ================= Hành động ================= */
async function toggleBookmark(kind, id, btn) {
  if (!ME) { toast('Đăng nhập để lưu câu lệnh, bài mẫu vào sổ tay của thầy cô.'); S.auth = 'login'; return go(7); }
  const list = kind === 'prompt' ? P : L;
  const item = list.find(x => x.id === id) || {};
  const on = !(item.bookmarked ?? (BOOKMARKS || []).some(b => b.kind === kind && b.targetId === id));
  if (btn) btn.disabled = true;
  try {
    on ? await PUT(`/me/bookmarks/${kind}/${encodeURIComponent(id)}`) : await DEL(`/me/bookmarks/${kind}/${encodeURIComponent(id)}`);
    item.bookmarked = on; if (LD[id]) LD[id].bookmarked = on;
    COUNTS.bookmarks += on ? 1 : -1;
    if (BOOKMARKS) BOOKMARKS = on ? BOOKMARKS : BOOKMARKS.filter(b => !(b.kind === kind && b.targetId === id));
    if (on) BOOKMARKS = null;
    toast(on ? 'Đã lưu vào Sổ tay của tôi' : 'Đã bỏ lưu');
    if (S.spread === 2) { refreshDetail(); setHtml('#plist', plistHTML()); }
    else if (S.spread === 5) rerenderSpread();
    else if (S.spread === 7) { await refreshMine(); }
  } catch (e) { fail(e); } finally { if (btn) btn.disabled = false; }
}
async function sendFeedback(body) {
  const r = await POST('/feedback', { ...body, visitorId });
  return r.feedback;
}
async function afterAuth(r, msg) {
  setToken(r.token); ME = r.me; resetMine();
  await loadMe(); await loadLists().catch(() => {});
  Object.keys(PF).forEach(k => delete PF[k]); Object.keys(LD).forEach(k => delete LD[k]);
  S.myTab = 'plans'; await loadMine();
  if (S.spread === 3) await loadProfiles();
  toast(msg); rerenderSpread();
}
async function savePlanFromBuilder(btn) {
  if (!ME) { toast('Đăng nhập để lưu kế hoạch. Câu lệnh đang nhập vẫn được giữ lại.'); S.auth = 'login'; return go(7); }
  const b = S.b;
  btn.disabled = true;
  try {
    const p = await POST('/me/plans', { title: `${b.subject} ${b.grade} – ${b.title || 'Bài chưa đặt tên'}`, subject: b.subject, grade: Number(b.grade), promptText: buildPrompt(), basePromptId: b.base });
    COUNTS.plans++; PLANS = null; PLAN = p; S.planId = p.id; S.myTab = 'plans';
    toast('Đã lưu vào Kế hoạch của tôi');
    go(7);
  } catch (e) { fail(e); } finally { btn.disabled = false; }
}
const savePlanNow = async () => {
  if (!PLAN) return;
  if (String(PLAN.title || '').trim().length < 2) { const st = $('#saveState'); if (st) { st.className = 'save-state dirty'; st.textContent = 'Đặt tên kế hoạch để lưu'; } return; }
  const st = $('#saveState'); if (st) { st.className = 'save-state saving'; st.textContent = 'Đang lưu…'; }
  try {
    const p = await PUT('/me/plans/' + PLAN.id, { title: PLAN.title, aiResult: PLAN.aiResult, note: PLAN.note, checks: PLAN.checks, status: PLAN.status });
    PLAN.updatedAt = p.updatedAt;
    const i = (PLANS || []).findIndex(x => x.id === p.id); if (i >= 0) PLANS[i] = { ...PLANS[i], title: p.title, status: p.status, checks: p.checks, checked: p.checked, updatedAt: p.updatedAt };
    const s2 = $('#saveState'); if (s2) { s2.className = 'save-state'; s2.innerHTML = I('check') + ' Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
    const item = $(`[data-plan="${CSS.escape(p.id)}"]`); if (item && PLANS) { const pp = PLANS[i]; item.outerHTML = `<button type="button" class="mitem on" data-plan="${E(pp.id)}"><b>${E(pp.title)}</b><span class="row"><span class="st st-${E(pp.status)}">${E(statusName(pp.status))}</span>${miniMeter(pp.checks)}<small>${E(pp.subject)} · Lớp ${pp.grade} · sửa vừa xong</small></span></button>`; }
  } catch (e) { const s2 = $('#saveState'); if (s2) { s2.className = 'save-state dirty'; s2.textContent = 'Chưa lưu được'; } fail(e); }
};
const savePlanSoon = debounce(savePlanNow, 900);
function markDirty() { const st = $('#saveState'); if (st) { st.className = 'save-state dirty'; st.textContent = 'Đang sửa…'; } savePlanSoon(); }
function confirmInline(boxSel, label, onYes) {
  const box = $(boxSel); if (!box) return;
  const old = box.innerHTML;
  box.innerHTML = `<span class="confirm-row">${E(label)} <button class="btn btn-sm btn-danger" type="button" data-yes>Xoá</button><button class="lnk" type="button" data-no>Huỷ</button></span>`;
  box.querySelector('[data-yes]').onclick = onYes;
  box.querySelector('[data-no]').onclick = () => { box.innerHTML = old; };
}

/* ================= Sự kiện ================= */
document.addEventListener('click', async e => {
  const t = e.target.closest('button, a, [data-check]');
  if (!t) { if (!e.target.closest('#menu, #menuBtn')) { $('#menu').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false'); } return; }
  if (t.closest('.leaf')) return;
  const d = t.dataset;
  if (t.id === 'prev') return go(S.spread - 1);
  if (t.id === 'next') return go(S.spread + 1);
  if (t.id === 'menuBtn') { const m = $('#menu'); m.hidden = !m.hidden; t.setAttribute('aria-expanded', String(!m.hidden)); return; }
  if ('go' in d) return go(d.go);
  if ('tool' in d) { track('tool_open', d.tool); return; }
  if ('auth' in d) { S.auth = d.auth; if (S.spread === 7) { setHtml('#myLeft', myLeftHTML()); return; } return go(7); }
  if ('pick' in d) { S.pid = d.pick; store.set('pid', S.pid); track('prompt_view', S.pid); refreshDetail(true); if (!isWide()) $('#pdetail')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); if (!(S.pid in PF)) { await loadPromptFb(S.pid); refreshDetail(); } return; }
  if ('copy' in d) { const p = P.find(x => x.id === d.copy); if (p) { copyText(p.text, t); track('prompt_copy', p.id); p.stats.copies++; } return; }
  if ('use' in d) { const p = P.find(x => x.id === d.use); if (p) { Object.assign(S.b, { base: p.id, subject: p.subject, grade: String(p.grade), purpose: p.purpose }); S.bIsExample = false; store.set('b', S.b); store.set('bex', false); toast('Đã chọn làm câu lệnh nền'); } return go(3); }
  if ('bm' in d) { const [kind, id] = d.bm.split(':'); return toggleBookmark(kind, id, t); }
  if ('cond' in d) { S.cond = S.cond === d.cond ? '' : d.cond; refreshLibrary(); return; }
  if ('resetFilter' in d) { S.q = S.subj = S.grade = S.purpose = S.cond = ''; ['#q', '#fSubj', '#fGrade', '#fPurpose'].forEach(s => { const el = $(s); if (el) el.value = ''; }); refreshLibrary(); return; }
  if ('prate' in d) {
    const rating = Number(d.prate); const old = PF[S.pid];
    try { PF[S.pid] = await sendFeedback({ kind: 'prompt', targetId: S.pid, rating, comment: old?.comment || '' }); const p = P.find(x => x.id === S.pid); if (p) { if (old?.rating === 1) p.stats.helpful--; if (rating === 1) p.stats.helpful++; } refreshDetail(); toast('Cảm ơn thầy cô đã đánh giá'); } catch (er) { fail(er); }
    return;
  }
  if ('pfbSend' in d) { try { PF[S.pid] = await sendFeedback({ kind: 'prompt', targetId: S.pid, rating: PF[S.pid].rating, comment: $('#pfbText').value }); toast('Đã gửi nhận xét'); } catch (er) { fail(er); } return; }
  if ('lrate' in d) {
    const l = LD[S.lid]; if (!l) return;
    try { l.myFeedback = await sendFeedback({ kind: 'lesson', targetId: l.id, rating: Number(d.lrate), comment: l.myFeedback?.comment || '' }); setHtml('#lfb', lessonFbHTML(l)); toast('Cảm ơn thầy cô đã đánh giá'); } catch (er) { fail(er); }
    return;
  }
  if ('lfbSend' in d) { const l = LD[S.lid]; try { l.myFeedback = await sendFeedback({ kind: 'lesson', targetId: l.id, rating: l.myFeedback.rating, comment: $('#lfbText').value }); toast('Đã gửi nhận xét'); } catch (er) { fail(er); } return; }
  if ('grate' in d) { S.gRate = Number(d.grate); $$('[data-grate]').forEach(b => b.classList.toggle('on', Number(b.dataset.grate) <= S.gRate)); return; }
  if ('gfbSend' in d) {
    const txt = $('#gfbText');
    t.disabled = true;
    try { await sendFeedback({ kind: 'general', rating: S.gRate || null, comment: txt.value }); txt.value = ''; S.gRate = 0; $$('[data-grate]').forEach(b => b.classList.remove('on')); toast('Đã gửi góp ý. Cảm ơn thầy cô!'); } catch (er) { fail(er); } finally { t.disabled = false; }
    return;
  }
  if ('equip' in d || 'bcond' in d) { const key = 'equip' in d ? 'equip' : 'conds', v = d.equip ?? d.bcond; const arr = S.b[key]; const i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); t.classList.toggle('on', i < 0); t.setAttribute('aria-pressed', String(i < 0)); S.bIsExample = false; refreshOut(); return; }
  if ('lang' in d) { S.b.lang = d.lang; t.parentElement.querySelectorAll('button').forEach(b => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); S.bIsExample = false; refreshOut(); return; }
  if ('bclear' in d) { S.b = clone(B_EMPTY); S.bIsExample = false; S.profileId = null; store.set('b', S.b); store.set('bex', false); rerenderSpread(); toast('Đã xóa ví dụ. Hãy nhập thông tin lớp của bạn.'); return; }
  if ('bexample' in d) { S.b = clone(B_EXAMPLE); S.bIsExample = true; S.profileId = null; store.set('b', S.b); store.set('bex', true); rerenderSpread(); return; }
  if ('unbase' in d) { S.b.base = null; refreshOut(); return; }
  if ('copyOut' in d) { copyText(buildPrompt(), t); track('custom_copy'); return; }
  if ('savePlan' in d) return savePlanFromBuilder(t);
  if ('profSave' in d) {
    const name = $('#profName').value.trim();
    const cur = (PROFILES || []).find(p => p.id === S.profileId);
    t.disabled = true;
    try {
      const saved = cur && cur.name === name ? await PUT('/me/profiles/' + cur.id, { data: S.b }) : await POST('/me/profiles', { name, data: S.b });
      await loadProfiles(); S.profileId = saved.id; setHtml('#profileBar', profileBarHTML()); toast(cur && cur.name === name ? 'Đã cập nhật hồ sơ lớp' : 'Đã lưu hồ sơ lớp');
    } catch (er) { fail(er); } finally { t.disabled = false; }
    return;
  }
  if ('step' in d) { S.step = +d.step; $$('.step-btn').forEach(b => { const on = +b.dataset.step === S.step; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); const sd = setHtml('#stepDetail', stepDetailHTML()); if (sd && !isWide()) sd.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); else rightScrollTop(); return; }
  if ('video' in d) { const v = M.guide.video; if (v.url) window.open(v.url, '_blank', 'noopener'); else toast(v.note || 'Video hướng dẫn đang được cập nhật.'); return; }
  if ('lsubj' in d) { S.lsubj = d.lsubj; rerenderSpread(); return; }
  if ('lesson' in d) {
    S.lid = d.lesson; S.ltab = 'plan'; track('lesson_view', S.lid);
    $$('[data-lesson]').forEach(b => b.classList.toggle('on', b.dataset.lesson === S.lid));
    setHtml('#ldetail', lessonDetailHTML()); rightScrollTop();
    if (!isWide()) $('#ldetail')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
    if (!LD[S.lid]) { await loadLesson(S.lid); setHtml('#ldetail', lessonDetailHTML()); }
    return;
  }
  if ('ltab' in d) { S.ltab = d.ltab; setHtml('#ldetail', lessonDetailHTML()); return; }
  if ('copyLesson' in d) { const l = LD[S.lid]; if (l) { copyText(lessonText(l), t, 'Đã sao chép kế hoạch bài dạy'); track('lesson_copy', l.id); } return; }
  if ('demo' in d) { const [em, pw] = d.demo.split('|'); try { await afterAuth(await POST('/login', { email: em, password: pw }), 'Đã đăng nhập tài khoản dùng thử'); } catch (er) { fail(er); } return; }
  if ('rgrade' in d) { const on = t.getAttribute('aria-pressed') !== 'true'; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); return; }
  if ('mgrade' in d || 'msubj' in d) { const on = !t.classList.contains('on'); t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); return; }
  if ('mytab' in d) { S.myTab = d.mytab; setHtml('#myLeft', myLeftHTML()); await refreshMine(); return; }
  if ('plan' in d) {
    S.planId = d.plan; S.promptExpanded = false;
    $$('[data-plan]').forEach(b => b.classList.toggle('on', b.dataset.plan === S.planId));
    try { PLAN = await GET('/me/plans/' + S.planId); setHtml('#myRight', myRightHTML()); rightScrollTop(); if (!isWide()) $('#myRight')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); } catch (er) { fail(er); }
    return;
  }
  if ('plstatus' in d) { PLAN.status = d.plstatus; t.parentElement.querySelectorAll('button').forEach(b => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); savePlanNow(); return; }
  if ('expand' in d) { S.promptExpanded = !S.promptExpanded; setHtml('#planBox', planEditorHTML()); return; }
  if ('copyPlanprompt' in d) { copyText(PLAN.promptText, t); track('custom_copy'); return; }
  if ('copyPlan' in d) { copyText([PLAN.title, '', PLAN.aiResult || '(chưa dán kết quả AI)', '', 'GHI CHÚ ĐIỀU CHỈNH:', PLAN.note || '—'].join('\n'), t, 'Đã sao chép kế hoạch'); return; }
  if ('delPlan' in d) {
    confirmInline('#delPlanBox', 'Xoá kế hoạch này?', async () => {
      try { await DEL('/me/plans/' + PLAN.id); toast('Đã xoá kế hoạch'); PLAN = null; S.planId = null; PLANS = null; await refreshMine(); } catch (er) { fail(er); }
    });
    return;
  }
  if ('myprof' in d) { S.myProfileId = d.myprof; $$('[data-myprof]').forEach(b => b.classList.toggle('on', b.dataset.myprof === S.myProfileId)); setHtml('#myRight', myRightHTML()); if (!isWide()) $('#myRight')?.scrollIntoView({ behavior: 'smooth' }); return; }
  if ('useprof' in d) { const p = PROFILES.find(x => x.id === d.useprof); if (p) { S.b = Object.assign(clone(B_EMPTY), clone(p.data)); S.profileId = p.id; S.bIsExample = false; store.set('b', S.b); store.set('bex', false); toast('Đã điền thông tin từ hồ sơ ' + p.name); go(3); } return; }
  if ('delProf' in d) {
    const id = d.delProf;
    confirmInline('#delProfBox', 'Xoá hồ sơ lớp này?', async () => { try { await DEL('/me/profiles/' + id); toast('Đã xoá hồ sơ lớp'); S.myProfileId = null; if (S.profileId === id) S.profileId = null; PROFILES = null; await refreshMine(); } catch (er) { fail(er); } });
    return;
  }
  if ('open' in d) {
    const [kind, id] = d.open.split(':');
    if (kind === 'prompt') { S.pid = id; S.q = S.subj = S.grade = S.purpose = S.cond = ''; track('prompt_view', id); return go(2); }
    S.lid = id; S.ltab = 'plan'; track('lesson_view', id); return go(5);
  }
  if ('logout' in d) { try { await POST('/logout'); } catch {} setToken(''); ME = null; resetMine(); await loadLists().catch(() => {}); Object.keys(PF).forEach(k => delete PF[k]); Object.keys(LD).forEach(k => delete LD[k]); toast('Đã đăng xuất'); rerenderSpread(); return; }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'loginForm') {
    const err = $('#loginErr'); err.hidden = true;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try { await afterAuth(await POST('/login', { email: $('#l_email').value, password: $('#l_pass').value }), 'Chào mừng thầy cô quay lại!'); }
    catch (er) { err.textContent = er.message; err.hidden = false; } finally { btn.disabled = false; }
  }
  if (f.id === 'regForm') {
    const err = $('#regErr'); err.hidden = true;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    const grades = $$('[data-rgrade][aria-pressed="true"]').map(b => Number(b.dataset.rgrade));
    try { await afterAuth(await POST('/register', { name: $('#r_name').value, email: $('#r_email').value, password: $('#r_pass').value, school: $('#r_school').value, province: $('#r_province').value, grades }), 'Đã tạo tài khoản. Chào mừng thầy cô!'); }
    catch (er) { err.textContent = er.message; err.hidden = false; } finally { btn.disabled = false; }
  }
  if (f.id === 'meForm') {
    try {
      const r = await PUT('/me', { name: $('#m_name').value, school: $('#m_school').value, province: $('#m_province').value, grades: $$('[data-mgrade].on').map(b => Number(b.dataset.mgrade)), subjects: $$('[data-msubj].on').map(b => b.dataset.msubj) });
      ME = r.me; toast('Đã lưu thông tin'); chrome(); setHtml('#myLeft', myLeftHTML());
    } catch (er) { fail(er); }
  }
  if (f.id === 'pwForm') {
    try { await POST('/auth/change-password', { current: $('#pw_cur').value, next: $('#pw_new').value }); f.reset(); toast('Đã đổi mật khẩu'); } catch (er) { fail(er); }
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { S.q = t.value; refreshLibrary(); return; }
  if (t.dataset.b) {
    S.b[t.dataset.b] = t.value; S.bIsExample = false;
    if (t.dataset.b === 'purpose') { const f = $('#srcField'); const need = t.value === 'adapt' || t.value === 'review'; if (f) { f.hidden = !need; f.querySelector('span').textContent = 'Dán kế hoạch / hoạt động cần ' + (t.value === 'review' ? 'rà soát' : 'điều chỉnh'); } }
    refreshOut(); return;
  }
  if (t.dataset.pl && PLAN) { PLAN[t.dataset.pl] = t.value; markDirty(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fSubj') { S.subj = t.value; refreshLibrary(); }
  if (t.id === 'fGrade') { S.grade = t.value; refreshLibrary(); }
  if (t.id === 'fPurpose') { S.purpose = t.value; refreshLibrary(); }
  if (t.id === 'profSel') {
    const p = (PROFILES || []).find(x => x.id === t.value);
    if (p) { S.b = Object.assign(clone(B_EMPTY), clone(p.data)); S.profileId = p.id; S.bIsExample = false; store.set('b', S.b); store.set('bex', false); rerenderSpread(); toast('Đã điền thông tin từ hồ sơ ' + p.name); }
    else { S.profileId = null; setHtml('#profileBar', profileBarHTML()); }
  }
  if (t.dataset.check != null && t.type === 'checkbox') {
    S.checks[+t.dataset.check] = t.checked; store.set('checks', S.checks);
    const C = M.checklist; const n = C.filter((_, i) => S.checks[i]).length, m = $('#chkMeter');
    if (m) { m.querySelector('.flabel').textContent = `Đã kiểm tra ${n}/${C.length} mục`; m.querySelector('i').style.width = (n / C.length * 100) + '%'; }
    if (n === C.length) toast(`Đã kiểm tra đủ ${C.length} mục. Kế hoạch sẵn sàng hoàn thiện.`);
  }
  if (t.dataset.plcheck != null && PLAN) {
    PLAN.checks[+t.dataset.plcheck] = t.checked;
    for (let i = 0; i < M.checklist.length; i++) PLAN.checks[i] = !!PLAN.checks[i];
    const n = PLAN.checks.filter(Boolean).length, m = $('#plMeter');
    if (m) { m.querySelector('.flabel').textContent = `Đã kiểm tra ${n}/${M.checklist.length} mục`; m.querySelector('i').style.width = (n / M.checklist.length * 100) + '%'; }
    savePlanNow();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('#menu').hidden = true; return; }
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); go(S.spread + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(S.spread - 1); }
});
let tx = null, ty = null;
book.addEventListener('touchstart', e => { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
book.addEventListener('touchend', e => {
  if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && !e.target.closest('input, textarea, select, .tbl-wrap, .chips, .term')) go(S.spread + (dx < 0 ? 1 : -1));
}, { passive: true });
mqWide.addEventListener?.('change', () => { if (!busy) render(); });

/* ================= Khởi động ================= */
function announce() {
  const a = M.handbook.announcement, box = $('#announce');
  const key = 'ann-' + norm(a.text).slice(0, 40);
  if (!a.enabled || !a.text || store.get(key, false)) { box.hidden = true; document.body.classList.remove('has-announce'); return; }
  box.innerHTML = `${I('flag')}<p>${E(a.text)}</p><button type="button" aria-label="Ẩn thông báo">${I('x')}</button>`;
  box.hidden = false; document.body.classList.add('has-announce');
  box.querySelector('button').onclick = () => { store.set(key, true); box.hidden = true; document.body.classList.remove('has-announce'); };
}
(async function boot() {
  try {
    await Sotay.init();
    M = await GET('/meta');
    await Promise.all([loadMe(), loadLists()]);
    if (Sotay.mode === 'mock') { const pill = document.createElement('div'); pill.className = 'mock-pill'; pill.textContent = 'Bản xem thử · dữ liệu lưu trên trình duyệt này'; document.body.appendChild(pill); }
    announce();
    const i = CH.findIndex(c => c.id === location.hash.slice(1));
    if (i >= 0) { S.spread = i; await prepare(i); }
    if (S.spread === 2 && !(S.pid in PF)) loadPromptFb(S.pid).then(() => { if (S.spread === 2) refreshDetail(); });
    render();
    if (!Sotay.store.sget('visited')) { Sotay.store.sset('visited', '1'); track('visit'); }
  } catch (e) {
    console.error(e);
    pR.innerHTML = `<div class="boot err"><div><i></i>Không mở được sổ tay<br><span style="text-transform:none;letter-spacing:0;font-weight:500">${E(e.message || '')}</span><br><button class="btn btn-sm" type="button" onclick="location.reload()" style="margin-top:12px">Thử lại</button></div></div>`;
  }
})();
})();
