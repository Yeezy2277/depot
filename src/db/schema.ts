import { pgTable, text, timestamp, jsonb, uniqueIndex, index, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Depot content model.
 *
 *   users ──< apiTokens
 *     └───< collections ──< items
 *
 * A `collection` is a content type (e.g. "article"); an `item` is one entry,
 * whose free-form fields live in a JSONB `data` column. Items have a publish
 * lifecycle so the delivery API can serve only what's `published`.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const itemStatus = pgEnum("item_status", ["draft", "published"]);
export const userRole = pgEnum("user_role", ["admin", "editor"]);

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // sha-256 of the full token; the plaintext is shown once at creation.
    tokenHash: text("token_hash").notNull(),
    // first chars of the token, stored in the clear so the UI can label it.
    prefix: text("prefix").notNull(),
    // Browser origins allowed to read with this token. Empty = open (any origin).
    allowedOrigins: text("allowed_origins")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("api_tokens_hash_unique").on(t.tokenHash)],
);

export const collections = pgTable(
  "collections",
  {
    id: id(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("collections_owner_slug_unique").on(t.ownerId, t.slug)],
);

export const items = pgTable(
  "items",
  {
    id: id(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    status: itemStatus("status").notNull().default("draft"),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("items_collection_slug_unique").on(t.collectionId, t.slug),
    index("items_collection_status_idx").on(t.collectionId, t.status),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  tokens: many(apiTokens),
  collections: many(collections),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  owner: one(users, { fields: [collections.ownerId], references: [users.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  collection: one(collections, { fields: [items.collectionId], references: [collections.id] }),
}));

export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
