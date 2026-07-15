import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { handle, ok, notFound } from "@/lib/http";
import { requireToken } from "@/lib/auth/guard";
import { corsHeadersFor, preflightHeaders } from "@/lib/cors";
import { clientKey, enforceLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ collection: string; slug: string }> };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: preflightHeaders() });
}

/** Public delivery of a single published item by slug. */
export function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const { userId, allowedOrigins } = await requireToken(req);
    const cors = corsHeadersFor(req, allowedOrigins);
    const rl = enforceLimit(clientKey(req, "delivery"), { limit: 120, windowMs: 60_000 });
    const { collection: collectionSlug, slug } = await params;

    const collection = await db.query.collections.findFirst({
      where: and(eq(collections.ownerId, userId), eq(collections.slug, collectionSlug)),
    });
    if (!collection) throw notFound("Collection not found");

    const item = await db.query.items.findFirst({
      where: and(
        eq(items.collectionId, collection.id),
        eq(items.slug, slug),
        eq(items.status, "published"),
      ),
      columns: { id: true, slug: true, data: true, publishedAt: true, updatedAt: true },
    });
    if (!item) throw notFound("Item not found");

    return ok(item, { headers: { ...cors, ...rl } });
  });
}
