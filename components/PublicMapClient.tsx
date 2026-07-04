"use client";

import dynamic from "next/dynamic";

const PublicMap = dynamic(() => import("./PublicMap"), {
  ssr: false,
  loading: () => (
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
  ),
});

export default function PublicMapClient() {
  return <PublicMap />;
}
