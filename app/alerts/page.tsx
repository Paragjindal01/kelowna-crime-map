"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ALERT_CATEGORIES, alertCategory, severityInfo } from "@/lib/categories";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--text-dim)", border: "1px solid var(--glass-border)", borderRadius: 8 }}>
      Loading map…
    </div>
  ),
});

type Alert = {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  location: string;
  lat?: number | null;
  lng?: number | null;
  severity: number;
  status: "active" | "resolved";
  startsAt: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  isVerified: boolean;
  locationApproximate: boolean;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; name: string; verified?: boolean } | null;
};

type Me = { id: string; name: string; emailVerified?: boolean } | null;

const TIME_FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "all", label: "All Time" },
];

function AlertCard({ alert, me, index, onStatusChange }: {
  alert: Alert;
  me: Me;
  index: number;
  onStatusChange: (id: string, status: "active" | "resolved") => void;
}) {
  const cat = alertCategory(alert.category);
  const sev = severityInfo(alert.severity);
  const isMine = me && alert.reporter?.id === me.id;

  return (
    <div
      className="glass-panel"
      style={{
        padding: "18px 20px",
        borderLeft: `3px solid ${cat.color}`,
        animation: "fadeUp 0.5s ease both",
        animationDelay: `${Math.min(index * 0.05, 0.4)}s`,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ fontSize: "1.8rem" }} aria-hidden>{cat.emoji}</span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.12rem", fontWeight: 700, color: "var(--text-hi)" }}>
              {alert.title}
            </span>
            <span className={`status-pill ${alert.status === "active" ? "status-pill--lost" : "status-pill--returned"}`}>
              {alert.status}
            </span>
            <span
              className="status-pill"
              style={{ background: `${sev.color}22`, color: sev.color, border: `1px solid ${sev.color}66` }}
            >
              {sev.label}
            </span>
            {alert.isVerified && (
              <span className="status-pill status-pill--returned" title="Confirmed by an official source">✔ Verified</span>
            )}
          </div>

          <div style={{ color: "var(--text-mid)", fontSize: "0.88rem", marginTop: 6 }}>
            <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>
            {" · 📍 "}
            {alert.location}
            {alert.locationApproximate && <span style={{ color: "var(--text-dim)" }}> (approximate)</span>}
          </div>

          {alert.description && (
            <div style={{ color: "var(--text-mid)", fontSize: "0.93rem", lineHeight: 1.6, marginTop: 8 }}>
              {alert.description}
            </div>
          )}

          <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>
              {new Date(alert.startsAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
            {alert.sourceName && (
              <span>
                Source:{" "}
                {alert.sourceUrl ? (
                  <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                    {alert.sourceName}
                  </a>
                ) : (
                  alert.sourceName
                )}
              </span>
            )}
            {alert.reporter && (
              <span>
                by{" "}
                <Link href={`/profile/${alert.reporter.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                  {alert.reporter.name}
                </Link>
                {alert.reporter.verified && <span style={{ color: "var(--vine)" }}> ✓</span>}
              </span>
            )}
            <span>Updated {new Date(alert.updatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
          </div>
        </div>

        {isMine && (
          <button
            className="cyber-btn cyber-btn--ghost"
            style={{ padding: "7px 14px", fontSize: "0.68rem" }}
            onClick={() => onStatusChange(alert.id, alert.status === "active" ? "resolved" : "active")}
          >
            {alert.status === "active" ? "Mark resolved" : "Re-activate"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState("week");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ category: "road_closure", title: "", location: "", description: "", severity: 2, lat: "", lng: "" });
  const [submitState, setSubmitState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const load = () =>
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAlerts(d))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return alerts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (catFilter !== "all" && a.category !== catFilter) return false;
      const t = new Date(a.startsAt).getTime();
      if (timeFilter === "today" && now - t > dayMs) return false;
      if (timeFilter === "week" && now - t > 7 * dayMs) return false;
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.location.toLowerCase().includes(q) &&
        !(a.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [alerts, timeFilter, statusFilter, catFilter, query]);

  const setStatus = async (id: string, status: "active" | "resolved") => {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const goToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("idle");
    setShowPreview(true);
  };

  const submitForReview = async () => {
    setSubmitState("busy");
    setSubmitError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: form.lat || null,
          lng: form.lng || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitState("done");
      setForm({ category: "road_closure", title: "", location: "", description: "", severity: 2, lat: "", lng: "" });
      setShowPreview(false);
    } catch (err: any) {
      setSubmitError(err.message);
      setSubmitState("error");
    }
  };

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "36px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="cyber-title" style={{ margin: 0, fontSize: "2rem" }}>Community Alerts</h1>
            <div className="cyber-sub" style={{ marginTop: 8 }}>
              Road closures · hazards · outages · notices
            </div>
          </div>
          {me ? (
            <button className="cyber-btn" onClick={() => setFormOpen(!formOpen)}>
              {formOpen ? "Close form" : "＋ Report an alert"}
            </button>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <span className="cyber-btn" style={{ display: "inline-block" }}>Sign in to report</span>
            </Link>
          )}
        </div>

        {formOpen && me && (
          <div className="glass-panel" style={{ padding: 26, marginBottom: 28 }}>
            <div className="cyber-sub" style={{ marginBottom: 18 }}>
              New alert · reviewed by moderators before going live
            </div>
            {submitState === "done" && (
              <div style={{ color: "var(--success)", fontWeight: 600, marginBottom: 16 }}>
                ✓ Submitted! Your alert will appear once approved.
              </div>
            )}
            {submitState === "error" && (
              <div style={{ color: "var(--danger)", fontWeight: 600, marginBottom: 16 }}>⚠ {submitError}</div>
            )}
            <form onSubmit={goToPreview} style={{ display: showPreview ? "none" : "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Category</label>
                <select className="cyber-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {ALERT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Severity</label>
                <select className="cyber-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}>
                  <option value={1}>ℹ️ Info</option>
                  <option value={2}>⚠️ Caution</option>
                  <option value={3}>🚨 Danger</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>What's happening?</label>
                <input className="cyber-input" required maxLength={100} placeholder="Water main break on Ellis Street" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Where?</label>
                <input className="cyber-input" required maxLength={150} placeholder="Ellis St between Doyle and Queensway" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Details (optional)</label>
                <textarea className="cyber-textarea" rows={3} maxLength={1000} placeholder="What should neighbours know?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>
                  Pin on map (optional — click to set)
                </label>
                <LocationPicker
                  lat={form.lat ? parseFloat(form.lat) : null}
                  lng={form.lng ? parseFloat(form.lng) : null}
                  onChange={(lat, lng) => setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))}
                />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="cyber-btn">Preview alert</button>
              </div>
            </form>

            {showPreview && (
              <div>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f1efe8", border: "1px solid var(--glass-border)", color: "var(--text-mid)", fontSize: "0.85rem", marginBottom: 18 }}>
                  Review your alert before submitting. Nothing is saved until you choose <strong>Submit for Review</strong>.
                </div>
                <div className="hud-card" style={{ padding: 20, borderLeft: `3px solid ${alertCategory(form.category).color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-hi)" }}>
                      {alertCategory(form.category).emoji} {form.title || "—"}
                    </strong>
                    <span className="status-pill status-pill--pending">Pending admin approval</span>
                  </div>
                  <dl style={{ margin: "14px 0 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "0.92rem" }}>
                    <dt style={{ color: "var(--text-mid)" }}>Category</dt><dd style={{ margin: 0 }}>{alertCategory(form.category).label}</dd>
                    <dt style={{ color: "var(--text-mid)" }}>Severity</dt><dd style={{ margin: 0 }}>{severityInfo(form.severity).label}</dd>
                    <dt style={{ color: "var(--text-mid)" }}>Location</dt><dd style={{ margin: 0 }}>{form.location || "—"} <span style={{ color: "var(--text-dim)" }}>(approximate)</span></dd>
                    <dt style={{ color: "var(--text-mid)" }}>Details</dt><dd style={{ margin: 0 }}>{form.description || "—"}</dd>
                  </dl>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowPreview(false)} className="cyber-btn cyber-btn--ghost">Edit</button>
                  <button onClick={submitForReview} disabled={submitState === "busy"} className="cyber-btn">
                    {submitState === "busy" ? "Submitting…" : "Submit for Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div className="tab-row">
              {TIME_FILTERS.map((t) => (
                <button key={t.key} className={`tab ${timeFilter === t.key ? "active" : ""}`} onClick={() => setTimeFilter(t.key)}>
                  {t.label}
                </button>
              ))}
              {["all", "active", "resolved"].map((s) => (
                <button key={s} className={`tab ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              className="cyber-input"
              style={{ maxWidth: 280 }}
              type="search"
              placeholder="🔍 Search street, area, keyword…"
              aria-label="Search alerts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className="cyber-select" style={{ maxWidth: 240 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {ALERT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-mid)" }}>Loading alerts…</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: 48, textAlign: "center", color: "var(--text-mid)" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>🕊️</div>
            No alerts match these filters — all quiet in the Okanagan.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((a, i) => (
              <AlertCard key={a.id} alert={a} me={me} index={i} onStatusChange={setStatus} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 30, textAlign: "center", color: "var(--text-dim)", fontSize: "0.82rem", lineHeight: 1.6 }}>
          Alerts are community-submitted or sourced from public reports, reviewed before publication.
          Locations may be approximate. <strong style={{ color: "var(--text-mid)" }}>In an emergency, always call 911.</strong>
        </div>
      </div>
    </main>
  );
}
