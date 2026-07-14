import type { z } from "zod";
import { badRequest } from "./http";

/**
 * Parse an unknown body against a Zod schema, turning validation failures into
 * a 400 ApiError with field-level details instead of a thrown ZodError.
 */
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw badRequest("Validation failed", details);
  }
  return result.data;
}

/** Read + validate a JSON request body in one step. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  return parse(schema, json);
}
