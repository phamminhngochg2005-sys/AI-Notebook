export async function cleanup(db: D1Database) {
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(new Date().toISOString()),
    db.prepare('DELETE FROM rate_limits WHERE window_start<?').bind(Math.floor(Date.now() / 1000) - 86400)
  ]);
}
export async function maintainOnVisit(db: D1Database) {
  const day = Math.floor(Date.now() / 86400000) * 86400;
  const claim = await db.prepare("INSERT OR IGNORE INTO rate_limits(key,window_start,count) VALUES('maintenance',?,1)").bind(day).run();
  // shortcut: account cron slots are full; run daily on visits until a cron slot is available.
  if (claim.meta.changes) await cleanup(db);
}
