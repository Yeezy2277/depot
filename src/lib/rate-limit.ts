import { tooManyRequests } from "./errors";
import { checkLimit, type RateLimit } from "./rate-limit-core";

export { checkLimit, type RateLimit } from "./rate-limit-core";

/** Throw a 429 when the key is over budget. Returns headers to attach on success. */
export function enforceLimit(key: string, opts: RateLimit): Record<string, string> {
  const { ok, remaining, resetAt } = checkLimit(key, opts);
  const headers = {
    "X-RateLimit-Limit": String(opts.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
  if (!ok) throw tooManyRequests();
  return headers;
}

/** Best-effort client key from proxy headers (Vercel sets x-forwarded-for). */
export function clientKey(req: Request, scope: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
