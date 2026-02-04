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
};

const kelownaCenter: [number, number] = [49.888, -119.496];

function getColor(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("vehicle")) return "#2d7ff9";
  if (t.includes("bicycle")) return "#2d7ff9";
  if (t.includes("theft")) return "#2d7ff9";
  if (t.includes("break")) return "#f5a623";
  if (t.includes("assault")) return "#d0021b";
  if (t.includes("mischief")) return "#7b61ff";
  return "#4a4a4a";
}

function makeDotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function PublicMap() {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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

  // fetch reports
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/reports");
        const data = (await res.json()) as Report[];
        if (!cancelled) setReports(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => {
    const s = new Set(reports.map((r) => r.type).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [reports]);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    return reports.filter((r) => {
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
        icon: makeDotIcon(getColor(r.type)),
      });

      marker.bindPopup(`
        <div style="font-weight:700">${r.type}</div>
        <div style="margin-top:6px">
          <div><b>Date:</b> ${new Date(r.occurredAt).toLocaleDateString()}</div>
          <div><b>Area:</b> ${r.address ?? "Unknown"}</div>
          <div style="margin-top:6px">${r.description ?? ""}</div>
        </div>
      `);

      cluster.addLayer(marker);
    }
  }, [filtered, mounted]);

  // ✅ Now it is SAFE to early-return AFTER hooks
  if (!mounted) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid #e5e5e5", padding: 16, overflow: "auto" }}>
        <h2 style={{ margin: 0 }}>Search for Occurrences</h2>
        <p style={{ marginTop: 8, color: "#555" }}>Approved reports across Kelowna.</p>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600 }}>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
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
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700 }}>Legend</div>
          {["vehicle_theft", "bicycle_theft", "break_enter", "assault", "mischief"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: getColor(t),
                  border: "2px solid white",
                  boxShadow: "0 1px 4px rgba(0,0,0,.35)",
                }}
              />
              <span style={{ color: "#333" }}>{t}</span>
            </div>
          ))}
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
