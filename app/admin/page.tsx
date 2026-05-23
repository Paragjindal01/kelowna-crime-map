"use client";

import { useEffect, useState } from "react";

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

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports", {
        headers: { "x-admin-key": key },
      });

      if (res.status === 401) {
        throw new Error("Invalid Admin Key");
      }
      
      if (!res.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await res.json();
      setReports(data);
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
    fetchReports(adminKey);
  };

  const updateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <main style={{ padding: "32px", maxWidth: "400px", margin: "40px auto", fontFamily: "sans-serif" }}>
        <h2>Admin Login</h2>
        {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="password"
            placeholder="Enter Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            required
          />
          <button type="submit" disabled={loading} style={{ padding: "10px", backgroundColor: "#1e293b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Moderation Dashboard</h1>
        <button onClick={() => fetchReports(adminKey)} style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc" }}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading reports...</p>}

      {!loading && reports.length === 0 && (
        <p>No pending reports to review.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {reports.map((report) => (
          <div key={report.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <strong style={{ fontSize: "1.1rem", color: "#1e293b" }}>{report.type}</strong>
                <span style={{ color: "#64748b", marginLeft: "8px", fontSize: "0.9rem" }}>
                  {new Date(report.occurredAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => updateStatus(report.id, "approved")}
                  style={{ backgroundColor: "#22c55e", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(report.id, "rejected")}
                  style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Reject
                </button>
              </div>
            </div>
            <div style={{ fontSize: "0.95rem", color: "#334155", marginBottom: "8px" }}>
              <strong>Address:</strong> {report.address || "N/A"} <br/>
              <strong>Coordinates:</strong> {report.lat}, {report.lng}
            </div>
            {report.description && (
              <div style={{ padding: "8px", backgroundColor: "#f8fafc", borderRadius: "4px", fontSize: "0.9rem", color: "#475569" }}>
                {report.description}
              </div>
            )}
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "8px" }}>
              Submitted: {new Date(report.createdAt).toLocaleString()} | ID: {report.id}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}