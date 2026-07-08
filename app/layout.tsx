import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "SafeKelowna — Community Safety & Local Alerts",
  description:
    "SafeKelowna is an independent community safety platform for Kelowna and the Central Okanagan — a public safety map, local alerts, and lost & found. Powered by GeoDASH.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
        <div className="cyber-bg" />
        <Navbar />
        <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
