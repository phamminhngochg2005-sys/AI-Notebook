# PLAN.md – Backend cho "Sổ tay AI hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy" trên Cloudflare

> Tài liệu giao việc cho Codex (hoặc lập trình viên backend). **Frontend đã xong.** Nhiệm vụ: viết backend chạy trên
> **Cloudflare Workers + D1 (SQLite)**. Cùng một Worker phục vụ web tĩnh `public/` và API `/api/*`. Sản phẩm không có upload ảnh nên **không cần R2**.
>
> **Nguồn sự thật (theo thứ tự ưu tiên):**
> 1. `tools/api-test.mjs`: backend đạt khi `node tools/api-test.mjs http://localhost:8787` ra **60/60 PASS** (được thêm test, không được xoá test).
> 2. `public/js/mock/api-core.js`: **lõi API tham chiếu**, đã chạy đúng với frontend (vừa là server mẫu Node qua `server.js`, vừa là chế độ xem thử trên trình duyệt). Logic viết bằng JavaScript, thao tác trên mảng trong bộ nhớ, nên **có thể chuyển gần như nguyên văn sang TypeScript** rồi thay phần đọc/ghi mảng bằng truy vấn D1. Khi tài liệu này và `api-core.js` khác nhau ở chi tiết nhỏ (chuỗi lỗi, giá trị mặc định, thứ tự sắp xếp), làm theo `api-core.js`.
> 3. Tài liệu này: kiến trúc, schema, quy tắc nghiệp vụ, danh sách API, triển khai.

---

## 1. Bối cảnh sản phẩm

Sản phẩm của một đề tài nghiên cứu khoa học: **sổ tay điện tử dạng lật trang** giúp giáo viên Tiểu học dùng công cụ AI (ChatGPT, Gemini, Copilot…) để soạn, điều chỉnh, rà soát **kế hoạch bài dạy** phù hợp điều kiện thực tế, đặc biệt ở trường vùng cao, miền núi. Website **không gọi API AI**: giáo viên sao chép câu lệnh rồi dán vào công cụ AI họ chọn.

Trang sổ tay `/` (không cần đăng nhập để dùng):
- **Bìa**: tên đầy đủ sản phẩm (sửa ở trang quản trị), hình sách mở, nhóm nghiên cứu, đơn vị, nút "Mở sổ tay" / "Bắt đầu sử dụng".
- **Chương 1 – Giới thiệu đề tài**: tên đề tài, mục tiêu, nơi ứng dụng, người thực hiện + mục lục.
- **Chương 2 – Thư viện 80 câu lệnh AI**: tìm từ khoá (không dấu), lọc môn / lớp / mục đích / điều kiện lớp; tên, mô tả, hướng dẫn; nút "Sao chép câu lệnh"; lưu câu lệnh; đánh giá Hữu ích / Chưa hữu ích.
- **Chương 3 – Cá nhân hoá kế hoạch bài dạy**: giáo viên nhập môn, lớp, tên bài, yêu cầu cần đạt, đặc điểm học sinh, năng lực tiếng Việt, thiết bị / học liệu, sĩ số, điều kiện lớp, thời lượng → frontend **tự ghép câu lệnh** (không cần backend). Có tài khoản thì lưu **hồ sơ lớp** và **lưu thành kế hoạch**.
- **Chương 4 – Hướng dẫn từng bước**: các bước (sửa được), minh hoạ, mã QR tới công cụ AI (frontend tự vẽ QR từ URL), video.
- **Chương 5 – Kho kế hoạch bài dạy mẫu**: bài mẫu theo khung Phụ lục 3, Công văn 2345/BGDĐT-GDTH; phiếu học tập, câu hỏi, điều chỉnh vùng cao, hướng dẫn rà soát kết quả AI; đánh giá 1–5 sao.
- **Chương 6 – Đối chiếu & chỉnh sửa kết quả AI**: danh mục kiểm tra (sửa được), phụ lục, **góp ý chung** cho nhóm nghiên cứu.
- **Chương 7 – Sổ tay của tôi** (cần tài khoản): đăng ký / đăng nhập; **Kế hoạch của tôi** (câu lệnh đã gửi AI + dán kết quả AI + danh mục đối chiếu + ghi chú, tự lưu), **Đã lưu**, **Hồ sơ lớp**, **Tài khoản**.

Trang quản trị `/admin` (biên tập viên & quản trị viên): tổng quan số liệu sử dụng (minh chứng cho báo cáo NCKH) + xuất CSV, thông tin sổ tay & đề tài (**tên sản phẩm sửa được**), quản lý câu lệnh, bài mẫu, hướng dẫn / công cụ AI / video / danh mục đối chiếu, giáo viên (khoá, phân quyền), góp ý (đánh dấu đã xử lý), cài đặt.

---

## 2. Hiện trạng thư mục

```
AI Notebook/
├─ PLAN.md, AGENTS.md, README.md
├─ wrangler.jsonc          ← cấu hình Worker (assets, D1, vars, cron) – ĐÃ CÓ, chỉ cần điền database_id + tên miền
├─ migrations/
│  └─ 0001_init.sql        ← schema D1 – ĐÃ CÓ (đã chạy thử trên SQLite)
├─ .dev.vars.example       ← biến môi trường khi chạy `wrangler dev` (APP_ENV=dev, …)
├─ package.json            ← scripts: start, test:api, cf:dev, cf:test, cf:db:migrate:*, cf:deploy
├─ public/                 ← FRONTEND HOÀN CHỈNH = thư mục static assets của Worker
│  ├─ index.html           ← trang sổ tay "/" (lật trang; hash: #gioi-thieu, #cau-lenh, #ca-nhan-hoa, #huong-dan, #bai-mau, #doi-chieu, #cua-toi)
│  ├─ admin.html           ← trang quản trị "/admin" (hash: #overview, #prompts, #prompt~<id>, #lessons, #lesson~<id>, #guide, #teachers, #teacher~<id>, #feedback, #settings, #handbook)
│  ├─ _headers, robots.txt, favicon.svg
│  ├─ css/app.css, css/admin.css
│  └─ js/
│     ├─ config.js         ← API_BASE ('/api'), DEMO, MOCK ('auto' | false | true)
│     ├─ core.js           ← gọi API (Bearer token), tự chuyển sang chế độ xem thử khi không có /api
│     ├─ app.js, admin.js
│     ├─ vendor/qrcode.js  ← qrcode-generator (MIT) – vẽ QR phía trình duyệt
│     └─ mock/
│        ├─ api-core.js    ← LÕI API THAM CHIẾU (nghiệp vụ + router) – nguồn để chuyển sang TypeScript
│        └─ seed-data.js   ← nội dung mặc định + dữ liệu mẫu (80 câu lệnh, 6 bài mẫu, tài khoản, góp ý…)
├─ server.js               ← server mẫu Node: phục vụ public/ + /api bằng api-core.js, lưu data/db.json
├─ start.command           ← bấm đúp chạy server mẫu trên macOS
├─ tools/
│  ├─ api-test.mjs         ← kiểm thử hợp đồng API (60 test)
│  ├─ build-seed.mjs, seed-data.src.js, content/{prompts,lessons}.json  ← nguồn của seed-data.js
├─ data/                   ← dữ liệu của server mẫu (bỏ qua, có trong .gitignore)
└─ dist/, v4-flipbook/, output/, export_mockup.py, … ← bản mockup cũ (v3, v4), KHÔNG thuộc phạm vi backend
```

Xem hành vi chuẩn: `node server.js` → http://localhost:8080 và http://localhost:8080/admin.
Test với server mẫu: `node tools/api-test.mjs http://localhost:8080` → 60/60.

---

## 3. Kiến trúc mục tiêu

### 3.1 Sơ đồ
```
Trình duyệt ──HTTPS──▶ Cloudflare (tên miền khách, SSL tự động)
                         │
                         ▼
                  Worker "sotay-ai"
   ┌─────────────────────┼───────────────────────────────┐
   │ Static assets       │ /api/*  (run_worker_first)     │
   │ public/ (/, /admin, │  router Hono → handlers        │
   │ /css, /js, …)       │   └─ D1 (binding DB)           │
   │ + _headers          │                                │
   └─────────────────────┴───────────────────────────────┘
                  Cron 02:00 VN: dọn session / rate-limit hết hạn
```

### 3.2 Công nghệ
- **TypeScript**, **Hono v4**, **Wrangler v4**, `@cloudflare/workers-types`.
- **D1** cho dữ liệu; **WebCrypto** (`crypto.subtle`) cho băm mật khẩu / SHA-256 token. Không dùng thư viện cần Node native (bcrypt…).
- Không có server riêng, không có bước build frontend.

### 3.3 Cấu trúc mã cần tạo
```
src/
├─ index.ts            ← export default { fetch: app.fetch, scheduled }
├─ types.ts            ← interface Env { DB: D1Database; ASSETS: Fetcher; APP_ENV; PBKDF2_ITERATIONS; TZ_OFFSET_MINUTES; BOOTSTRAP_ADMIN_EMAIL?; BOOTSTRAP_ADMIN_PASSWORD? }
├─ app.ts              ← new Hono<{Bindings: Env, Variables:{me}}>().basePath('/api'); middleware: bootstrap, auth, lastActive, onError → {error}
├─ lib/
│  ├─ http.ts          ← class ApiError(status,msg); need(cond,status,msg); json(); security headers cho phản hồi của Worker
│  ├─ db.ts            ← helper first/all/run/batch; map snake_case ↔ camelCase; JSON parse/stringify cột mảng
│  ├─ crypto.ts        ← randomHex(n), sha256Hex, pbkdf2Hash/verify, timingSafeEqual
│  ├─ text.ts          ← vnNormalize (giống norm() trong api-core.js), str(v,max), arrStr(v,maxItems,maxLen)
│  ├─ auth.ts          ← currentUser, requireAuth, requireStaff, requireAdmin
│  ├─ present.ts       ← pubUser, mini, outPrompt, outLesson, outPlan, outProfile, outFeedback, targetOf (shape mục 6)
│  ├─ usage.ts         ← thống kê views/copies/helpful/rating cho câu lệnh, bài mẫu (GROUP BY trong SQL)
│  ├─ settings.ts      ← đọc/ghi kv_store (handbook, guide, checklist, settings), cache trong request
│  └─ ratelimit.ts
├─ routes/             ← meta, prompts, lessons, events, feedback, auth, me (bookmarks, profiles, plans)
│  └─ admin/           ← stats, content (handbook, guide, checklist, settings), prompts, lessons, users, feedback, events, reset
└─ seed/
   ├─ data.ts          ← chuyển public/js/mock/seed-data.js sang TS (hoặc import thẳng file JS) – giữ nguyên ID
   └─ run.ts           ← seedDemo(env) / bootstrapProduction(env) – logic giống buildSeed() trong api-core.js
```

### 3.4 Môi trường
| | Dev trên máy | Staging (khuyên có) | Production |
|---|---|---|---|
| Lệnh | `npx wrangler dev` (D1 giả lập trong `.wrangler/`) | `wrangler deploy --env staging` | `npm run cf:deploy` |
| `APP_ENV` | `dev` (file `.dev.vars`) | `dev` | `production` |
| Dữ liệu | tự nạp dữ liệu mẫu khi DB trống; có `/api/admin/reset` | như dev, D1 riêng | nội dung mặc định (80 câu lệnh, 6 bài) + admin đầu tiên; **không có reset** |
| Dùng để | chạy `api-test` | gửi khách xem thử trên `*.workers.dev` | tên miền thật |

Thêm khối `"env": { "staging": { … d1 riêng, vars APP_ENV=dev } }` vào `wrangler.jsonc` khi cần staging.

---

## 4. Quy ước chung của API

| Mục | Quy ước |
|---|---|
| Định dạng | JSON UTF-8. Header phản hồi: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`. |
| Lỗi | Status đúng nghĩa + **`{ "error": "Thông báo tiếng Việt" }`**. Frontend hiện nguyên chuỗi `error`. Lỗi không lường trước → 500 `{error:"Lỗi máy chủ, vui lòng thử lại"}` + `console.error`. |
| Mã lỗi | 400 dữ liệu sai · 401 chưa đăng nhập / sai mật khẩu · 403 không đủ quyền / bị khoá / tắt đăng ký · 404 không tồn tại (cả đường dẫn API lạ) · 405 sai phương thức · 409 trùng / vượt giới hạn · 413 quá lớn · 429 thao tác quá nhanh · 500. JSON hỏng → 400 "Dữ liệu gửi lên không phải JSON hợp lệ". |
| Xác thực | `Authorization: Bearer <token>`; token = 48 ký tự hex ngẫu nhiên. Lưu `sha256(token)` trong `sessions`, hạn 30 ngày. Token sai / hết hạn / user bị khoá = khách (không lỗi, trừ route cần đăng nhập → 401). |
| ID | Tiền tố + 10 ký tự hex: `u_`, `p_`, `cp_`, `pl_`, `fb_`, `ev_`. Bài mẫu dùng slug từ tên (`bai-thu-nghiem`, trùng thì thêm `-<4 hex>`). **ID seed giữ nguyên** (`p01`…`p80`, `toan-3-chu-vi`, `u_lan`, `pl_lan1`…) vì test và frontend dùng. |
| Thời gian | Lưu TEXT ISO 8601 UTC có `Z` (`new Date().toISOString()`), trả nguyên chuỗi đó. Chia ngày thống kê theo giờ Việt Nam: `date(created_at, '+7 hours')`. |
| Kiểu | Trả `true/false`, number JSON, mảng JSON (D1 trả 0/1 và chuỗi JSON → phải chuyển). |
| Chuỗi | `trim` + cắt độ dài (mục 7.2). Lưu nguyên văn, frontend tự escape HTML. |
| `visitorId` | Mã khách ẩn danh do frontend tạo, khớp `^v_[a-z0-9]{6,40}$`, gửi trong body (`/events`, `/feedback`) hoặc query (`GET /prompts/:id?visitorId=`, `GET /lessons/:id?visitorId=` để trả `myFeedback` của khách). |
| CORS | Web và API cùng tên miền nên không cần. `OPTIONS` trả 204. |

---

## 5. Dữ liệu (D1)

Schema: **`migrations/0001_init.sql`**. Bảng: `users`, `sessions`, `prompts`, `lessons`, `profiles`, `plans`, `bookmarks`, `feedback`, `events`, `kv_store`, `rate_limits`.

Đổi tên cột so với JSON (còn lại snake_case ↔ camelCase như thường):
| Bảng | Cột DB | Trường JSON |
|---|---|---|
| prompts | `description` | `desc` |
| prompts | `body` | `text` |
| prompts, lessons | `sort_order` | `order` |
| users | `pass_hash` | (không bao giờ trả) |
| plans | `prompt_text`, `ai_result`, `base_prompt_id` | `promptText`, `aiResult`, `basePromptId` |

- Cột JSON: `users.subjects/grades`, `prompts.conditions`, `lessons.conditions/materials/activities/questions/adaptations/review`, `profiles.data`, `plans.checks`, `kv_store.value`.
- `search_text` = `vnNormalize(...)` của các trường được tìm (xem `filterPrompts` / `filterLessons` trong api-core.js), cập nhật mỗi lần lưu.
- `kv_store`: khoá `handbook`, `guide`, `checklist`, `settings`; mặc định lấy từ `seed-data.js`:
  - `handbook` = `{ productTitle, shortName, researchTitle, groupName, members, advisor, organization, year, applicationArea, applicationDescription, introduction, announcement:{enabled,text} }`
  - `guide` = `{ steps:[{id,title,summary,visual,points[]}], tools:[{id,name,url}], video:{title,url,duration,note} }`
  - `checklist` = `[{title, detail}]` (3–12 mục)
  - `settings` = `{ allowRegistration:true, allowAnonymousFeedback:true, maxPlansPerUser:100, maxProfilesPerUser:20 }`
- Hằng số trong code (giống `seed-data.js` → `meta`): `subjects` (13 môn), `grades` 1–5, `purposes` (draft/adapt/review/materials), `langLevels`, `equipment`, `classConditions`, `durations`, `planStatuses`, `roles`, `feedbackKinds`, `eventTypes`, `visuals`, `provinces`.

**Lưu ý D1:**
- Không có transaction tương tác; thao tác nhiều câu lệnh dùng **`env.DB.batch([...])`**: khoá tài khoản (đổi status + xoá session), đổi mật khẩu (đổi hash + xoá session khác), xoá câu lệnh / bài mẫu (xoá bookmarks liên quan), reset dữ liệu.
- Góp ý "gửi lại = cập nhật": dùng `INSERT … ON CONFLICT DO UPDATE` dựa trên 2 unique index một phần `uq_feedback_user`, `uq_feedback_visitor` (SQLite cần lặp lại điều kiện `WHERE` của index trong mệnh đề `ON CONFLICT(...) WHERE …`), hoặc SELECT rồi UPDATE/INSERT.
- Giới hạn hồ sơ lớp / kế hoạch: `INSERT … SELECT … WHERE (SELECT COUNT(*) FROM plans WHERE user_id=?) < ?` rồi kiểm tra `meta.changes`.
- Mỗi request đọc `kv_store` một lần rồi giữ trong biến của request.
- Bảng `events` lớn dần (mỗi lượt xem / sao chép 1 dòng). Thống kê phải `GROUP BY` / `COUNT` trong SQL có điều kiện thời gian, **không tải cả bảng**. Giới hạn D1 Free (5 triệu dòng đọc/ngày, 100.000 dòng ghi/ngày) dư cho giai đoạn thử nghiệm.

---

## 6. Shape dữ liệu trả về (frontend phụ thuộc vào đây)

### 6.1 User – `pubUser(u, viewer)`
```jsonc
{ "id": "u_lan", "name": "Lò Thị Lan", "school": "…", "province": "Điện Biên", "subjects": ["Toán"], "grades": [3],
  "role": "teacher|editor|admin", "status": "active|locked", "joinedAt": "…Z",
  // + nếu viewer là chính chủ hoặc staff (editor/admin):
  "email": "lan.gv@sotayai.vn", "lastActiveAt": "…Z",
  // + nếu viewer là staff:
  "lockReason": "" }
```
`mini(u)` = `{ id, name, role, school }` (null nếu không còn). Danh sách quản trị thêm `counts: { plans, profiles, bookmarks, feedback, copies }` (copies = số event `prompt_copy` + `custom_copy` của user).

### 6.2 Câu lệnh – `outPrompt(p, ctx, full)`
```jsonc
{ "id": "p07", "title": "…", "subject": "Toán", "grade": 3, "purpose": "draft", "desc": "…", "howto": "1. … 2. … 3. …",
  "conditions": ["Không máy chiếu"], "text": "…[tên bài]…", "status": "published|hidden", "order": 7, "createdAt": "…Z", "updatedAt": "…Z",
  "stats": { "views": 12, "copies": 30, "helpful": 3, "notHelpful": 1 },   // views/copies = đếm events; helpful = feedback rating 1/-1
  "bookmarked": false,                                                      // true nếu user đăng nhập đã lưu
  // + full (GET /prompts/:id, /admin/prompts/:id, kết quả tạo/sửa):
  "myFeedback": null | { "id", "rating", "comment", "createdAt" } }         // của user, hoặc của visitorId nếu chưa đăng nhập
```

### 6.3 Bài mẫu – `outLesson(l, ctx, full)`
```jsonc
{ "id": "toan-3-chu-vi", "title", "subject", "grade", "duration": 35, "summary", "conditions": [], "status", "order", "createdAt", "updatedAt",
  "activityCount": 4, "adaptationCount": 5,
  "stats": { "views", "copies", "ratingAvg": 4.5 | null, "ratingCount": 2 },  // ratingAvg làm tròn 1 chữ số
  "bookmarked": false,
  // + full:
  "goals": "…", "materials": [], "activities": [{ "name", "minutes", "teacher", "students", "evidence" }], "worksheet": "…",
  "questions": [], "adaptations": [], "review": [], "myFeedback": null | {…} }
```

### 6.4 Hồ sơ lớp, kế hoạch, góp ý
- Profile `{ id, name, data, createdAt, updatedAt }`; `data` luôn được **chuẩn hoá** (hàm `profileData` trong api-core.js):
  `{ subject, grade:"1".."5" (chuỗi), title, goal, traits, lang (thuộc langLevels, mặc định "Một số em cần hỗ trợ"), home, equip[], equipNote, size ("" hoặc 1–3 chữ số), conds[], condNote, dur ("35"|"40"|"70"), purpose, source, base (id câu lệnh tồn tại hoặc null) }`
- Plan (danh sách) `{ id, title, subject, grade, basePromptId, status, checks: boolean[], checked: số mục true, hasResult, createdAt, updatedAt }`; chi tiết thêm `promptText, aiResult, note`. **Danh sách không trả `aiResult`, `promptText`.**
- Feedback (quản trị) `{ id, kind, targetId, rating, comment, status, adminNote, createdAt, updatedAt, user: mini|null, anonymous, target: null | { type, id, title, exists, subject, grade } }` – câu lệnh / bài đã xoá: `title` = "Câu lệnh đã xoá" / "Bài mẫu đã xoá", `exists:false`.
- Bookmark `{ kind, targetId, createdAt, item: outPrompt|outLesson|null }` (null nếu đã xoá hoặc bị ẩn).

### 6.5 `GET /meta`
```jsonc
{ "handbook": {…}, "guide": {…}, "checklist": [...],
  "subjects": [13 môn], "activeSubjects": [môn có câu lệnh đang hiển thị], "grades": [1..5], "purposes": [{id,name}],
  "conditions": [điều kiện xuất hiện trong câu lệnh đang hiển thị], "langLevels", "equipment", "classConditions", "durations",
  "planStatuses", "provinces", "visuals", "roles", "feedbackKinds",
  "config": { "allowRegistration", "allowAnonymousFeedback" },
  "counts": { "prompts": 80, "lessons": 6, "subjects": 9 } }   // chỉ đếm nội dung published
```

---

## 7. Quy tắc nghiệp vụ

### 7.1 Quyền
| Vai trò | Sổ tay, câu lệnh, bài mẫu (published) | Sổ tay của tôi | Nội dung quản trị (sổ tay, câu lệnh, bài mẫu, hướng dẫn, đối chiếu) | Giáo viên | Góp ý | Cài đặt, đổi vai trò, xoá góp ý, reset |
|---|---|---|---|---|---|---|
| Khách | ✓ (sự kiện, góp ý ẩn danh nếu bật) | ✗ 401 | ✗ 401 | ✗ | ✗ | ✗ |
| `teacher` | ✓ | ✓ | ✗ 403 | ✗ | ✗ | ✗ |
| `editor` | ✓ (+ xem nội dung ẩn) | ✓ | ✓ | xem, khoá/mở khoá **giáo viên** | xem, xử lý, ghi chú | ✗ 403 |
| `admin` | ✓ | ✓ | ✓ | ✓ (khoá cả staff) | ✓ | ✓ |

- Không ai tự khoá / tự đổi vai trò của mình (400).
- Tài khoản `locked`: không đăng nhập được (403 "Tài khoản đã bị khoá: <lý do>"), mọi session bị xoá khi khoá.
- **Quyền riêng tư:** staff chỉ thấy **tên và tiến độ** kế hoạch của giáo viên (`outPlan` không full) và tên hồ sơ lớp; không có API nào cho staff đọc `aiResult`, `promptText`, `note`, `profiles.data` của người khác.

### 7.2 Kiểm tra dữ liệu (thông báo lỗi lấy nguyên văn từ `api-core.js`)
- Đăng ký: email hợp lệ (chuyển chữ thường), không trùng (409); mật khẩu ≥ 6; name 2–60; school 2–120; province bắt buộc (≤60); `subjects` lọc theo danh sách môn; `grades` lọc 1–5. `allowRegistration=false` → 403.
- Câu lệnh: title 3–120; subject ∈ subjects; grade 1–5; purpose ∈ purposes; desc ≤300; howto ≤1500; conditions ≤8 mục × ≤40; text 20–4000; status `published|hidden`.
- Bài mẫu: title 3–150; duration số nguyên 10–140; summary ≤400; goals ≤3000; materials ≤20×400; activities 1–12, mỗi cái name bắt buộc ≤120, minutes nguyên 1–120, teacher/students ≤1500, evidence ≤1000; worksheet ≤6000; questions ≤20×400; adaptations, review ≤15×600.
- Handbook: productTitle ≥10 (≤300), shortName ≥2 (≤40), researchTitle ≥10 (≤400); các trường khác để trống → lưu "Đang cập nhật"; announcement bật thì text ≥5 (≤300).
- Guide: steps 1–8 (title ≥3, ≥1 ý, ≤6 ý × 300, visual ∈ visuals); tools ≤6 (name bắt buộc, url `https://…`); video.url rỗng hoặc `https://…`.
- Checklist 3–12 mục, title ≥3.
- Settings: maxPlansPerUser 1–500, maxProfilesPerUser 1–100.
- Plan: title 2–150; promptText ≥10 khi tạo (≤8000); aiResult ≤20000; note ≤3000; checks ≤12 boolean; status ∈ draft|reviewed|taught.
- Profile: name 2–80; data qua `profileData`.

### 7.3 Sự kiện sử dụng (`POST /events`)
- `type` ∈ `visit, prompt_view, prompt_copy, custom_copy, lesson_view, lesson_copy, tool_open`; `visitorId` hợp lệ (400).
- `prompt_*` / `lesson_*`: `targetId` phải tồn tại (404). `tool_open`: targetId = id công cụ (≤40). `visit`, `custom_copy`: targetId null.
- Ghi `user_id` nếu có token hợp lệ. Giới hạn 600 sự kiện / giờ / visitorId (429).
- Frontend gửi: `visit` một lần mỗi phiên trình duyệt; `prompt_view` khi mở câu lệnh; `prompt_copy` khi sao chép; `custom_copy` khi sao chép câu lệnh cá nhân hoá hoặc câu lệnh trong kế hoạch; `lesson_view`, `lesson_copy`; `tool_open` khi bấm link / QR công cụ AI.
- Có thể ghi bằng `ctx.waitUntil` để không làm chậm phản hồi.

### 7.4 Góp ý (`POST /feedback`)
- `kind=prompt`: rating ∈ {1, -1}; `kind=lesson`: rating nguyên 1–5; `kind=general`: comment ≥5, rating null hoặc 1–5.
- Chưa đăng nhập: cần `settings.allowAnonymousFeedback` (không thì 401) và visitorId hợp lệ.
- prompt / lesson: **mỗi người 1 bản ghi / đối tượng** (theo user_id, hoặc visitor_id khi ẩn danh) – gửi lại thì cập nhật rating + comment và đưa `status` về `new`. general: luôn tạo mới.
- Giới hạn 30 lần / giờ / người (429).

### 7.5 Tài khoản & Sổ tay của tôi
- Đăng ký / đăng nhập trả `{ token, me }`. Đăng nhập: 10 lần / 10 phút / (IP + email) → 429.
- Đổi mật khẩu: kiểm tra mật khẩu cũ (400 nếu sai), xoá các session **khác** session hiện tại.
- `last_active_at`: cập nhật tối đa 1 lần / 60 giây / user.
- Bookmarks: `kind` ∈ prompt|lesson (400), đối tượng phải tồn tại và published (404); PUT lặp lại không lỗi.
- Profiles / plans chỉ chủ sở hữu thấy, sửa, xoá (khác chủ → 404). Vượt `maxProfilesPerUser` / `maxPlansPerUser` → 409.

### 7.6 Tìm kiếm & sắp xếp
- `vnNormalize(s) = s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d').toLowerCase()`.
- `q` tách theo khoảng trắng; **mọi từ** phải có trong `search_text` (`AND search_text LIKE ?` cho từng từ, escape `%` `_`).
- Câu lệnh, bài mẫu: `ORDER BY sort_order, created_at`. Profiles, plans: `updated_at DESC`. Feedback, events: `created_at DESC`.
- Câu lệnh / bài mới: `sort_order = MAX(sort_order) + 1`.
- Admin users `sort`: `recent` (last_active_at DESC, mặc định), `joined` (created_at DESC), `name` (A–Z tiếng Việt; dùng `ORDER BY name COLLATE NOCASE` là chấp nhận được).

---

## 8. Danh sách API

Quyền: 🌐 khách · 🔑 đã đăng nhập · 🛡 staff (editor/admin) · 👑 admin. Mọi đường dẫn có tiền tố `/api`.

### 8.1 Công khai
| Method | Path | Quyền | Body / Query | Trả về |
|---|---|---|---|---|
| GET | `/meta` | 🌐 | – | mục 6.5 |
| GET | `/prompts` | 🌐 | `q, subject, grade, purpose, cond` | `{ items:[outPrompt], total }` – chỉ published, có `bookmarked` theo user |
| GET | `/prompts/:id` | 🌐 | `visitorId?` | `outPrompt(full)`; ẩn → 404 trừ staff |
| GET | `/lessons` | 🌐 | `q, subject, grade` | `{ items:[outLesson], total }` (không có trường full) |
| GET | `/lessons/:id` | 🌐 | `visitorId?` | `outLesson(full)` |
| POST | `/events` | 🌐 | `{ type, targetId?, visitorId }` | `{ ok:true }` |
| POST | `/feedback` | 🌐 | `{ kind, targetId?, rating?, comment?, visitorId }` | `{ ok:true, feedback:{ id, rating, comment, createdAt } }` |

### 8.2 Tài khoản & Sổ tay của tôi
| Method | Path | Quyền | Body | Trả về |
|---|---|---|---|---|
| POST | `/register` | 🌐 | `{ email, password, name, school, province, subjects?, grades? }` | `{ token, me }` |
| POST | `/login` | 🌐 | `{ email, password }` | `{ token, me }` |
| POST | `/logout` | 🌐 | – | `{ ok:true }` (xoá session của token nếu có) |
| GET | `/me` | 🌐 | – | `{ me: null }` hoặc `{ me, counts:{ bookmarks, profiles, plans } }` |
| PUT | `/me` | 🔑 | tuỳ chọn `name, school, province, subjects, grades` | `{ me }` |
| POST | `/auth/change-password` | 🔑 | `{ current, next }` | `{ ok:true }` |
| GET | `/me/bookmarks` | 🔑 | – | `{ items:[bookmark] }` (mới nhất trước) |
| PUT / DELETE | `/me/bookmarks/:kind/:id` | 🔑 | – | `{ ok:true, bookmarked:true|false }` |
| GET / POST | `/me/profiles` | 🔑 | POST `{ name, data }` | `{ items }` / `profile` |
| PUT / DELETE | `/me/profiles/:id` | 🔑 | PUT `{ name?, data? }` | `profile` / `{ ok:true }` |
| GET / POST | `/me/plans` | 🔑 | POST `{ title, subject, grade, promptText, basePromptId? }` | `{ items:[plan] }` / `plan(full)` (status mặc định `draft`) |
| GET / PUT / DELETE | `/me/plans/:id` | 🔑 | PUT `{ title?, aiResult?, note?, checks?, status? }` | `plan(full)` / `{ ok:true }` |

### 8.3 Quản trị
| Method | Path | Quyền | Body / Query | Trả về |
|---|---|---|---|---|
| GET | `/admin/stats` | 🛡 | `days` 7–90 (mặc định 14) | mục 9 |
| GET | `/admin/content` | 🛡 | – | `{ handbook, guide, checklist, settings }` |
| PUT | `/admin/handbook` | 🛡 | một phần handbook | `{ handbook }` |
| PUT | `/admin/guide` | 🛡 | `steps?`, `tools?`, `video?` | `{ guide }` |
| PUT | `/admin/checklist` | 🛡 | `{ items:[{title,detail}] }` | `{ checklist }` |
| PUT | `/admin/settings` | 👑 | một phần settings | `{ settings }` |
| GET | `/admin/prompts` | 🛡 | `q, subject, grade, purpose, cond, status` | `{ items, total, all }` (`all` = tổng mọi trạng thái) |
| GET / PUT / DELETE | `/admin/prompts/:id` | 🛡 | PUT: trường cần sửa (+ `order`) | `outPrompt(full)` / `{ ok:true }` (xoá kèm bookmarks) |
| POST | `/admin/prompts` | 🛡 | như PUT, bắt buộc title/subject/grade/purpose/text | `outPrompt(full)` (mặc định published) |
| GET | `/admin/lessons` | 🛡 | `q, subject, grade, status` | `{ items, total, all }` |
| GET / PUT / DELETE | `/admin/lessons/:id` | 🛡 | | `outLesson(full)` / `{ ok:true }` |
| POST | `/admin/lessons` | 🛡 | bắt buộc title/subject/grade/activities | `outLesson(full)` |
| GET | `/admin/users` | 🛡 | `q, role, status, province, sort` | `{ items:[pubUser + counts], total }` |
| GET | `/admin/users/:id` | 🛡 | – | `{ user, plans:[plan danh sách], profiles:[{id,name,updatedAt}], bookmarks:[{kind,targetId,createdAt,target}], feedback:[outFeedback] }` |
| POST | `/admin/users/:id/lock` | 🛡 | `{ lock, reason? }` | `{ ok, user }` (editor chỉ khoá teacher – 403; lý do mặc định "Vi phạm quy định sử dụng") |
| POST | `/admin/users/:id/role` | 👑 | `{ role }` | `{ ok, user }` |
| GET | `/admin/feedback` | 🛡 | `kind, status, targetId, q` | `{ items:[outFeedback], total, newCount }` |
| PUT | `/admin/feedback/:id` | 🛡 | `{ status?, adminNote? }` | `outFeedback` |
| DELETE | `/admin/feedback/:id` | 👑 | – | `{ ok:true }` |
| GET | `/admin/events` | 🛡 | `type` (cách bởi dấu phẩy), `from`, `to` (YYYY-MM-DD giờ VN), `limit` ≤5000 (mặc định 500), `offset` | `{ items:[event], total, limit, offset }` – dùng cho xuất CSV |
| POST | `/admin/reset` | 👑 | – | `{ ok:true }` – **chỉ khi `APP_ENV=dev`**, còn lại 404 |

---

## 9. `GET /admin/stats`
```jsonc
{ "days": 14, "from": "2026-10-09", "to": "2026-10-22",        // ngày giờ VN
  "kpis": { "teachers", "newTeachers7d", "activeTeachers7d",     // role = teacher
            "visits", "visits7d", "visitors", "visitors7d",       // visitors = COUNT(DISTINCT visitor_id) của event visit
            "promptCopies", "promptCopies7d", "customCopies", "lessonViews", "lessonCopies", "toolOpens",
            "plans", "profiles", "bookmarks", "feedback", "feedbackNew",
            "helpfulRate",            // round(số feedback prompt rating=1 / tổng feedback prompt × 100) | null
            "lessonRating",           // trung bình rating feedback lesson, 1 chữ số | null
            "promptsPublished", "lessonsPublished" },
  "series": [ { "date":"2026-10-09", "visits", "promptCopies", "customCopies", "lessonViews", "registrations", "feedback" } ],  // đủ `days` ngày, cũ → mới
  "topPrompts": [ { "id", "title", "subject", "grade", "exists", "copies", "views", "helpful", "notHelpful" } ],   // top 8 theo copies trong khoảng
  "bySubject": [ { "subject", "prompts", "copies" } ],     // copies trong khoảng; bỏ môn có 0 câu lệnh và 0 copies; copies giảm dần
  "byPurpose": [ { "purpose", "name", "copies" } ],
  "topLessons": [ { "id", "title", "subject", "grade", "views", "copies", "ratingAvg", "ratingCount" } ],          // mọi bài, views giảm dần
  "recentFeedback": [ /* 6 outFeedback mới nhất */ ] }
```
SQL gợi ý: `SELECT date(created_at,'+7 hours') d, type, COUNT(*) n FROM events WHERE created_at >= ? GROUP BY d, type`, rồi điền 0 cho ngày trống. Chỉ số 7 ngày dùng `created_at >= now - 7 ngày`.

---

## 10. Bảo mật & giới hạn gói Cloudflare

### 10.1 Mật khẩu
- **PBKDF2-SHA256** qua `crypto.subtle.deriveBits`, salt 16 byte, khoá 32 byte. Lưu `pbkdf2$<iterations>$<salt_b64>$<hash_b64>` (cùng định dạng `server.js` → dữ liệu chuyển qua lại được). So sánh thời gian hằng. Số vòng từ `PBKDF2_ITERATIONS` (Workers giới hạn tối đa 100.000).
- **Giới hạn CPU:** Workers **Free chỉ 10 ms CPU/request**; PBKDF2 100.000 vòng vượt mức này nên đăng nhập / đăng ký có thể lỗi.
  - **Khuyên dùng:** gói **Workers Paid (tối thiểu 5 USD/tháng)**, giữ 100.000 vòng.
  - Nếu ở gói Free: hạ `PBKDF2_ITERATIONS` (10.000–20.000), đo bằng `wrangler tail` (`cpuTime`). Số vòng nằm trong chuỗi hash nên tăng sau được (rehash khi đăng nhập thành công).
- Không bao giờ trả `pass_hash`, token.

### 10.2 Chống lạm dụng
- Giới hạn tần suất (giống api-core.js): đăng nhập 10 / 10 phút / (IP + email); đăng ký 5 / giờ / IP; góp ý 30 / giờ / người; sự kiện 600 / giờ / visitorId. Vượt → **429** `{error:"Bạn thao tác quá nhanh, thử lại sau ít phút"}`. Làm bằng bảng `rate_limits` (đã có trong migration) hoặc binding Rate Limiting của Workers (kiểm tra cú pháp hiện hành trước khi thêm). Thêm một **WAF Rate limiting rule** cho `/api/login` ở dashboard (gói Free có 1 rule).
- IP lấy từ header `CF-Connecting-IP`.
- Kiểm tra quyền ở backend cho **mọi** route; frontend ẩn nút chỉ là phụ.
- Phản hồi do Worker tạo phải tự gắn header bảo mật (mục 4); `_headers` chỉ áp dụng cho file tĩnh.
- `POST /api/admin/reset` trả 404 khi `APP_ENV !== 'dev'`.
- Sổ tay nhắc giáo viên không nhập tên, ảnh học sinh; backend không cần lọc nội dung nhưng **không ghi log** nội dung kế hoạch / câu lệnh.

### 10.3 Cron (`scheduled`, 02:00 giờ VN)
Xoá `sessions` hết hạn, `rate_limits` cũ hơn 1 ngày. **Không xoá `events`** (số liệu nghiên cứu, giữ tối thiểu 12 tháng).

---

## 11. Dữ liệu ban đầu

### 11.1 Dev / staging (`APP_ENV=dev`)
- Middleware: nếu `kv_store` chưa có `handbook` → chạy `seedDemo(env)` một lần.
- `seedDemo` = làm đúng như `buildSeed()` trong api-core.js với `env='dev'`:
  - nội dung: `handbook`, `guide`, `checklist`, `settings`, 80 câu lệnh (`p01`–`p80`), 6 bài mẫu từ `seed-data.js`;
  - 8 tài khoản: `u_admin` (admin@sotayai.vn / **admin123**), `u_bientap` (editor, bientap@sotayai.vn), `u_lan`, `u_minh`, `u_hoa`, `u_tuan`, `u_mai` (teacher), `u_khoa` (teacher, **locked**); mật khẩu khác đều **123456**. Chỉ băm 2 mật khẩu rồi dùng lại hash;
  - hồ sơ lớp, kế hoạch (`pl_lan1`, `pl_lan2`, `pl_minh1`), bookmarks, 12 góp ý mẫu;
  - **sự kiện 21 ngày gần nhất** sinh bằng bộ sinh số ngẫu nhiên có hạt giống `mulberry32(2026)` (chép nguyên đoạn code; dùng `batch` chèn theo lô ~100 dòng). Thời gian dữ liệu mẫu tương đối so với lúc seed.
- `/api/admin/reset`: một `batch` xoá dữ liệu mọi bảng → `seedDemo`.
- Test phụ thuộc: `counts.prompts` = 80, `counts.lessons` = 6; câu lệnh đầu danh sách `p01`; tìm "chu vi hinh" ra `p07`; `toan-3-chu-vi` có 4 hoạt động và đã có đánh giá; cô Lan có 2 kế hoạch, 2 hồ sơ lớp; `u_khoa` bị khoá.

### 11.2 Production (`APP_ENV=production`)
- Khi `kv_store` trống: nạp **nội dung** (handbook, guide, checklist, settings, 80 câu lệnh, 6 bài mẫu) – **không** tạo tài khoản mẫu, góp ý, sự kiện.
- Khi bảng `users` trống: tạo admin đầu tiên từ secret `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`. Đăng nhập được rồi thì xoá 2 secret.
- Frontend: trong `public/js/config.js` đặt `DEMO: false` (ẩn tài khoản dùng thử) và `MOCK: false` (không bao giờ chuyển sang chế độ xem thử). Có thể thêm `public/.assetsignore` chứa `js/mock/` để không đưa lõi tham chiếu lên mạng (frontend không tải các file này khi `MOCK: false`).

---

## 12. Kế hoạch thực hiện (checklist cho Codex)

**Giai đoạn 0 – Khung**
- [ ] `npm i -D wrangler @cloudflare/workers-types typescript` + `npm i hono`; `tsconfig.json`; tạo `src/` như mục 3.3.
- [ ] `cp .dev.vars.example .dev.vars`; `npm run cf:db:migrate:local`; `npm run cf:dev` → http://localhost:8787 phục vụ `/`, `/admin` (assets) và `/api/meta`.
- [ ] Middleware lỗi → `{error}`, header bảo mật, xác thực Bearer, `seedDemo` khi dev & DB trống, 404/405 cho đường dẫn lạ.

**Giai đoạn 1 – Công khai & giáo viên**
- [ ] `/meta`, `/prompts`, `/prompts/:id`, `/lessons`, `/lessons/:id` (thống kê bằng GROUP BY, không N+1).
- [ ] `/events`, `/feedback` (upsert).
- [ ] Đăng ký, đăng nhập (PBKDF2), đăng xuất, `/me`, đổi mật khẩu.
- [ ] Bookmarks, hồ sơ lớp, kế hoạch.

**Giai đoạn 2 – Quản trị**
- [ ] `/admin/stats`, content (handbook, guide, checklist, settings), prompts, lessons, users, feedback, events, reset (chỉ dev).
- [ ] `node tools/api-test.mjs http://localhost:8787` → 60/60.

**Giai đoạn 3 – Triển khai & bảo mật**
- [ ] Rate limit, cron dọn dẹp, bootstrap admin production.
- [ ] Deploy staging lên `*.workers.dev`, chạy lại `api-test` với URL staging.
- [ ] `README-DEPLOY.md` theo mục 13.

**Định nghĩa hoàn thành**
1. `node tools/api-test.mjs http://localhost:8787` → **60 PASS, 0 FAIL** (`APP_ENV=dev`).
2. Mở http://localhost:8787/ và /admin: lật hết 7 chương, đăng nhập tài khoản dùng thử, lưu kế hoạch, sửa tên sản phẩm ở quản trị rồi thấy bìa đổi theo; không có lỗi console. Kiểm tra trên trình duyệt rằng thanh dưới cùng **không** hiện "Bản xem thử" (nghĩa là frontend đang dùng backend thật).
3. Không sửa `public/` (trừ `js/config.js`). Nếu buộc phải đổi hợp đồng API: sửa đồng bộ `public/js/*.js`, `public/js/mock/api-core.js`, `tools/api-test.mjs` và ghi rõ trong commit.
4. Không lộ `pass_hash`, token, email của người khác cho giáo viên, nội dung kế hoạch / hồ sơ lớp cho staff (đối chiếu 6.1, 7.1).
5. `wrangler deploy` chạy được với `wrangler.jsonc` (đã điền `database_id`).

---

## 13. Triển khai và trỏ tên miền

### 13.1 Chuẩn bị Cloudflare
1. Tạo tài khoản Cloudflare (nên dùng email của nhóm nghiên cứu), mời người phát triển làm thành viên (*Manage Account → Members*).
2. Chọn gói Workers: **Paid 5 USD/tháng** (khuyên dùng, mục 10.1) hoặc Free.
3. Trên máy: `npx wrangler login`.
4. `npx wrangler d1 create sotay-ai` → dán `database_id` vào `wrangler.jsonc`.
5. `npx wrangler secret put BOOTSTRAP_ADMIN_EMAIL` và `BOOTSTRAP_ADMIN_PASSWORD`.
6. Sửa `public/js/config.js`: `DEMO: false`, `MOCK: false`.
7. `npm run cf:db:migrate:remote` → `npm run cf:deploy` → kiểm tra tại `https://sotay-ai.<tài-khoản>.workers.dev`.

### 13.2 Gắn tên miền của khách
Custom Domain của Worker yêu cầu tên miền nằm trong Cloudflare (đổi nameserver):
1. Cloudflare Dashboard → **Add a domain** → nhập tên miền → gói **Free** → Cloudflare quét bản ghi DNS hiện có.
2. **Trước khi đổi:** nếu tên miền đang dùng email (Google Workspace, email của nhà đăng ký…), kiểm tra Cloudflare đã chép đủ bản ghi **MX, TXT (SPF/DKIM/DMARC)**.
3. Đăng nhập trang quản lý tên miền ở nhà đăng ký (Tenten, Mắt Bão, PA Việt Nam…) → thay nameserver bằng 2 nameserver Cloudflare cấp → chờ tên miền **Active** (thường 30 phút – vài giờ, có nơi tới 24–48 giờ; tên miền `.vn` đôi khi cần liên hệ hỗ trợ nhà đăng ký).
4. **Workers & Pages → sotay-ai → Settings → Domains & Routes → Add → Custom Domain** → `tenmien.vn` và `www.tenmien.vn` (hoặc bỏ comment `routes` trong `wrangler.jsonc` rồi deploy). SSL tự động.
5. **SSL/TLS → Edge Certificates → Always Use HTTPS: On.**
6. Đăng nhập `/admin` bằng tài khoản bootstrap, đổi mật khẩu, cập nhật **Thông tin sổ tay** (tên sản phẩm, nhóm, đơn vị, nơi ứng dụng).

### 13.3 Chi phí dự kiến
- Tên miền: theo năm ở nhà đăng ký.
- Cloudflare: DNS + SSL miễn phí; Workers Free 100.000 request/ngày; D1 Free 5 GB. Giai đoạn thử nghiệm nằm trong mức miễn phí, chỉ nên trả **Workers Paid 5 USD/tháng** vì giới hạn CPU khi băm mật khẩu.

---

## 14. Ngoài phạm vi (ghi nhận cho sau)
- Gọi API AI trực tiếp trong sổ tay (sinh kế hoạch ngay trên web) – cần khoá API, chi phí, kiểm duyệt.
- Quên mật khẩu qua email (Resend / Brevo…), đăng nhập Google.
- Xuất kế hoạch ra Word / PDF theo mẫu của trường.
- Upload video / tài liệu (cần R2); hiện video dùng đường dẫn ngoài (YouTube, Drive).
- Phân quyền theo trường / phòng giáo dục; khảo sát định kỳ trong sổ tay.
