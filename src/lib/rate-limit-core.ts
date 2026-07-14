/**
 * Pure fixed-window rate-limiting algorithm — no framework imports, so it can be
 * unit-tested under `node --test` in isolation. `rate-limit.ts` wraps this with
 * the HTTP concerns (throwing 429s, deriving the client key).
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimit = { limit: number; windowMs: number };

export function checkLimit(
  key: string,
  opts: RateLimit,
  now = Date.now(),
): { ok: boolean; remaining: number; resetAt: number } {
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }
  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  return { ok: existing.count <= opts.limit, remaining, resetAt: existing.resetAt };
}
