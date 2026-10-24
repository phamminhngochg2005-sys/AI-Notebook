/* Sổ tay AI — tiện ích dùng chung cho index.html và admin.html:
 * gọi API (tự chuyển sang chế độ xem thử khi không có backend), mã khách truy cập, thông báo nhanh,
 * sao chép, biểu tượng, mã QR, định dạng ngày giờ.  */
(function () {
  'use strict';
  const CFG = Object.assign({ API_BASE: '/api', DEMO: true, MOCK: 'auto' }, window.SOTAY_CONFIG || {});

  /* ---------- Lưu trữ cục bộ an toàn ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sotay-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sotay-' + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem('sotay-' + k); } catch {} },
    sget(k) { try { return sessionStorage.getItem('sotay-' + k); } catch { return null; } },
    sset(k, v) { try { sessionStorage.setItem('sotay-' + k, v); } catch {} },
  };
  function randomHex(n) {
    const a = new Uint8Array(Math.ceil(n / 2));
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('').slice(0, n);
  }
  let visitorId = store.get('visitor', null);
  if (!/^v_[a-z0-9]{6,40}$/.test(visitorId || '')) { visitorId = 'v_' + randomHex(16); store.set('visitor', visitorId); }

  /* ---------- Chế độ xem thử (không có backend) ---------- */
  let mode = null, mock = null, bootMeta = null;
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Không tải được ' + src)); document.head.appendChild(s); });
  }
  async function startMock() {
    const base = (document.querySelector('script[src*="core.js"]')?.getAttribute('src') || 'js/core.js').replace(/core\.js.*$/, '');
    if (!window.SOTAY_SEED) await loadScript(base + 'mock/seed-data.js');
    if (!window.SotayApiCore) await loadScript(base + 'mock/api-core.js');
    let saveTimer = null;
    const simpleHash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
    mock = window.SotayApiCore.createApi({
      seed: window.SOTAY_SEED, env: 'dev', eventScale: 0.85,
      now: () => Date.now(), randomHex,
      hashToken: t => 'mock$' + t,
      hashPassword: pw => 'mock$' + simpleHash('sotay:' + pw),
      verifyPassword: (pw, h) => h === 'mock$' + simpleHash('sotay:' + pw),
      load: () => store.get('mockdb', null),
      save: db => { clearTimeout(saveTimer); saveTimer = setTimeout(() => {
        try { localStorage.setItem('sotay-mockdb', JSON.stringify(db)); }
        catch { db.events = db.events.slice(-1500); store.set('mockdb', db); }
      }, 120); },
    });
    mode = 'mock';
  }
  async function init() {
    if (mode) return mode;
    if (CFG.MOCK === true || (CFG.MOCK !== false && location.protocol === 'file:')) { await startMock(); return mode; }
    try {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 5000);
      const res = await fetch(CFG.API_BASE + '/meta', { signal: ctl.signal, headers: tokenHeader() });
      clearTimeout(timer);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) { bootMeta = await res.json(); mode = 'server'; return mode; }
      throw new Error('no api');
    } catch (e) {
      if (CFG.MOCK === false) { mode = 'server'; return mode; }
      await startMock(); return mode;
    }
  }

  /* ---------- Gọi API ---------- */
  const token = () => store.get('token', '');
  function tokenHeader() { const t = token(); return t ? { Authorization: 'Bearer ' + t } : {}; }
  function setToken(t) { if (t) store.set('token', t); else store.del('token'); }
  async function api(method, path, body) {
    await init();
    if (method === 'GET' && path === '/meta' && bootMeta) { const m = bootMeta; bootMeta = null; return m; }
    if (mode === 'mock') {
      const u = new URL(path, 'http://x');
      await new Promise(r => setTimeout(r, 40));
      const out = mock.handle({ method, path: u.pathname, query: Object.fromEntries(u.searchParams), body: body === undefined ? undefined : JSON.parse(JSON.stringify(body)), token: token(), ip: 'mock' });
      if (out.status >= 400) throw Object.assign(new Error(out.body?.error || 'Có lỗi xảy ra'), { status: out.status });
      return out.body;
    }
    let res;
    try {
      res = await fetch(CFG.API_BASE + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...tokenHeader() }, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch { throw Object.assign(new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'), { status: 0 }); }
    let data = null; try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (res.status === 401 && token() && path !== '/login') setToken('');
      throw Object.assign(new Error(data?.error || 'Có lỗi xảy ra, vui lòng thử lại'), { status: res.status });
    }
    return data;
  }
  const GET = p => api('GET', p), POST = (p, b) => api('POST', p, b ?? {}), PUT = (p, b) => api('PUT', p, b ?? {}), DEL = p => api('DELETE', p);
  function track(type, targetId) {
    if (store.sget('notrack')) return;
    api('POST', '/events', { type, targetId: targetId ?? null, visitorId }).catch(() => {});
  }

  /* ---------- Giao diện chung ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    map: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c1.8.7 3 2.6 3.5 5.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    book: '<path d="M2 5.5C5 4 8.5 4 12 6c3.5-2 7-2 10-.5v13c-3-1.5-6.5-1.5-10 .5-3.5-2-7-2-10-.5z"/><path d="M12 6v13.5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    thumb: '<path d="M7 10v11H3V10zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.3 8A2 2 0 0 1 18.2 21H7"/>',
    thumbdown: '<path d="M17 14V3h4v11zM17 14l-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.3-8A2 2 0 0 1 5.8 3H17"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    save: '<path d="M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    home: '<path d="M3 11l9-8 9 8M5 9v12h14V9"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
  };
  const I = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  function toast(msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = I(kind === 'err' ? 'x' : 'check') + '<span>' + E(msg) + '</span>';
    box.appendChild(t); setTimeout(() => t.remove(), kind === 'err' ? 4200 : 2600);
  }
  const fail = e => toast(e?.message || 'Có lỗi xảy ra', 'err');

  function copyText(text, btn, msg) {
    const done = () => {
      toast(msg || 'Đã sao chép. Dán vào công cụ AI để dùng ngay.');
      if (btn) { const old = btn.innerHTML; btn.classList.add('done'); btn.innerHTML = I('check') + '<span>Đã sao chép</span>'; setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = old; }, 1600); }
    };
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {}
      ta.remove(); ok ? done() : toast('Trình duyệt chặn sao chép. Hãy bôi đen nội dung và nhấn Ctrl/⌘ + C.', 'err');
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
  }

  function qrSvg(text) {
    if (typeof window.qrcode !== 'function') return '';
    try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { return ''; }
  }

  const fmtDate = s => { if (!s) return '—'; const d = new Date(s); return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const fmtTime = s => { if (!s) return '—'; const d = new Date(s); return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); };
  function ago(s) {
    if (!s) return '—';
    const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return 'vừa xong'; if (m < 60) return m + ' phút trước';
    const h = Math.round(m / 60); if (h < 24) return h + ' giờ trước';
    const d = Math.round(h / 24); if (d < 30) return d + ' ngày trước';
    return fmtDate(s);
  }
  const initials = name => String(name || '?').trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  window.Sotay = {
    CFG, store, visitorId, init, api, GET, POST, PUT, DEL, track, setToken, token, get mode() { return mode; },
    $, $$, E, norm, I, toast, fail, copyText, qrSvg, fmtDate, fmtTime, ago, initials, debounce,
  };
})();
