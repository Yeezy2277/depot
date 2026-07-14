import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { handle, ok, notFound, unauthorized, conflict } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { updateItemSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth/guard";

type Ctx = { params: Promise<{ id: string }> };

/** Load an item and confirm the requesting user owns its collection. */
async function ownedItem(userId: string, itemId: string) {
  const row = await db.query.items.findFirst({
    where: eq(items.id, itemId),
    with: { collection: true },
  });
  if (!row) throw notFound("Item not found");
  if (row.collection.ownerId !== userId) throw unauthorized();
  return row;
}

export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    return ok(await ownedItem(user.id, (await params).id));
  });
}

export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const item = await ownedItem(user.id, (await params).id);
    const body = await parseBody(req, updateItemSchema);

    if (body.slug && body.slug !== item.slug) {
      const clash = await db.query.items.findFirst({
        where: and(eq(items.collectionId, item.collectionId), eq(items.slug, body.slug)),
      });
      if (clash) throw conflict(`An item with slug "${body.slug}" already exists`);
    }

    // Publish transition drives publishedAt.
    let publishedAt = item.publishedAt;
    if (body.status === "published" && item.status !== "published") publishedAt = new Date();
    if (body.status === "draft") publishedAt = null;

    const [row] = await db
      .update(items)
      .set({
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.data !== undefined ? { data: body.data } : {}),
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(items.id, item.id))
      .returning();
    return ok(row);
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const item = await ownedItem(user.id, (await params).id);
    await db.delete(items).where(eq(items.id, item.id));
    return ok({ deleted: item.id });
  });
}
