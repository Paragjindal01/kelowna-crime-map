"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

const kelownaCenter: [number, number] = [49.888, -119.496];

function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="neon-marker" style="--marker-color:#d9a45b">
      <span class="neon-marker__ring"></span>
      <span class="neon-marker__core">📍</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(kelownaCenter, 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { icon: pinIcon() }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      onChangeRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // keep marker in sync when fields are edited manually
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon() }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 260,
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(217, 164, 91, 0.3)",
        cursor: "crosshair",
      }}
    />
  );
}
