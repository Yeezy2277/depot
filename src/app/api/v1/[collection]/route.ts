import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { handle, ok, notFound, badRequest } from "@/lib/http";
import { requireToken } from "@/lib/auth/guard";
import { corsHeadersFor, preflightHeaders } from "@/lib/cors";
import { clientKey, enforceLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ collection: string }> };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: preflightHeaders() });
}

/**
 * Public delivery API. Bearer `depot_…` token → the owning user's *published*
 * items in a collection. Read-only, CORS-open (see next.config.ts), rate-limited.
 *
 *   GET /api/v1/:collection?limit=20&offset=0
 */
export function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const { userId, allowedOrigins } = await requireToken(req);
    const cors = corsHeadersFor(req, allowedOrigins);
    const rl = enforceLimit(clientKey(req, "delivery"), { limit: 120, windowMs: 60_000 });

    const collection = await db.query.collections.findFirst({
      where: and(eq(collections.ownerId, userId), eq(collections.slug, (await params).collection)),
    });
    if (!collection) throw notFound("Collection not found");

    const url = new URL(req.url);
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 100_000);

    const rows = await db
      .select({
        id: items.id,
        slug: items.slug,
        data: items.data,
        publishedAt: items.publishedAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .where(and(eq(items.collectionId, collection.id), eq(items.status, "published")))
      .orderBy(desc(items.publishedAt))
      .limit(limit)
      .offset(offset);

    return ok(rows, { headers: { ...cors, ...rl } });
  });
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw badRequest(`Expected an integer, got "${raw}"`);
  return Math.min(max, Math.max(min, n));
}
