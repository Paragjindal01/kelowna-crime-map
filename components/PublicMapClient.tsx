"use client";

import dynamic from "next/dynamic";

const PublicMap = dynamic(() => import("./PublicMap"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function PublicMapClient() {
  return <PublicMap />;
}
