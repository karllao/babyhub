// Web Crypto API only (no node:crypto) so this file is safe to import
// from Edge middleware as well as Node API routes.

export const SESSION_COOKIE = "bh_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 8) {
    throw new Error("SESSION_SECRET 未配置或过短,请在 .env.local 中设置");
  }
  return s;
}

const encoder = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  // 返回 Uint8Array 而非裸 ArrayBuffer:Next.js Edge runtime 的 SubtleCrypto
  // 对 signature 参数做严格 instanceof 检查,跨 isolate 边界构造的裸 ArrayBuffer
  // 会被拒(报 "3rd argument is not instance of ArrayBuffer, Buffer, TypedArray, or DataView"),
  // TypedArray 则始终被识别为 BufferSource。
  const len = hex.length % 2 === 0 ? hex.length / 2 : 0;
  const out = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    const b = parseInt(hex.substr(i * 2, 2), 16);
    if (isNaN(b)) return new Uint8Array(new ArrayBuffer(0));
    out[i] = b;
  }
  return out;
}

export async function sign(payload: string): Promise<string> {
  const key = await hmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(sigBuf)}`;
}

export async function verify(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = fromHex(token.slice(idx + 1));
  if (!sig.byteLength) return false;
  try {
    const key = await hmacKey();
    return await crypto.subtle.verify("HMAC", key, sig, encoder.encode(payload));
  } catch (e) {
    // 唯一会在此抛出的情形是 SESSION_SECRET 缺失或过短(见 secret()),
    // 若吞掉将导致登录后被无声地踢回登录页 —— 打日志方便排查。
    console.error("[babyhub] auth.verify error:", (e as Error).message);
    return false;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function checkAccessCode(code: string): boolean {
  const expected = process.env.ACCESS_CODE || "";
  if (!expected) return false;
  return timingSafeEqual(encoder.encode(code), encoder.encode(expected));
}
