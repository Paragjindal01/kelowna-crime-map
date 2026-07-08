"use client";

import { useState } from "react";

type Report = {
  id: string;
  type: string;
  status: string;
  occurredAt: string;
  lat: number;
  lng: number;
  address?: string | null;
  description?: string | null;
  createdAt: string;
};

type LostItem = {
  id: string;
  title: string;
  category: string;
  location: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  owner?: { name: string; email: string } | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  xp: number;
  banned: boolean;
  createdAt: string;
  _count: { reports: number; lostItems: number };
};

type Stats = {
  members: number;
  reportsTotal: number;
  reportsApproved: number;
  reportsPending: number;
  itemsTotal: number;
  itemsPending: number;
  itemsReturned: number;
  activeThisMonth: number;
  successRate: number;
};

type PendingAlert = {
  id: string;
  category: string;
  title: string;
  location: string;
  description?: string | null;
  severity: number;
  startsAt: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
};

const TABS = ["reports", "lost items", "alerts", "users", "statistics"] as const;

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("reports");

  const [reports, setReports] = useState<Report[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [alerts, setAlerts] = useState<PendingAlert[]>([]);

  const authHeaders = { "x-admin-key": adminKey, "Content-Type": "application/json" };

  const loadTab = async (which: (typeof TABS)[number], key = adminKey) => {
    setLoading(true);
    setError("");
    try {
      if (which === "reports") {
        const res = await fetch("/api/admin/reports", { headers: { "x-admin-key": key } });
        if (res.status === 401) throw new Error("Invalid Admin Key");
        setReports(await res.json());
      } else if (which === "lost items") {
        const res = await fetch("/api/admin/lost-items", { headers: { "x-admin-key": key } });
        if (res.status === 401) throw new Error("Invalid Admin Key");
        setLostItems(await res.json());
      } else if (which === "alerts") {
        const res = await fetch("/api/admin/alerts", { headers: { "x-admin-key": key } });
        if (res.status === 401) throw new Error("Invalid Admin Key");
        setAlerts(await res.json());
      } else if (which === "users") {
        const res = await fetch("/api/admin/users", { headers: { "x-admin-key": key } });
        if (res.status === 401) throw new Error("Invalid Admin Key");
        setUsers(await res.json());
      } else if (which === "statistics") {
        const res = await fetch("/api/admin/stats", { headers: { "x-admin-key": key } });
        if (res.status === 401) throw new Error("Invalid Admin Key");
        setStats(await res.json());
      }
      setIsAuthorized(true);
    } catch (err: any) {
      setError(err.message);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loadTab("reports");
  };

  const switchTab = (t: (typeof TABS)[number]) => {
    setTab(t);
    loadTab(t);
  };

  const updateReportStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moderateAlert = async (id: string, moderation: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ moderation }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moderateItem = async (id: string, moderation: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/lost-items/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ moderation }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      setLostItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleBan = async (id: string, banned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ banned }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned } : u)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <main style={{ height: "100%", overflow: "auto", padding: "60px 24px" }}>
        <div className="glass-panel" style={{ maxWidth: 420, margin: "0 auto", padding: 32 }}>
          <h2 className="cyber-title" style={{ margin: 0, fontSize: "1.3rem" }}>
            Admin Access
          </h2>
          <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 24 }}>
            Restricted // Clearance Required
          </div>
          {error && (
            <p style={{ color: "#c94f4f", marginBottom: 16, fontWeight: 600 }}>⚠ {error}</p>
          )}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="password"
              placeholder="Enter Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="cyber-input"
              required
            />
            <button type="submit" disabled={loading} className="cyber-btn">
              {loading ? "Verifying..." : "Authenticate"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.5rem" }}>Admin Console</h1>
            <div className="cyber-sub" style={{ marginTop: 6 }}>Moderation & Community Management</div>
          </div>
          <button onClick={() => loadTab(tab)} className="cyber-btn cyber-btn--ghost">Refresh</button>
        </div>

        <div className="tab-row" style={{ marginBottom: 20 }}>
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => switchTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "var(--accent)" }}>Loading…</p>}

        {!loading && tab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reports.length === 0 && (
              <div className="glass-panel" style={{ padding: 28, textAlign: "center", color: "var(--text-mid)" }}>
                Queue clear — no pending reports to review.
              </div>
            )}
            {reports.map((report) => (
              <div key={report.id} className="hud-card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
                  <div>
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", textTransform: "uppercase", color: "var(--accent)" }}>
                      {report.type.replace(/_/g, " ")}
                    </strong>
                    <span style={{ color: "var(--text-mid)", marginLeft: 10, fontSize: "0.9rem" }}>
                      {new Date(report.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => updateReportStatus(report.id, "approved")} className="cyber-btn cyber-btn--success" style={{ padding: "8px 16px", fontSize: "0.7rem" }}>
                      Approve
                    </button>
                    <button onClick={() => updateReportStatus(report.id, "rejected")} className="cyber-btn cyber-btn--danger" style={{ padding: "8px 16px", fontSize: "0.7rem" }}>
                      Reject
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "0.95rem", color: "var(--text-hi)", marginBottom: 8, lineHeight: 1.6 }}>
                  <span style={{ color: "var(--text-mid)" }}>ADDRESS //</span> {report.address || "N/A"}
                  <br />
                  <span style={{ color: "var(--text-mid)" }}>COORDS //</span> {report.lat}, {report.lng}
                </div>
                {report.description && (
                  <div style={{ padding: "10px 12px", background: "rgba(217, 164, 91, 0.05)", border: "1px solid rgba(217, 164, 91, 0.15)", borderRadius: 8, fontSize: "0.92rem", color: "var(--text-mid)" }}>
                    {report.description}
                  </div>
                )}
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: 10 }}>
                  Submitted: {new Date(report.createdAt).toLocaleString()} | ID: {report.id}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "lost items" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {lostItems.length === 0 && (
              <div className="glass-panel" style={{ padding: 28, textAlign: "center", color: "var(--text-mid)" }}>
                Queue clear — no pending listings to review.
              </div>
            )}
            {lostItems.map((item) => (
              <div key={item.id} className="hud-card" style={{ padding: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : "rgba(217,164,91,0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {!item.imageUrl && "📦"}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>{item.title}</strong>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => moderateItem(item.id, "approved")} className="cyber-btn cyber-btn--success" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Approve</button>
                      <button onClick={() => moderateItem(item.id, "rejected")} className="cyber-btn cyber-btn--danger" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Reject</button>
                    </div>
                  </div>
                  <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: 6 }}>
                    {item.category} · {item.location} {item.owner ? `· by ${item.owner.name} (${item.owner.email})` : ""}
                  </div>
                  {item.description && <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: 6 }}>{item.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {alerts.length === 0 && (
              <div className="glass-panel" style={{ padding: 28, textAlign: "center", color: "var(--text-mid)" }}>
                Queue clear — no pending alerts to review.
              </div>
            )}
            {alerts.map((a) => (
              <div key={a.id} className="hud-card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>
                    {a.title}
                  </strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => moderateAlert(a.id, "approved")} className="cyber-btn cyber-btn--success" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Approve</button>
                    <button onClick={() => moderateAlert(a.id, "rejected")} className="cyber-btn cyber-btn--danger" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Reject</button>
                  </div>
                </div>
                <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: 6 }}>
                  {a.category.replace(/_/g, " ")} · severity {a.severity} · {a.location}
                  {a.user ? ` · by ${a.user.name} (${a.user.email})` : ""}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: 4 }}>
                  Starts: {new Date(a.startsAt).toLocaleString()} · Submitted: {new Date(a.createdAt).toLocaleString()}
                </div>
                {a.description && <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: 6 }}>{a.description}</div>}
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "users" && (
          <>
            <input
              className="cyber-input"
              type="search"
              placeholder="🔍 Search users by name or email…"
              aria-label="Search users"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              style={{ maxWidth: 340, marginBottom: 14 }}
            />
          <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
            {users
              .filter((u) => {
                const q = userQuery.trim().toLowerCase();
                return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
              })
              .map((u, i) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: i < users.length - 1 ? "1px solid rgba(217,164,91,0.12)" : "none",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-hi)" }}>{u.name} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {u.email}</span></div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: 2 }}>
                    {u.xp} XP · {u._count.reports} reports · {u._count.lostItems} listings · joined {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {u.banned && <span className="status-pill status-pill--lost">banned</span>}
                <button
                  onClick={() => toggleBan(u.id, !u.banned)}
                  className={`cyber-btn ${u.banned ? "cyber-btn--success" : "cyber-btn--danger"}`}
                  style={{ padding: "6px 14px", fontSize: "0.68rem" }}
                >
                  {u.banned ? "Unban" : "Ban"}
                </button>
              </div>
            ))}
          </div>
          </>
        )}

        {!loading && tab === "statistics" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {[
              { label: "Total Members", value: stats.members },
              { label: "Active This Month", value: stats.activeThisMonth },
              { label: "Reports Submitted", value: stats.reportsTotal },
              { label: "Reports Approved", value: stats.reportsApproved },
              { label: "Reports Pending", value: stats.reportsPending },
              { label: "Lost Items Total", value: stats.itemsTotal },
              { label: "Listings Pending", value: stats.itemsPending },
              { label: "Items Returned", value: stats.itemsReturned },
              { label: "Success Rate", value: `${stats.successRate}%` },
            ].map((s) => (
              <div key={s.label} className="hud-card" style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
                <div className="cyber-label" style={{ marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
