"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LIVE_FEATURES, PLANNED_FEATURES } from "@/lib/roadmap";

type RoadmapData = {
  votes: Record<string, number>;
  myVotes: string[];
  signedIn: boolean;
};

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null);

  const load = () =>
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const toggleVote = async (featureKey: string) => {
    if (!data?.signedIn) return;
    // optimistic update
    setData((d) => {
      if (!d) return d;
      const has = d.myVotes.includes(featureKey);
      return {
        ...d,
        myVotes: has ? d.myVotes.filter((k) => k !== featureKey) : [...d.myVotes, featureKey],
        votes: { ...d.votes, [featureKey]: (d.votes[featureKey] ?? 0) + (has ? -1 : 1) },
      };
    });
    await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureKey }),
    });
    load();
  };

  const sorted = [...PLANNED_FEATURES].sort(
    (a, b) => (data?.votes[b.key] ?? 0) - (data?.votes[a.key] ?? 0)
  );

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "40px 24px 70px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <h1 className="cyber-title" style={{ margin: 0, fontSize: "2rem" }}>Roadmap</h1>
          <div className="cyber-sub" style={{ marginTop: 10 }}>
            Built with the community, for the community
          </div>
          <p style={{ color: "var(--text-mid)", maxWidth: 560, margin: "16px auto 0", lineHeight: 1.65 }}>
            SafeKelowna grows based on what actually helps Kelowna. Vote for the features you want —
            the most-requested ones get built first.
          </p>
        </div>

        <div className="cyber-sub" style={{ marginBottom: 14 }}>✅ Available now</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 40 }}>
          {LIVE_FEATURES.map((f) => (
            <div key={f.title} className="hud-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-hi)" }}>{f.title}</div>
                <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: 3 }}>{f.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div className="cyber-sub">🗳️ Coming next — you decide</div>
          {data && !data.signedIn && (
            <Link href="/login" style={{ color: "var(--accent)", fontSize: "0.85rem" }}>
              Sign in to vote →
            </Link>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((f) => {
            const count = data?.votes[f.key] ?? 0;
            const voted = data?.myVotes.includes(f.key) ?? false;
            return (
              <div key={f.key} className="glass-panel" style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.7rem" }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-hi)" }}>
                    {f.title}
                  </div>
                  <div style={{ color: "var(--text-mid)", fontSize: "0.88rem", marginTop: 3 }}>{f.description}</div>
                </div>
                <button
                  onClick={() => toggleVote(f.key)}
                  disabled={!data?.signedIn}
                  aria-pressed={voted}
                  className={voted ? "cyber-btn" : "cyber-btn cyber-btn--ghost"}
                  style={{ padding: "9px 18px", fontSize: "0.72rem", opacity: data?.signedIn ? 1 : 0.5 }}
                  title={data?.signedIn ? (voted ? "Remove vote" : "Vote for this") : "Sign in to vote"}
                >
                  {voted ? "▲ Voted" : "▲ Vote"} · {count}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 36, color: "var(--text-dim)", fontSize: "0.88rem" }}>
          Have an idea that's not listed? <Link href="/contact" style={{ color: "var(--accent)" }}>Tell us</Link>.
        </div>
      </div>
    </main>
  );
}
