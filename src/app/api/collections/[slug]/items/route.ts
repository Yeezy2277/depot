import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { handle, ok, conflict, badRequest } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { createItemSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth/guard";
import { ownedCollection } from "@/lib/data";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ slug: string }> };

export function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const collection = await ownedCollection(user.id, (await params).slug);

    const statusParam = new URL(req.url).searchParams.get("status");
    if (statusParam && statusParam !== "draft" && statusParam !== "published") {
      throw badRequest("status must be 'draft' or 'published'");
    }
    const status = statusParam as "draft" | "published" | null;

    const where = status
      ? and(eq(items.collectionId, collection.id), eq(items.status, status))
      : eq(items.collectionId, collection.id);

    const rows = await db.select().from(items).where(where).orderBy(desc(items.updatedAt));
    return ok(rows);
  });
}

export function POST(req: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const collection = await ownedCollection(user.id, (await params).slug);
    const body = await parseBody(req, createItemSchema);

    const data = body.data ?? {};
    const title = typeof data.title === "string" ? data.title : "";
    const slug = body.slug ?? (title ? slugify(title) : `item-${Date.now().toString(36)}`);

    const clash = await db.query.items.findFirst({
      where: and(eq(items.collectionId, collection.id), eq(items.slug, slug)),
    });
    if (clash) throw conflict(`An item with slug "${slug}" already exists in this collection`);

    const publishing = body.status === "published";
    const [row] = await db
      .insert(items)
      .values({
        collectionId: collection.id,
        slug,
        status: body.status ?? "draft",
        data,
        publishedAt: publishing ? new Date() : null,
      })
      .returning();
    return ok(row, { status: 201 });
  });
}
