"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign in");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "70px 24px" }}>
      <div className="glass-panel" style={{ maxWidth: 420, margin: "0 auto", padding: 34 }}>
        <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.7rem" }}>Welcome back</h1>
        <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 26 }}>Sign in to SafeKelowna</div>

        {error && (
          <p style={{ color: "#c94f4f", fontWeight: 600, marginBottom: 16 }}>⚠ {error}</p>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Email</label>
            <input type="email" className="cyber-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Password</label>
            <input type="password" className="cyber-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="cyber-btn" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ color: "var(--text-mid)", marginTop: 22, marginBottom: 0, textAlign: "center" }}>
          New to SafeKelowna?{" "}
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
