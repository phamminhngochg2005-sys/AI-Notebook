/* Sổ tay AI — trang quản trị (admin.html).
 * Điều hướng bằng hash: #overview, #handbook, #prompts, #prompt~<id|new>, #lessons, #lesson~<id|new>,
 * #guide, #teachers, #teacher~<id>, #feedback, #settings.
 * Quyền: biên tập viên (editor) quản lý nội dung, giáo viên, góp ý; quản trị viên (admin) thêm Cài đặt, đổi vai trò, xoá góp ý. */
(() => {
'use strict';
const { CFG, GET, POST, PUT, DEL, setToken, $, $$, E, norm, I, toast, fail, qrSvg, fmtDate, fmtTime, ago, initials } = window.Sotay;

let M = null, ME = null, BADGE = { prompts: 0, lessons: 0, fbNew: 0 };
const app = $('#app');
const F = { prompts: { q: '', subject: '', grade: '', purpose: '', status: '' }, lessons: { q: '', subject: '', status: '' }, teachers: { q: '', role: '', status: '', sort: 'recent' }, feedback: { kind: '', status: 'new', q: '' }, days: 14 };
const isAdmin = () => ME?.role === 'admin';
const purposeName = id => (M.purposes.find(p => p.id === id) || {}).name || id;
const roleName = id => (M.roles.find(r => r.id === id) || {}).name || id;
const opt = (v, cur, label) => `<option value="${E(v)}"${String(v) === String(cur ?? '') ? ' selected' : ''}>${E(label ?? v)}</option>`;
const ph = s => E(s).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const starText = n => n ? `<span class="stars" aria-label="${n} sao">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>` : '';
let dirty = false;
const setDirty = v => { dirty = v; const d = $('#dirty'); if (d) d.hidden = !v; };

/* ================= Khung & điều hướng ================= */
const NAV = [
  { id: 'overview', t: 'Tổng quan', i: 'chart' },
  { id: 'handbook', t: 'Thông tin sổ tay', i: 'book' },
  { h: 'Nội dung' },
  { id: 'prompts', t: 'Câu lệnh', i: 'spark', badge: () => BADGE.prompts },
  { id: 'lessons', t: 'Bài dạy mẫu', i: 'file', badge: () => BADGE.lessons },
  { id: 'guide', t: 'Hướng dẫn & đối chiếu', i: 'list' },
  { h: 'Người dùng' },
  { id: 'teachers', t: 'Giáo viên', i: 'users' },
  { id: 'feedback', t: 'Góp ý', i: 'msg', badge: () => BADGE.fbNew, hot: true },
  { id: 'settings', t: 'Cài đặt', i: 'gear', admin: true },
];
function shell(active, inner) {
  const nav = NAV.filter(n => !n.admin || isAdmin()).map(n => n.h ? `<div class="nav-h">${E(n.h)}</div>`
    : `<a href="#${n.id}" class="${active === n.id ? 'on' : ''}">${I(n.i)}<span class="t">${E(n.t)}</span>${n.badge && n.badge() ? `<em class="${n.hot ? 'hot' : ''}">${n.badge()}</em>` : ''}</a>`).join('');
  app.innerHTML = `<div class="shell">
    <aside class="side"><a class="brand" href="#overview"><span class="brand-mark">${I('book')}</span><span><b>${E(M.handbook.shortName || 'Sổ tay AI')}</b><small>Trang quản trị</small></span></a>
      <nav class="nav" aria-label="Quản trị">${nav}</nav>
      <div class="side-foot">
        <div class="who"><span class="avatar">${E(initials(ME.name))}</span><span style="min-width:0"><b>${E(ME.name)}</b><small>${E(roleName(ME.role))}</small></span></div>
        <div class="row" style="gap:6px"><a class="btn btn-sm btn-ghost" href="index.html">${I('book')} Mở sổ tay</a><button class="btn btn-sm btn-ghost" type="button" data-logout>${I('logout')}<span class="sr">Đăng xuất</span></button></div>
      </div></aside>
    <main class="main" id="main">${Sotay.mode === 'mock' ? '<p class="mock-note">Bản xem thử: dữ liệu lưu trên trình duyệt này, không ảnh hưởng máy chủ.</p>' : ''}${inner}</main>
  </div>`;
}
const head = (eyebrow, title, desc, actions = '') => `<div class="head"><div><p class="eyebrow">${E(eyebrow)}</p><h1>${E(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div><div class="row">${actions}</div></div>`;
const loading = active => shell(active, '<div class="boot">Đang tải…</div>');

async function refreshBadges() {
  try {
    const [p, l, f] = await Promise.all([GET('/admin/prompts'), GET('/admin/lessons'), GET('/admin/feedback?status=new')]);
    BADGE = { prompts: p.all, lessons: l.all, fbNew: f.newCount };
  } catch {}
}
async function route() {
  if (!ME) return loginView();
  const [name, arg] = (location.hash.slice(1) || 'overview').split('~');
  window.scrollTo(0, 0); setDirty(false);
  try {
    if (name === 'overview') return await overview();
    if (name === 'handbook') return await handbookPage();
    if (name === 'prompts') return await promptsPage();
    if (name === 'prompt') return await promptEditor(arg);
    if (name === 'lessons') return await lessonsPage();
    if (name === 'lesson') return await lessonEditor(arg);
    if (name === 'guide') return await guidePage();
    if (name === 'teachers') return await teachersPage();
    if (name === 'teacher') return await teacherDetail(arg);
    if (name === 'feedback') return await feedbackPage();
    if (name === 'settings' && isAdmin()) return await settingsPage();
    location.hash = 'overview';
  } catch (e) {
    if (e.status === 401 || e.status === 403) { ME = null; return loginView(e.message); }
    shell(name, `<div class="empty"><b>Không tải được trang.</b><br>${E(e.message)}<br><button class="btn btn-sm" type="button" onclick="location.reload()" style="margin-top:10px">Tải lại</button></div>`);
  }
}
addEventListener('hashchange', route);

/* ================= Đăng nhập ================= */
function loginView(msg) {
  app.innerHTML = `<div class="login"><form class="panel" id="loginForm" autocomplete="on">
    <a class="brand" href="index.html" style="padding:0"><span class="brand-mark">${I('book')}</span><span><b>Quản trị ${E(M?.handbook?.shortName || 'Sổ tay AI')}</b><small>Dành cho nhóm nghiên cứu, biên tập viên</small></span></a>
    <label class="field"><span>Email</span><input class="in" id="lgEmail" type="email" autocomplete="username" required></label>
    <label class="field"><span>Mật khẩu</span><input class="in" id="lgPass" type="password" autocomplete="current-password" required></label>
    <p class="err" id="lgErr" ${msg ? '' : 'hidden'}>${E(msg || '')}</p>
    <div class="row"><button class="btn btn-primary" type="submit">${I('arrow')} Đăng nhập</button><a class="lnk" href="index.html">${I('back')} Về sổ tay</a></div>
    ${CFG.DEMO ? `<div class="field"><span class="flabel">Tài khoản dùng thử</span><div class="demo-list">
      <button type="button" data-demo="admin@sotayai.vn|admin123"><b>Quản trị viên</b><small>admin@sotayai.vn · admin123</small></button>
      <button type="button" data-demo="bientap@sotayai.vn|123456"><b>Biên tập viên</b><small>bientap@sotayai.vn · 123456</small></button>
    </div></div>` : ''}
  </form></div>`;
  $('#loginForm').addEventListener('submit', async e => { e.preventDefault(); await doLogin($('#lgEmail').value, $('#lgPass').value); });
}
async function doLogin(email, password) {
  const err = $('#lgErr');
  try {
    const r = await POST('/login', { email, password });
    if (!['editor', 'admin'].includes(r.me.role)) { await POST('/logout').catch(() => {}); throw new Error('Tài khoản giáo viên không có quyền vào trang quản trị'); }
    setToken(r.token); ME = r.me; await refreshBadges();
    if (!location.hash) location.hash = 'overview'; else route();
  } catch (e) { if (err) { err.textContent = e.message; err.hidden = false; } }
}

/* ================= Biểu đồ (SVG, một chuỗi số liệu mỗi biểu đồ) ================= */
function niceMax(v) { if (v <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
const dLabel = d => d.slice(8, 10) + '/' + d.slice(5, 7);
function columnChart(series, key, label, alt) {
  const W = 640, H = 210, L = 34, R = 8, T = 12, B = 24;
  const max = niceMax(Math.max(1, ...series.map(s => s[key])));
  const band = (W - L - R) / series.length, bw = Math.max(3, Math.min(26, band * .62));
  const y = v => T + (H - T - B) * (1 - v / max);
  const every = Math.ceil(series.length / 8);
  const ticks = [0, .25, .5, .75, 1].map(f => Math.round(max * f));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(label)}"><g class="grid">${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s += `<g class="axis">${ticks.map(t => `<text x="${L - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}</text>`).join('')}${series.map((d, i) => i % every === 0 || i === series.length - 1 ? `<text x="${L + band * i + band / 2}" y="${H - 6}" text-anchor="middle">${dLabel(d.date)}</text>` : '').join('')}</g>`;
  series.forEach((d, i) => {
    const v = d[key], x = L + band * i + (band - bw) / 2, top = y(v), h = (H - B) - top;
    const r = Math.min(4, bw / 2, h);
    const path = v > 0 ? `M${x} ${H - B}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bw - r}Q${x + bw} ${top} ${x + bw} ${top + r}V${H - B}Z` : '';
    s += `<path class="bar${alt ? ' alt' : ''}" d="${path}"/><rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${H - T - B}" data-tip="${E(dLabel(d.date))}: <b>${v}</b> ${E(label.toLowerCase())}" data-cx="${x + bw / 2}" data-cy="${top}"/>`;
  });
  return `<div class="chart">${s}</svg><div class="tip" hidden></div></div>`;
}
function lineChart(series, key, label) {
  const W = 640, H = 210, L = 34, R = 34, T = 12, B = 24;
  const max = niceMax(Math.max(1, ...series.map(s => s[key])));
  const n = series.length, step = (W - L - R) / Math.max(1, n - 1);
  const x = i => L + step * i, y = v => T + (H - T - B) * (1 - v / max);
  const every = Math.ceil(n / 8);
  const ticks = [0, .25, .5, .75, 1].map(f => Math.round(max * f));
  const pts = series.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(label)}"><g class="grid">${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s += `<g class="axis">${ticks.map(t => `<text x="${L - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}</text>`).join('')}${series.map((d, i) => i % every === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dLabel(d.date)}</text>` : '').join('')}</g>`;
  s += `<path class="area" d="M${x(0)} ${H - B}L${pts.join('L')}L${x(n - 1)} ${H - B}Z"/><polyline class="line" points="${pts.join(' ')}"/>`;
  const last = series[n - 1];
  s += `<circle class="dot" cx="${x(n - 1)}" cy="${y(last[key])}" r="4.5"/><text class="endlabel" x="${x(n - 1) + 8}" y="${y(last[key]) + 4}">${last[key]}</text>`;
  s += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/><circle class="dot hdot" r="5" cx="0" cy="0" visibility="hidden"/>`;
  series.forEach((d, i) => { s += `<rect class="hit" x="${x(i) - step / 2}" y="${T}" width="${step}" height="${H - T - B}" data-tip="${E(dLabel(d.date))}: <b>${d[key]}</b> ${E(label.toLowerCase())}" data-cx="${x(i)}" data-cy="${y(d[key])}" data-line="1"/>`; });
  return `<div class="chart">${s}</svg><div class="tip" hidden></div></div>`;
}
function wireCharts(root) {
  $$('.chart', root).forEach(c => {
    const svg = c.querySelector('svg'), tip = c.querySelector('.tip'), cross = c.querySelector('.cross'), hdot = c.querySelector('.hdot');
    const show = h => {
      const vb = svg.viewBox.baseVal, sc = svg.clientWidth / vb.width;
      tip.innerHTML = h.dataset.tip; tip.hidden = false;
      tip.style.left = (Number(h.dataset.cx) * sc) + 'px'; tip.style.top = (Number(h.dataset.cy) * sc) + 'px';
      $$('.bar.hover', c).forEach(b => b.classList.remove('hover')); const pb = h.previousElementSibling; if (pb?.classList.contains('bar')) pb.classList.add('hover');
      if (h.dataset.line && cross) { cross.setAttribute('x1', h.dataset.cx); cross.setAttribute('x2', h.dataset.cx); cross.setAttribute('visibility', 'visible'); hdot.setAttribute('cx', h.dataset.cx); hdot.setAttribute('cy', h.dataset.cy); hdot.setAttribute('visibility', 'visible'); }
    };
    const hide = () => { tip.hidden = true; $$('.bar.hover', c).forEach(b => b.classList.remove('hover')); cross?.setAttribute('visibility', 'hidden'); hdot?.setAttribute('visibility', 'hidden'); };
    $$('.hit', c).forEach(h => { h.addEventListener('mouseenter', () => show(h)); h.addEventListener('click', () => show(h)); });
    svg.addEventListener('mouseleave', hide);
  });
}
const hbars = (items, valKey, labelFn, max) => `<div class="hbars">${items.map(it => `<div class="hbar"><span class="lab">${labelFn(it)}</span><span class="val">${it[valKey]}</span><span class="track"><i style="width:${max ? Math.max(2, it[valKey] / max * 100) : 0}%"></i></span></div>`).join('') || '<p class="muted small">Chưa có số liệu trong khoảng thời gian này.</p>'}</div>`;

/* ================= CSV ================= */
function downloadCsv(name, rows) {
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Đã tạo file ' + name);
}
async function exportEvents(from, to) {
  let offset = 0, all = [];
  for (;;) { const r = await GET(`/admin/events?from=${from}&to=${to}&limit=5000&offset=${offset}`); all = all.concat(r.items); offset += r.items.length; if (!r.items.length || offset >= r.total) break; }
  downloadCsv(`su-kien_${from}_${to}.csv`, [['thoi_gian', 'loai', 'doi_tuong', 'ma_khach', 'tai_khoan'], ...all.map(e => [e.createdAt, e.type, e.targetId || '', e.visitorId, e.userId || ''])]);
}
async function exportFeedback() {
  const r = await GET('/admin/feedback');
  downloadCsv('gop-y.csv', [['thoi_gian', 'loai', 'noi_dung_lien_quan', 'danh_gia', 'nhan_xet', 'nguoi_gui', 'truong', 'trang_thai', 'ghi_chu_xu_ly'], ...r.items.map(f => [f.createdAt, f.kind, f.target?.title || '', f.rating ?? '', f.comment, f.user?.name || 'Ẩn danh', f.user?.school || '', f.status, f.adminNote])]);
}

/* ================= Tổng quan ================= */
async function overview() {
  loading('overview');
  const st = await GET('/admin/stats?days=' + F.days);
  const k = st.kpis;
  const maxSub = Math.max(1, ...st.bySubject.map(s => s.copies)), maxTop = Math.max(1, ...st.topPrompts.map(p => p.copies));
  const fbCard = f => `<div class="fb-card${f.status === 'new' ? ' new' : ''}"><div class="fb-meta"><span class="tag">${E((M.feedbackKinds.find(x => x.id === f.kind) || {}).name)}</span>${f.target ? `<b style="color:var(--ink)">${E(f.target.title)}</b>` : ''}${f.kind === 'prompt' ? (f.rating === 1 ? '<span class="pill p-ok">Hữu ích</span>' : '<span class="pill p-bad">Chưa hữu ích</span>') : starText(f.rating)}<span class="spacer"></span><span>${E(ago(f.createdAt))}</span></div>${f.comment ? `<blockquote>${E(f.comment)}</blockquote>` : ''}<div class="fb-meta">${f.user ? E(f.user.name) + ' · ' + E(f.user.school) : 'Khách ẩn danh'}</div></div>`;
  shell('overview', `${head('Tổng quan', 'Tình hình sử dụng sổ tay', `Số liệu từ ${fmtDate(st.from)} đến ${fmtDate(st.to)}. Dùng làm minh chứng cho báo cáo nghiên cứu.`,
    `<select class="in" id="daysSel" aria-label="Khoảng thời gian" style="width:auto">${[7, 14, 30, 90].map(d => opt(d, F.days, d + ' ngày gần nhất')).join('')}</select><button class="btn btn-sm" type="button" data-export-events>${I('download')} Xuất sự kiện CSV</button>`)}
  <div class="kpis">
    <div class="kpi accent"><small>Lượt truy cập</small><b>${k.visits7d}</b><span>7 ngày qua · ${k.visitors7d} khách khác nhau</span></div>
    <div class="kpi"><small>Sao chép câu lệnh</small><b>${k.promptCopies7d}</b><span>7 ngày qua · tổng ${k.promptCopies}</span></div>
    <div class="kpi"><small>Câu lệnh cá nhân hóa</small><b>${k.customCopies}</b><span>lượt sao chép từ trang Cá nhân hóa</span></div>
    <div class="kpi"><small>Giáo viên</small><b>${k.teachers}</b><span><strong>+${k.newTeachers7d}</strong> mới · ${k.activeTeachers7d} hoạt động 7 ngày</span></div>
    <div class="kpi"><small>Kế hoạch đã lưu</small><b>${k.plans}</b><span>${k.profiles} hồ sơ lớp · ${k.bookmarks} mục đã lưu</span></div>
    <div class="kpi"><small>Đánh giá</small><b>${k.helpfulRate == null ? '—' : k.helpfulRate + '%'}</b><span>câu lệnh được đánh giá hữu ích${k.lessonRating ? ` · bài mẫu ${k.lessonRating}/5` : ''}</span></div>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Lượt truy cập mỗi ngày</h2><p>Mỗi phiên trình duyệt tính 1 lượt</p></div>${columnChart(st.series, 'visits', 'Lượt truy cập')}</section>
    <section class="panel"><div class="panel-h"><h2>Lượt sao chép câu lệnh mỗi ngày</h2><p>Từ thư viện câu lệnh</p></div>${lineChart(st.series, 'promptCopies', 'Lượt sao chép')}</section>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Câu lệnh được sao chép nhiều nhất</h2><a class="lnk" href="#prompts">Tất cả ${I('arrow')}</a></div>${hbars(st.topPrompts, 'copies', p => `${p.exists ? `<a class="lnk" style="font-weight:600;color:var(--ink)" href="#prompt~${E(p.id)}">${E(p.title)}</a>` : E(p.title)} <small>${E(p.subject)} ${p.grade ? '· L' + p.grade : ''}</small>`, maxTop)}</section>
    <section class="panel"><div class="panel-h"><h2>Lượt sao chép theo môn học</h2><p>${F.days} ngày gần nhất</p></div>${hbars(st.bySubject, 'copies', s => `${E(s.subject)} <small>${s.prompts} câu lệnh</small>`, maxSub)}</section>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Bài dạy mẫu</h2><a class="lnk" href="#lessons">Quản lý ${I('arrow')}</a></div>
      <div class="tbl-wrap" style="border-width:1.5px"><table class="tbl" style="min-width:420px"><thead><tr><th>Bài</th><th class="num">Xem</th><th class="num">Chép</th><th class="num">Đánh giá</th></tr></thead><tbody>${st.topLessons.map(l => `<tr data-href="#lesson~${E(l.id)}"><td><b>${E(l.title)}</b><span class="sub">${E(l.subject)} · Lớp ${l.grade}</span></td><td class="num">${l.views}</td><td class="num">${l.copies}</td><td class="num">${l.ratingAvg ? l.ratingAvg + '/5 (' + l.ratingCount + ')' : '—'}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h2>Góp ý mới nhất</h2><a class="lnk" href="#feedback">${k.feedbackNew} chưa xử lý ${I('arrow')}</a></div><div class="fb-list">${st.recentFeedback.map(fbCard).join('') || '<p class="muted small">Chưa có góp ý.</p>'}</div></section>
  </div>`);
  wireCharts($('#main'));
  $('#daysSel').onchange = e => { F.days = Number(e.target.value); overview(); };
  $('[data-export-events]').onclick = () => exportEvents(st.from, st.to).catch(fail);
}

/* ================= Thông tin sổ tay ================= */
const HB_FIELDS = [
  ['productTitle', 'Tên đầy đủ của sản phẩm (hiển thị trên bìa)', 'area', 300, 2],
  ['shortName', 'Tên ngắn trên thanh điều hướng', 'text', 40],
  ['researchTitle', 'Tên đề tài nghiên cứu khoa học', 'area', 400, 2],
  ['groupName', 'Tên nhóm nghiên cứu', 'text', 150],
  ['organization', 'Đơn vị thực hiện', 'text', 200],
  ['members', 'Thành viên', 'text', 400],
  ['advisor', 'Giảng viên hướng dẫn', 'text', 150],
  ['year', 'Năm thực hiện', 'text', 20],
  ['applicationArea', 'Nơi ứng dụng (ngắn)', 'text', 200],
  ['applicationDescription', 'Mô tả phạm vi ứng dụng', 'area', 1500, 4],
  ['introduction', 'Giới thiệu, mục tiêu đề tài', 'area', 2000, 5],
];
function coverPreview(h) {
  return `<div class="preview-cover"><span class="badge">Sản phẩm nghiên cứu khoa học · ${E(h.year)}</span><h3>${E(h.productTitle)}</h3><dl><div><dt>Nhóm nghiên cứu</dt><dd>${E(h.groupName || 'Đang cập nhật')}</dd></div><div><dt>Đơn vị thực hiện</dt><dd>${E(h.organization || 'Đang cập nhật')}</dd></div></dl></div>`;
}
async function handbookPage() {
  loading('handbook');
  const { handbook } = await GET('/admin/content');
  const h = JSON.parse(JSON.stringify(handbook));
  shell('handbook', `${head('Nội dung chung', 'Thông tin sổ tay & đề tài', 'Tên sản phẩm, tên đề tài, nhóm thực hiện hiển thị trên bìa, trang Giới thiệu và Phụ lục của sổ tay. Ô để trống sẽ hiện "Đang cập nhật".')}
  <div class="grid-main">
    <form class="panel" id="hbForm" onsubmit="return false">
      ${HB_FIELDS.map(([k, label, type, max, rows]) => `<label class="field"><span>${E(label)}</span>${type === 'area' ? `<textarea class="in" id="hb_${k}" data-hb="${k}" maxlength="${max}" rows="${rows}">${E(h[k])}</textarea>` : `<input class="in" id="hb_${k}" data-hb="${k}" maxlength="${max}" value="${E(h[k])}">`}</label>`).join('')}
      <div class="field"><span class="flabel">Thông báo đầu trang sổ tay</span>
        <label class="switch"><input type="checkbox" id="annOn"${h.announcement.enabled ? ' checked' : ''}><span><b>Hiện thông báo</b><small>Dải thông báo màu vàng phía trên cuốn sổ, giáo viên có thể ẩn đi.</small></span></label>
        <textarea class="in" id="annText" maxlength="300" rows="2" placeholder="Nội dung thông báo">${E(h.announcement.text)}</textarea></div>
    </form>
    <div style="display:grid;gap:18px;position:sticky;top:16px">
      <section class="panel"><div class="panel-h"><h2>Xem trước trang bìa</h2><a class="lnk" href="index.html" target="_blank" rel="noopener">Mở sổ tay ${I('ext')}</a></div><div id="cvPrev">${coverPreview(h)}</div></section>
    </div>
  </div>
  <div class="sticky-actions"><span class="dirty" id="dirty" hidden>● Có thay đổi chưa lưu</span><button class="btn btn-primary" type="button" id="hbSave">${I('save')} Lưu thông tin</button></div>`);
  $('#hbForm').addEventListener('input', e => { const k = e.target.dataset.hb; if (k) h[k] = e.target.value; h.announcement = { enabled: $('#annOn').checked, text: $('#annText').value }; $('#cvPrev').innerHTML = coverPreview(h); setDirty(true); });
  $('#annOn').addEventListener('change', () => setDirty(true));
  $('#hbSave').onclick = async () => {
    const body = {}; HB_FIELDS.forEach(([k]) => body[k] = $('#hb_' + k).value); body.announcement = { enabled: $('#annOn').checked, text: $('#annText').value };
    try { const r = await PUT('/admin/handbook', body); M.handbook = r.handbook; HB_FIELDS.forEach(([k]) => { $('#hb_' + k).value = r.handbook[k]; }); setDirty(false); toast('Đã lưu. Sổ tay hiển thị thông tin mới ngay.'); } catch (e) { fail(e); }
  };
}

/* ================= Câu lệnh ================= */
const statusPill = s => s === 'published' ? '<span class="pill p-ok">Hiển thị</span>' : '<span class="pill p-off">Đang ẩn</span>';
async function promptsPage() {
  loading('prompts');
  const q = new URLSearchParams(Object.entries(F.prompts).filter(([, v]) => v)).toString();
  const r = await GET('/admin/prompts' + (q ? '?' + q : ''));
  BADGE.prompts = r.all;
  shell('prompts', `${head('Nội dung', 'Thư viện câu lệnh', `${r.all} câu lệnh · hiển thị ${r.total} theo bộ lọc. Câu lệnh ẩn không xuất hiện với giáo viên.`, `<a class="btn btn-primary" href="#prompt~new">${I('plus')} Thêm câu lệnh</a>`)}
  <div class="toolbar">
    <label class="search">${I('search')}<span class="sr">Tìm</span><input class="in" id="fq" type="search" placeholder="Tìm tên, nội dung, điều kiện…" value="${E(F.prompts.q)}"></label>
    <select class="in" data-f="subject" aria-label="Môn">${opt('', F.prompts.subject, 'Tất cả môn')}${M.subjects.map(s => opt(s, F.prompts.subject)).join('')}</select>
    <select class="in" data-f="grade" aria-label="Lớp">${opt('', F.prompts.grade, 'Mọi lớp')}${M.grades.map(g => opt(g, F.prompts.grade, 'Lớp ' + g)).join('')}</select>
    <select class="in" data-f="purpose" aria-label="Mục đích">${opt('', F.prompts.purpose, 'Mọi mục đích')}${M.purposes.map(p => opt(p.id, F.prompts.purpose, p.name)).join('')}</select>
    <select class="in" data-f="status" aria-label="Trạng thái">${opt('', F.prompts.status, 'Mọi trạng thái')}${opt('published', F.prompts.status, 'Hiển thị')}${opt('hidden', F.prompts.status, 'Đang ẩn')}</select>
  </div>
  ${r.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Câu lệnh</th><th>Môn · Lớp</th><th>Mục đích</th><th>Trạng thái</th><th class="num">Xem</th><th class="num">Sao chép</th><th class="num">Hữu ích</th><th></th></tr></thead><tbody>
    ${r.items.map(p => `<tr data-href="#prompt~${E(p.id)}"><td class="num">${p.order}</td><td><b>${E(p.title)}</b><span class="sub">${E(p.desc)}</span></td><td><span class="tag subj">${E(p.subject)}</span> <span class="tag">L${p.grade}</span></td><td>${E(purposeName(p.purpose))}</td><td>${statusPill(p.status)}</td><td class="num">${p.stats.views}</td><td class="num">${p.stats.copies}</td><td class="num">${p.stats.helpful}/${p.stats.helpful + p.stats.notHelpful}</td><td><button class="lnk" type="button" data-toggle-prompt="${E(p.id)}" data-st="${p.status}">${p.status === 'published' ? I('eyeoff') + ' Ẩn' : I('eye') + ' Hiện'}</button></td></tr>`).join('')}
  </tbody></table></div>` : '<div class="empty">Không có câu lệnh phù hợp bộ lọc.</div>'}`);
  const reload = () => promptsPage();
  $('#fq').addEventListener('input', debounceLocal(e => { F.prompts.q = e.target.value; reload().then(() => { const i = $('#fq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350));
  $$('[data-f]').forEach(s => s.onchange = () => { F.prompts[s.dataset.f] = s.value; reload(); });
}
function debounceLocal(fn, ms) { let t; return e => { clearTimeout(t); t = setTimeout(() => fn(e), ms); }; }
function condChipsHTML(all, on) {
  return `<div class="chips" id="condChips">${all.map(c => `<button type="button" class="chip${on.includes(c) ? ' on' : ''}" data-cond="${E(c)}" aria-pressed="${on.includes(c)}">${E(c)}</button>`).join('')}</div>
  <div class="row" style="margin-top:6px"><input class="in" id="condNew" maxlength="40" placeholder="Thêm điều kiện khác…" style="flex:1;min-height:34px"><button class="btn btn-sm" type="button" data-cond-add>${I('plus')} Thêm</button></div>`;
}
function wireCondChips(state, all) {
  const box = $('#condChips').parentElement;
  box.addEventListener('click', e => {
    const c = e.target.closest('[data-cond]');
    if (c) { const v = c.dataset.cond; const i = state.conditions.indexOf(v); i < 0 ? state.conditions.push(v) : state.conditions.splice(i, 1); c.classList.toggle('on', i < 0); c.setAttribute('aria-pressed', String(i < 0)); setDirty(true); }
    if (e.target.closest('[data-cond-add]')) {
      const v = $('#condNew').value.trim(); if (!v) return;
      if (!all.includes(v)) all.push(v); if (!state.conditions.includes(v)) state.conditions.push(v);
      $('#condChips').outerHTML = condChipsHTML(all, state.conditions).split('<div class="row"')[0];
      $('#condNew').value = ''; setDirty(true);
    }
  });
}
function confirmInline(el, label, onYes) {
  const old = el.innerHTML;
  el.innerHTML = `<span class="confirm-row">${E(label)} <button class="btn btn-sm btn-danger" type="button" data-yes>Xoá</button><button class="lnk" type="button" data-no>Huỷ</button></span>`;
  el.querySelector('[data-yes]').onclick = onYes; el.querySelector('[data-no]').onclick = () => { el.innerHTML = old; };
}
async function relatedFeedback(kind, id) {
  try {
    const r = await GET(`/admin/feedback?kind=${kind}&targetId=${encodeURIComponent(id)}`);
    return r.items.length ? `<div class="fb-list">${r.items.slice(0, 8).map(f => `<div class="fb-card${f.status === 'new' ? ' new' : ''}"><div class="fb-meta">${kind === 'prompt' ? (f.rating === 1 ? '<span class="pill p-ok">Hữu ích</span>' : '<span class="pill p-bad">Chưa hữu ích</span>') : starText(f.rating)}<span>${f.user ? E(f.user.name) : 'Ẩn danh'}</span><span class="spacer"></span><span>${E(ago(f.createdAt))}</span></div>${f.comment ? `<blockquote>${E(f.comment)}</blockquote>` : ''}</div>`).join('')}</div>` : '<p class="muted small">Chưa có đánh giá.</p>';
  } catch { return ''; }
}
async function promptEditor(id) {
  loading('prompts');
  const isNew = id === 'new';
  const p = isNew ? { title: '', subject: M.subjects[0], grade: 1, purpose: 'draft', desc: '', howto: '1. Điền tên bài và yêu cầu cần đạt kèm nguồn, trang. 2. Ghi sĩ số, thời lượng, đồ dùng thực sự có. 3. Sao chép câu lệnh, tự kiểm tra trước khi dạy.', conditions: [], text: '', status: 'published', stats: null }
    : await GET('/admin/prompts/' + encodeURIComponent(id));
  const allConds = [...new Set([...M.conditions, ...p.conditions])];
  const state = { conditions: [...p.conditions] };
  shell('prompts', `${head(isNew ? 'Thêm câu lệnh' : 'Sửa câu lệnh', isNew ? 'Câu lệnh mới' : p.title, `<a class="lnk" href="#prompts">${I('back')} Về thư viện câu lệnh</a>`, isNew ? '' : statusPill(p.status))}
  <div class="grid-main">
    <form class="panel" id="pForm" onsubmit="return false">
      <label class="field"><span>Tên câu lệnh <em>*</em></span><input class="in" id="p_title" maxlength="120" value="${E(p.title)}" placeholder="VD: So sánh số bằng hạt và que"></label>
      <div class="f3"><label class="field"><span>Môn học</span><select class="in" id="p_subject">${M.subjects.map(s => opt(s, p.subject)).join('')}</select></label>
        <label class="field"><span>Lớp</span><select class="in" id="p_grade">${M.grades.map(g => opt(g, p.grade, 'Lớp ' + g)).join('')}</select></label>
        <label class="field"><span>Mục đích</span><select class="in" id="p_purpose">${M.purposes.map(x => opt(x.id, p.purpose, x.name)).join('')}</select></label></div>
      <label class="field"><span>Mô tả ngắn</span><input class="in" id="p_desc" maxlength="300" value="${E(p.desc)}" placeholder="Một câu cho giáo viên biết câu lệnh dùng để làm gì"></label>
      <div class="field"><span class="flabel">Điều kiện lớp học phù hợp (bộ lọc trong thư viện)</span>${condChipsHTML(allConds, state.conditions)}</div>
      <label class="field"><span>Hướng dẫn sử dụng</span><textarea class="in" id="p_howto" maxlength="1500" rows="3">${E(p.howto)}</textarea><small>Đánh số "1. … 2. … 3. …" để sổ tay hiển thị thành các bước.</small></label>
      <label class="field"><span>Nội dung câu lệnh <em>*</em></span><textarea class="in mono" id="p_text" maxlength="4000" rows="9" placeholder="Phần giáo viên cần điền đặt trong [ngoặc vuông]">${E(p.text)}</textarea><small><span id="p_len">${p.text.length}</span>/4000 ký tự · phần trong [ngoặc vuông] được tô vàng cho giáo viên.</small></label>
      <div class="f2"><label class="field"><span>Trạng thái</span><select class="in" id="p_status">${opt('published', p.status, 'Hiển thị cho giáo viên')}${opt('hidden', p.status, 'Ẩn (bản nháp)')}</select></label>
        ${isNew ? '' : `<label class="field"><span>Thứ tự trong thư viện</span><input class="in" id="p_order" type="number" value="${E(p.order)}"></label>`}</div>
    </form>
    <div style="display:grid;gap:18px">
      <section class="panel"><h2>Xem trước câu lệnh</h2><div class="prompt-preview" id="pPrev">${ph(p.text) || '<span class="muted">Nội dung câu lệnh sẽ hiện ở đây.</span>'}</div></section>
      ${isNew ? '' : `<section class="panel"><h2>Số liệu sử dụng</h2><dl class="kv"><div><dt>Lượt xem</dt><dd>${p.stats.views}</dd></div><div><dt>Lượt sao chép</dt><dd>${p.stats.copies}</dd></div><div><dt>Đánh giá</dt><dd>${p.stats.helpful} hữu ích · ${p.stats.notHelpful} chưa hữu ích</dd></div><div><dt>Cập nhật</dt><dd>${E(fmtTime(p.updatedAt))}</dd></div></dl></section>
      <section class="panel"><h2>Đánh giá của giáo viên</h2><div id="pFb"><p class="muted small">Đang tải…</p></div></section>`}
    </div>
  </div>
  <div class="sticky-actions"><span class="dirty" id="dirty" hidden>● Có thay đổi chưa lưu</span>${isNew ? '' : `<span id="pDel"><button class="lnk danger" type="button" data-del>${I('trash')} Xoá</button></span><button class="btn btn-ghost" type="button" data-dup>${I('copy')} Nhân bản</button>`}<button class="btn btn-primary" type="button" data-save>${I('save')} ${isNew ? 'Tạo câu lệnh' : 'Lưu thay đổi'}</button></div>`);
  wireCondChips(state, allConds);
  $('#pForm').addEventListener('input', () => { setDirty(true); $('#pPrev').innerHTML = ph($('#p_text').value) || '<span class="muted">Nội dung câu lệnh sẽ hiện ở đây.</span>'; $('#p_len').textContent = $('#p_text').value.length; });
  const body = () => ({ title: $('#p_title').value, subject: $('#p_subject').value, grade: Number($('#p_grade').value), purpose: $('#p_purpose').value, desc: $('#p_desc').value, conditions: state.conditions, howto: $('#p_howto').value, text: $('#p_text').value, status: $('#p_status').value, ...(isNew ? {} : { order: Number($('#p_order').value) }) });
  $('[data-save]').onclick = async () => {
    try {
      const r = isNew ? await POST('/admin/prompts', body()) : await PUT('/admin/prompts/' + encodeURIComponent(id), body());
      setDirty(false); toast(isNew ? 'Đã tạo câu lệnh' : 'Đã lưu câu lệnh');
      await refreshBadges(); M.conditions = [...new Set([...M.conditions, ...r.conditions])];
      if (isNew) location.hash = 'prompt~' + r.id; else route();
    } catch (e) { fail(e); }
  };
  if (!isNew) {
    $('[data-dup]').onclick = async () => { try { const r = await POST('/admin/prompts', { ...body(), title: body().title + ' (bản sao)', status: 'hidden' }); toast('Đã tạo bản sao (đang ẩn)'); await refreshBadges(); location.hash = 'prompt~' + r.id; } catch (e) { fail(e); } };
    $('[data-del]').onclick = () => confirmInline($('#pDel'), 'Xoá vĩnh viễn câu lệnh này?', async () => { try { await DEL('/admin/prompts/' + encodeURIComponent(id)); toast('Đã xoá câu lệnh'); await refreshBadges(); location.hash = 'prompts'; } catch (e) { fail(e); } });
    $('#pFb').innerHTML = await relatedFeedback('prompt', id);
  }
}

/* ================= Bài dạy mẫu ================= */
async function lessonsPage() {
  loading('lessons');
  const q = new URLSearchParams(Object.entries(F.lessons).filter(([, v]) => v)).toString();
  const r = await GET('/admin/lessons' + (q ? '?' + q : ''));
  BADGE.lessons = r.all;
  shell('lessons', `${head('Nội dung', 'Kho kế hoạch bài dạy mẫu', `${r.all} bài · theo khung Phụ lục 3, Công văn 2345/BGDĐT-GDTH.`, `<a class="btn btn-primary" href="#lesson~new">${I('plus')} Thêm bài mẫu</a>`)}
  <div class="toolbar">
    <label class="search">${I('search')}<span class="sr">Tìm</span><input class="in" id="fq" type="search" placeholder="Tìm tên bài, tóm tắt…" value="${E(F.lessons.q)}"></label>
    <select class="in" data-f="subject" aria-label="Môn">${opt('', F.lessons.subject, 'Tất cả môn')}${M.subjects.map(s => opt(s, F.lessons.subject)).join('')}</select>
    <select class="in" data-f="status" aria-label="Trạng thái">${opt('', F.lessons.status, 'Mọi trạng thái')}${opt('published', F.lessons.status, 'Hiển thị')}${opt('hidden', F.lessons.status, 'Đang ẩn')}</select>
  </div>
  ${r.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bài dạy</th><th>Môn · Lớp</th><th class="num">Thời lượng</th><th class="num">Hoạt động</th><th>Trạng thái</th><th class="num">Xem</th><th class="num">Chép</th><th class="num">Đánh giá</th></tr></thead><tbody>
    ${r.items.map(l => `<tr data-href="#lesson~${E(l.id)}"><td><b>${E(l.title)}</b><span class="sub">${E(l.summary)}</span></td><td><span class="tag subj">${E(l.subject)}</span> <span class="tag">L${l.grade}</span></td><td class="num">${l.duration}′</td><td class="num">${l.activityCount}</td><td>${statusPill(l.status)}</td><td class="num">${l.stats.views}</td><td class="num">${l.stats.copies}</td><td class="num">${l.stats.ratingAvg ? l.stats.ratingAvg + ' (' + l.stats.ratingCount + ')' : '—'}</td></tr>`).join('')}
  </tbody></table></div>` : '<div class="empty">Không có bài mẫu phù hợp bộ lọc.</div>'}`);
  $('#fq').addEventListener('input', debounceLocal(e => { F.lessons.q = e.target.value; lessonsPage().then(() => { const i = $('#fq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350));
  $$('[data-f]').forEach(s => s.onchange = () => { F.lessons[s.dataset.f] = s.value; lessonsPage(); });
}
function actHTML(a, i, n) {
  return `<div class="rep-item" data-act="${i}"><div class="rep-h"><span class="n">${i + 1}</span><b style="font-size:13.5px">Hoạt động ${i + 1}</b><span class="spacer"></span>
    <button class="icon-btn" type="button" data-act-up="${i}" aria-label="Chuyển lên" ${i === 0 ? 'disabled' : ''}>${I('left').replace('viewBox', 'style="transform:rotate(90deg)" viewBox')}</button>
    <button class="icon-btn" type="button" data-act-down="${i}" aria-label="Chuyển xuống" ${i === n - 1 ? 'disabled' : ''}>${I('right').replace('viewBox', 'style="transform:rotate(90deg)" viewBox')}</button>
    <button class="icon-btn danger" type="button" data-act-del="${i}" aria-label="Xoá hoạt động" ${n === 1 ? 'disabled' : ''}>${I('trash')}</button></div>
    <div class="f2" style="grid-template-columns:minmax(0,1fr) 110px"><label class="field"><span>Tên hoạt động</span><input class="in" data-a="name" maxlength="120" value="${E(a.name)}" placeholder="VD: Mở đầu — Đi theo đường bao"></label><label class="field"><span>Số phút</span><input class="in" data-a="minutes" type="number" min="1" max="120" value="${E(a.minutes)}"></label></div>
    <label class="field"><span>Việc của giáo viên</span><textarea class="in" data-a="teacher" rows="3" maxlength="1500">${E(a.teacher)}</textarea></label>
    <label class="field"><span>Việc của học sinh</span><textarea class="in" data-a="students" rows="2" maxlength="1500">${E(a.students)}</textarea></label>
    <label class="field"><span>Sản phẩm, cách quan sát đánh giá</span><textarea class="in" data-a="evidence" rows="2" maxlength="1000">${E(a.evidence)}</textarea></label></div>`;
}
async function lessonEditor(id) {
  loading('lessons');
  const isNew = id === 'new';
  const l = isNew ? { title: '', subject: M.subjects[0], grade: 1, duration: 35, summary: '', conditions: [], goals: '', materials: [], activities: [{ name: 'Mở đầu', minutes: 5, teacher: '', students: '', evidence: '' }, { name: 'Khám phá', minutes: 12, teacher: '', students: '', evidence: '' }, { name: 'Luyện tập', minutes: 13, teacher: '', students: '', evidence: '' }, { name: 'Vận dụng', minutes: 5, teacher: '', students: '', evidence: '' }], worksheet: '', questions: [], adaptations: [], review: [], status: 'hidden' }
    : await GET('/admin/lessons/' + encodeURIComponent(id));
  const acts = JSON.parse(JSON.stringify(l.activities));
  const allConds = [...new Set(['Không máy chiếu', 'Không máy in', 'Học liệu địa phương', 'Hỗ trợ tiếng Việt', 'Có thể học ngoài trời', ...l.conditions])];
  const state = { conditions: [...l.conditions] };
  const ta = (key, label, rows, max, hint) => `<label class="field"><span>${label}</span><textarea class="in" id="l_${key}" rows="${rows}" maxlength="${max}">${E(Array.isArray(l[key]) ? l[key].join('\n') : l[key])}</textarea>${hint ? `<small>${hint}</small>` : ''}</label>`;
  shell('lessons', `${head(isNew ? 'Thêm bài mẫu' : 'Sửa bài mẫu', isNew ? 'Bài dạy mẫu mới' : l.title, `<a class="lnk" href="#lessons">${I('back')} Về kho bài mẫu</a>`, isNew ? '' : statusPill(l.status))}
  <div class="grid-main">
    <form class="panel" id="lForm" onsubmit="return false">
      <label class="field"><span>Tên bài <em>*</em></span><input class="in" id="l_title" maxlength="150" value="${E(l.title)}"></label>
      <div class="f3"><label class="field"><span>Môn học</span><select class="in" id="l_subject">${M.subjects.map(s => opt(s, l.subject)).join('')}</select></label>
        <label class="field"><span>Lớp</span><select class="in" id="l_grade">${M.grades.map(g => opt(g, l.grade, 'Lớp ' + g)).join('')}</select></label>
        <label class="field"><span>Thời lượng (phút)</span><input class="in" id="l_duration" type="number" min="10" max="140" value="${E(l.duration)}"></label></div>
      <label class="field"><span>Tóm tắt</span><textarea class="in" id="l_summary" rows="2" maxlength="400">${E(l.summary)}</textarea></label>
      <div class="field"><span class="flabel">Điều kiện phù hợp</span>${condChipsHTML(allConds, state.conditions)}</div>
      <h2 style="font:700 15px var(--f-display);margin-top:6px">I. Yêu cầu cần đạt</h2>
      ${ta('goals', 'Yêu cầu cần đạt', 5, 3000, 'Mỗi ý bắt đầu bằng "• " trên một dòng.')}
      <h2 style="font:700 15px var(--f-display)">II. Đồ dùng dạy học</h2>
      ${ta('materials', 'Đồ dùng (mỗi dòng một mục)', 3, 8000)}
      <div class="row" style="justify-content:space-between"><h2 style="font:700 15px var(--f-display)">III. Các hoạt động dạy học chủ yếu</h2><span class="small" id="minSum"></span></div>
      <div class="rep" id="acts"></div>
      <button class="btn btn-sm btn-ghost" type="button" data-act-add style="justify-self:start">${I('plus')} Thêm hoạt động</button>
      <h2 style="font:700 15px var(--f-display);margin-top:6px">Học liệu đi kèm</h2>
      <label class="field"><span>Phiếu học tập</span><textarea class="in mono" id="l_worksheet" rows="7" maxlength="6000">${E(l.worksheet)}</textarea></label>
      ${ta('questions', 'Câu hỏi gợi mở (mỗi dòng một câu)', 4, 8000)}
      ${ta('adaptations', 'Điều chỉnh cho điều kiện vùng cao (mỗi dòng một phương án)', 4, 9000)}
      ${ta('review', 'Hướng dẫn rà soát kết quả AI (mỗi dòng một ý)', 4, 9000)}
      <label class="field"><span>Trạng thái</span><select class="in" id="l_status">${opt('published', l.status, 'Hiển thị cho giáo viên')}${opt('hidden', l.status, 'Ẩn (bản nháp)')}</select></label>
    </form>
    <div style="display:grid;gap:18px">
      ${isNew ? '<section class="panel"><h2>Gợi ý</h2><p class="small muted">Bài mới mặc định ở trạng thái Ẩn. Kiểm tra chuyên môn xong, chuyển sang Hiển thị để giáo viên thấy.</p></section>' : `<section class="panel"><h2>Số liệu sử dụng</h2><dl class="kv"><div><dt>Lượt xem</dt><dd>${l.stats.views}</dd></div><div><dt>Lượt sao chép</dt><dd>${l.stats.copies}</dd></div><div><dt>Đánh giá</dt><dd>${l.stats.ratingAvg ? l.stats.ratingAvg + '/5 từ ' + l.stats.ratingCount + ' giáo viên' : 'Chưa có'}</dd></div><div><dt>Cập nhật</dt><dd>${E(fmtTime(l.updatedAt))}</dd></div></dl></section>
      <section class="panel"><h2>Đánh giá của giáo viên</h2><div id="lFb"><p class="muted small">Đang tải…</p></div></section>`}
    </div>
  </div>
  <div class="sticky-actions"><span class="dirty" id="dirty" hidden>● Có thay đổi chưa lưu</span>${isNew ? '' : `<span id="lDel"><button class="lnk danger" type="button" data-del>${I('trash')} Xoá</button></span>`}<button class="btn btn-primary" type="button" data-save>${I('save')} ${isNew ? 'Tạo bài mẫu' : 'Lưu thay đổi'}</button></div>`);
  wireCondChips(state, allConds);
  const drawActs = () => {
    $('#acts').innerHTML = acts.map((a, i) => actHTML(a, i, acts.length)).join('');
    const sum = acts.reduce((s, a) => s + (Number(a.minutes) || 0), 0), dur = Number($('#l_duration').value) || 0;
    $('#minSum').innerHTML = `Tổng ${sum}/${dur} phút ${sum === dur ? '<span class="pill p-ok">Khớp</span>' : '<span class="pill p-warn">Chưa khớp</span>'}`;
  };
  drawActs();
  $('#lForm').addEventListener('input', e => {
    setDirty(true);
    const box = e.target.closest('[data-act]');
    if (box && e.target.dataset.a) { acts[+box.dataset.act][e.target.dataset.a] = e.target.dataset.a === 'minutes' ? Number(e.target.value) : e.target.value; }
    if (e.target.dataset.a === 'minutes' || e.target.id === 'l_duration') { const sum = acts.reduce((s, a) => s + (Number(a.minutes) || 0), 0), dur = Number($('#l_duration').value) || 0; $('#minSum').innerHTML = `Tổng ${sum}/${dur} phút ${sum === dur ? '<span class="pill p-ok">Khớp</span>' : '<span class="pill p-warn">Chưa khớp</span>'}`; }
  });
  $('#lForm').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if ('actAdd' in d) { acts.push({ name: 'Hoạt động mới', minutes: 5, teacher: '', students: '', evidence: '' }); drawActs(); setDirty(true); }
    if ('actDel' in d) { acts.splice(+d.actDel, 1); drawActs(); setDirty(true); }
    if ('actUp' in d) { const i = +d.actUp; [acts[i - 1], acts[i]] = [acts[i], acts[i - 1]]; drawActs(); setDirty(true); }
    if ('actDown' in d) { const i = +d.actDown; [acts[i + 1], acts[i]] = [acts[i], acts[i + 1]]; drawActs(); setDirty(true); }
  });
  const body = () => ({ title: $('#l_title').value, subject: $('#l_subject').value, grade: Number($('#l_grade').value), duration: Number($('#l_duration').value), summary: $('#l_summary').value, conditions: state.conditions,
    goals: $('#l_goals').value, materials: lines($('#l_materials').value), activities: acts.map(a => ({ ...a, minutes: Number(a.minutes) })), worksheet: $('#l_worksheet').value,
    questions: lines($('#l_questions').value), adaptations: lines($('#l_adaptations').value), review: lines($('#l_review').value), status: $('#l_status').value });
  $('[data-save]').onclick = async () => {
    try { const r = isNew ? await POST('/admin/lessons', body()) : await PUT('/admin/lessons/' + encodeURIComponent(id), body()); setDirty(false); toast(isNew ? 'Đã tạo bài mẫu' : 'Đã lưu bài mẫu'); await refreshBadges(); if (isNew) location.hash = 'lesson~' + r.id; else route(); } catch (e) { fail(e); }
  };
  if (!isNew) {
    $('[data-del]').onclick = () => confirmInline($('#lDel'), 'Xoá vĩnh viễn bài mẫu này?', async () => { try { await DEL('/admin/lessons/' + encodeURIComponent(id)); toast('Đã xoá bài mẫu'); await refreshBadges(); location.hash = 'lessons'; } catch (e) { fail(e); } });
    $('#lFb').innerHTML = await relatedFeedback('lesson', id);
  }
}

/* ================= Hướng dẫn & đối chiếu ================= */
async function guidePage() {
  loading('guide');
  const c = await GET('/admin/content');
  const g = JSON.parse(JSON.stringify(c.guide)), chk = JSON.parse(JSON.stringify(c.checklist));
  const mv = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  const ctrl = (k, i, n, min) => `<span class="spacer"></span><button class="icon-btn" type="button" data-mv="${k}:${i}:-1" aria-label="Chuyển lên" ${i === 0 ? 'disabled' : ''}>${I('left').replace('viewBox', 'style="transform:rotate(90deg)" viewBox')}</button><button class="icon-btn" type="button" data-mv="${k}:${i}:1" aria-label="Chuyển xuống" ${i === n - 1 ? 'disabled' : ''}>${I('right').replace('viewBox', 'style="transform:rotate(90deg)" viewBox')}</button><button class="icon-btn danger" type="button" data-rm="${k}:${i}" aria-label="Xoá" ${n <= min ? 'disabled' : ''}>${I('trash')}</button>`;
  const stepsHTML = () => g.steps.map((s, i) => `<div class="rep-item" data-k="steps" data-i="${i}"><div class="rep-h"><span class="n">Bước ${i + 1}</span>${ctrl('steps', i, g.steps.length, 1)}</div>
    <div class="f2"><label class="field"><span>Tiêu đề</span><input class="in" data-p="title" maxlength="80" value="${E(s.title)}"></label><label class="field"><span>Minh họa</span><select class="in" data-p="visual">${M.visuals.map(v => opt(v.id, s.visual, v.name)).join('')}</select></label></div>
    <label class="field"><span>Tóm tắt (hiện trong danh sách bước)</span><input class="in" data-p="summary" maxlength="160" value="${E(s.summary)}"></label>
    <label class="field"><span>Các ý hướng dẫn (mỗi dòng một ý, tối đa 6)</span><textarea class="in" data-p="points" rows="3">${E(s.points.join('\n'))}</textarea></label></div>`).join('');
  const toolsHTML = () => g.tools.map((t, i) => `<div class="rep-item" data-k="tools" data-i="${i}"><div class="rep-h"><span class="n">${i + 1}</span><b style="font-size:13.5px">${E(t.name || 'Công cụ mới')}</b>${ctrl('tools', i, g.tools.length, 0)}</div>
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div class="f2" style="flex:1"><label class="field"><span>Tên</span><input class="in" data-p="name" maxlength="40" value="${E(t.name)}"></label><label class="field"><span>Địa chỉ (https://)</span><input class="in" data-p="url" maxlength="200" value="${E(t.url)}"></label></div><span class="qr-mini" data-qr>${/^https:\/\//.test(t.url) ? qrSvg(t.url) : ''}</span></div></div>`).join('');
  const checksHTML = () => chk.map((x, i) => `<div class="rep-item" data-k="chk" data-i="${i}"><div class="rep-h"><span class="n">${i + 1}</span>${ctrl('chk', i, chk.length, 3)}</div>
    <label class="field"><span>Mục kiểm tra</span><input class="in" data-p="title" maxlength="100" value="${E(x.title)}"></label><label class="field"><span>Giải thích</span><input class="in" data-p="detail" maxlength="300" value="${E(x.detail)}"></label></div>`).join('');
  shell('guide', `${head('Nội dung', 'Hướng dẫn & đối chiếu', 'Các bước hướng dẫn, công cụ AI kèm mã QR, video và danh mục kiểm tra kết quả AI hiển thị trong sổ tay.')}
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Các bước hướng dẫn</h2><button class="btn btn-sm btn-ghost" type="button" data-add="steps">${I('plus')} Thêm bước</button></div><div class="rep" id="rep-steps">${stepsHTML()}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" type="button" data-save="steps">${I('save')} Lưu các bước</button></div></section>
    <div style="display:grid;gap:18px">
      <section class="panel"><div class="panel-h"><h2>Công cụ AI & mã QR</h2><button class="btn btn-sm btn-ghost" type="button" data-add="tools">${I('plus')} Thêm công cụ</button></div><div class="rep" id="rep-tools">${toolsHTML()}</div>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" type="button" data-save="tools">${I('save')} Lưu công cụ</button></div></section>
      <section class="panel"><h2>Video hướng dẫn</h2>
        <label class="field"><span>Tiêu đề</span><input class="in" id="v_title" maxlength="120" value="${E(g.video.title)}"></label>
        <div class="f2"><label class="field"><span>Đường dẫn video (YouTube, Drive… https://)</span><input class="in" id="v_url" maxlength="300" value="${E(g.video.url)}" placeholder="Để trống nếu chưa có"></label><label class="field"><span>Thời lượng</span><input class="in" id="v_duration" maxlength="10" value="${E(g.video.duration)}" placeholder="04:30"></label></div>
        <label class="field"><span>Ghi chú khi chưa có video</span><input class="in" id="v_note" maxlength="200" value="${E(g.video.note)}"></label>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" type="button" data-save="video">${I('save')} Lưu video</button></div></section>
      <section class="panel"><div class="panel-h"><h2>Danh mục đối chiếu kết quả AI</h2><button class="btn btn-sm btn-ghost" type="button" data-add="chk">${I('plus')} Thêm mục</button></div><p class="small muted">Hiện ở chương Đối chiếu và trong "Kế hoạch của tôi" của giáo viên (3–12 mục).</p><div class="rep" id="rep-chk">${checksHTML()}</div>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" type="button" data-save="chk">${I('save')} Lưu danh mục</button></div></section>
    </div>
  </div>`);
  const draw = k => { if (k === 'steps') $('#rep-steps').innerHTML = stepsHTML(); if (k === 'tools') $('#rep-tools').innerHTML = toolsHTML(); if (k === 'chk') $('#rep-chk').innerHTML = checksHTML(); };
  const arr = k => k === 'steps' ? g.steps : k === 'tools' ? g.tools : chk;
  $('#main').addEventListener('input', e => {
    const it = e.target.closest('[data-k]'); const p = e.target.dataset.p; if (!it || !p) return;
    const o = arr(it.dataset.k)[+it.dataset.i];
    o[p] = p === 'points' ? e.target.value.split('\n') : e.target.value;
    if (it.dataset.k === 'tools' && p === 'url') it.querySelector('[data-qr]').innerHTML = /^https:\/\/\S+$/.test(e.target.value) ? qrSvg(e.target.value) : '';
  });
  $('#main').addEventListener('change', e => { const it = e.target.closest('[data-k]'); if (it && e.target.dataset.p === 'visual') arr(it.dataset.k)[+it.dataset.i].visual = e.target.value; });
  $('#main').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.mv) { const [k, i, dir] = d.mv.split(':'); mv(arr(k), +i, +dir); draw(k); }
    if (d.rm) { const [k, i] = d.rm.split(':'); arr(k).splice(+i, 1); draw(k); }
    if (d.add) { const k = d.add; if (k === 'steps') g.steps.push({ id: '', title: '', summary: '', visual: 'none', points: [''] }); if (k === 'tools') g.tools.push({ id: '', name: '', url: 'https://' }); if (k === 'chk') chk.push({ title: '', detail: '' }); draw(k); }
    if (d.save) {
      try {
        if (d.save === 'steps') { const r = await PUT('/admin/guide', { steps: g.steps.map(s => ({ ...s, points: (Array.isArray(s.points) ? s.points : []).map(x => x.trim()).filter(Boolean) })) }); g.steps = r.guide.steps; draw('steps'); }
        if (d.save === 'tools') { const r = await PUT('/admin/guide', { tools: g.tools }); g.tools = r.guide.tools; draw('tools'); }
        if (d.save === 'video') { await PUT('/admin/guide', { video: { title: $('#v_title').value, url: $('#v_url').value, duration: $('#v_duration').value, note: $('#v_note').value } }); }
        if (d.save === 'chk') { const r = await PUT('/admin/checklist', { items: chk }); chk.splice(0, chk.length, ...r.checklist); draw('chk'); }
        toast('Đã lưu. Sổ tay cập nhật ngay.');
      } catch (er) { fail(er); }
    }
  });
}

/* ================= Giáo viên ================= */
const userStatus = u => u.status === 'locked' ? '<span class="pill p-bad">Bị khoá</span>' : '<span class="pill p-ok">Hoạt động</span>';
async function teachersPage() {
  loading('teachers');
  const q = new URLSearchParams(Object.entries(F.teachers).filter(([, v]) => v)).toString();
  const r = await GET('/admin/users' + (q ? '?' + q : ''));
  shell('teachers', `${head('Người dùng', 'Giáo viên & tài khoản', `${r.total} tài khoản theo bộ lọc. Giáo viên tự đăng ký ở chương "Sổ tay của tôi".`)}
  <div class="toolbar">
    <label class="search">${I('search')}<span class="sr">Tìm</span><input class="in" id="fq" type="search" placeholder="Tên, email, trường, tỉnh…" value="${E(F.teachers.q)}"></label>
    <select class="in" data-f="role" aria-label="Vai trò">${opt('', F.teachers.role, 'Mọi vai trò')}${M.roles.map(x => opt(x.id, F.teachers.role, x.name)).join('')}</select>
    <select class="in" data-f="status" aria-label="Trạng thái">${opt('', F.teachers.status, 'Mọi trạng thái')}${opt('active', F.teachers.status, 'Hoạt động')}${opt('locked', F.teachers.status, 'Bị khoá')}</select>
    <select class="in" data-f="sort" aria-label="Sắp xếp">${opt('recent', F.teachers.sort, 'Hoạt động gần đây')}${opt('joined', F.teachers.sort, 'Mới tham gia')}${opt('name', F.teachers.sort, 'Tên A–Z')}</select>
    <button class="btn btn-sm" type="button" data-export>${I('download')} Xuất CSV</button>
  </div>
  ${r.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Giáo viên</th><th>Trường · Tỉnh</th><th>Vai trò</th><th>Trạng thái</th><th class="num">Kế hoạch</th><th class="num">Đã lưu</th><th class="num">Sao chép</th><th class="num">Góp ý</th><th>Hoạt động</th></tr></thead><tbody>
    ${r.items.map(u => `<tr data-href="#teacher~${E(u.id)}"><td><b>${E(u.name)}</b><span class="sub">${E(u.email)}</span></td><td>${E(u.school)}<span class="sub">${E(u.province)}</span></td><td>${E(roleName(u.role))}</td><td>${userStatus(u)}</td><td class="num">${u.counts.plans}</td><td class="num">${u.counts.bookmarks}</td><td class="num">${u.counts.copies}</td><td class="num">${u.counts.feedback}</td><td class="small">${E(ago(u.lastActiveAt))}</td></tr>`).join('')}
  </tbody></table></div>` : '<div class="empty">Không có tài khoản phù hợp.</div>'}`);
  $('#fq').addEventListener('input', debounceLocal(e => { F.teachers.q = e.target.value; teachersPage().then(() => { const i = $('#fq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350));
  $$('[data-f]').forEach(s => s.onchange = () => { F.teachers[s.dataset.f] = s.value; teachersPage(); });
  $('[data-export]').onclick = () => downloadCsv('giao-vien.csv', [['ho_ten', 'email', 'truong', 'tinh', 'vai_tro', 'trang_thai', 'lop_day', 'mon_day', 'tham_gia', 'hoat_dong_gan_nhat', 'ke_hoach', 'da_luu', 'sao_chep', 'gop_y'],
    ...r.items.map(u => [u.name, u.email, u.school, u.province, roleName(u.role), u.status, (u.grades || []).join(' '), (u.subjects || []).join('; '), u.joinedAt, u.lastActiveAt, u.counts.plans, u.counts.bookmarks, u.counts.copies, u.counts.feedback])]);
}
async function teacherDetail(id) {
  loading('teachers');
  const r = await GET('/admin/users/' + encodeURIComponent(id));
  const u = r.user; const self = u.id === ME.id;
  const canLock = !self && (isAdmin() || u.role === 'teacher');
  shell('teachers', `${head(roleName(u.role), u.name, `<a class="lnk" href="#teachers">${I('back')} Về danh sách</a>`, userStatus(u))}
  <div class="grid-main">
    <div style="display:grid;gap:18px">
      <section class="panel"><h2>Thông tin</h2><dl class="kv">
        <div><dt>Email</dt><dd>${E(u.email)}</dd></div><div><dt>Trường</dt><dd>${E(u.school)}</dd></div><div><dt>Tỉnh/thành</dt><dd>${E(u.province)}</dd></div>
        <div><dt>Lớp dạy</dt><dd>${u.grades.length ? u.grades.join(', ') : '—'}</dd></div><div><dt>Môn dạy</dt><dd>${u.subjects.length ? E(u.subjects.join(', ')) : '—'}</dd></div>
        <div><dt>Tham gia</dt><dd>${E(fmtTime(u.joinedAt))}</dd></div><div><dt>Hoạt động gần nhất</dt><dd>${E(ago(u.lastActiveAt))}</dd></div>
        ${u.status === 'locked' ? `<div><dt>Lý do khoá</dt><dd>${E(u.lockReason)}</dd></div>` : ''}
      </dl></section>
      <section class="panel"><div class="panel-h"><h2>Kế hoạch bài dạy (${r.plans.length})</h2><p>Chỉ xem tên và tiến độ, không mở nội dung</p></div>
        ${r.plans.length ? `<div class="tbl-wrap" style="border-width:1.5px"><table class="tbl" style="min-width:420px"><thead><tr><th>Kế hoạch</th><th>Trạng thái</th><th class="num">Đối chiếu</th><th>Cập nhật</th></tr></thead><tbody>${r.plans.map(p => `<tr style="cursor:default"><td><b>${E(p.title)}</b><span class="sub">${E(p.subject)} · Lớp ${p.grade}</span></td><td>${E((M.planStatuses.find(s => s.id === p.status) || {}).name)}</td><td class="num">${p.checked}/${M.checklist.length}</td><td class="small">${E(ago(p.updatedAt))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Chưa có kế hoạch.</p>'}</section>
      <section class="panel"><h2>Góp ý đã gửi (${r.feedback.length})</h2>${r.feedback.length ? `<div class="fb-list">${r.feedback.map(f => `<div class="fb-card"><div class="fb-meta"><span class="tag">${E((M.feedbackKinds.find(x => x.id === f.kind) || {}).name)}</span>${f.target ? `<b style="color:var(--ink)">${E(f.target.title)}</b>` : ''}${f.kind === 'prompt' ? (f.rating === 1 ? '<span class="pill p-ok">Hữu ích</span>' : '<span class="pill p-bad">Chưa hữu ích</span>') : starText(f.rating)}<span class="spacer"></span><span>${E(ago(f.createdAt))}</span></div>${f.comment ? `<blockquote>${E(f.comment)}</blockquote>` : ''}</div>`).join('')}</div>` : '<p class="muted small">Chưa gửi góp ý.</p>'}</section>
    </div>
    <div style="display:grid;gap:18px">
      <section class="panel"><h2>Mức độ sử dụng</h2><div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        <div class="kpi"><small>Kế hoạch</small><b>${u.counts.plans}</b></div><div class="kpi"><small>Hồ sơ lớp</small><b>${u.counts.profiles}</b></div>
        <div class="kpi"><small>Mục đã lưu</small><b>${u.counts.bookmarks}</b></div><div class="kpi"><small>Lượt sao chép</small><b>${u.counts.copies}</b></div></div>
        ${r.bookmarks.length ? `<div class="field"><span class="flabel">Đã lưu</span><div class="chips">${r.bookmarks.map(b => `<span class="tag">${E(b.target?.title || b.targetId)}</span>`).join('')}</div></div>` : ''}</section>
      ${canLock ? `<section class="panel"><h2>${u.status === 'locked' ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}</h2>
        ${u.status === 'locked' ? `<p class="small muted">Giáo viên đăng nhập lại được sau khi mở khoá.</p><button class="btn" type="button" data-lock="0">${I('unlock')} Mở khoá</button>`
        : `<label class="field"><span>Lý do (giáo viên thấy khi đăng nhập)</span><input class="in" id="lockReason" maxlength="200" placeholder="VD: Đăng ký sai thông tin"></label><p class="small muted">Khoá sẽ đăng xuất tài khoản khỏi mọi thiết bị.</p><button class="btn btn-danger" type="button" data-lock="1">${I('lock')} Khoá tài khoản</button>`}</section>` : ''}
      ${isAdmin() && !self ? `<section class="panel"><h2>Vai trò</h2><select class="in" id="roleSel">${M.roles.map(x => opt(x.id, u.role, x.name)).join('')}</select><p class="small muted">Biên tập viên quản lý nội dung, giáo viên, góp ý. Quản trị viên có thêm Cài đặt và phân quyền.</p><button class="btn btn-sm" type="button" data-role>${I('save')} Đổi vai trò</button></section>` : ''}
    </div>
  </div>`);
  $('[data-lock]')?.addEventListener('click', async e => { const lock = e.currentTarget.dataset.lock === '1'; try { await POST(`/admin/users/${encodeURIComponent(id)}/lock`, { lock, reason: $('#lockReason')?.value || '' }); toast(lock ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản'); route(); } catch (er) { fail(er); } });
  $('[data-role]')?.addEventListener('click', async () => { try { await POST(`/admin/users/${encodeURIComponent(id)}/role`, { role: $('#roleSel').value }); toast('Đã đổi vai trò'); route(); } catch (er) { fail(er); } });
}

/* ================= Góp ý ================= */
async function feedbackPage() {
  loading('feedback');
  const q = new URLSearchParams(Object.entries(F.feedback).filter(([, v]) => v)).toString();
  const r = await GET('/admin/feedback' + (q ? '?' + q : ''));
  BADGE.fbNew = r.newCount;
  const link = f => !f.target ? '' : f.target.exists ? `<a class="lnk" href="#${f.kind}~${E(f.target.id)}" style="color:var(--ink)">${E(f.target.title)}</a>` : `<span class="muted">${E(f.target.title)}</span>`;
  shell('feedback', `${head('Người dùng', 'Góp ý & đánh giá', `${r.newCount} góp ý chưa xử lý. Giáo viên gửi đánh giá ở từng câu lệnh, bài mẫu và góp ý chung ở trang Phụ lục.`, `<button class="btn btn-sm" type="button" data-export>${I('download')} Xuất CSV</button>`)}
  <div class="toolbar">
    <label class="search">${I('search')}<span class="sr">Tìm</span><input class="in" id="fq" type="search" placeholder="Tìm trong nhận xét, tên giáo viên…" value="${E(F.feedback.q)}"></label>
    <select class="in" data-f="kind" aria-label="Loại">${opt('', F.feedback.kind, 'Mọi loại')}${M.feedbackKinds.map(k => opt(k.id, F.feedback.kind, k.name)).join('')}</select>
    <select class="in" data-f="status" aria-label="Trạng thái">${opt('', F.feedback.status, 'Tất cả')}${opt('new', F.feedback.status, 'Chưa xử lý')}${opt('handled', F.feedback.status, 'Đã xử lý')}</select>
  </div>
  <div class="fb-list">${r.items.map(f => `<article class="fb-card${f.status === 'new' ? ' new' : ''}" data-fb="${E(f.id)}">
    <div class="fb-meta"><span class="tag">${E((M.feedbackKinds.find(x => x.id === f.kind) || {}).name)}</span>${link(f)}${f.kind === 'prompt' ? (f.rating === 1 ? '<span class="pill p-ok">Hữu ích</span>' : '<span class="pill p-bad">Chưa hữu ích</span>') : starText(f.rating)}<span class="spacer"></span>${f.status === 'new' ? '<span class="pill p-warn">Chưa xử lý</span>' : '<span class="pill p-off">Đã xử lý</span>'}</div>
    ${f.comment ? `<blockquote>${E(f.comment)}</blockquote>` : '<p class="small muted">Không kèm nhận xét.</p>'}
    <div class="fb-meta">${f.user ? `<a class="lnk" href="#teacher~${E(f.user.id)}">${E(f.user.name)}</a> · ${E(f.user.school)}` : 'Khách ẩn danh'} · ${E(fmtTime(f.createdAt))}</div>
    <div class="row"><input class="in" data-note maxlength="1000" value="${E(f.adminNote)}" placeholder="Ghi chú xử lý (chỉ nhóm nghiên cứu thấy)" style="flex:1;min-height:34px;min-width:200px">
      <button class="btn btn-sm" type="button" data-fb-status="${f.status === 'new' ? 'handled' : 'new'}">${f.status === 'new' ? I('check') + ' Đánh dấu đã xử lý' : 'Mở lại'}</button>
      ${isAdmin() ? `<span data-delbox><button class="lnk danger" type="button" data-fb-del>${I('trash')}<span class="sr">Xoá</span></button></span>` : ''}</div>
  </article>`).join('') || '<div class="empty">Không có góp ý phù hợp bộ lọc.</div>'}</div>`);
  $('#fq').addEventListener('input', debounceLocal(e => { F.feedback.q = e.target.value; feedbackPage().then(() => { const i = $('#fq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350));
  $$('[data-f]').forEach(s => s.onchange = () => { F.feedback[s.dataset.f] = s.value; feedbackPage(); });
  $('[data-export]').onclick = () => exportFeedback().catch(fail);
  $('#main').addEventListener('click', async e => {
    const card = e.target.closest('[data-fb]'); if (!card) return; const id = card.dataset.fb;
    const st = e.target.closest('[data-fb-status]');
    if (st) { try { await PUT('/admin/feedback/' + id, { status: st.dataset.fbStatus, adminNote: card.querySelector('[data-note]').value }); toast(st.dataset.fbStatus === 'handled' ? 'Đã đánh dấu đã xử lý' : 'Đã mở lại góp ý'); feedbackPage(); } catch (er) { fail(er); } }
    if (e.target.closest('[data-fb-del]')) confirmInline(card.querySelector('[data-delbox]'), 'Xoá góp ý?', async () => { try { await DEL('/admin/feedback/' + id); toast('Đã xoá góp ý'); feedbackPage(); } catch (er) { fail(er); } });
  });
  $('#main').addEventListener('change', async e => { if (!e.target.matches('[data-note]')) return; const id = e.target.closest('[data-fb]').dataset.fb; try { await PUT('/admin/feedback/' + id, { adminNote: e.target.value }); toast('Đã lưu ghi chú'); } catch (er) { fail(er); } });
}

/* ================= Cài đặt ================= */
async function settingsPage() {
  loading('settings');
  const { settings: s } = await GET('/admin/content');
  shell('settings', `${head('Quản trị viên', 'Cài đặt', 'Quy định chung cho tài khoản giáo viên và góp ý.')}
  <div class="grid2">
    <section class="panel"><h2>Tài khoản & góp ý</h2>
      <label class="switch"><input type="checkbox" id="s_reg"${s.allowRegistration ? ' checked' : ''}><span><b>Cho phép giáo viên tự tạo tài khoản</b><small>Tắt khi muốn dừng nhận người dùng mới (ví dụ sau giai đoạn khảo sát).</small></span></label>
      <label class="switch"><input type="checkbox" id="s_anon"${s.allowAnonymousFeedback ? ' checked' : ''}><span><b>Nhận góp ý, đánh giá ẩn danh</b><small>Khi tắt, giáo viên phải đăng nhập mới gửi được đánh giá và góp ý.</small></span></label>
      <div class="f2"><label class="field"><span>Số kế hoạch tối đa / tài khoản</span><input class="in" id="s_plans" type="number" min="1" max="500" value="${s.maxPlansPerUser}"></label><label class="field"><span>Số hồ sơ lớp tối đa / tài khoản</span><input class="in" id="s_profiles" type="number" min="1" max="100" value="${s.maxProfilesPerUser}"></label></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="button" data-save>${I('save')} Lưu cài đặt</button></div></section>
    <section class="panel"><h2>Dữ liệu mẫu</h2><p class="small muted">Chỉ có ở bản thử nghiệm (máy chủ chạy với APP_ENV=dev hoặc bản xem thử). Khôi phục toàn bộ nội dung, tài khoản và số liệu mẫu ban đầu; mọi thay đổi sẽ mất.</p>
      <div id="resetBox"><button class="btn btn-ghost" type="button" data-reset>${I('refresh')} Khôi phục dữ liệu mẫu</button></div></section>
  </div>`);
  $('[data-save]').onclick = async () => { try { await PUT('/admin/settings', { allowRegistration: $('#s_reg').checked, allowAnonymousFeedback: $('#s_anon').checked, maxPlansPerUser: Number($('#s_plans').value), maxProfilesPerUser: Number($('#s_profiles').value) }); toast('Đã lưu cài đặt'); } catch (e) { fail(e); } };
  $('[data-reset]').onclick = () => confirmInline($('#resetBox'), 'Xoá mọi thay đổi và nạp lại dữ liệu mẫu?', async () => {
    try { await POST('/admin/reset'); toast('Đã khôi phục dữ liệu mẫu. Vui lòng đăng nhập lại.'); setToken(''); ME = null; M = await GET('/meta'); loginView(); } catch (e) { fail(e.status === 404 ? new Error('Máy chủ đang chạy bản chính thức, không có chức năng khôi phục dữ liệu mẫu') : e); }
  });
}

/* ================= Sự kiện chung ================= */
document.addEventListener('click', async e => {
  const tr = e.target.closest('tr[data-href]');
  if (tr && !e.target.closest('button, a, input, select')) { location.hash = tr.dataset.href.slice(1); return; }
  const tog = e.target.closest('[data-toggle-prompt]');
  if (tog) { try { await PUT('/admin/prompts/' + encodeURIComponent(tog.dataset.togglePrompt), { status: tog.dataset.st === 'published' ? 'hidden' : 'published' }); toast(tog.dataset.st === 'published' ? 'Đã ẩn câu lệnh' : 'Đã hiện câu lệnh'); promptsPage(); } catch (er) { fail(er); } return; }
  const demo = e.target.closest('[data-demo]');
  if (demo) { const [em, pw] = demo.dataset.demo.split('|'); return doLogin(em, pw); }
  if (e.target.closest('[data-logout]')) { try { await POST('/logout'); } catch {} setToken(''); ME = null; loginView(); }
});

/* ================= Khởi động ================= */
(async function boot() {
  try {
    await Sotay.init();
    M = await GET('/meta');
    const r = await GET('/me');
    ME = r.me && ['editor', 'admin'].includes(r.me.role) ? r.me : null;
    if (!ME) return loginView(r.me ? 'Tài khoản giáo viên không có quyền vào trang quản trị' : '');
    await refreshBadges();
    route();
  } catch (e) { app.innerHTML = `<div class="boot">Không mở được trang quản trị: ${E(e.message)}</div>`; }
})();
})();
