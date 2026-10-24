#!/bin/bash
# Bấm đúp để chạy Sổ tay AI trên macOS (server mẫu Node, dữ liệu lưu ở data/db.json)
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Chưa có Node.js. Cài tại https://nodejs.org rồi chạy lại."; read -r; exit 1
fi
(sleep 1.5; open "http://localhost:${PORT:-8080}") &
node server.js
