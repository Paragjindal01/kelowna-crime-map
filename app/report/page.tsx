"use client";

import { useState } from "react";

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
    <main style={{ padding: "32px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "24px" }}>Submit a Crime Report</h1>
      
      {status === "success" && (
        <div style={{ padding: "16px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "8px", marginBottom: "24px" }}>
          Submitted for review.
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "24px" }}>
          An error occurred while submitting your report. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Incident Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
          >
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
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Date and Time</label>
          <input
            type="datetime-local"
            name="occurredAt"
            value={formData.occurredAt}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Address or Location</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, Kelowna"
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Latitude</label>
            <input
              type="number"
              step="any"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              placeholder="49.888"
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Longitude</label>
            <input
              type="number"
              step="any"
              name="lng"
              value={formData.lng}
              onChange={handleChange}
              placeholder="-119.496"
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide additional details..."
            rows={4}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            marginTop: "8px",
            padding: "12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: status === "submitting" ? "not-allowed" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
          }}
        >
          {status === "submitting" ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </main>
  );
}