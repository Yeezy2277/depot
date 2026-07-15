/**
 * Deterministic, locale-independent date formatting.
 *
 * `toLocaleString()` renders differently on the server (UTC / en-US) and the
 * client (the visitor's locale + timezone), which trips React hydration in
 * SSR'd client components. Formatting from the ISO string (always UTC) keeps
 * the server and client markup identical.
 */
export function fmtInstant(d: Date | string | null | undefined): string {
  if (!d) return "never";
  return new Date(d).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}
