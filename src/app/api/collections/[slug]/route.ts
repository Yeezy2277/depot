import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { handle, ok } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { updateCollectionSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth/guard";
import { ownedCollection } from "@/lib/data";

type Ctx = { params: Promise<{ slug: string }> };

export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { slug } = await params;
    return ok(await ownedCollection(user.id, slug));
  });
}

export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { slug } = await params;
    const collection = await ownedCollection(user.id, slug);
    const body = await parseBody(req, updateCollectionSchema);

    const [row] = await db
      .update(collections)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      })
      .where(eq(collections.id, collection.id))
      .returning();
    return ok(row);
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { slug } = await params;
    const collection = await ownedCollection(user.id, slug);
    await db.delete(collections).where(eq(collections.id, collection.id));
    return ok({ deleted: collection.id });
  });
}
