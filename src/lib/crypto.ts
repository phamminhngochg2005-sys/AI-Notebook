const encoder = new TextEncoder();
const b64 = (a: Uint8Array) => btoa(String.fromCharCode(...a));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export const randomHex = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(Math.ceil(n / 2))), b => b.toString(16).padStart(2, '0')).join('').slice(0, n);
export const rid = (prefix: string) => prefix + randomHex(10);
export async function sha256Hex(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
}
export async function hashPassword(password: string, iterations: number) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(await derive(password, salt, iterations))}`;
}
export async function verifyPassword(password: string, stored: string) {
  try {
    const [kind, iter, salt, hash] = stored.split('$');
    const iterations = Number(iter);
    if (kind !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 1 || iterations > 100000) return false;
    const got = await derive(password, unb64(salt), iterations), want = unb64(hash);
    if (got.length !== want.length) return false;
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
    return diff === 0;
  } catch { return false; }
}
