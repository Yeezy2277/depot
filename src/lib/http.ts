import { NextResponse } from "next/server";
import { ApiError } from "./errors";

/**
 * JSON response helpers. Every endpoint answers the same envelope:
 *   success → { data }
 *   failure → { error: { message, code, details? } }
 * Error *types* live in ./errors so pure modules can throw them without Next.
 */
export * from "./errors";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function fail(error: ApiError): NextResponse {
  return NextResponse.json(
    { error: { message: error.message, code: error.code, details: error.details } },
    { status: error.status },
  );
}

/** Wrap a handler so thrown ApiErrors become clean JSON and anything else 500s. */
export function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((err) => {
    if (err instanceof ApiError) return fail(err);
    console.error("Unhandled route error:", err);
    return fail(new ApiError(500, "Internal server error", "internal"));
  });
}
