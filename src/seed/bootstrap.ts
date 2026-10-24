import type { Env, Row } from '../types';
import { buildSeed } from './run';
import { hashPassword, randomHex } from '../lib/crypto';
import { first, insert, searchText } from '../lib/db';
import { iso } from '../lib/http';
export const iterations = (env: Env) => Math.min(100000, Math.max(10000, Number(env.PBKDF2_ITERATIONS) || 100000));
export async function seedDatabase(env: Env, reset = false) {
  const dev = env.APP_ENV === 'dev';
  const passwords = new Map<string, string>();
  const initialPassword = env.BOOTSTRAP_ADMIN_PASSWORD;
  for (const password of dev ? ['admin123', '123456'] : initialPassword ? [initialPassword] : []) passwords.set(password, await hashPassword(password, iterations(env)));
  const seed: Row = buildSeed({ env: dev ? 'dev' : 'production', bootstrap: { email: env.BOOTSTRAP_ADMIN_EMAIL, password: initialPassword }, randomHex, hashPassword: p => passwords.get(p) });
  const statements: D1PreparedStatement[] = [];
  if (reset) for (const table of ['media', 'sessions', 'bookmarks', 'profiles', 'plans', 'feedback', 'events', 'users', 'prompts', 'lessons', 'kv_store', 'rate_limits']) statements.push(env.DB.prepare(`DELETE FROM ${table}`));
  for (const [key, value] of Object.entries(seed.kv)) statements.push(insert(env.DB, 'kv_store', { key, value, updatedAt: iso() }));
  for (const table of ['users', 'prompts', 'lessons', 'profiles', 'plans', 'bookmarks', 'feedback', 'events']) {
    for (const row of seed[table]) statements.push(insert(env.DB, table, ['prompts', 'lessons'].includes(table) ? { ...row, searchText: searchText(row, table) } : row));
  }
  // One transaction keeps partial seed data invisible to concurrent first requests.
  await env.DB.batch(statements);
}
export async function bootstrap(env: Env) {
  if (!await first(env.DB, 'SELECT key FROM kv_store WHERE key=?', ['handbook'])) {
    try { await seedDatabase(env); }
    catch (error) { if (!await first(env.DB, 'SELECT key FROM kv_store WHERE key=?', ['handbook'])) throw error; }
  }
  if (env.APP_ENV !== 'dev' && env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_PASSWORD && !await first(env.DB, 'SELECT id FROM users LIMIT 1')) {
    const hash = await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD, iterations(env));
    await insert(env.DB, 'users', { id: 'u_' + randomHex(10), email: env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(), name: 'Quản trị viên', school: 'Nhóm nghiên cứu', province: 'Tỉnh/thành khác', subjects: [], grades: [], role: 'admin', status: 'active', lockReason: '', passHash: hash, createdAt: iso(), lastActiveAt: iso() }, 'WHERE NOT EXISTS (SELECT 1 FROM users)').run();
  }
}
