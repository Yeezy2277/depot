import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, apiTokens } from "@/db/schema";
import { readSession } from "@/lib/auth/session";
import { AdminConsole } from "./AdminConsole";

// Reads the session + user's data on the server, then hands off to a client
// component for the interactive bits (create, issue token, logout).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  const [cols, tokens] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(eq(collections.ownerId, session.sub))
      .orderBy(desc(collections.createdAt)),
    db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        allowedOrigins: apiTokens.allowedOrigins,
        lastUsedAt: apiTokens.lastUsedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, session.sub))
      .orderBy(desc(apiTokens.createdAt)),
  ]);

  return (
    <AdminConsole
      email={session.email}
      initialCollections={cols.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
      }))}
      initialTokens={tokens}
    />
  );
}
