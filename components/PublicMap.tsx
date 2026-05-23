"use client";

import "leaflet/dist/leaflet.css";

// markercluster styles (works with leaflet.markercluster)
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// geocoder styles
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet-control-geocoder"; // ✅ IMPORTANT: correct import (no /dist/... path)

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useMap } from "react-leaflet";

function MapSetup({
  onReady,
}: {
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

type Report = {
  id: string;
  type: string;
  status: string;
  occurredAt: string;
  lat: number;
  lng: number;
  address?: string | null;
  description?: string | null;
  isVerified?: boolean;
  sourceName?: string | null;
  locationApproximate?: boolean;
};

const kelownaCenter: [number, number] = [49.888, -119.496];

function getIconEmoji(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "camera") return "📹";
  if (t.includes("vehicle")) return "🚗";
  if (t.includes("break")) return "🏠";
  if (t.includes("theft") || t.includes("shoplift")) return "🛍️";
  if (t.includes("mischief") || t.includes("vandalism")) return "⚠️";
  if (t.includes("assault")) return "🚨";
  if (t.includes("fraud")) return "💳";
  return "📍";
}

function getCleanLabel(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "all") return "All Types";
  if (t === "camera") return "Camera";
  if (t.includes("vehicle")) return "Vehicle Theft";
  if (t.includes("break")) return "Break & Enter";
  if (t.includes("theft") || t.includes("shoplift")) return "Theft";
  if (t.includes("mischief") || t.includes("vandalism")) return "Mischief";
  if (t.includes("assault")) return "Assault";
  if (t.includes("fraud")) return "Fraud";
  return "Other";
}

function makeEmojiIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      font-size: 20px;
      line-height: 1;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    ">${emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function PublicMap() {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [daysBack, setDaysBack] = useState(365);

  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const geocoderAddedRef = useRef(false);

  // ✅ mount gate (prevents hydration + map init issues)
  useEffect(() => {
    setMounted(true);
  }, []);

// fetch reports + cameras
useEffect(() => {
  let cancelled = false;

  (async () => {
    setLoading(true);
    try {
      // Fetch reports
      const res = await fetch("/api/reports");
      const rawData = await res.json();
      
      let reportData: Report[] = [];
      if (Array.isArray(rawData)) {
        reportData = rawData;
      } else if (rawData && Array.isArray(rawData.reports)) {
        reportData = rawData.reports;
      } else if (rawData && rawData.error) {
        console.error("API error:", rawData.error);
        if (!cancelled) setErrorMsg("Reports could not be loaded. Check database connection.");
      } else {
        if (!cancelled) setErrorMsg("Reports could not be loaded. Check database connection.");
      }

      // Fetch cameras
      const camRes = await fetch("/api/cameras");
      const cameraData = await camRes.json();

      if (!cancelled) {
        setReports(reportData);

        // Add camera markers
        if (Array.isArray(cameraData)) {
          cameraData.forEach((cam: any) => {
            L.marker([cam.lat, cam.lng], {
              icon: makeEmojiIcon("📹"),
            })
              .addTo(mapRef.current!)
              .bindPopup(`<b>${cam.name}</b><br/>Type: ${cam.type}`);
          });
        }
      }

    } catch (e) {
      console.error(e);
      if (!cancelled) {
        setErrorMsg("Reports could not be loaded. Check database connection.");
        setReports([]);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, []);

  const types = useMemo(() => {
    const s = new Set((reports || []).map((r) => r.type).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [reports]);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    return (reports || []).filter((r) => {
      const okStatus = (r.status || "").toLowerCase() === "approved";
      const okType = typeFilter === "all" ? true : r.type === typeFilter;
      const okDate = new Date(r.occurredAt).getTime() >= cutoff;
      return okStatus && okType && okDate && Number.isFinite(r.lat) && Number.isFinite(r.lng);
    });
  }, [reports, typeFilter, daysBack]);

  // called once when map is ready
  function onMapReady(map: L.Map) {
    mapRef.current = map;

    // ✅ Add geocoder only once
    if (!geocoderAddedRef.current) {
      geocoderAddedRef.current = true;

      // @ts-ignore
      const geocoder = L.Control.geocoder({
        defaultMarkGeocode: true,
        position: "topright",
        placeholder: "Address Search...",
      });

      geocoder.addTo(map);
    }

    // ✅ Create cluster layer only once
    if (!clusterRef.current) {
      const clusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
      });

      clusterRef.current = clusterGroup;
      map.addLayer(clusterGroup);
    }
  }

  // ✅ rebuild markers whenever filtered changes
  // NOTE: This hook must ALWAYS run (no early return above hooks)
  useEffect(() => {
    if (!mounted) return;

    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();

    for (const r of filtered) {
      const marker = L.marker([r.lat, r.lng], {
        icon: makeEmojiIcon(getIconEmoji(r.type)),
      });

      marker.bindPopup(`
        <div style="font-weight:700">${getCleanLabel(r.type)} <span title="Verified" style="color:#22c55e">✓</span></div>
        <div style="margin-top:6px">
          <div><b>Date:</b> ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Vancouver', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(r.occurredAt))}</div>
          <div><b>Area:</b> ${r.address ?? "Unknown"} ${r.locationApproximate ? '<span style="color:#64748b; font-size:0.85em;">(Approximate)</span>' : ''}</div>
          ${r.sourceName ? `<div style="margin-top:4px"><b>Source:</b> ${r.sourceName}</div>` : ''}
          <div style="margin-top:6px; font-size:0.95em;">${r.description ?? ""}</div>
        </div>
      `);

      cluster.addLayer(marker);
    }
  }, [filtered, mounted]);

  // ✅ Now it is SAFE to early-return AFTER hooks
  if (!mounted) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100%" }}>
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid #e5e5e5", padding: 16, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div>
          <h2 style={{ margin: 0 }}>Kelowna GeoDASH</h2>
          <div style={{ fontWeight: 600, color: "#1e293b", marginTop: 4 }}>Independent Public Safety Map</div>
          <p style={{ marginTop: 8, color: "#555", fontSize: "0.95em" }}>Verified public safety reports across Kelowna.</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600 }}>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {getCleanLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600 }}>Time Range</label>
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 1 year</option>
            <option value={3650}>All time</option>
          </select>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
          <div style={{ fontWeight: 700 }}>Results</div>
          <div style={{ marginTop: 6 }}>{loading ? "Loading…" : `${filtered.length} reports`}</div>
          {errorMsg && (
            <div style={{ marginTop: 8, color: "#d0021b", fontSize: "0.9em" }}>
              {errorMsg}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Legend</div>
          {[
            { label: "Vehicle Theft", type: "vehicle_theft" },
            { label: "Break & Enter", type: "break_enter" },
            { label: "Theft", type: "theft" },
            { label: "Mischief", type: "mischief" },
            { label: "Assault", type: "assault" },
            { label: "Fraud", type: "fraud" },
            { label: "Other", type: "other" },
            { label: "Camera", type: "camera" }
          ].map((item) => (
            <div key={item.type} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: "20px" }}>{getIconEmoji(item.type)}</span>
              <span style={{ color: "#333", fontSize: "0.95em" }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: "0.8em", color: "#64748b", lineHeight: 1.5 }}>
          <b>Disclaimer:</b> Kelowna GeoDASH is an independent public-safety dashboard and is not an official RCMP, City of Kelowna, or police website. Incident locations may be approximate.
        </div>
      </aside>

      {/* Map */}
      <div style={{ position: "relative" }}>
        <MapContainer
  center={kelownaCenter}
  zoom={12}
  style={{ height: "100%", width: "100%" }}
  zoomControl={false}
>
  <ZoomControl position="topleft" />

  <TileLayer
    attribution="&copy; OpenStreetMap contributors"
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  <MapSetup onReady={onMapReady} />
</MapContainer>

      </div>
    </div>
  );
}
