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

type Camera = {
  name: string;
  type: string;
  lat: number;
  lng: number;
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

function getMarkerColor(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "camera") return "#8a5c8f";
  if (t.includes("vehicle")) return "#c96f4a";
  if (t.includes("break")) return "#d9a45b";
  if (t.includes("theft") || t.includes("shoplift")) return "#a04a68";
  if (t.includes("mischief") || t.includes("vandalism")) return "#e3c975";
  if (t.includes("assault")) return "#c94f4f";
  if (t.includes("fraud")) return "#7fa35c";
  return "#c98ba6";
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

function makeNeonIcon(type: string) {
  const color = getMarkerColor(type);
  const emoji = getIconEmoji(type);
  return L.divIcon({
    className: "",
    html: `<div class="neon-marker" style="--marker-color:${color}">
      <span class="neon-marker__ring"></span>
      <span class="neon-marker__core">${emoji}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
}

function makeClusterIcon(cluster: any) {
  return L.divIcon({
    className: "",
    html: `<div class="neon-cluster">${cluster.getChildCount()}</div>`,
    iconSize: L.point(38, 38),
  });
}

// User-submitted text goes into Leaflet popup HTML — escape it to prevent
// stored XSS via report addresses/descriptions.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(r: Report) {
  const color = getMarkerColor(r.type);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(r.occurredAt));

  return `
    <div style="font-family:var(--font-body); min-width:200px">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-family:var(--font-display); font-size:0.8rem; letter-spacing:0.08em; text-transform:uppercase; color:${color}; text-shadow:0 0 10px ${color}">
          ${getCleanLabel(r.type)}
        </span>
        <span title="Verified" style="color:#7fa35c; text-shadow:0 0 8px #7fa35c">✓</span>
      </div>
      <div style="margin-top:8px; font-size:0.95em; line-height:1.55; color:#f6ede1">
        <div><span style="color:#c0ab97">DATE //</span> ${date}</div>
        <div><span style="color:#c0ab97">AREA //</span> ${esc(r.address ?? "Unknown")} ${r.locationApproximate ? '<span style="color:#8d7460; font-size:0.85em;">(approx.)</span>' : ""}</div>
        ${r.sourceName ? `<div><span style="color:#c0ab97">SOURCE //</span> ${esc(r.sourceName)}</div>` : ""}
        ${r.description ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(217,164,91,0.18); color:#e3d3bf;">${esc(r.description)}</div>` : ""}
      </div>
    </div>
  `;
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
        color: "var(--accent)",
        textShadow: "0 0 8px rgba(217,164,91,0.6)",
      }}
    >
      {now
        ? now.toLocaleTimeString("en-US", {
            hour12: false,
            timeZone: "America/Vancouver",
          })
        : "--:--:--"}
    </span>
  );
}

export default function PublicMap() {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [daysBack, setDaysBack] = useState(365);

  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const cameraLayerRef = useRef<L.LayerGroup | null>(null);
  const geocoderAddedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

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
          if (Array.isArray(cameraData)) setCameras(cameraData);
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
        iconCreateFunction: makeClusterIcon,
      });

      clusterRef.current = clusterGroup;
      map.addLayer(clusterGroup);
    }

    // ✅ Camera layer only once
    if (!cameraLayerRef.current) {
      const cameraLayer = L.layerGroup();
      cameraLayerRef.current = cameraLayer;
      map.addLayer(cameraLayer);
    }

    setMapReady(true);
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
        icon: makeNeonIcon(r.type),
      });

      marker.bindPopup(popupHtml(r));
      cluster.addLayer(marker);
    }
  }, [filtered, mounted, mapReady]);

  // ✅ camera markers once cameras + map are both ready
  useEffect(() => {
    if (!mounted) return;

    const layer = cameraLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const cam of cameras) {
      L.marker([cam.lat, cam.lng], { icon: makeNeonIcon("camera") })
        .addTo(layer)
        .bindPopup(`
          <div style="font-family:var(--font-body)">
            <span style="font-family:var(--font-display); font-size:0.8rem; letter-spacing:0.08em; text-transform:uppercase; color:#a04a68; text-shadow:0 0 10px #a04a68">${esc(cam.name)}</span>
            <div style="margin-top:6px; color:#f6ede1"><span style="color:#c0ab97">TYPE //</span> ${esc(cam.type)}</div>
          </div>
        `);
    }
  }, [cameras, mounted, mapReady]);

  // ✅ Now it is SAFE to early-return AFTER hooks
  if (!mounted) {
    return (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-mono)",
          color: "var(--accent)",
          letterSpacing: "0.3em",
          textShadow: "0 0 12px rgba(217,164,91,0.6)",
        }}
      >
        INITIALIZING GRID...
      </div>
    );
  }

  const legendItems = [
    { label: "Vehicle Theft", type: "vehicle_theft" },
    { label: "Break & Enter", type: "break_enter" },
    { label: "Theft", type: "theft" },
    { label: "Mischief", type: "mischief" },
    { label: "Assault", type: "assault" },
    { label: "Fraud", type: "fraud" },
    { label: "Other", type: "other" },
    { label: "Camera", type: "camera" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", height: "100%" }}>
      {/* Sidebar */}
      <aside
        className="glass-panel"
        style={{
          borderRadius: 0,
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          padding: 18,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <h2 className="cyber-title" style={{ margin: 0, fontSize: "1.3rem" }}>
            Kelowna GeoDASH
          </h2>
          <div className="cyber-sub" style={{ marginTop: 6 }}>
            Public Safety Grid
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(217, 164, 91, 0.18)",
              background: "rgba(217, 164, 91, 0.05)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="live-dot" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "var(--vine)",
                }}
              >
                LIVE FEED
              </span>
            </span>
            <LiveClock />
          </div>
        </div>

        <div>
          <label className="cyber-label">Incident Type</label>
          <select
            className="cyber-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ marginTop: 6 }}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {getCleanLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cyber-label">Time Range</label>
          <select
            className="cyber-select"
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            style={{ marginTop: 6 }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 1 year</option>
            <option value={3650}>All time</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="hud-card" style={{ textAlign: "center" }}>
            <div className="cyber-label">Reports</div>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--accent)",
                textShadow: "0 0 14px rgba(217,164,91,0.6)",
              }}
            >
              {loading ? "··" : filtered.length}
            </div>
          </div>
          <div className="hud-card" style={{ textAlign: "center" }}>
            <div className="cyber-label">Cameras</div>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--wine)",
                textShadow: "0 0 14px rgba(160,74,104,0.7)",
              }}
            >
              {loading ? "··" : cameras.length}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255, 45, 85, 0.45)",
              background: "rgba(255, 45, 85, 0.1)",
              color: "#c94f4f",
              fontSize: "0.9em",
              textShadow: "0 0 8px rgba(201,79,79,0.5)",
            }}
          >
            ⚠ {errorMsg}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div className="cyber-label" style={{ marginBottom: 8 }}>
            Legend
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {legendItems.map((item) => {
              const color = getMarkerColor(item.type);
              return (
                <span
                  key={item.type}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 11px",
                    borderRadius: 999,
                    border: `1px solid ${color}55`,
                    background: `${color}12`,
                    fontSize: "0.85em",
                    fontWeight: 600,
                    color: "var(--text-hi)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div
          style={{
            paddingTop: 14,
            borderTop: "1px solid rgba(217, 164, 91, 0.15)",
            fontSize: "0.8em",
            color: "var(--text-dim)",
            lineHeight: 1.55,
          }}
        >
          <b style={{ color: "var(--text-mid)" }}>About the data:</b> Pins come from
          community-submitted reports and public news reports (with a source link on each). Locations
          are approximate — often a block or intersection, not an exact address.
          <br />
          <br />
          <b style={{ color: "var(--text-mid)" }}>Disclaimer:</b> Kelowna GeoDASH is an independent
          public-safety dashboard, not an official RCMP, City of Kelowna, or police website. For
          emergencies call 911.
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />

          <MapSetup onReady={onMapReady} />
        </MapContainer>

        {/* vignette overlay for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 500,
            pointerEvents: "none",
            boxShadow: "inset 0 0 120px rgba(0, 0, 0, 0.65), inset 0 0 40px rgba(217, 164, 91, 0.06)",
          }}
        />
      </div>
    </div>
  );
}
