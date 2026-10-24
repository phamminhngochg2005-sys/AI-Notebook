# Sổ tay điện tử AI — Mockup v3

Tên sản phẩm: **Sổ tay điện tử hướng dẫn sử dụng AI hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy**.

Bản v3 cập nhật theo góp ý giảng viên: giao diện công nghệ AI màu tím/cyan, trang bìa có sách mở, giới thiệu đề tài và định hướng ứng dụng. Nhóm nghiên cứu, đơn vị, tên đề tài đăng ký và trường/địa bàn cụ thể đang chờ thông tin; giao diện ghi rõ Đang cập nhật.

## Nội dung và chức năng

- Trang bìa và giới thiệu đề tài.
- 80 câu lệnh mẫu có từ khóa, bộ lọc môn/lớp/mục đích, 12 mẫu/trang, hướng dẫn, sao chép, lưu trên trình duyệt.
- Cá nhân hóa theo môn, lớp, bài, yêu cầu cần đạt, đặc điểm học sinh, năng lực tiếng Việt, học liệu, sĩ số, điều kiện lớp và thời lượng.
- Hướng dẫn 5 bước với minh họa thao tác.
- 6 bài dạy tham khảo, mỗi bài35phút; hoạt động GV/HS, sản phẩm quan sát, phiếu, câu hỏi, điều chỉnh vùngcao, ràsoát và ghi chú sau dạy. TảiTXT hoặc mở bảnin để lưuPDF.
- 7 nội dung kiểm tra trước khi dạy; lưu tại trình duyệt.
- Hướng dẫn minh họa 6trang, PDF và Word đồng nhất về nội dung.

9 môn trong thư viện: Toán15, TiếngViệt15, TNXH9, Đạođức10, Khoa học6, Lịch sử và Địa lí6, HĐTN10, Công nghệ4, Tin học5. Các khối lớp trong dữ liệu được chọn theo môn.

Đây là nội dung minh họa cần rà soát chuyên môn. Chưa kết nối API AI; giáo viên dùng câu lệnh với công cụ AI đã lựa chọn. Không có tài khoản hoặc đồng bộ máy chủ. Dữ liệu bối cảnh, mục đã lưu, ghi chú và checklist chỉ lưu trên trình duyệt hiện tại.

## Chạy và xuất file gửi khách

`python3 -m http.server 4178 --bind 127.0.0.1 --directory dist`

`python3 export_mockup.py`

File tự chứa: `output/website-so-tay-ai/So_Tay_Dien_Tu_AI_Mockup_V3.html` — nhúng dữ liệu, CSS, JS, font, SVG, PDF và DOCX. Mở bằng trình duyệt, không cần mạng để đọc nội dung. Các liên kết tới công cụAI/nguồn chuyên môn cần kết nốiInternet.

Cloudflare Tunnel hiện trỏ tới dist qua 127.0.0.1:4178. Trạng thái tiến trình và URL được lưu ngoài checkout tại `output/website-so-tay-ai/cloudflare/state.json`. Đây là linktạm phụthuộc máy và tiến trình tunnel đangchạy.

## Nguồn và tài nguyên

- Công văn2345/BGDĐT-GDTH ngày07/06/2021, Phụ lục3: https://thnguyentruongto.hcm.edu.vn/van-ban-cac-cap/cong-van-2345bgddt-gdth-ngay-07-thang-6-nam-2021-cua-bo-giao-duc-va-dao-tao/ct/80817/883672
- PDFscan văn bản: https://fileth.hcm.shieldix.app/Data/hcmedu/thnguyentruongto/2021_8/cong-van-2345bgddtgdth_68202115020.pdf
- Khung tham khảo: yêu cầu cần đạt; đồdùngdạyhọc; hoạtđộngdạyhọc chủyếu; điều chỉnh sau bài dạy (nếu có). Phương án điều chỉnh vùng cao chuẩn bị trước được trình bày riêng.
- SVG sáchAI nguyên bản. Font BeVietnamPro/BricolageGrotesque lưu cục bộ kèm giấy phép SIL trong assets/fonts.

Các bản tài liệu, ảnh và ZIPv2 đã gửi trước đây được giữ tại thưmụcoutput; phiênbảnđangphụcvụ làv3.
