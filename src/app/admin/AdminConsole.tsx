"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Collection = { id: string; name: string; slug: string; description: string | null };
type Token = { id: string; name: string; prefix: string; lastUsedAt: Date | string | null };

export function AdminConsole({
  email,
  initialCollections,
  initialTokens,
}: {
  email: string;
  initialCollections: Collection[];
  initialTokens: Token[];
}) {
  const router = useRouter();
  const [collections, setCollections] = useState(initialCollections);
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function api(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
    return json.data;
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await api("/api/collections", { name });
      setCollections((c) => [created, ...c]);
      setName("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function issueToken(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await api("/api/tokens", { name: tokenName });
      setFreshToken(created.token);
      setTokens((t) => [{ id: created.id, name: created.name, prefix: created.prefix, lastUsedAt: null }, ...t]);
      setTokenName("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <span className="pill">Admin console</span>
          <h1 style={{ fontSize: "1.8rem", marginBottom: 0 }}>Depot</h1>
          <p className="muted" style={{ margin: 0 }}>
            Signed in as {email}
          </p>
        </div>
        <button className="btn ghost" onClick={logout}>
          Sign out
        </button>
      </div>

      {error && <p style={{ color: "#f0a5a5" }}>{error}</p>}

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Collections</h2>
        <form onSubmit={createCollection} className="row" style={{ marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="New collection name (e.g. Articles)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn">Create</button>
        </form>
        {collections.length === 0 ? (
          <p className="muted">No collections yet — create your first content type above.</p>
        ) : (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Delivery path</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <code>{c.slug}</code>
                    </td>
                    <td className="muted">
                      <code>/api/v1/{c.slug}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Delivery tokens</h2>
        <form onSubmit={issueToken} className="row" style={{ marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="Token name (e.g. Website)"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            required
          />
          <button className="btn">Issue token</button>
        </form>

        {freshToken && (
          <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent)" }}>
            <strong>Copy this token now — it won&apos;t be shown again:</strong>
            <pre className="block" style={{ marginBottom: 0 }}>
              {freshToken}
            </pre>
          </div>
        )}

        {tokens.length === 0 ? (
          <p className="muted">No tokens yet.</p>
        ) : (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Last used</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      <code>{t.prefix}</code>
                    </td>
                    <td className="muted">
                      {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
