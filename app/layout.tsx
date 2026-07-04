import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "Kelowna GeoDASH — Community Safety & Lost + Found",
  description:
    "Community-run safety map and lost & found for Kelowna and the Okanagan.",
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
