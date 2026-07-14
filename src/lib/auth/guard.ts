import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiTokens, users, type User } from "@/db/schema";
import { unauthorized } from "@/lib/http";
import { readSession } from "./session";
import { hashToken, looksLikeToken } from "./tokens";

/**
 * Two auth surfaces:
 *  - `requireUser()` — admin session (httpOnly JWT cookie) for the management API.
 *  - `requireToken()` — a `depot_…` bearer token for the public delivery API.
 */

export async function requireUser(): Promise<User> {
  const session = await readSession();
  if (!session) throw unauthorized();
  const row = await db.query.users.findFirst({ where: eq(users.id, session.sub) });
  if (!row) throw unauthorized("Session user no longer exists");
  return row;
}

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  // Also accept ?token= for quick browser testing of the delivery API.
  const url = new URL(req.url);
  return url.searchParams.get("token");
}

export async function requireToken(req: Request): Promise<{ userId: string }> {
  const token = bearer(req);
  if (!token || !looksLikeToken(token)) throw unauthorized("Provide a delivery token");

  const hash = await hashToken(token);
  const row = await db.query.apiTokens.findFirst({ where: eq(apiTokens.tokenHash, hash) });
  if (!row) throw unauthorized("Invalid delivery token");

  // Fire-and-forget last-used bookkeeping; never block the read on it.
  void db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, row.id))
    .catch(() => {});

  return { userId: row.userId };
}
