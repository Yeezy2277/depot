"use client";

import { useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  slug: string;
  status: "draft" | "published";
  data: Record<string, unknown>;
  updatedAt: string;
};
type Collection = { id: string; name: string; slug: string; description: string | null };

type Draft = { id: string | null; slug: string; status: "draft" | "published"; json: string };

const EMPTY_DRAFT: Draft = {
  id: null,
  slug: "",
  status: "draft",
  json: '{\n  "title": ""\n}',
};

export function CollectionEditor({
  collection,
  initialItems,
}: {
  collection: Collection;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function edit(item: Item) {
    setError(null);
    setDraft({
      id: item.id,
      slug: item.slug,
      status: item.status,
      json: JSON.stringify(item.data, null, 2),
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);

    let data: unknown;
    try {
      data = JSON.parse(draft.json);
    } catch {
      setError("Data must be valid JSON.");
      return;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      setError("Data must be a JSON object.");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, unknown> = { status: draft.status, data };
      if (draft.slug.trim()) body.slug = draft.slug.trim();

      const res = await fetch(
        draft.id ? `/api/items/${draft.id}` : `/api/collections/${collection.slug}/items`,
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Save failed");

      const saved = json.data as Item;
      setItems((prev) => {
        const without = prev.filter((i) => i.id !== saved.id);
        return [{ ...saved, updatedAt: new Date().toISOString() }, ...without];
      });
      setDraft(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    if (!confirm(`Delete "${item.slug}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Delete failed");
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (draft?.id === item.id) setDraft(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <Link className="muted" href="/admin">
            ← Collections
          </Link>
          <h1 style={{ fontSize: "1.8rem", margin: "8px 0 0" }}>{collection.name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Delivery: <code>/api/v1/{collection.slug}</code>
          </p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY_DRAFT });
          }}
        >
          New item
        </button>
      </div>

      {error && <p style={{ color: "#f0a5a5" }}>{error}</p>}

      {draft && (
        <form onSubmit={save} className="card" style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <strong>{draft.id ? "Edit item" : "New item"}</strong>
          <div className="row" style={{ gap: 12 }}>
            <input
              className="input"
              style={{ maxWidth: 300 }}
              placeholder="slug (optional — derived from title)"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
            <select
              className="input"
              style={{ maxWidth: 160 }}
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as "draft" | "published" })
              }
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <label className="muted" style={{ fontSize: "0.85rem" }}>
            Data (JSON)
          </label>
          <textarea
            className="input"
            style={{ minHeight: 180, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
            value={draft.json}
            onChange={(e) => setDraft({ ...draft, json: e.target.value })}
            spellCheck={false}
          />
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" disabled={busy}>
              {busy ? "…" : "Save"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setDraft(null)}
              disabled={busy}
            >
              Cancel
            </button>
            {draft.id && (
              <button
                type="button"
                className="btn ghost"
                style={{ marginLeft: "auto", borderColor: "#7a3b3b", color: "#f0a5a5" }}
                onClick={() => {
                  const item = items.find((i) => i.id === draft.id);
                  if (item) remove(item);
                }}
                disabled={busy}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}

      <section style={{ marginTop: 28 }}>
        {items.length === 0 ? (
          <p className="muted">No items yet — create your first entry above.</p>
        ) : (
          <div className="card scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code>{item.slug}</code>
                    </td>
                    <td>
                      <span className={item.status === "published" ? "tag tag--ok" : "tag"}>
                        {item.status}
                      </span>
                    </td>
                    <td className="muted">
                      {typeof item.data.title === "string" ? item.data.title : "—"}
                    </td>
                    <td className="muted">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn ghost" onClick={() => edit(item)}>
                        Edit
                      </button>
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
