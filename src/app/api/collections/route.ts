import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { handle, ok, conflict } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { createCollectionSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/auth/guard";
import { slugify } from "@/lib/slug";

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(collections)
      .where(eq(collections.ownerId, user.id))
      .orderBy(desc(collections.createdAt));
    return ok(rows);
  });
}

export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await parseBody(req, createCollectionSchema);
    const slug = body.slug ?? slugify(body.name);

    const clash = await db.query.collections.findFirst({
      where: and(eq(collections.ownerId, user.id), eq(collections.slug, slug)),
    });
    if (clash) throw conflict(`A collection with slug "${slug}" already exists`);

    const [row] = await db
      .insert(collections)
      .values({
        ownerId: user.id,
        name: body.name,
        slug,
        description: body.description ?? null,
      })
      .returning();
    return ok(row, { status: 201 });
  });
}
