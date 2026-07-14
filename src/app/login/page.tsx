"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { email, password, name, invite };
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Something went wrong");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="wrap" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: "1.6rem" }}>{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="muted">Depot admin console.</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {mode === "register" && (
          <input
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "register" && (
          <input
            className="input"
            placeholder="Invite code (if required)"
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
          />
        )}
        {error && <p style={{ color: "#f0a5a5", margin: 0 }}>{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        {mode === "login" ? "No account?" : "Already have one?"}{" "}
        <button
          className="btn ghost"
          style={{ padding: "4px 10px" }}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Register" : "Sign in"}
        </button>
      </p>
    </main>
  );
}
