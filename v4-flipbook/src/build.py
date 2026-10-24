"""Dựng bản mockup v4 (sổ tay lật trang) từ mã nguồn.
Chạy:  python3 build.py
Kết quả: ../index.html (bản đầy đủ, mở trực tiếp hoặc phục vụ qua Cloudflare tunnel)
         ../so-tay-ai.html (bản không có khung <html>, dùng để đăng Artifact)
Dữ liệu: data/prompt-data.js (80 câu lệnh), data/lesson-data.js (6 bài mẫu), qr.json (mã QR)."""
import re
from pathlib import Path
SRC = Path(__file__).resolve().parent
OUT = SRC.parent

def arr(path, var):
    t = (SRC / path).read_text(encoding='utf-8')
    m = re.search(r'window\.' + var + r'\s*=\s*', t)
    return t[m.end():].strip().rstrip(';')

s = (SRC / 'index.src.html').read_text(encoding='utf-8')
s = s.replace('/*__PROMPTS__*/', arr('data/prompt-data.js', 'PROMPT_LIBRARY'))
s = s.replace('/*__LESSONS__*/', arr('data/lesson-data.js', 'LESSON_LIBRARY'))
s = s.replace('/*__QR__*/', (SRC / 'qr.json').read_text(encoding='utf-8'))
(OUT / 'so-tay-ai.html').write_text(s, encoding='utf-8')

head = ('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n')
i = s.index('<header class="bar">')
std = head + s[:i] + '</head>\n<body>\n' + s[i:] + '\n</body>\n</html>\n'
std = std.replace('<style>\n', '<style>\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n[hidden]{display:none!important}\n', 1)
(OUT / 'index.html').write_text(std, encoding='utf-8')
print('Đã dựng:', OUT / 'index.html')
