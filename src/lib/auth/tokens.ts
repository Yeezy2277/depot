/**
 * API delivery tokens.
 *
 * A token is `depot_<43 base64url chars>` — 32 bytes of entropy. Because it's
 * high-entropy we store a fast SHA-256 hash (not bcrypt): bcrypt is for
 * low-entropy human passwords; for random tokens SHA-256 is both safe and fast
 * enough to hash on every delivery request. The plaintext is shown once.
 */

const PREFIX = "depot_";

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return PREFIX + toBase64Url(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

/** Human-readable label stored alongside the hash, e.g. `depot_A1b2…`. */
export function tokenPrefix(token: string): string {
  return token.slice(0, PREFIX.length + 4) + "…";
}

export function looksLikeToken(value: string): boolean {
  return value.startsWith(PREFIX) && value.length > PREFIX.length + 20;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
