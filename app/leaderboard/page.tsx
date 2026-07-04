"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PU = { id: string; name: string; avatarColor: string; xp: number; verified?: boolean; level: { level: number; name: string } };
type Board = {
  topHelpers: PU[];
  mostReturned: { user: PU; count: number }[];
  mostVerifiedReports: { user: PU; count: number }[];
  mostActive: { user: PU; count: number }[];
  totals: { members: number; approvedReports: number; itemsReturned: number };
} | null;

function Row({ rank, user, trailing }: { rank: number; user: PU; trailing?: string }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <Link
      href={`/profile/${user.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 6px",
        textDecoration: "none",
        borderBottom: "1px solid rgba(217,164,91,0.1)",
      }}
    >
      <span style={{ width: 26, textAlign: "center", fontSize: medal ? "1.2rem" : "0.85rem", color: "var(--text-dim)", fontWeight: 700 }}>
        {medal ?? rank}
      </span>
      <span className="avatar" style={{ background: user.avatarColor }}>
        {user.name.charAt(0).toUpperCase()}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ color: "var(--text-hi)", fontWeight: 600 }}>
          {user.name}
          {user.verified && (
            <span title="Verified member" style={{ color: "var(--vine)", marginLeft: 4, fontSize: "0.85em" }}>✓</span>
          )}
        </div>
        <div className="level-badge" style={{ marginTop: 2, fontSize: "0.62rem", padding: "2px 8px" }}>
          Lv.{user.level.level} {user.level.name}
        </div>
      </div>
      <div style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "var(--font-display)" }}>
        {trailing ?? `${user.xp} XP`}
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Board>(null);

  useEffect(() => {
    fetch("/api/leaderboard").then((r) => r.json()).then(setBoard).catch(() => {});
  }, []);

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "36px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 className="cyber-title" style={{ margin: 0, fontSize: "2rem" }}>Community Leaderboard</h1>
          <div className="cyber-sub" style={{ marginTop: 8 }}>Top helpers across the Okanagan</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 30 }}>
          {[
            { label: "Members", value: board?.totals.members },
            { label: "Verified Reports", value: board?.totals.approvedReports },
            { label: "Items Returned", value: board?.totals.itemsReturned },
          ].map((s) => (
            <div key={s.label} className="hud-card" style={{ textAlign: "center", padding: 18 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 900, color: "var(--accent)" }}>
                {s.value ?? "—"}
              </div>
              <div className="cyber-label" style={{ marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <div className="cyber-sub" style={{ marginBottom: 10 }}>🏆 Top Helpers</div>
            {board?.topHelpers.map((u, i) => <Row key={u.id} rank={i + 1} user={u} />)}
            {board && board.topHelpers.length === 0 && <div style={{ color: "var(--text-dim)" }}>No data yet.</div>}
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div className="cyber-sub" style={{ marginBottom: 10 }}>🎁 Most Items Returned</div>
            {board?.mostReturned.map((r, i) => <Row key={r.user.id} rank={i + 1} user={r.user} trailing={`${r.count}×`} />)}
            {board && board.mostReturned.length === 0 && <div style={{ color: "var(--text-dim)" }}>No data yet.</div>}
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div className="cyber-sub" style={{ marginBottom: 10 }}>📋 Most Verified Reports</div>
            {board?.mostVerifiedReports.map((r, i) => <Row key={r.user.id} rank={i + 1} user={r.user} trailing={`${r.count}×`} />)}
            {board && board.mostVerifiedReports.length === 0 && <div style={{ color: "var(--text-dim)" }}>No data yet.</div>}
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div className="cyber-sub" style={{ marginBottom: 10 }}>⚡ Most Active (30 days)</div>
            {board?.mostActive.map((r, i) => <Row key={r.user.id} rank={i + 1} user={r.user} trailing={`${r.count}×`} />)}
            {board && board.mostActive.length === 0 && <div style={{ color: "var(--text-dim)" }}>No data yet.</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
