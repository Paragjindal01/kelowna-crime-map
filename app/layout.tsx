import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import type { Metadata } from "next";

const SITE_URL = process.env.APP_URL || "https://safekelowna.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SafeKelowna — Community Safety & Local Alerts",
    template: "%s — SafeKelowna",
  },
  description:
    "SafeKelowna is an independent community safety platform for Kelowna and the Central Okanagan — a public safety map, local alerts, and lost & found. Powered by GeoDASH.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SafeKelowna",
    title: "SafeKelowna — Community Safety & Local Alerts",
    description:
      "An independent community safety platform for Kelowna: public safety map, local alerts, and lost & found. Not affiliated with the RCMP or City of Kelowna.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "SafeKelowna — Community Safety & Local Alerts",
    description:
      "An independent community safety platform for Kelowna: public safety map, local alerts, and lost & found.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div className="cyber-bg" />
        <Navbar />
        {/* Natural document flow — pages scroll with the body and the footer
            always comes after the content, never pinned over it. */}
        <div style={{ flex: 1, position: "relative", zIndex: 1, minWidth: 0 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
