import type { Context } from 'hono';
import type { Bindings, Row } from '../types';
import { need, MSG, iso, DAY } from './http';
import { isStaff } from './present';
import { first, insert } from './db';
import { sha256Hex, randomHex } from './crypto';
export function requireAuth(c: Context<Bindings>): Row { const u = c.get('me'); need(u, 401, MSG.auth); return u; }
export function requireStaff(c: Context<Bindings>) { const u = requireAuth(c); need(isStaff(u), 403, MSG.staff); return u; }
export function requireAdmin(c: Context<Bindings>) { const u = requireStaff(c); need(u.role === 'admin', 403, MSG.admin); return u; }
export async function currentUser(db: D1Database, token: string) {
  if (!token) return null;
  return first(db, 'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?', [await sha256Hex(token), iso(), 'active']);
}
export async function session(db: D1Database, u: Row) {
  const token = randomHex(48);
  await insert(db, 'sessions', { tokenHash: await sha256Hex(token), userId: u.id, createdAt: iso(), expiresAt: new Date(Date.now() + 30 * DAY).toISOString() }).run();
  return token;
}
