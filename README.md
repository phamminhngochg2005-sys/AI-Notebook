# Sổ tay AI — giáo viên Tiểu học xây dựng kế hoạch bài dạy

Sản phẩm nghiên cứu khoa học: **sổ tay điện tử dạng lật trang** giúp giáo viên Tiểu học dùng AI soạn, điều chỉnh và rà soát kế hoạch bài dạy theo điều kiện thực tế (định hướng ứng dụng ở trường vùng cao, miền núi).

- **Frontend hoàn chỉnh** trong `public/`: trang sổ tay `/` và trang quản trị `/admin`.
- **Server mẫu Node** (`server.js`) chạy được ngay, không cần cài thư viện, dùng để xem thử và gửi khách.
- **Backend chính thức** chạy trên Cloudflare Workers + D1: giao cho Codex theo **[PLAN.md](PLAN.md)** (hướng dẫn ngắn ở [AGENTS.md](AGENTS.md)).

## Chạy thử trên máy

Cần Node.js 20 trở lên.

```bash
node server.js            # hoặc bấm đúp start.command trên macOS
# Sổ tay:     http://localhost:8080
# Quản trị:   http://localhost:8080/admin
```

Tài khoản dùng thử (chỉ có ở bản thử nghiệm):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@sotayai.vn | admin123 |
| Biên tập viên | bientap@sotayai.vn | 123456 |
| Giáo viên (có sẵn kế hoạch, hồ sơ lớp) | lan.gv@sotayai.vn | 123456 |

Dữ liệu lưu ở `data/db.json`. Xoá file này (hoặc vào Quản trị → Cài đặt → Khôi phục dữ liệu mẫu) để về dữ liệu ban đầu.

**Gửi khách xem qua Cloudflare Tunnel:** chạy `node server.js` rồi `cloudflared tunnel --url http://localhost:8080`.

**Chế độ xem thử không cần server:** mở `public/index.html` bằng trình duyệt hoặc đưa thư mục `public/` lên bất kỳ hosting tĩnh nào. Khi không gọi được `/api`, sổ tay tự chạy bằng dữ liệu mẫu và lưu trên trình duyệt (thanh dưới góc trái ghi "Bản xem thử").

## Chức năng

**Sổ tay (giáo viên):** bìa (tên sản phẩm sửa được ở quản trị) · giới thiệu đề tài + mục lục · thư viện 80 câu lệnh (tìm không dấu, lọc môn / lớp / mục đích / điều kiện, sao chép, lưu, đánh giá) · cá nhân hóa kế hoạch bài dạy (tự ghép câu lệnh theo lớp thật, lưu hồ sơ lớp) · hướng dẫn 5 bước có minh họa, mã QR, video · 6 kế hoạch bài dạy mẫu theo CV 2345 có điều chỉnh vùng cao, phiếu học tập, câu hỏi · danh mục đối chiếu kết quả AI, phụ lục, góp ý · Sổ tay của tôi (kế hoạch tự lưu, đã lưu, hồ sơ lớp, tài khoản).

**Quản trị (nhóm nghiên cứu):** tổng quan số liệu sử dụng (biểu đồ, xuất CSV làm minh chứng) · thông tin sổ tay & đề tài · quản lý câu lệnh, bài mẫu · hướng dẫn, công cụ AI, video, danh mục đối chiếu · giáo viên (khoá, phân quyền) · góp ý · cài đặt.

## Cấu hình

`public/js/config.js`:
- `DEMO: true` hiện tài khoản dùng thử; bản chạy thật đặt `false`.
- `MOCK: 'auto'` tự chuyển sang chế độ xem thử khi không có backend; bản chạy thật đặt `false`.

## Kiểm thử API

```bash
node server.js &
node tools/api-test.mjs http://localhost:8080     # 60 PASS
```

## Sửa nội dung mặc định

Câu lệnh và bài mẫu gốc nằm ở `tools/content/*.json`; thông tin sổ tay, hướng dẫn, tài khoản mẫu ở `tools/seed-data.src.js`. Sửa xong chạy `node tools/build-seed.mjs` để tạo lại `public/js/mock/seed-data.js`, rồi xoá `data/db.json`. Khi đã chạy thật, sửa nội dung trực tiếp trong trang quản trị.

## Thư mục khác

`dist/`, `v4-flipbook/`, `output/`, `preview/`, `export_mockup.py`, `integrate_book.py`, `CLIENT_BRIEF_V3.md`, `README-v3.md` là các bản mockup trước (v3, v4), giữ lại để tham khảo.
