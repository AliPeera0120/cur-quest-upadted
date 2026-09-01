/* ============================================================================
   Password hashing and id generation for the local backend.

   Even though the local backend never leaves the browser, passwords are
   salted and stretched with PBKDF2-SHA-256 rather than stored as plain text.
   Two reasons: a shared classroom Chromebook is a real threat model, and the
   code path here should be the same shape as the one that will run against a
   real auth provider, so nobody later "ports" a plain-text habit to the server.
   ========================================================================= */

const enc = new TextEncoder();
const ITERATIONS = 150_000;

const subtle = () => {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error('This browser does not support the Web Crypto API.');
  return c.subtle;
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function randomId(prefix = '') {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const hex = toHex(bytes);
  return prefix ? `${prefix}_${hex}` : hex;
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** Five-digit join code, e.g. CQ-48291. */
export function randomJoinCode() {
  const bytes = new Uint32Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return `CQ-${String(bytes[0] % 100000).padStart(5, '0')}`;
}

/**
 * A human-readable recovery phrase. Teachers get one at sign-up so a
 * forgotten password is recoverable without us storing an email we don't need
 * and without a mail server the project doesn't have.
 */
const WORDS = [
  'atom', 'beaker', 'circuit', 'delta', 'ember', 'fossil', 'gravity', 'helix',
  'ion', 'joule', 'kelvin', 'lever', 'magnet', 'nucleus', 'orbit', 'prism',
  'quartz', 'rotor', 'solar', 'torque', 'umbra', 'vector', 'watt', 'xenon',
  'yield', 'zenith', 'basalt', 'comet', 'dynamo', 'enzyme', 'fusion', 'gear',
];
export function recoveryPhrase(words = 4) {
  const idx = new Uint32Array(words);
  globalThis.crypto.getRandomValues(idx);
  return [...idx].map((n) => WORDS[n % WORDS.length]).join('-');
}

async function derive(password, salt) {
  const key = await subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key, 256,
  );
  return toHex(bits);
}

export async function hashSecret(password, salt = randomSalt()) {
  return { salt, hash: await derive(password, salt), iterations: ITERATIONS };
}

export async function verifySecret(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const candidate = await derive(password, record.salt);
  /* Constant-time-ish comparison. */
  if (candidate.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) diff |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

/** Password policy. Kept gentle for children, still refuses the obvious. */
const COMMON = new Set([
  'password', 'password1', '12345678', '123456789', 'qwerty123', 'iloveyou',
  'letmein1', 'sunshine', 'football', 'baseball', 'abc12345', 'princess',
]);

export function checkPassword(pw, { min = 8 } = {}) {
  if (!pw || pw.length < min) return `Use at least ${min} characters.`;
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common. Try something only you would think of.';
  if (/^(.)\1+$/.test(pw)) return 'Try mixing in some different characters.';
  return null;
}

export function checkUsername(name) {
  const v = (name || '').trim();
  if (v.length < 3) return 'Usernames need at least 3 characters.';
  if (v.length > 24) return 'Usernames can be at most 24 characters.';
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) return 'Use letters, numbers, dots, dashes or underscores.';
  return null;
}
