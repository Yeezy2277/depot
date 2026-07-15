import { forbidden } from "./errors";

/**
 * Per-token CORS for the delivery API.
 *
 * - Empty allowlist → open: `Access-Control-Allow-Origin: *` (the public-demo default).
 * - Non-empty allowlist → the browser `Origin` must be in the list; the response
 *   echoes that exact origin (credentials-safe) and a disallowed origin gets 403.
 * - No `Origin` header (curl / server-to-server) → allowed, but no wildcard is
 *   emitted since there's no browser CORS context to satisfy.
 */
export function corsHeadersFor(
  req: Request,
  allowedOrigins: string[],
): Record<string, string> {
  const origin = req.headers.get("origin");

  if (allowedOrigins.length === 0) {
    return { "Access-Control-Allow-Origin": "*", Vary: "Origin" };
  }
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      throw forbidden("This delivery token does not allow requests from this origin");
    }
    return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  return { Vary: "Origin" };
}

/** Preflight can't see the token, so it responds permissively; the GET enforces. */
export function preflightHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
