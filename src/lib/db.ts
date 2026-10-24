import type { Row } from '../types';
import { norm, iso } from './http';
const aliases = { description: 'desc', body: 'text', sort_order: 'order' };
const jsonFields = new Set(['subjects', 'grades', 'conditions', 'materials', 'activities', 'questions', 'adaptations', 'review', 'data', 'checks', 'value']);
export function decode(row: Row): Row {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [aliases[k] || k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), jsonFields.has(k) && typeof v === 'string' ? JSON.parse(v) : v]));
}
export async function all(db: D1Database, sql: string, values: unknown[] = []): Promise<Row[]> {
  return (await db.prepare(sql).bind(...values).all<Row>()).results.map(decode);
}
export async function first(db: D1Database, sql: string, values: unknown[] = []): Promise<Row | null> {
  const row = await db.prepare(sql).bind(...values).first<Row>();
  return row ? decode(row) : null;
}
export const count = async (db: D1Database, sql: string, values: unknown[] = []) => Number((await first(db, sql, values))?.n || 0);
export const run = (db: D1Database, sql: string, values: unknown[] = []) => db.prepare(sql).bind(...values).run();
function columns(row: Row) {
  const reverse = { desc: 'description', text: 'body', order: 'sort_order' };
  return Object.entries(row).map(([k, v]) => {
    const key = reverse[k] || k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    return [key, jsonFields.has(key) ? JSON.stringify(v) : typeof v === 'boolean' ? Number(v) : v ?? null] as const;
  });
}
export function insert(db: D1Database, table: string, row: Row, suffix = '', extra: unknown[] = []) {
  const cols = columns(row);
  return db.prepare(`INSERT INTO ${table} (${cols.map(([k]) => k).join(',')}) ${suffix ? 'SELECT' : 'VALUES ('} ${cols.map(() => '?').join(',')} ${suffix || ')'} `).bind(...cols.map(([, v]) => v), ...extra);
}
export function update(db: D1Database, table: string, row: Row, where: string, values: unknown[]) {
  const cols = columns(row);
  return db.prepare(`UPDATE ${table} SET ${cols.map(([k]) => `${k}=?`).join(',')} WHERE ${where}`).bind(...cols.map(([, v]) => v), ...values);
}
export function searchText(row: Row, kind: string) {
  return norm((kind === 'prompts' ? [row.title, row.desc, row.subject, 'lop ' + row.grade, row.howto, row.conditions.join(' '), row.text] : [row.title, row.summary, row.subject, 'lop ' + row.grade, row.conditions.join(' ')]).join(' '));
}
export const byId = (db: D1Database, table: string, id: string) => first(db, `SELECT * FROM ${table} WHERE id=?`, [id]);
export const putKv = (db: D1Database, key: string, value: unknown) => run(db, 'INSERT INTO kv_store(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at', [key, JSON.stringify(value), iso()]);
