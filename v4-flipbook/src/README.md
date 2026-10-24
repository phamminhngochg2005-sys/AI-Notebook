# Sổ tay AI — Mockup v4 (lật trang)

- `index.src.html`: giao diện, CSS và JS (tông sáng, lật trang 3D, trang quản trị demo — mật khẩu `admin`).
- `data/`: 80 câu lệnh và 6 kế hoạch bài dạy mẫu (lấy từ bản v3).
- `qr.json`: mã QR mở ChatGPT, Gemini, Copilot.
- Dựng lại: `python3 build.py` → tạo `../index.html` và `../so-tay-ai.html`.
- Xem thử: `python3 -m http.server 4178 --bind 127.0.0.1 --directory ..`
