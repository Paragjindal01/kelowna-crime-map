"use client";

import { useCallback, useEffect, useState } from "react";
import { ALERT_CATEGORIES, alertCategory, severityInfo } from "@/lib/categories";

const CRIME_TYPES = [
  "vehicle_theft", "theft_from_vehicle", "residential_break_enter",
  "commercial_break_enter", "shoplifting", "package_theft", "bicycle_theft",
  "vandalism_mischief", "trespassing", "suspicious_activity", "assault",
  "harassment_threats",
];

type Submitter = { id: string; name: string; email: string } | null;

type Stats = {
  members: number;
  reportsTotal: number; reportsApproved: number; reportsPending: number; reportsRejected: number;
  itemsTotal: number; itemsPending: number; itemsRejected: number; itemsReturned: number;
  alertsPending: number; alertsActive: number; alertsRejected: number;
  pendingTotal: number; rejectedTotal: number;
  activeThisMonth: number; successRate: number;
};

type Report = {
  id: string; type: string; status: string; occurredAt: string; address?: string | null;
  description?: string | null; lat: number; lng: number; isVerified: boolean;
  locationApproximate: boolean; sourceName?: string | null; sourceUrl?: string | null;
  createdAt: string; user?: Submitter;
};

type LostItem = {
  id: string; title: string; category: string; description?: string | null; location: string;
  dateLost: string; imageUrl?: string | null; imageUrls?: string[]; status: string;
  moderation: string; createdAt: string; owner?: Submitter;
};

type Alert = {
  id: string; category: string; title: string; description?: string | null; location: string;
  lat?: number | null; lng?: number | null; severity: number; status: string; moderation: string;
  startsAt: string; sourceName?: string | null; sourceUrl?: string | null; isVerified: boolean;
  locationApproximate: boolean; createdAt: string; user?: Submitter;
};

type AdminUser = {
  id: string; name: string; email: string; xp: number; banned: boolean;
  emailVerified?: boolean; createdAt: string; _count: { reports: number; lostItems: number };
};

type QueueItem = {
  kind: "report" | "lostItem" | "alert"; id: string; title: string; category: string;
  description?: string | null; date: string; location?: string | null; images: string[];
  status: string; isVerified: boolean; locationApproximate: boolean;
  sourceName?: string | null; sourceUrl?: string | null; submittedBy: Submitter; createdAt: string;
};

type AuditRow = {
  id: string; action: string; targetType: string; targetId: string;
  label?: string | null; meta?: string | null; createdAt: string;
};

const TABS = ["overview", "queue", "reports", "lost & found", "alerts", "users", "audit", "create"] as const;
type Tab = (typeof TABS)[number];

function Badge({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "grey" | "blue" }) {
  const colors: Record<string, string> = {
    green: "#7fa35c", amber: "#d9a45b", red: "#c9302c", grey: "#8d7460", blue: "#5b9e9c",
  };
  const c = colors[tone];
  return (
    <span style={{ padding: "1px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: c, border: `1px solid ${c}66`, background: `${c}18` }}>
      {text}
    </span>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleString("en-CA", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [queueKind, setQueueKind] = useState("all");
  const [userQuery, setUserQuery] = useState("");
  const [editing, setEditing] = useState<{ kind: string; data: any } | null>(null);

  const authHeaders = { "x-admin-key": adminKey, "Content-Type": "application/json" };

  const loadTab = useCallback(
    async (which: Tab, key = adminKey, status = statusFilter) => {
      setLoading(true);
      setError("");
      try {
        const h = { "x-admin-key": key };
        const guard = (res: Response) => {
          if (res.status === 401) throw new Error("Invalid Admin Key");
          return res;
        };
        if (which === "overview") {
          setStats(await (await fetch("/api/admin/stats", { headers: h }).then(guard)).json());
        } else if (which === "queue") {
          setQueue(await (await fetch("/api/admin/queue", { headers: h }).then(guard)).json());
        } else if (which === "reports") {
          setReports(await (await fetch(`/api/admin/reports?status=${status}`, { headers: h }).then(guard)).json());
        } else if (which === "lost & found") {
          setLostItems(await (await fetch(`/api/admin/lost-items?status=${status}`, { headers: h }).then(guard)).json());
        } else if (which === "alerts") {
          setAlerts(await (await fetch(`/api/admin/alerts?status=${status}`, { headers: h }).then(guard)).json());
        } else if (which === "users") {
          setUsers(await (await fetch("/api/admin/users", { headers: h }).then(guard)).json());
        } else if (which === "audit") {
          setAudit(await (await fetch("/api/admin/audit", { headers: h }).then(guard)).json());
        }
        setIsAuthorized(true);
      } catch (err: any) {
        setError(err.message);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    },
    [adminKey, statusFilter]
  );

  const switchTab = (t: Tab) => {
    setTab(t);
    setStatusFilter("pending");
    loadTab(t, adminKey, "pending");
  };

  const logout = () => {
    setAdminKey("");
    setIsAuthorized(false);
    setStats(null); setQueue([]); setReports([]); setLostItems([]); setAlerts([]); setUsers([]); setAudit([]);
    setTab("overview");
  };

  // --- generic actions ---
  const endpointFor = (kind: string, id: string) =>
    kind === "report" ? `/api/admin/reports/${id}`
    : kind === "lostItem" ? `/api/admin/lost-items/${id}`
    : `/api/admin/alerts/${id}`;

  const patch = async (kind: string, id: string, body: any) => {
    try {
      const res = await fetch(endpointFor(kind, id), { method: "PATCH", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      loadTab(tab);
      if (tab !== "overview") loadTab("overview" as Tab); // keep counts fresh in the background
    } catch (err: any) { alert(err.message); }
  };

  const remove = async (kind: string, id: string) => {
    if (!confirm("Delete permanently? This also removes any images and cannot be undone.")) return;
    try {
      const res = await fetch(endpointFor(kind, id), { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      loadTab(tab);
    } catch (err: any) { alert(err.message); }
  };

  const toggleBan = async (id: string, banned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ banned }) });
      if (!res.ok) throw new Error("Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned } : u)));
    } catch (err: any) { alert(err.message); }
  };

  // Moderation rename for inappropriate/impersonating display names.
  const renameUser = async (id: string, current: string) => {
    const name = prompt("New public display name for this member:", current);
    if (!name || name === current) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename user");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, name: data.name } : u)));
    } catch (err: any) { alert(err.message); }
  };

  // ---------- login gate ----------
  if (!isAuthorized) {
    return (
      <main style={{ height: "100%", overflow: "auto", padding: "60px 24px" }}>
        <div className="glass-panel" style={{ maxWidth: 420, margin: "0 auto", padding: 32 }}>
          <h2 className="cyber-title" style={{ margin: 0, fontSize: "1.3rem" }}>Admin Control Center</h2>
          <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 24 }}>Restricted // Clearance Required</div>
          {error && <p style={{ color: "#c94f4f", marginBottom: 16, fontWeight: 600 }}>⚠ {error}</p>}
          <form onSubmit={(e) => { e.preventDefault(); loadTab("overview"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input type="password" placeholder="Enter Admin Key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="cyber-input" required autoFocus />
            <button type="submit" disabled={loading} className="cyber-btn">{loading ? "Verifying..." : "Authenticate"}</button>
          </form>
        </div>
      </main>
    );
  }

  const statusTabs = (
    <div className="tab-row" style={{ marginBottom: 16 }}>
      {["pending", "approved", "rejected", "all"].map((s) => (
        <button key={s} className={`tab ${statusFilter === s ? "active" : ""}`} onClick={() => { setStatusFilter(s); loadTab(tab, adminKey, s); }}>{s}</button>
      ))}
    </div>
  );

  const submitterLine = (s: Submitter) =>
    s ? <>Submitted by <strong style={{ color: "var(--text-hi)" }}>{s.name}</strong> · <span title="Visible to admins only">{s.email}</span></> : <em>Anonymous / imported</em>;

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "28px 20px 60px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.5rem" }}>Admin Control Center</h1>
            <div className="cyber-sub" style={{ marginTop: 6 }}>SafeKelowna · private management</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => loadTab(tab)} className="cyber-btn cyber-btn--ghost">Refresh</button>
            <button onClick={logout} className="cyber-btn cyber-btn--danger">Log out</button>
          </div>
        </div>

        <div className="tab-row" style={{ marginBottom: 20, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => switchTab(t)} style={{ whiteSpace: "nowrap" }}>
              {t}
              {t === "queue" && stats && stats.pendingTotal > 0 ? ` (${stats.pendingTotal})` : ""}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "var(--accent)" }}>Loading…</p>}

        {/* ---------- OVERVIEW ---------- */}
        {!loading && tab === "overview" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {[
              { label: "Pending Reports", value: stats.reportsPending, tone: "amber" },
              { label: "Pending Lost/Found", value: stats.itemsPending, tone: "amber" },
              { label: "Pending Alerts", value: stats.alertsPending, tone: "amber" },
              { label: "Total Users", value: stats.members, tone: "blue" },
              { label: "Approved Reports", value: stats.reportsApproved, tone: "green" },
              { label: "Active Alerts", value: stats.alertsActive, tone: "green" },
              { label: "Returned Items", value: stats.itemsReturned, tone: "green" },
              { label: "Rejected Submissions", value: stats.rejectedTotal, tone: "red" },
            ].map((c) => (
              <div key={c.label} className="hud-card" style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", fontWeight: 900, color: "var(--accent)" }}>{c.value}</div>
                <div className="cyber-label" style={{ marginTop: 6 }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- COMBINED QUEUE ---------- */}
        {!loading && tab === "queue" && (
          <>
            <div className="tab-row" style={{ marginBottom: 16 }}>
              {["all", "report", "lostItem", "alert"].map((k) => (
                <button key={k} className={`tab ${queueKind === k ? "active" : ""}`} onClick={() => setQueueKind(k)}>
                  {k === "lostItem" ? "lost & found" : k}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {queue.filter((q) => queueKind === "all" || q.kind === queueKind).length === 0 && (
                <div className="glass-panel" style={{ padding: 40, textAlign: "center", color: "var(--text-mid)" }}>
                  🕊️ Queue clear — nothing awaiting review.
                </div>
              )}
              {queue.filter((q) => queueKind === "all" || q.kind === queueKind).map((q) => (
                <div key={`${q.kind}-${q.id}`} className="hud-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <Badge text={q.kind === "lostItem" ? "lost & found" : q.kind} tone="blue" />
                        <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)", textTransform: "capitalize" }}>{q.title}</strong>
                        <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>{String(q.category).replace(/_/g, " ")}</span>
                      </div>
                      {q.location && <div style={{ color: "var(--text-mid)", fontSize: "0.86rem" }}>📍 {q.location}{q.locationApproximate ? " (approx.)" : ""}</div>}
                      {q.description && <div style={{ color: "var(--text-mid)", fontSize: "0.9rem", marginTop: 6 }}>{q.description}</div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {q.images.map((src) => (
                          <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                            <img src={src} alt="" style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(217,164,91,0.35)" }} />
                          </a>
                        ))}
                      </div>
                      <div style={{ color: "var(--text-dim)", fontSize: "0.76rem", marginTop: 8 }}>
                        {submitterLine(q.submittedBy)} · {fmt(q.date)}
                        {q.sourceName && <> · Source: {q.sourceUrl ? <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>{q.sourceName}</a> : q.sourceName}</>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <button onClick={() => patch(q.kind, q.id, q.kind === "report" ? { status: "approved" } : { moderation: "approved" })} className="cyber-btn cyber-btn--success" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Approve</button>
                      <button onClick={() => patch(q.kind, q.id, q.kind === "report" ? { status: "rejected" } : { moderation: "rejected" })} className="cyber-btn cyber-btn--danger" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Reject</button>
                      <button onClick={() => setEditing({ kind: q.kind, data: q })} className="cyber-btn cyber-btn--ghost" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Edit</button>
                      <button onClick={() => remove(q.kind, q.id)} className="cyber-btn cyber-btn--ghost" style={{ padding: "6px 14px", fontSize: "0.68rem" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- REPORTS ---------- */}
        {!loading && tab === "reports" && (
          <>
            {statusTabs}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reports.length === 0 && <div className="glass-panel" style={{ padding: 36, textAlign: "center", color: "var(--text-mid)" }}>No reports in this view.</div>}
              {reports.map((r) => (
                <div key={r.id} className="hud-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <strong style={{ fontFamily: "var(--font-display)", color: "var(--accent)", textTransform: "capitalize" }}>{r.type.replace(/_/g, " ")}</strong>
                        <Badge text={r.status} tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"} />
                        {r.isVerified && <Badge text="verified" tone="green" />}
                        {r.locationApproximate && <Badge text="approx" tone="grey" />}
                      </div>
                      <div style={{ color: "var(--text-mid)", fontSize: "0.86rem" }}>📍 {r.address || `${r.lat}, ${r.lng}`} · {fmt(r.occurredAt)}</div>
                      {r.description && <div style={{ color: "var(--text-mid)", fontSize: "0.9rem", marginTop: 6 }}>{r.description}</div>}
                      <div style={{ color: "var(--text-dim)", fontSize: "0.76rem", marginTop: 8 }}>{submitterLine(r.user ?? null)}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      {r.status !== "approved" && <button onClick={() => patch("report", r.id, { status: "approved" })} className="cyber-btn cyber-btn--success" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Approve</button>}
                      {r.status !== "rejected" && <button onClick={() => patch("report", r.id, { status: "rejected" })} className="cyber-btn cyber-btn--danger" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Reject</button>}
                      {r.status === "approved" && <button onClick={() => patch("report", r.id, { status: "pending" })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Hide</button>}
                      <button onClick={() => patch("report", r.id, { isVerified: !r.isVerified })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>{r.isVerified ? "Unverify" : "Verify"}</button>
                      <button onClick={() => patch("report", r.id, { locationApproximate: !r.locationApproximate })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>{r.locationApproximate ? "Exact loc" : "Approx loc"}</button>
                      <button onClick={() => setEditing({ kind: "report", data: r })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Edit</button>
                      <button onClick={() => remove("report", r.id)} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- LOST & FOUND ---------- */}
        {!loading && tab === "lost & found" && (
          <>
            {statusTabs}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {lostItems.length === 0 && <div className="glass-panel" style={{ padding: 36, textAlign: "center", color: "var(--text-mid)" }}>No listings in this view.</div>}
              {lostItems.map((i) => {
                const imgs = i.imageUrls?.length ? i.imageUrls : i.imageUrl ? [i.imageUrl] : [];
                return (
                  <div key={i.id} className="hud-card" style={{ padding: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {imgs.length === 0 && <div style={{ width: 72, height: 72, borderRadius: 10, background: "rgba(217,164,91,0.1)", display: "grid", placeItems: "center" }}>📦</div>}
                      {imgs.map((src) => (
                        <div key={src} style={{ position: "relative" }}>
                          <a href={src} target="_blank" rel="noopener noreferrer" title="View full image">
                            <img src={src} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(217,164,91,0.35)" }} />
                          </a>
                          <button onClick={() => patch("lostItem", i.id, { removeImage: src })} title="Remove image" style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 999, border: "none", background: "#c9302c", color: "#fff", cursor: "pointer", fontSize: "0.7rem", lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>{i.title}</strong>
                        <Badge text={i.moderation} tone={i.moderation === "approved" ? "green" : i.moderation === "rejected" ? "red" : "amber"} />
                        <Badge text={i.status} tone={i.status === "returned" ? "green" : "grey"} />
                      </div>
                      <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: 6 }}>{i.category} · 📍 {i.location} · {fmt(i.dateLost)}</div>
                      {i.description && <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: 6 }}>{i.description}</div>}
                      <div style={{ color: "var(--text-dim)", fontSize: "0.76rem", marginTop: 6 }}>{submitterLine(i.owner ?? null)}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      {i.moderation !== "approved" && <button onClick={() => patch("lostItem", i.id, { moderation: "approved" })} className="cyber-btn cyber-btn--success" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Approve</button>}
                      {i.moderation !== "rejected" && <button onClick={() => patch("lostItem", i.id, { moderation: "rejected" })} className="cyber-btn cyber-btn--danger" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Reject</button>}
                      {i.status !== "returned" && <button onClick={() => patch("lostItem", i.id, { status: "returned" })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Mark returned</button>}
                      <button onClick={() => setEditing({ kind: "lostItem", data: i })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Edit</button>
                      <button onClick={() => remove("lostItem", i.id)} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---------- ALERTS ---------- */}
        {!loading && tab === "alerts" && (
          <>
            {statusTabs}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {alerts.length === 0 && <div className="glass-panel" style={{ padding: 36, textAlign: "center", color: "var(--text-mid)" }}>No alerts in this view.</div>}
              {alerts.map((a) => {
                const cat = alertCategory(a.category);
                const sev = severityInfo(a.severity);
                return (
                  <div key={a.id} className="hud-card" style={{ padding: 18, borderLeft: `3px solid ${cat.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span>{cat.emoji}</span>
                          <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>{a.title}</strong>
                          <Badge text={a.moderation} tone={a.moderation === "approved" ? "green" : a.moderation === "rejected" ? "red" : "amber"} />
                          <Badge text={a.status} tone={a.status === "active" ? "green" : "grey"} />
                          <Badge text={sev.label} tone={a.severity === 3 ? "red" : a.severity === 2 ? "amber" : "blue"} />
                          {a.isVerified && <Badge text="verified" tone="green" />}
                        </div>
                        <div style={{ color: "var(--text-mid)", fontSize: "0.86rem" }}>{cat.label} · 📍 {a.location} · {fmt(a.startsAt)}</div>
                        {a.description && <div style={{ color: "var(--text-mid)", fontSize: "0.9rem", marginTop: 6 }}>{a.description}</div>}
                        <div style={{ color: "var(--text-dim)", fontSize: "0.76rem", marginTop: 8 }}>{submitterLine(a.user ?? null)}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        {a.moderation !== "approved" && <button onClick={() => patch("alert", a.id, { moderation: "approved" })} className="cyber-btn cyber-btn--success" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Approve</button>}
                        {a.moderation !== "rejected" && <button onClick={() => patch("alert", a.id, { moderation: "rejected" })} className="cyber-btn cyber-btn--danger" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Reject</button>}
                        <button onClick={() => patch("alert", a.id, { status: a.status === "active" ? "resolved" : "active" })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>{a.status === "active" ? "Mark resolved" : "Re-activate"}</button>
                        <button onClick={() => patch("alert", a.id, { isVerified: !a.isVerified })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>{a.isVerified ? "Unverify" : "Verify"}</button>
                        <button onClick={() => setEditing({ kind: "alert", data: a })} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Edit</button>
                        <button onClick={() => remove("alert", a.id)} className="cyber-btn cyber-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.66rem" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---------- USERS ---------- */}
        {!loading && tab === "users" && (
          <>
            <input className="cyber-input" type="search" placeholder="🔍 Search users by name or email…" aria-label="Search users" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} style={{ maxWidth: 340, marginBottom: 14 }} />
            <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
              {users.filter((u) => { const q = userQuery.trim().toLowerCase(); return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q); }).map((u, i, arr) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid rgba(217,164,91,0.12)" : "none", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-hi)" }}>
                      {u.name} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {u.email}</span>
                      {u.emailVerified && <span title="Verified email" style={{ color: "var(--vine)", marginLeft: 6 }}>✓</span>}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: 2 }}>
                      {u.xp} XP · {u._count.reports} reports · {u._count.lostItems} listings · joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a href={`/profile/${u.id}`} target="_blank" rel="noopener noreferrer" className="cyber-btn cyber-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.66rem", textDecoration: "none" }}>Profile</a>
                  <button onClick={() => renameUser(u.id, u.name)} className="cyber-btn cyber-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.66rem" }}>Rename</button>
                  {u.banned && <Badge text="banned" tone="red" />}
                  <button onClick={() => toggleBan(u.id, !u.banned)} className={`cyber-btn ${u.banned ? "cyber-btn--success" : "cyber-btn--danger"}`} style={{ padding: "6px 14px", fontSize: "0.68rem" }}>{u.banned ? "Unban" : "Ban"}</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- AUDIT LOG ---------- */}
        {!loading && tab === "audit" && (
          <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
            {audit.length === 0 && <div style={{ padding: 36, textAlign: "center", color: "var(--text-mid)" }}>No admin actions recorded yet.</div>}
            {audit.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < audit.length - 1 ? "1px solid rgba(217,164,91,0.1)" : "none", flexWrap: "wrap", fontSize: "0.82rem" }}>
                <Badge text={a.action.replace(/_/g, " ")} tone={a.action.includes("deleted") || a.action.includes("rejected") || a.action.includes("banned") ? "red" : a.action.includes("approved") || a.action.includes("created") ? "green" : "grey"} />
                <span style={{ color: "var(--text-mid)" }}>{a.targetType} · {a.targetId.slice(0, 8)}…</span>
                <span style={{ color: "var(--text-dim)", marginLeft: "auto" }}>{a.label} · {fmt(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* ---------- CREATE ---------- */}
        {!loading && tab === "create" && (
          <CreateForms authHeaders={authHeaders} onCreated={() => loadTab("overview")} />
        )}
      </div>

      {editing && (
        <EditModal
          kind={editing.kind}
          data={editing.data}
          onClose={() => setEditing(null)}
          onSave={async (body) => { await patch(editing.kind, editing.data.id, body); setEditing(null); }}
        />
      )}
    </main>
  );
}

// ---------- Edit modal ----------
function EditModal({ kind, data, onClose, onSave }: { kind: string; data: any; onClose: () => void; onSave: (b: any) => void }) {
  const [form, setForm] = useState<any>(() => ({
    title: data.title ?? "",
    type: data.type ?? data.category ?? "",
    category: data.category ?? "",
    description: data.description ?? "",
    address: data.address ?? "",
    location: data.location ?? "",
    severity: data.severity ?? 2,
    lat: data.lat ?? "",
    lng: data.lng ?? "",
  }));
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const L = { display: "block", marginBottom: 6 } as const;

  const submit = () => {
    const body: any = {};
    if (kind === "report") {
      body.type = form.type; body.address = form.address; body.description = form.description;
      if (form.lat !== "") body.lat = form.lat; if (form.lng !== "") body.lng = form.lng;
    } else if (kind === "alert") {
      body.title = form.title; body.category = form.category; body.location = form.location;
      body.description = form.description; body.severity = Number(form.severity);
      if (form.lat !== "") body.lat = form.lat; if (form.lng !== "") body.lng = form.lng;
    } else {
      body.title = form.title; body.category = form.category; body.location = form.location; body.description = form.description;
    }
    onSave(body);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: 26, maxWidth: 520, width: "100%", maxHeight: "88vh", overflow: "auto" }}>
        <h3 className="cyber-title" style={{ margin: "0 0 16px", fontSize: "1.2rem" }}>Edit {kind === "lostItem" ? "listing" : kind}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(kind === "alert" || kind === "lostItem") && (
            <div><label className="cyber-label" style={L}>Title</label><input className="cyber-input" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          )}
          {kind === "report" && (
            <div><label className="cyber-label" style={L}>Type</label>
              <select className="cyber-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
                {CRIME_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select></div>
          )}
          {kind === "alert" && (
            <div><label className="cyber-label" style={L}>Category</label>
              <select className="cyber-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {ALERT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
              </select></div>
          )}
          {kind === "lostItem" && (
            <div><label className="cyber-label" style={L}>Category</label><input className="cyber-input" value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
          )}
          {kind === "alert" && (
            <div><label className="cyber-label" style={L}>Severity</label>
              <select className="cyber-select" value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                <option value={1}>Info</option><option value={2}>Caution</option><option value={3}>Danger</option>
              </select></div>
          )}
          <div><label className="cyber-label" style={L}>{kind === "report" ? "Address" : "Location"}</label>
            <input className="cyber-input" value={kind === "report" ? form.address : form.location} onChange={(e) => set(kind === "report" ? "address" : "location", e.target.value)} /></div>
          <div><label className="cyber-label" style={L}>Description</label>
            <textarea className="cyber-textarea" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          {(kind === "report" || kind === "alert") && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Lat</label><input className="cyber-input" value={form.lat} onChange={(e) => set("lat", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Lng</label><input className="cyber-input" value={form.lng} onChange={(e) => set("lng", e.target.value)} /></div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="cyber-btn cyber-btn--ghost">Cancel</button>
          <button onClick={submit} className="cyber-btn">Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Manual create ----------
function CreateForms({ authHeaders, onCreated }: { authHeaders: any; onCreated: () => void }) {
  const [kind, setKind] = useState<"alert" | "report" | "lostItem">("alert");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<any>({ category: "road_closure", severity: 2, type: "vehicle_theft", status: "found", title: "", location: "", address: "", description: "", lat: "", lng: "", sourceName: "", sourceUrl: "" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const L = { display: "block", marginBottom: 6 } as const;

  const submit = async () => {
    setMsg("");
    const endpoint = kind === "alert" ? "/api/admin/alerts" : kind === "report" ? "/api/admin/reports" : "/api/admin/lost-items";
    try {
      const res = await fetch(endpoint, { method: "POST", headers: authHeaders, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("✓ Created and published.");
      onCreated();
    } catch (e: any) { setMsg("⚠ " + e.message); }
  };

  return (
    <div className="glass-panel" style={{ padding: 26, maxWidth: 640 }}>
      <div className="tab-row" style={{ marginBottom: 18 }}>
        {(["alert", "report", "lostItem"] as const).map((k) => (
          <button key={k} className={`tab ${kind === k ? "active" : ""}`} onClick={() => setKind(k)}>{k === "lostItem" ? "lost/found" : k}</button>
        ))}
      </div>
      <div className="cyber-sub" style={{ marginBottom: 16 }}>Admin-created posts publish immediately (approved).</div>
      {msg && <div style={{ marginBottom: 14, color: msg.startsWith("✓") ? "var(--vine)" : "#c94f4f", fontWeight: 600 }}>{msg}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {kind === "report" ? (
          <div><label className="cyber-label" style={L}>Type</label>
            <select className="cyber-select" value={form.type} onChange={(e) => set("type", e.target.value)}>{CRIME_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></div>
        ) : kind === "alert" ? (
          <>
            <div><label className="cyber-label" style={L}>Category</label>
              <select className="cyber-select" value={form.category} onChange={(e) => set("category", e.target.value)}>{ALERT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}</select></div>
            <div><label className="cyber-label" style={L}>Severity</label>
              <select className="cyber-select" value={form.severity} onChange={(e) => set("severity", e.target.value)}><option value={1}>Info</option><option value={2}>Caution</option><option value={3}>Danger</option></select></div>
          </>
        ) : (
          <>
            <div><label className="cyber-label" style={L}>Category</label><input className="cyber-input" placeholder="electronics, keys…" value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
            <div><label className="cyber-label" style={L}>Status</label>
              <select className="cyber-select" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="found">Found</option><option value="lost">Lost</option><option value="returned">Returned</option></select></div>
          </>
        )}
        {kind !== "report" && <div><label className="cyber-label" style={L}>Title</label><input className="cyber-input" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>}
        <div><label className="cyber-label" style={L}>{kind === "report" ? "Address" : "Location"}</label>
          <input className="cyber-input" value={kind === "report" ? form.address : form.location} onChange={(e) => set(kind === "report" ? "address" : "location", e.target.value)} /></div>
        <div><label className="cyber-label" style={L}>Description</label><textarea className="cyber-textarea" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        {(kind === "report" || kind === "alert") && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Lat{kind === "report" ? " *" : ""}</label><input className="cyber-input" value={form.lat} onChange={(e) => set("lat", e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Lng{kind === "report" ? " *" : ""}</label><input className="cyber-input" value={form.lng} onChange={(e) => set("lng", e.target.value)} /></div>
          </div>
        )}
        {kind !== "lostItem" && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Source name</label><input className="cyber-input" value={form.sourceName} onChange={(e) => set("sourceName", e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="cyber-label" style={L}>Source URL</label><input className="cyber-input" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} /></div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={submit} className="cyber-btn">Create &amp; publish</button>
      </div>
    </div>
  );
}
