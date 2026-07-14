import { redirect, notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { readSession } from "@/lib/auth/session";
import { CollectionEditor } from "./CollectionEditor";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { collection: slug } = await params;

  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.ownerId, session.sub), eq(collections.slug, slug)),
  });
  if (!collection) notFound();

  const rows = await db
    .select()
    .from(items)
    .where(eq(items.collectionId, collection.id))
    .orderBy(desc(items.updatedAt));

  return (
    <CollectionEditor
      collection={{
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
      }}
      initialItems={rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        status: r.status,
        data: r.data as Record<string, unknown>,
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
