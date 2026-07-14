/**
 * Seed a demo "articles" collection with a few published items, owned by the
 * first registered user. Makes the live delivery API return real content.
 *
 *   npm run seed:demo        # reads DATABASE_URL from .env (Node --env-file)
 *
 * Idempotent: re-running skips rows that already exist (ON CONFLICT DO NOTHING).
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: npm run seed:demo");
  process.exit(1);
}
const sql = neon(url);

const ARTICLES = [
  {
    slug: "designing-a-content-api",
    data: {
      title: "Designing a content API that outlives its schema",
      excerpt: "Why a JSONB item body plus a thin typed shell beats rigid columns.",
      body: "Collections describe shape loosely; items carry their fields in JSONB. The delivery API stays stable while the content model evolves.",
      tags: ["architecture", "postgres"],
    },
  },
  {
    slug: "tokens-vs-sessions",
    data: {
      title: "Tokens vs. sessions: two auth surfaces, one backend",
      excerpt: "bcrypt-checked cookie sessions for humans; SHA-256 bearer tokens for machines.",
      body: "The admin console uses a signed httpOnly JWT. The delivery API uses high-entropy tokens hashed with SHA-256 — the right tool for each entropy profile.",
      tags: ["security", "auth"],
    },
  },
  {
    slug: "serverless-postgres-notes",
    data: {
      title: "Notes on serverless Postgres",
      excerpt: "Why the Neon HTTP driver fits route handlers better than a pool.",
      body: "Each request opens no long-lived connection, so a burst of serverless invocations can't exhaust the pool. Trade-off: no cross-statement transactions on the HTTP path.",
      tags: ["postgres", "serverless"],
    },
  },
];

async function run() {
  const [user] = await sql`select id from users order by created_at asc limit 1`;
  if (!user) {
    console.error("No users yet — register at /login first, then re-run.");
    process.exit(1);
  }

  await sql`
    insert into collections (id, owner_id, name, slug, description)
    values (${crypto.randomUUID()}, ${user.id}, 'Articles', 'articles', 'Demo articles delivered by the Depot API')
    on conflict (owner_id, slug) do nothing`;

  const [col] = await sql`select id from collections where owner_id = ${user.id} and slug = 'articles'`;

  let inserted = 0;
  for (const a of ARTICLES) {
    const res = await sql`
      insert into items (id, collection_id, slug, status, data, published_at)
      values (${crypto.randomUUID()}, ${col.id}, ${a.slug}, 'published', ${JSON.stringify(a.data)}::jsonb, now())
      on conflict (collection_id, slug) do nothing
      returning id`;
    if (res.length) inserted += 1;
  }

  console.log(`Done. Collection "articles" ready, ${inserted} new item(s) published.`);
  console.log("Try:  curl http://localhost:3000/api/v1/articles -H 'Authorization: Bearer <your depot_ token>'");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
