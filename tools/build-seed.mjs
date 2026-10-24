// Tạo public/js/mock/seed-data.js từ tools/seed-data.src.js + tools/content/*.json
// Chạy: node tools/build-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'tools/seed-data.src.js'), 'utf8');
const prompts = JSON.parse(readFileSync(join(root, 'tools/content/prompts.json'), 'utf8'));
const lessons = JSON.parse(readFileSync(join(root, 'tools/content/lessons.json'), 'utf8'));
const out = src
  .replace('/*__PROMPTS__*/', JSON.stringify(prompts, null, 1))
  .replace('/*__LESSONS__*/', JSON.stringify(lessons, null, 1));
writeFileSync(join(root, 'public/js/mock/seed-data.js'), out);
console.log(`seed-data.js: ${prompts.length} câu lệnh, ${lessons.length} bài mẫu, ${(out.length / 1024).toFixed(0)} KB`);
