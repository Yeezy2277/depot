import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="wrap">
      <div className="topbar">
        <span className="pill">Backend · API · Postgres</span>
        <ThemeToggle />
      </div>
      <h1>Depot</h1>
      <p className="lede">
        A headless content API — the <strong>backend half of a CMS</strong>. Email/password
        auth with signed-cookie sessions, hashed API tokens for delivery, a Postgres content
        model (collections → items with a publish lifecycle), and a token-secured read API.
        Built with Next.js route handlers, Drizzle ORM and Neon Postgres.
      </p>

      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn" href="/admin">
          Admin console
        </Link>
        <a className="btn ghost" href="https://github.com/Yeezy2277/depot">
          Source code
        </a>
        <a className="btn ghost" href="https://vitaliipopov.dev">
          Portfolio
        </a>
      </div>

      <section style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: "1.1rem" }}>What it demonstrates</h2>
        <div className="grid">
          <div className="card">
            <strong>Auth, two surfaces</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              bcrypt passwords + `jose` JWT sessions for the admin; high-entropy{" "}
              <code>depot_…</code> tokens (SHA-256 hashed) for delivery.
            </p>
          </div>
          <div className="card">
            <strong>Typed data layer</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Drizzle schema with relations, unique indexes, migrations and a JSONB
              content column. Neon HTTP driver — serverless-safe.
            </p>
          </div>
          <div className="card">
            <strong>API rigor</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Zod validation, a consistent error envelope, per-IP rate limiting and
              ownership checks on every mutation.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Delivery API</h2>
        <p className="muted">
          Read published content with a bearer token — CORS-open, so any frontend can consume it:
        </p>
        <pre className="block">{`curl https://depot.vitaliipopov.dev/api/v1/articles \\
  -H "Authorization: Bearer depot_your_token_here"

# → { "data": [ { "slug": "hello-world", "data": { ... }, "publishedAt": "…" } ] }`}</pre>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Endpoints</h2>
        <div className="card scroll-x">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Auth</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.path + e.method}>
                  <td>
                    <code>{e.method}</code>
                  </td>
                  <td>
                    <code>{e.path}</code>
                  </td>
                  <td className="muted">{e.auth}</td>
                  <td className="muted">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const ENDPOINTS = [
  { method: "POST", path: "/api/auth/register", auth: "—", purpose: "Create an admin account" },
  { method: "POST", path: "/api/auth/login", auth: "—", purpose: "Start a session" },
  { method: "GET", path: "/api/auth/me", auth: "session", purpose: "Current user" },
  { method: "GET/POST", path: "/api/collections", auth: "session", purpose: "List / create content types" },
  { method: "GET/POST", path: "/api/collections/:slug/items", auth: "session", purpose: "List / create entries" },
  { method: "PATCH", path: "/api/items/:id", auth: "session", purpose: "Edit / publish an entry" },
  { method: "POST", path: "/api/tokens", auth: "session", purpose: "Issue a delivery token" },
  { method: "GET", path: "/api/v1/:collection", auth: "token", purpose: "Delivery: published items" },
  { method: "GET", path: "/api/v1/:collection/:slug", auth: "token", purpose: "Delivery: one item" },
];
