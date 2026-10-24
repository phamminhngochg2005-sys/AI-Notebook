export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function need(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) throw new ApiError(status, message);
}
export const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
export const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
export const iso = () => new Date().toISOString();
export const VISITOR_RE = /^v_[a-z0-9]{6,40}$/;
export const DAY = 86400000, HOUR = 3600000;
export const MSG = { auth: 'Vui lòng đăng nhập để tiếp tục', staff: 'Bạn không có quyền truy cập trang quản trị', admin: 'Chỉ quản trị viên được thực hiện thao tác này', notFound: 'Không tìm thấy dữ liệu', rate: 'Bạn thao tác quá nhanh, thử lại sau ít phút' };
