import type { Row } from '../types';
export const isStaff = (u: Row | null) => !!u && ['editor', 'admin'].includes(u.role);
export const mini = (u: Row | null) => u ? { id: u.id, name: u.name, role: u.role, school: u.school } : null;
export function pubUser(u: Row, viewer: Row | null) {
  const o: Row = { id: u.id, name: u.name, school: u.school, province: u.province, subjects: u.subjects, grades: u.grades, role: u.role, status: u.status, joinedAt: u.createdAt };
  if (viewer && (viewer.id === u.id || isStaff(viewer))) { o.email = u.email; o.lastActiveAt = u.lastActiveAt; }
  if (isStaff(viewer)) o.lockReason = u.lockReason || '';
  return o;
}
export const outProfile = (p: Row) => ({ id: p.id, name: p.name, data: p.data, createdAt: p.createdAt, updatedAt: p.updatedAt });
export function outPlan(p: Row, full = false) {
  const o: Row = { id: p.id, title: p.title, subject: p.subject, grade: p.grade, basePromptId: p.basePromptId, status: p.status, checks: p.checks, checked: p.checks.filter(Boolean).length, hasResult: !!p.aiResult, createdAt: p.createdAt, updatedAt: p.updatedAt };
  if (full) Object.assign(o, { promptText: p.promptText, aiResult: p.aiResult, note: p.note });
  return o;
}
