/* Cấu hình frontend – sửa file này khi triển khai, không cần sửa code khác.
 *  API_BASE: đường dẫn API. Trên Cloudflare (Worker phục vụ cả web lẫn API cùng tên miền) giữ nguyên '/api'.
 *  DEMO:     true  = hiện các tài khoản demo ở chương "Sổ tay của tôi" và trang đăng nhập quản trị (khi gửi khách xem thử)
 *            false = bản chạy thật cho giáo viên: ẩn toàn bộ phần demo.
 *  MOCK:     'auto' = có backend thì dùng backend; không gọi được /api (mở file trực tiếp, bản xem thử tĩnh)
 *                     thì tự chạy "chế độ xem thử": dữ liệu mẫu + lưu trên trình duyệt (js/mock/*).
 *            false  = luôn dùng backend (bản chạy thật).  true = luôn dùng chế độ xem thử.               */
window.SOTAY_CONFIG = {
  API_BASE: '/api',
  DEMO: false,
  MOCK: false,
};

// Admin uses a username; keep the existing form and rendering code intact.
if (/\/admin(?:\.html)?\/?$/.test(location.pathname)) {
  new MutationObserver(() => {
    const input = document.getElementById('lgEmail');
    if (input && input.type === 'email') {
      input.type = 'text';
      input.previousElementSibling.textContent = 'Tên đăng nhập';
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}
