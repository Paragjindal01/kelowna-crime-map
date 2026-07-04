"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, display: "grid", placeItems: "center", color: "var(--text-dim)", border: "1px solid rgba(217,164,91,0.2)", borderRadius: 10 }}>
      Loading map…
    </div>
  ),
});

export default function ReportPage() {
  const [formData, setFormData] = useState({
    type: "vehicle_theft",
    occurredAt: "",
    address: "",
    description: "",
    lat: "",
    lng: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

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

      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
      setFormData({
        type: "vehicle_theft",
        occurredAt: "",
        address: "",
        description: "",
        lat: "",
        lng: "",
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "40px 24px" }}>
      <div className="glass-panel" style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
        <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.5rem" }}>
          Submit a Report
        </h1>
        <div className="cyber-sub" style={{ marginTop: 8, marginBottom: 26 }}>
          Incident Intake // Reviewed Before Publishing
        </div>

        {status === "success" && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid rgba(0, 255, 157, 0.45)",
              background: "rgba(0, 255, 157, 0.08)",
              color: "var(--vine)",
              marginBottom: 24,
              fontWeight: 600,
              textShadow: "0 0 8px rgba(127,163,92,0.5)",
            }}
          >
            ✓ Transmission received — submitted for review.
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255, 45, 85, 0.45)",
              background: "rgba(255, 45, 85, 0.08)",
              color: "#c94f4f",
              marginBottom: 24,
              fontWeight: 600,
              textShadow: "0 0 8px rgba(201,79,79,0.5)",
            }}
          >
            ⚠ Transmission failed. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Incident Type</label>
            <select name="type" value={formData.type} onChange={handleChange} required className="cyber-select">
              <option value="vehicle_theft">Vehicle Theft</option>
              <option value="theft_from_vehicle">Theft from Vehicle</option>
              <option value="residential_break_enter">Residential Break & Enter</option>
              <option value="commercial_break_enter">Commercial Break & Enter</option>
              <option value="shoplifting">Shoplifting</option>
              <option value="package_theft">Package Theft</option>
              <option value="bicycle_theft">Bicycle Theft</option>
              <option value="vandalism_mischief">Vandalism / Mischief</option>
              <option value="trespassing">Trespassing</option>
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="assault">Assault</option>
              <option value="harassment_threats">Harassment / Threats</option>
            </select>
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Date and Time</label>
            <input
              type="datetime-local"
              name="occurredAt"
              value={formData.occurredAt}
              onChange={handleChange}
              required
              className="cyber-input"
              style={{ colorScheme: "dark" }}
            />
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Address or Location</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, Kelowna"
              required
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>
              Pin the location — click the map
            </label>
            <LocationPicker
              lat={formData.lat ? parseFloat(formData.lat) : null}
              lng={formData.lng ? parseFloat(formData.lng) : null}
              onChange={(lat, lng) =>
                setFormData((f) => ({ ...f, lat: String(lat), lng: String(lng) }))
              }
            />
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: 6 }}>
              A street or block-level location is enough — please don't pinpoint exact home addresses.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Latitude</label>
              <input
                type="number"
                step="any"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                placeholder="49.888"
                required
                className="cyber-input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Longitude</label>
              <input
                type="number"
                step="any"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                placeholder="-119.496"
                required
                className="cyber-input"
              />
            </div>
          </div>

          <div>
            <label className="cyber-label" style={{ display: "block", marginBottom: 8 }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide additional details..."
              rows={4}
              className="cyber-textarea"
            />
          </div>

          <button type="submit" disabled={status === "submitting"} className="cyber-btn" style={{ marginTop: 8 }}>
            {status === "submitting" ? "Transmitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </main>
  );
}
