# Hướng dẫn cho AI coding agent (Codex)

- Việc cần làm: viết backend **Cloudflare Workers (TypeScript + Hono) + D1** trong thư mục `src/` theo **PLAN.md** (đọc toàn bộ trước khi code).
- Đã có sẵn: `wrangler.jsonc` (assets = `public/`, binding DB), `migrations/0001_init.sql`, `.dev.vars.example`, `package.json` (scripts `cf:*`).
- Frontend trong `public/` đã hoàn chỉnh: **không sửa** (trừ `public/js/config.js`).
- Hành vi chuẩn: `public/js/mock/api-core.js` (lõi API tham chiếu, chạy bằng `node server.js`). Khi phân vân, chạy `node server.js` và so sánh phản hồi.
- Kiểm tra: `npm run cf:dev` rồi `node tools/api-test.mjs http://localhost:8787` phải ra 60 PASS, 0 FAIL.
- Thông báo lỗi tiếng Việt, giữ nguyên chuỗi `error` như trong `api-core.js`.
- Không đụng vào các thư mục mockup cũ: `dist/`, `v4-flipbook/`, `output/`, `preview/` và các script `export_mockup.py`, `integrate_book.py`.
