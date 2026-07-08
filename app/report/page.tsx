"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, display: "grid", placeItems: "center", color: "var(--text-dim)", border: "1px solid var(--glass-border)", borderRadius: 8 }}>
      Loading map…
    </div>
  ),
});

const TYPE_LABELS: Record<string, string> = {
  vehicle_theft: "Vehicle Theft",
  theft_from_vehicle: "Theft from Vehicle",
  residential_break_enter: "Residential Break & Enter",
  commercial_break_enter: "Commercial Break & Enter",
  shoplifting: "Shoplifting",
  package_theft: "Package Theft",
  bicycle_theft: "Bicycle Theft",
  vandalism_mischief: "Vandalism / Mischief",
  trespassing: "Trespassing",
  suspicious_activity: "Suspicious Activity",
  assault: "Assault",
  harassment_threats: "Harassment / Threats",
};

const empty = { type: "vehicle_theft", occurredAt: "", address: "", description: "", lat: "", lng: "" };

export default function ReportPage() {
  const [formData, setFormData] = useState(empty);
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: validate and move to the preview screen (nothing saved yet).
  const goToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setShowPreview(true);
  };

  // Step 2: actually submit for review.
  const submitForReview = async () => {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const payload = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        occurredAt: new Date(formData.occurredAt).toISOString(),
      };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus("success");
      setFormData(empty);
      setShowPreview(false);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const fmtDate = (v: string) => (v ? new Date(v).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—");

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "40px 24px" }}>
      <div className="glass-panel" style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
        <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.6rem" }}>Submit a Report</h1>
        <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 26 }}>
          Incident intake · reviewed before publishing
        </div>

        {status === "success" && (
          <div style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #cfe6cf", background: "#eaf4ea", color: "#2e7d32", marginBottom: 24, fontWeight: 600 }}>
            ✓ Thank you — your report was submitted for review and will appear once approved.
          </div>
        )}
        {status === "error" && (
          <div style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #f0c8c4", background: "#fdeceb", color: "#b42318", marginBottom: 24, fontWeight: 600 }}>
            ⚠ {errorMsg || "Something went wrong. Please try again."}
          </div>
        )}

        {/* ---------- PREVIEW ---------- */}
        {showPreview ? (
          <div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f1efe8", border: "1px solid var(--glass-border)", color: "var(--text-mid)", fontSize: "0.85rem", marginBottom: 20 }}>
              Please review your report before submitting. Nothing is saved until you choose <strong>Submit for Review</strong>.
            </div>
            <div className="hud-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-hi)" }}>{TYPE_LABELS[formData.type]}</strong>
                <span className="status-pill status-pill--pending">Pending admin approval</span>
              </div>
              <dl style={{ margin: "14px 0 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "0.92rem" }}>
                <dt style={{ color: "var(--text-mid)" }}>Category</dt><dd style={{ margin: 0 }}>{TYPE_LABELS[formData.type]}</dd>
                <dt style={{ color: "var(--text-mid)" }}>Date</dt><dd style={{ margin: 0 }}>{fmtDate(formData.occurredAt)}</dd>
                <dt style={{ color: "var(--text-mid)" }}>Location</dt><dd style={{ margin: 0 }}>{formData.address || "—"} <span style={{ color: "var(--text-dim)" }}>(approx. {formData.lat}, {formData.lng})</span></dd>
                <dt style={{ color: "var(--text-mid)" }}>Description</dt><dd style={{ margin: 0 }}>{formData.description || "—"}</dd>
              </dl>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowPreview(false)} className="cyber-btn cyber-btn--ghost">Edit</button>
              <button onClick={submitForReview} disabled={status === "submitting"} className="cyber-btn">
                {status === "submitting" ? "Submitting…" : "Submit for Review"}
              </button>
            </div>
          </div>
        ) : (
        /* ---------- FORM ---------- */
        <form onSubmit={goToPreview} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Incident Type</label>
            <select name="type" value={formData.type} onChange={handleChange} required className="cyber-select">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Date and Time</label>
            <input type="datetime-local" name="occurredAt" value={formData.occurredAt} onChange={handleChange} required className="cyber-input" />
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Address or Location</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="e.g. 100-block Bernard Ave, Kelowna" required className="cyber-input" />
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Pin the location — click the map</label>
            <LocationPicker
              lat={formData.lat ? parseFloat(formData.lat) : null}
              lng={formData.lng ? parseFloat(formData.lng) : null}
              onChange={(lat, lng) => setFormData((f) => ({ ...f, lat: String(lat), lng: String(lng) }))}
            />
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: 6 }}>
              A street or block-level location is enough — please don't pinpoint exact home addresses.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Latitude</label>
              <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} placeholder="49.888" required className="cyber-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Longitude</label>
              <input type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} placeholder="-119.496" required className="cyber-input" />
            </div>
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Provide additional details…" rows={4} className="cyber-textarea" />
          </div>

          <button type="submit" className="cyber-btn" style={{ marginTop: 8 }}>Preview report</button>
        </form>
        )}
      </div>
    </main>
  );
}
