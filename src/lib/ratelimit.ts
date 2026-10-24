import { need, MSG } from './http';
export async function limit(db: D1Database, key: string, max: number, windowMs: number) {
  const window = Math.floor(Date.now() / windowMs) * Math.floor(windowMs / 1000);
  const row = await db.prepare('INSERT INTO rate_limits(key,window_start,count) VALUES(?,?,1) ON CONFLICT(key,window_start) DO UPDATE SET count=count+1 RETURNING count').bind(key, window).first<{count: number}>();
  need(row && row.count <= max, 429, MSG.rate);
}
