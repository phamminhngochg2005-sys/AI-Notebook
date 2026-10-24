/* Dữ liệu mặc định + dữ liệu mẫu của Sổ tay AI.
 * File này được tạo từ tools/seed-data.src.js bằng `node tools/build-seed.mjs` — sửa file nguồn rồi chạy lại.
 * Dùng chung cho: server.js (Node), public/js/mock/api-core.js (chế độ xem thử trên trình duyệt)
 * và là nguồn để Codex chuyển sang src/seed/data.ts (PLAN.md mục 11).
 * Thời gian trong dữ liệu mẫu là TƯƠNG ĐỐI: `daysAgo` / `hoursAgo` tính từ lúc nạp dữ liệu.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SOTAY_SEED = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Hằng số dùng chung (không sửa trong trang quản trị) ---------- */
  const meta = {
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học', 'Công nghệ', 'Hoạt động trải nghiệm', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Tiếng Anh'],
    grades: [1, 2, 3, 4, 5],
    purposes: [
      { id: 'draft', name: 'Xây dựng kế hoạch' },
      { id: 'adapt', name: 'Điều chỉnh theo thực tế' },
      { id: 'review', name: 'Kiểm tra, hoàn thiện' },
      { id: 'materials', name: 'Thiết kế học liệu' },
    ],
    langLevels: ['Phần lớn thành thạo', 'Một số em cần hỗ trợ', 'Nhiều em cần hỗ trợ'],
    equipment: ['Bảng, phấn', 'Sách giáo khoa', 'Tranh ảnh, thẻ chữ', 'Vật thật địa phương', 'Máy tính giáo viên', 'Máy chiếu / Tivi', 'Máy in', 'Loa', 'Internet ổn định'],
    classConditions: ['Lớp ghép', 'Phòng học hẹp', 'Có thể học ngoài sân', 'Điện không ổn định', 'Bàn ghế cố định'],
    durations: ['35', '40', '70'],
    planStatuses: [
      { id: 'draft', name: 'Bản nháp' },
      { id: 'reviewed', name: 'Đã rà soát' },
      { id: 'taught', name: 'Đã dạy' },
    ],
    roles: [
      { id: 'teacher', name: 'Giáo viên' },
      { id: 'editor', name: 'Biên tập viên' },
      { id: 'admin', name: 'Quản trị viên' },
    ],
    feedbackKinds: [
      { id: 'prompt', name: 'Câu lệnh' },
      { id: 'lesson', name: 'Bài dạy mẫu' },
      { id: 'general', name: 'Góp ý chung' },
    ],
    eventTypes: ['visit', 'prompt_view', 'prompt_copy', 'custom_copy', 'lesson_view', 'lesson_copy', 'tool_open'],
    visuals: [
      { id: 'ai-tools', name: 'Giao diện công cụ AI + mã QR' },
      { id: 'library', name: 'Thư viện câu lệnh' },
      { id: 'context', name: 'Điền thông tin thực tế' },
      { id: 'chat', name: 'Hội thoại hỏi tiếp AI' },
      { id: 'review', name: 'Giữ – Sửa – Bỏ' },
      { id: 'none', name: 'Không có minh họa' },
    ],
    provinces: ['Hà Giang', 'Cao Bằng', 'Lào Cai', 'Lai Châu', 'Điện Biên', 'Sơn La', 'Yên Bái', 'Tuyên Quang', 'Bắc Kạn', 'Lạng Sơn', 'Thái Nguyên', 'Phú Thọ', 'Hòa Bình', 'Thanh Hóa', 'Nghệ An', 'Quảng Trị', 'Thừa Thiên Huế', 'Quảng Nam', 'Quảng Ngãi', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Tỉnh/thành khác'],
  };

  /* ---------- Nội dung sổ tay (sửa trong trang quản trị) ---------- */
  const handbook = {
    productTitle: 'Sổ tay điện tử hướng dẫn sử dụng AI hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy',
    shortName: 'Sổ tay AI',
    researchTitle: 'Sổ tay hướng dẫn giáo viên Tiểu học ứng dụng AI trong xây dựng kế hoạch bài dạy phù hợp với điều kiện thực tế',
    groupName: 'Đang cập nhật',
    members: 'Đang cập nhật',
    advisor: 'Đang cập nhật',
    organization: 'Đang cập nhật',
    year: '2026',
    applicationArea: 'Trường Tiểu học vùng cao, miền núi',
    applicationDescription: 'Định hướng ứng dụng tại các trường Tiểu học ở địa bàn miền núi, vùng khó khăn, nơi còn hạn chế về thiết bị, học liệu, kết nối Internet và nhiều học sinh cần hỗ trợ tiếng Việt. Tên trường, địa bàn khảo sát và kết quả triển khai sẽ được bổ sung theo hồ sơ của nhóm nghiên cứu.',
    introduction: 'Đề tài xây dựng một sổ tay điện tử giúp giáo viên Tiểu học sử dụng AI để đề xuất ý tưởng, soạn bản dự thảo, điều chỉnh và hoàn thiện kế hoạch bài dạy theo điều kiện thực tế của lớp học. Giáo viên chủ động chọn câu lệnh, cung cấp bối cảnh lớp và tự kiểm tra nội dung trước khi sử dụng.',
    announcement: { enabled: true, text: 'Sổ tay đang trong giai đoạn thử nghiệm. Thầy cô dùng thử và gửi góp ý ở trang Phụ lục giúp nhóm nghiên cứu hoàn thiện sản phẩm.' },
  };

  const guide = {
    steps: [
      { id: 's1', title: 'Truy cập công cụ AI', summary: 'Mở ChatGPT, Gemini hoặc Copilot trên máy tính, điện thoại.', visual: 'ai-tools',
        points: ['Mở trình duyệt, gõ địa chỉ hoặc quét mã QR bằng camera điện thoại.', 'Đăng nhập bằng tài khoản cá nhân hoặc tài khoản do nhà trường cấp.', 'Nơi mạng yếu: soạn câu lệnh trước tại nhà hoặc ở điểm trường chính, lưu kết quả để dùng ngoại tuyến.'] },
      { id: 's2', title: 'Chọn và sử dụng câu lệnh', summary: 'Lọc thư viện theo môn, lớp, mục đích rồi sao chép.', visual: 'library',
        points: ['Vào Thư viện câu lệnh, gõ từ khóa hoặc chọn môn, lớp, mục đích sử dụng.', 'Bấm "Xem hướng dẫn" để đọc cách dùng và các ô cần điền.', 'Bấm "Sao chép câu lệnh", dán vào khung chat của công cụ AI.'] },
      { id: 's3', title: 'Cung cấp thông tin thực tế', summary: 'Điền vào [ngoặc vuông] hoặc dùng trang Cá nhân hóa.', visual: 'context',
        points: ['Thay mọi phần [trong ngoặc vuông] bằng thông tin thật: tên bài, yêu cầu cần đạt, sĩ số, học liệu.', 'Nói rõ điều lớp KHÔNG có: máy chiếu, máy in, Internet… để AI không đề xuất hoạt động không làm được.', 'Mô tả đặc điểm và năng lực tiếng Việt của học sinh, không ghi tên thật.'] },
      { id: 's4', title: 'Đọc kết quả và hỏi tiếp', summary: 'Yêu cầu AI sửa từng phần cho sát lớp học.', visual: 'chat',
        points: ['Đọc toàn bộ bản dự thảo, đánh dấu chỗ chưa phù hợp.', 'Hỏi tiếp từng ý ngắn gọn, ví dụ: "Rút hoạt động 2 còn 8 phút", "Thay video bằng vật thật".', 'Yêu cầu AI nêu rõ căn cứ khi có số liệu, kiến thức mới.'] },
      { id: 's5', title: 'Kiểm tra, chỉnh sửa và hoàn thiện', summary: 'Đối chiếu, tự giải lại, đưa vào mẫu của trường.', visual: 'review',
        points: ['Dùng danh mục kiểm tra ở chương Đối chiếu để rà soát.', 'Đánh dấu từng đề xuất của AI: Giữ, Sửa hoặc Bỏ, kèm lý do.', 'Lưu vào "Kế hoạch của tôi", chép bản hoàn chỉnh vào mẫu kế hoạch bài dạy của nhà trường; sau tiết dạy ghi phần điều chỉnh.'] },
    ],
    tools: [
      { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
      { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
      { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com' },
    ],
    video: { title: 'Từ câu lệnh đến kế hoạch bài dạy', url: '', duration: '04:30', note: 'Nhóm sẽ bổ sung video hướng dẫn.' },
  };

  const checklist = [
    { title: 'Yêu cầu cần đạt khớp chương trình', detail: 'Đối chiếu Chương trình GDPT 2018, sách giáo khoa đang dùng và kế hoạch của tổ chuyên môn.' },
    { title: 'Kiến thức, ví dụ và đáp án chính xác', detail: 'Tự giải lại bài tập, kiểm tra số liệu, chính tả; không tin lời AI tự xác nhận.' },
    { title: 'Tổng thời gian đúng tiết học', detail: 'Cộng phút của từng hoạt động; giữ thời gian dự phòng cho lớp đông hoặc lớp ghép.' },
    { title: 'Chỉ dùng thiết bị, học liệu lớp đang có', detail: 'Thay video, máy chiếu, phiếu in màu bằng bảng, vật thật, phiếu viết tay khi cần.' },
    { title: 'Ngôn ngữ phù hợp học sinh', detail: 'Câu chỉ dẫn ngắn, có khung câu, hình ảnh, làm mẫu cho học sinh cần hỗ trợ tiếng Việt.' },
    { title: 'Phù hợp văn hóa địa phương', detail: 'Ví dụ gần gũi với đời sống bản làng; không định kiến về giới, dân tộc, hoàn cảnh.' },
    { title: 'An toàn thông tin, đúng mẫu nhà trường', detail: 'Không nhập tên, ảnh học sinh vào AI; trình bày theo khung kế hoạch bài dạy của trường.' },
  ];

  const settings = {
    allowRegistration: true,
    allowAnonymousFeedback: true,
    maxPlansPerUser: 100,
    maxProfilesPerUser: 20,
  };

  /* ---------- 80 câu lệnh + 6 bài dạy mẫu (nội dung minh họa từ bản v3) ---------- */
  const prompts = /*__PROMPTS__*/;
  const lessons = /*__LESSONS__*/;

  /* ---------- Tài khoản mẫu (chỉ nạp ở môi trường dev / bản xem thử) ---------- */
  // password: 'admin123' cho u_admin, '123456' cho tất cả tài khoản còn lại.
  const users = [
    { id: 'u_admin', email: 'admin@sotayai.vn', name: 'Quản trị viên', school: 'Nhóm nghiên cứu', province: 'Hà Nội', subjects: [], grades: [], role: 'admin', status: 'active', daysAgo: 30 },
    { id: 'u_bientap', email: 'bientap@sotayai.vn', name: 'Trần Thu Hà', school: 'Nhóm nghiên cứu', province: 'Hà Nội', subjects: ['Tiếng Việt', 'Toán'], grades: [1, 2, 3, 4, 5], role: 'editor', status: 'active', daysAgo: 29 },
    { id: 'u_lan', email: 'lan.gv@sotayai.vn', name: 'Lò Thị Lan', school: 'Trường Tiểu học Hoa Ban (mẫu)', province: 'Điện Biên', subjects: ['Toán', 'Tiếng Việt', 'Tự nhiên và Xã hội'], grades: [3], role: 'teacher', status: 'active', daysAgo: 18 },
    { id: 'u_minh', email: 'minh.gv@sotayai.vn', name: 'Giàng A Minh', school: 'Trường PTDTBT Tiểu học Đá Trắng (mẫu)', province: 'Hà Giang', subjects: ['Tiếng Việt', 'Đạo đức'], grades: [1, 2], role: 'teacher', status: 'active', daysAgo: 14 },
    { id: 'u_hoa', email: 'hoa.gv@sotayai.vn', name: 'Nguyễn Thị Hoa', school: 'Trường Tiểu học Suối Mây (mẫu)', province: 'Lào Cai', subjects: ['Khoa học', 'Lịch sử và Địa lí'], grades: [4, 5], role: 'teacher', status: 'active', daysAgo: 11 },
    { id: 'u_tuan', email: 'tuan.gv@sotayai.vn', name: 'Vàng Văn Tuấn', school: 'Trường Tiểu học Nậm Ngà (mẫu)', province: 'Lai Châu', subjects: ['Toán', 'Tin học'], grades: [4, 5], role: 'teacher', status: 'active', daysAgo: 7 },
    { id: 'u_mai', email: 'mai.gv@sotayai.vn', name: 'Hà Thị Mai', school: 'Trường Tiểu học Bản Xôm (mẫu)', province: 'Sơn La', subjects: ['Hoạt động trải nghiệm'], grades: [2], role: 'teacher', status: 'active', daysAgo: 2 },
    { id: 'u_khoa', email: 'khoa.test@sotayai.vn', name: 'Tài khoản thử', school: 'Không rõ', province: 'Tỉnh/thành khác', subjects: [], grades: [], role: 'teacher', status: 'locked', lockReason: 'Thông tin đăng ký không đúng, tạo nhiều tài khoản thử.', daysAgo: 5 },
  ];

  const profiles = [
    { id: 'cp_lan3a', userId: 'u_lan', name: 'Lớp 3A – điểm trường chính', daysAgo: 16, data: {
      subject: 'Toán', grade: '3', title: 'Chu vi hình chữ nhật',
      goal: 'Nhận biết chu vi hình chữ nhật là độ dài đường bao; tính được chu vi khi biết chiều dài, chiều rộng cùng đơn vị đo.',
      traits: "Lớp có 18/24 em là học sinh dân tộc Thái, rụt rè khi nói trước lớp; 5 em đọc chậm; các em hiểu nhanh khi được thao tác với đồ vật thật.",
      lang: 'Nhiều em cần hỗ trợ', home: 'Tiếng Thái', equip: ['Bảng, phấn', 'Sách giáo khoa', 'Vật thật địa phương', 'Máy tính giáo viên'],
      equipNote: 'Mỗi nhóm có 1 thước kẻ; có bìa cát-tông cũ để cắt hình chữ nhật.', size: '24', conds: ['Phòng học hẹp', 'Điện không ổn định'], condNote: '', dur: '35', purpose: 'draft', source: '', base: 'p07' } },
    { id: 'cp_lan3b', userId: 'u_lan', name: 'Lớp ghép 2+3 – điểm bản Co Mạ', daysAgo: 9, data: {
      subject: 'Tiếng Việt', grade: '2', title: 'Nói về một đồ vật quen thuộc',
      goal: '', traits: 'Lớp ghép 2 trình độ, 11 học sinh; phần lớn chưa nói câu dài bằng tiếng Việt; thích hát, vẽ.',
      lang: 'Nhiều em cần hỗ trợ', home: 'Tiếng Thái', equip: ['Bảng, phấn', 'Tranh ảnh, thẻ chữ', 'Vật thật địa phương'],
      equipNote: 'Không có điện lưới ổn định; có gùi, ống tre, khăn piêu làm vật thật.', size: '11', conds: ['Lớp ghép', 'Điện không ổn định'], condNote: 'Giáo viên dạy cùng lúc 2 nhóm lớp.', dur: '35', purpose: 'adapt', source: '', base: null } },
    { id: 'cp_minh1', userId: 'u_minh', name: 'Lớp 1B', daysAgo: 12, data: {
      subject: 'Tiếng Việt', grade: '1', title: 'Vần an, at', goal: '', traits: '26 học sinh, 100% dân tộc Mông; nhiều em mới học tiếng Việt.',
      lang: 'Nhiều em cần hỗ trợ', home: "Tiếng H'Mông", equip: ['Bảng, phấn', 'Sách giáo khoa', 'Tranh ảnh, thẻ chữ'], equipNote: '', size: '26', conds: ['Bàn ghế cố định'], condNote: '', dur: '35', purpose: 'draft', source: '', base: 'p16' } },
  ];

  const plans = [
    { id: 'pl_lan1', userId: 'u_lan', title: 'Toán 3 – Chu vi hình chữ nhật (lớp 3A)', subject: 'Toán', grade: 3, basePromptId: 'p07', status: 'reviewed', daysAgo: 15, updatedDaysAgo: 13,
      checks: [true, true, true, true, true, false, true],
      promptText: 'Bạn là chuyên gia hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy theo Chương trình GDPT 2018 và khung kế hoạch bài dạy tham khảo tại Phụ lục 3, Công văn 2345/BGDĐT-GDTH.\n\nNHIỆM VỤ: Soạn bản dự thảo kế hoạch bài dạy cho bài "Chu vi hình chữ nhật", môn Toán, lớp 3, thời lượng 35 phút.\n…',
      aiResult: 'I. YÊU CẦU CẦN ĐẠT\n- Nhận biết chu vi hình chữ nhật là độ dài đường bao.\n- Tính được chu vi khi biết chiều dài, chiều rộng cùng đơn vị đo.\n\nII. ĐỒ DÙNG DẠY HỌC\n- Bảng, phấn; tấm bìa hình chữ nhật 8 cm × 5 cm cho mỗi nhóm; thước kẻ.\n\nIII. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU\n1. Khởi động (5 phút): …\n2. Khám phá (10 phút): …\n3. Luyện tập (15 phút): …\n4. Vận dụng (5 phút): …\n\nIV. ĐIỀU CHỈNH SAU BÀI DẠY\n…',
      note: 'Bỏ đề xuất chiếu video của AI vì lớp không có máy chiếu. Thêm khung câu "Em cộng … vì …" cho nhóm cần hỗ trợ tiếng Việt. Cần hỏi tổ chuyên môn về ví dụ văn hóa địa phương.' },
    { id: 'pl_lan2', userId: 'u_lan', title: 'Tiếng Việt 2 – Nói về đồ vật quen thuộc (lớp ghép)', subject: 'Tiếng Việt', grade: 2, basePromptId: null, status: 'draft', daysAgo: 8, updatedDaysAgo: 8,
      checks: [false, false, false, false, false, false, false],
      promptText: 'Bạn là chuyên gia hỗ trợ giáo viên Tiểu học…\n\nNHIỆM VỤ: Điều chỉnh kế hoạch bài dạy dưới đây cho phù hợp điều kiện thực tế cho bài "Nói về một đồ vật quen thuộc", môn Tiếng Việt, lớp 2, thời lượng 35 phút.\n…',
      aiResult: '', note: '' },
    { id: 'pl_minh1', userId: 'u_minh', title: 'Tiếng Việt 1 – Vần an, at', subject: 'Tiếng Việt', grade: 1, basePromptId: 'p16', status: 'taught', daysAgo: 11, updatedDaysAgo: 4,
      checks: [true, true, true, true, true, true, true],
      promptText: 'Bạn là chuyên gia hỗ trợ giáo viên Tiểu học…\n\nNHIỆM VỤ: Soạn bản dự thảo kế hoạch bài dạy cho bài "Vần an, at", môn Tiếng Việt, lớp 1, thời lượng 35 phút.\n…',
      aiResult: 'I. YÊU CẦU CẦN ĐẠT …', note: 'Sau tiết dạy: hoạt động ghép vần bằng thẻ chữ mất 12 phút thay vì 8 phút; lần sau chuẩn bị sẵn thẻ cho từng bàn.' },
  ];

  const bookmarks = [
    { userId: 'u_lan', kind: 'prompt', targetId: 'p07', daysAgo: 16 },
    { userId: 'u_lan', kind: 'prompt', targetId: 'p08', daysAgo: 15 },
    { userId: 'u_lan', kind: 'prompt', targetId: 'p19', daysAgo: 10 },
    { userId: 'u_lan', kind: 'lesson', targetId: 'toan-3-chu-vi', daysAgo: 15 },
    { userId: 'u_minh', kind: 'prompt', targetId: 'p16', daysAgo: 12 },
    { userId: 'u_minh', kind: 'prompt', targetId: 'p17', daysAgo: 12 },
    { userId: 'u_hoa', kind: 'prompt', targetId: 'p51', daysAgo: 9 },
  ];

  // rating: câu lệnh 1 (hữu ích) | -1 (chưa hữu ích); bài mẫu 1–5; góp ý chung 1–5 hoặc null
  const feedback = [
    { userId: 'u_lan', kind: 'prompt', targetId: 'p07', rating: 1, comment: 'Câu lệnh rõ ràng, AI trả về đúng khung 4 phần. Phần hỏi lại khi thiếu dữ kiện rất hữu ích.', daysAgo: 14, status: 'handled', adminNote: 'Đã ghi nhận vào báo cáo tuần 2.' },
    { userId: 'u_lan', kind: 'lesson', targetId: 'toan-3-chu-vi', rating: 5, comment: 'Dạy được ngay với bìa cát-tông, học sinh rất hứng thú.', daysAgo: 12, status: 'handled', adminNote: '' },
    { userId: 'u_minh', kind: 'prompt', targetId: 'p16', rating: 1, comment: 'Nên thêm gợi ý dùng tiếng mẹ đẻ để giải nghĩa từ khó.', daysAgo: 10, status: 'new', adminNote: '' },
    { userId: 'u_minh', kind: 'prompt', targetId: 'p17', rating: -1, comment: 'AI vẫn đề xuất chiếu video dù đã ghi không có máy chiếu.', daysAgo: 9, status: 'new', adminNote: '' },
    { userId: 'u_hoa', kind: 'prompt', targetId: 'p51', rating: 1, comment: '', daysAgo: 8, status: 'new', adminNote: '' },
    { userId: 'u_hoa', kind: 'lesson', targetId: 'tnxh-3-cay-quanh-truong', rating: 4, comment: 'Phiếu học tập hay, nhưng mùa mưa khó đưa học sinh ra vườn.', daysAgo: 7, status: 'new', adminNote: '' },
    { userId: 'u_tuan', kind: 'general', targetId: null, rating: 4, comment: 'Mong nhóm bổ sung thêm câu lệnh cho môn Tin học lớp 3 và hướng dẫn dùng AI trên điện thoại khi mạng yếu.', daysAgo: 5, status: 'new', adminNote: '' },
    { userId: 'u_tuan', kind: 'lesson', targetId: 'toan-4-phan-so', rating: 5, comment: 'Băng giấy rất dễ chuẩn bị.', daysAgo: 4, status: 'new', adminNote: '' },
    { userId: null, visitorId: 'v_seed01', kind: 'general', targetId: null, rating: 5, comment: 'Giao diện dễ dùng, chữ to rõ. Rất cần thêm video hướng dẫn từng bước.', daysAgo: 6, status: 'new', adminNote: '' },
    { userId: null, visitorId: 'v_seed02', kind: 'prompt', targetId: 'p01', rating: 1, comment: '', daysAgo: 3, status: 'new', adminNote: '' },
    { userId: null, visitorId: 'v_seed03', kind: 'prompt', targetId: 'p22', rating: -1, comment: 'Câu lệnh hơi dài, nên có bản rút gọn để dán trên điện thoại.', daysAgo: 2, status: 'new', adminNote: '' },
    { userId: null, visitorId: 'v_seed04', kind: 'lesson', targetId: 'dao-duc-2-giup-ban', rating: 4, comment: '', daysAgo: 1, status: 'new', adminNote: '' },
  ];

  return { version: 3, meta, handbook, guide, checklist, settings, prompts, lessons, users, profiles, plans, bookmarks, feedback };
});
