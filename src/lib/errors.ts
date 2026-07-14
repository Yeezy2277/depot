/**
 * Framework-free error types. Kept separate from `http.ts` (which imports
 * `next/server`) so pure modules — and their unit tests — can throw typed
 * errors without dragging Next into the graph.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = "error", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (m: string, details?: unknown) => new ApiError(400, m, "bad_request", details);
export const unauthorized = (m = "Authentication required") => new ApiError(401, m, "unauthorized");
export const forbidden = (m = "Forbidden") => new ApiError(403, m, "forbidden");
export const notFound = (m = "Not found") => new ApiError(404, m, "not_found");
export const conflict = (m: string) => new ApiError(409, m, "conflict");
export const tooManyRequests = (m = "Rate limit exceeded") => new ApiError(429, m, "rate_limited");
