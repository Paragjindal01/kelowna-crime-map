"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  emailVerified: boolean;
  xp: number;
  level: { level: number; name: string; progress: number; nextLevel: { minXp: number; name: string } | null };
  unreadNotifications: number;
} | null;

type Report = { id: string; type: string; status: string; occurredAt: string; address?: string | null };
type LostItem = { id: string; title: string; status: string; moderation: string; imageUrl?: string | null };
type Notif = { id: string; body: string; link?: string | null; readAt: string | null; createdAt: string };
type Thread = {
  id: string;
  lostItem: { id: string; title: string; status: string; imageUrl?: string | null; ownerId: string };
  iAmOwner: boolean;
  owner: { id: string; name: string };
  other: { id: string; name: string };
  messages: { id: string; body: string; senderId: string; senderName: string; createdAt: string }[];
};

const TABS = ["overview", "reports", "lost items", "messages", "notifications"] as const;

export default function DashboardPage() {
  const [me, setMe] = useState<Me>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [reports, setReports] = useState<Report[]>([]);
  const [items, setItems] = useState<LostItem[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [resendState, setResendState] = useState<"idle" | "busy" | "sent">("idle");

  const resendVerification = async () => {
    setResendState("busy");
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setResendState("sent");
  };

  const loadAll = () => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/reports?mine=1").then((r) => r.json()),
      fetch("/api/lost-items?mine=1").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
      fetch("/api/messages").then((r) => r.json()),
    ]).then(([meData, reportsData, itemsData, notifData, threadData]) => {
      setMe(meData.user);
      if (Array.isArray(reportsData)) setReports(reportsData);
      if (Array.isArray(itemsData)) setItems(itemsData);
      if (Array.isArray(notifData)) setNotifs(notifData);
      if (Array.isArray(threadData)) setThreads(threadData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const markStatus = async (id: string, status: "lost" | "found" | "returned", threadId?: string) => {
    await fetch(`/api/lost-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, threadId }),
    });
    loadAll();
  };

  const markNotifsRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    loadAll();
  };

  const reply = async (threadId: string) => {
    const body = replyText[threadId]?.trim();
    if (!body) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, body }),
    });
    setReplyText((r) => ({ ...r, [threadId]: "" }));
    loadAll();
  };

  if (loading) {
    return <main style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-mid)" }}>Loading dashboard…</main>;
  }

  if (!me) {
    return (
      <main style={{ height: "100%", display: "grid", placeItems: "center" }}>
        <div className="glass-panel" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ color: "var(--text-mid)", marginBottom: 16 }}>Sign in to view your dashboard.</div>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span className="cyber-btn" style={{ display: "inline-block" }}>Sign in</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "32px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {!me.emailVerified && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              padding: "14px 18px",
              marginBottom: 18,
              borderRadius: 12,
              border: "1px solid rgba(227, 201, 117, 0.45)",
              background: "rgba(227, 201, 117, 0.08)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>✉️</span>
            <span style={{ flex: 1, minWidth: 220, color: "var(--text-hi)", fontSize: "0.92rem" }}>
              Verify your email to unlock posting lost items, contacting owners, and commenting.
              We sent a link to <b>{me.email}</b>.
            </span>
            <button
              className="cyber-btn cyber-btn--ghost"
              style={{ padding: "8px 16px", fontSize: "0.7rem" }}
              onClick={resendVerification}
              disabled={resendState !== "idle"}
            >
              {resendState === "sent" ? "✓ Sent" : resendState === "busy" ? "Sending…" : "Resend email"}
            </button>
          </div>
        )}
        <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 24 }}>
          <span className="avatar" style={{ width: 56, height: 56, fontSize: "1.4rem", background: me.avatarColor }}>
            {me.name.charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--text-hi)" }}>{me.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              <span className="level-badge">Lv.{me.level.level} · {me.level.name}</span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>{me.xp} XP</span>
            </div>
            <div className="xp-bar" style={{ marginTop: 10, maxWidth: 280 }}>
              <div style={{ width: `${me.level.progress}%` }} />
            </div>
          </div>
          <Link href={`/profile/${me.id}`} style={{ textDecoration: "none" }}>
            <span className="cyber-btn cyber-btn--ghost" style={{ display: "inline-block" }}>View public profile</span>
          </Link>
        </div>

        <div className="tab-row" style={{ marginBottom: 20 }}>
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => { setTab(t); if (t === "notifications") markNotifsRead(); }}>
              {t}
              {t === "notifications" && me.unreadNotifications > 0 && ` (${me.unreadNotifications})`}
              {t === "messages" && threads.length > 0 && ` (${threads.length})`}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            {[
              { label: "Reports Submitted", value: reports.length },
              { label: "Reports Approved", value: reports.filter((r) => r.status === "approved").length },
              { label: "Lost Items Posted", value: items.length },
              { label: "Items Returned", value: items.filter((i) => i.status === "returned").length },
            ].map((s) => (
              <div key={s.label} className="hud-card" style={{ textAlign: "center", padding: 18 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
                <div className="cyber-label" style={{ marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.length === 0 && <div className="glass-panel" style={{ padding: 24, color: "var(--text-mid)" }}>No reports yet. <Link href="/report" style={{ color: "var(--accent)" }}>Submit one</Link>.</div>}
            {reports.map((r) => (
              <div key={r.id} className="hud-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-hi)", textTransform: "capitalize" }}>{r.type.replace(/_/g, " ")}</div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.82rem", marginTop: 2 }}>
                    {r.address || "No address"} · {new Date(r.occurredAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`status-pill status-pill--${r.status === "approved" ? "returned" : r.status === "rejected" ? "lost" : "pending"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "lost items" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.length === 0 && <div className="glass-panel" style={{ padding: 24, color: "var(--text-mid)" }}>No lost items posted yet. <Link href="/lost-found" style={{ color: "var(--accent)" }}>Post one</Link>.</div>}
            {items.map((i) => (
              <div key={i.id} className="hud-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: i.imageUrl ? `url(${i.imageUrl}) center/cover` : "rgba(217,164,91,0.1)", display: "grid", placeItems: "center" }}>
                    {!i.imageUrl && "📦"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-hi)" }}>{i.title}</div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: 2 }}>
                      Moderation: {i.moderation}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`status-pill status-pill--${i.status}`}>{i.status}</span>
                  {i.status === "lost" && i.moderation === "approved" && (
                    <button className="cyber-btn cyber-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.68rem" }} onClick={() => markStatus(i.id, "found")}>
                      Mark found
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {threads.length === 0 && <div className="glass-panel" style={{ padding: 24, color: "var(--text-mid)" }}>No conversations yet.</div>}
            {threads.map((t) => {
              const counterpart = t.iAmOwner ? t.other : t.owner;
              return (
                <div key={t.id} className="glass-panel" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-hi)" }}>
                      {t.lostItem.title} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>with {counterpart.name}</span>
                    </div>
                    {t.iAmOwner && t.lostItem.status !== "returned" && (
                      <button className="cyber-btn cyber-btn--success" style={{ padding: "6px 12px", fontSize: "0.68rem" }} onClick={() => markStatus(t.lostItem.id, "returned", t.id)}>
                        ✓ Confirm returned by {counterpart.name}
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto", marginBottom: 10 }}>
                    {t.messages.map((m) => (
                      <div key={m.id} style={{ alignSelf: m.senderId === me.id ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            background: m.senderId === me.id ? "rgba(217,164,91,0.15)" : "rgba(160,74,104,0.15)",
                            color: "var(--text-hi)",
                            fontSize: "0.88rem",
                          }}
                        >
                          {m.body}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 2, textAlign: m.senderId === me.id ? "right" : "left" }}>
                          {m.senderName}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="cyber-input"
                      style={{ padding: "8px 10px", fontSize: "0.85rem" }}
                      placeholder="Reply..."
                      value={replyText[t.id] ?? ""}
                      onChange={(e) => setReplyText((r) => ({ ...r, [t.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && reply(t.id)}
                    />
                    <button className="cyber-btn" style={{ padding: "8px 16px", fontSize: "0.7rem" }} onClick={() => reply(t.id)}>Send</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifs.length === 0 && <div className="glass-panel" style={{ padding: 24, color: "var(--text-mid)" }}>No notifications yet.</div>}
            {notifs.map((n) => (
              <Link key={n.id} href={n.link || "#"} style={{ textDecoration: "none" }}>
                <div className="hud-card" style={{ padding: 14, opacity: n.readAt ? 0.6 : 1 }}>
                  <div style={{ color: "var(--text-hi)", fontSize: "0.92rem" }}>{n.body}</div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.72rem", marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
