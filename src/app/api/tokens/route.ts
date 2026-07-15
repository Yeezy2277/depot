import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { handle, ok } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { createTokenSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth/guard";
import { generateToken, hashToken, tokenPrefix } from "@/lib/auth/tokens";

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    const rows = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        allowedOrigins: apiTokens.allowedOrigins,
        lastUsedAt: apiTokens.lastUsedAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, user.id))
      .orderBy(desc(apiTokens.createdAt));
    return ok(rows);
  });
}

export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await parseBody(req, createTokenSchema);

    const token = generateToken();
    // Normalize origins (drop any trailing slash so they match the Origin header).
    const origins = (body.origins ?? []).map((o) => o.replace(/\/+$/, ""));

    const [row] = await db
      .insert(apiTokens)
      .values({
        userId: user.id,
        name: body.name,
        tokenHash: await hashToken(token),
        prefix: tokenPrefix(token),
        allowedOrigins: origins,
      })
      .returning({
        id: apiTokens.id,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        allowedOrigins: apiTokens.allowedOrigins,
      });

    // `token` is returned exactly once — it is never recoverable afterwards.
    return ok({ ...row, token }, { status: 201 });
  });
}
