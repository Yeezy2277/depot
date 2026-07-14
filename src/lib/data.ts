import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, items, type Collection, type Item } from "@/db/schema";
import { notFound } from "./http";

/** Fetch a collection the user owns, or 404. Shared by the admin routes. */
export async function ownedCollection(userId: string, slug: string): Promise<Collection> {
  const row = await db.query.collections.findFirst({
    where: and(eq(collections.ownerId, userId), eq(collections.slug, slug)),
  });
  if (!row) throw notFound(`Collection "${slug}" not found`);
  return row;
}

/** Fetch an item by id, scoped to a collection, or 404. */
export async function itemInCollection(collectionId: string, itemId: string): Promise<Item> {
  const row = await db.query.items.findFirst({
    where: and(eq(items.collectionId, collectionId), eq(items.id, itemId)),
  });
  if (!row) throw notFound("Item not found");
  return row;
}
