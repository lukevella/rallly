// Imported by the edge proxy: use Web Crypto (not node:crypto) and read
// process.env inside each function to keep `@/env` out of the bundle —
// t3-env validates eagerly on import and would crash server boot on any
// misconfigured server var. Shape is still validated in `@/env`.

export const MAINTENANCE_PATH = "/maintenance";
export const MAINTENANCE_BYPASS_COOKIE_NAME = "rallly-maintenance-bypass";
export const MAINTENANCE_BYPASS_COOKIE_MAX_AGE = 60 * 60 * 4;

export function isMaintenanceModeEnabled() {
  return process.env.MAINTENANCE_MODE === "true";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function hashBypassToken({ token }: { token: string }) {
  return sha256Hex(token);
}

export async function isValidBypassToken({ token }: { token: string }) {
  const secret = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (!secret) {
    return false;
  }
  // Compare digests so the comparison never operates on the raw secret
  return timingSafeEqualHex(await sha256Hex(token), await sha256Hex(secret));
}

export async function isValidBypassCookie({ value }: { value: string }) {
  const secret = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (!secret) {
    return false;
  }
  return timingSafeEqualHex(value, await sha256Hex(secret));
}
