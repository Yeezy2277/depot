import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle client over Neon's HTTP driver — stateless per request, which is what
 * serverless functions want (no pool to exhaust).
 *
 * Initialized lazily via a Proxy: importing this module never touches the
 * connection string, so `next build` (and CI, with no DB) succeed. The first
 * actual query resolves DATABASE_URL and throws a clear error if it's missing.
 */
type DB = NeonHttpDatabase<typeof schema>;

let instance: DB | null = null;

function getDb(): DB {
  if (instance) return instance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env and fill it in.");
  }
  instance = drizzle(neon(connectionString), { schema });
  return instance;
}

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
}) as DB;

export { schema };
