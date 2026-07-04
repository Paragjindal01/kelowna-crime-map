"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign up");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "70px 24px" }}>
      <div className="glass-panel" style={{ maxWidth: 440, margin: "0 auto", padding: 34 }}>
        <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.7rem" }}>Join the community</h1>
        <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 26 }}>
          Free for everyone in the Okanagan
        </div>

        {error && (
          <p style={{ color: "#c94f4f", fontWeight: 600, marginBottom: 16 }}>⚠ {error}</p>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Display name</label>
            <input type="text" className="cyber-input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} placeholder="Sam from Rutland" />
          </div>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Email</label>
            <input type="email" className="cyber-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Password</label>
            <input type="password" className="cyber-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
          </div>
          <button type="submit" className="cyber-btn" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ color: "var(--text-mid)", marginTop: 22, marginBottom: 0, textAlign: "center" }}>
          Already a member?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
