import { Hono } from 'hono';
import type { Bindings } from '../types';
import { requireAdmin } from '../lib/auth';
import { need, iso, HOUR } from '../lib/http';
import { rid } from '../lib/crypto';
import { insert, all } from '../lib/db';
import { limit } from '../lib/ratelimit';
export const integrationRoutes = new Hono<Bindings>();
integrationRoutes.get('/admin/media', async c => {
  requireAdmin(c);
  return c.json({ items: await all(c.env.DB, 'SELECT * FROM media ORDER BY created_at DESC LIMIT 100') });
});
integrationRoutes.post('/admin/media', async c => {
  const u = requireAdmin(c), env = c.env, b = c.get('body');
  need(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET, 503, 'Chưa cấu hình Cloudinary');
  need(typeof b.file === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(b.file), 400, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP dạng data URL');
  need(b.file.length <= 1400000, 413, 'Ảnh vượt quá giới hạn 1 MB');
  await limit(env.DB, 'media:' + u.id, 30, HOUR);
  const timestamp = String(Math.floor(Date.now() / 1000)), publicId = 'sotay-ai/' + rid('media_');
  const input = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))), n => n.toString(16).padStart(2, '0')).join('');
  const form = new FormData();
  form.set('file', b.file); form.set('public_id', publicId); form.set('timestamp', timestamp); form.set('api_key', env.CLOUDINARY_API_KEY); form.set('signature', signature);
  let res: Response;
  try { res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) }); }
  catch { need(false, 502, 'Không kết nối được Cloudinary, vui lòng thử lại'); }
  need(res!.ok, 502, 'Không tải được ảnh lên Cloudinary, vui lòng thử lại');
  const data = await res!.json<{ public_id: string; secure_url: string; resource_type: string; format: string; bytes: number }>();
  need(data.secure_url?.startsWith('https://res.cloudinary.com/') && data.public_id === publicId, 502, 'Phản hồi Cloudinary không hợp lệ');
  const media = { id: rid('md_'), publicId: data.public_id, secureUrl: data.secure_url, resourceType: data.resource_type, format: data.format, bytes: data.bytes, userId: u.id, createdAt: iso() };
  await insert(env.DB, 'media', media).run();
  return c.json(media);
});
