# Triển khai Sổ tay AI

Worker `sotay-ai` phục vụ nguyên frontend `public/` và API Hono `/api/*`. D1 lưu nội dung, tài khoản, phiên đăng nhập, kế hoạch, thống kê và thông tin ảnh. Cloudinary lưu ảnh. Không sửa các thư mục mockup cũ.

Website: https://sotay-ai.luuta-uranus.workers.dev — quản trị: https://sotay-ai.luuta-uranus.workers.dev/admin.

## Chạy trên máy

```powershell
npm.cmd ci
npm.cmd run cf:db:migrate:local
npm.cmd run cf:dev
```

`.dev.vars` là file riêng tư, chứa các khóa từ `secrets.json`, `APP_ENV=dev` và `PBKDF2_ITERATIONS=10000`. Chỉ dev có tài khoản mẫu và API reset. Frontend luôn dùng API thật, không hiện tài khoản demo.

```powershell
npm.cmd run typecheck
node tools/api-test.mjs http://localhost:8787
node tools/security-test.mjs http://localhost:8787
node tools/cloudinary-test.mjs http://localhost:8787
```

Bộ `api-test` phải đạt 60 PASS, 0 FAIL. Hai bộ test này chỉ chạy với dữ liệu dev: `api-test` reset dữ liệu, `security-test` thêm đánh giá thử.

`cloudinary-test` dùng khóa thật trong `secrets.json`, upload một ảnh 1 pixel, kiểm tra URL và metadata, xóa ảnh thử rồi reset D1 dev. Không chạy các test ghi dữ liệu với URL production.

## Production

`wrangler.jsonc` chứa D1 ID và `APP_ENV=production`. Các khóa Cloudinary/Gemini được nạp từ file riêng tư bằng `wrangler secret bulk`, không import vào mã Worker hoặc gửi xuống trình duyệt. Dùng `npx.cmd wrangler secret list` để xem tên khóa; không in giá trị.

Admin đăng nhập bằng username `ADMIN`. Username ánh xạ tới email bootstrap `admin@sotayai.vn`; mật khẩu chỉ lưu trong D1 dưới dạng PBKDF2-SHA256 với salt ngẫu nhiên. Mật khẩu bootstrap được cung cấp riêng, không ghi trong source/config công khai. Bootstrap chỉ tạo admin khi bảng users trống, không ghi đè mật khẩu đã đổi. Sau khi admin đã được tạo, xóa secret `BOOTSTRAP_ADMIN_PASSWORD`.

```powershell
npx.cmd wrangler whoami
npm.cmd run cf:db:migrate:remote
npm.cmd run cf:deploy
```

Production chỉ nạp 80 câu lệnh, 6 bài mẫu, nội dung sổ tay và admin; không nạp tài khoản giáo viên, sự kiện, góp ý mẫu. `/api/admin/reset` và `/js/mock/*` trả 404.

Đổi tên miền bằng `routes` / Custom Domain của Worker sau khi tên miền nằm trong tài khoản Cloudflare. Khi chưa có tên miền, dùng URL `workers.dev` do deploy trả về.

## Cloudinary và Gemini

- `POST /api/admin/media`: chỉ admin, JSON `{ "file": "data:image/png;base64,..." }`; nhận PNG/JPEG/WebP tối đa khoảng 1 MB, tối đa 30 lần/giờ. Worker ký và gửi ảnh sang Cloudinary; trả URL HTTPS và lưu metadata trong D1. `GET /api/admin/media` trả tối đa 100 ảnh mới nhất. Frontend hiện không có nút upload nên không thêm giao diện.
- `GEMINI_API_KEY`, `GEMINI_MODEL` được lưu dưới dạng Worker secrets. Chưa gọi Gemini từ website vì frontend và PLAN.md dùng luồng sao chép câu lệnh sang công cụ AI. Không phát sinh yêu cầu AI tự động.
- Upload thành công nhưng ghi metadata D1 thất bại có thể để lại ảnh trên Cloudinary; cần kiểm tra Cloudinary nếu gặp lỗi khi lưu. Hiện không có API xóa ảnh.

Tài khoản đã dùng hết 5 cron slots của Workers Free. Hiện việc dọn session hết hạn/rate limit cũ chạy tối đa một lần/ngày khi có request `/api/meta`; luôn giữ lại sự kiện nghiên cứu. Có thể bật lịch `0 19 * * *` cho handler `scheduled` khi có slot. Session hết hạn vẫn bị từ chối ngay cả khi chưa được dọn. Giữ nguyên 100.000 vòng PBKDF2 ở production; theo dõi CPU request và chọn gói Workers phù hợp trước khi mở rộng sử dụng. Không ghi nội dung kế hoạch hoặc secret vào log.

Tài liệu API nền tảng: [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [Cloudinary upload](https://cloudinary.com/documentation/image_upload_api_reference).
