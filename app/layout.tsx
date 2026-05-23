import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
        <Navbar />
        <div style={{ flex: 1, overflow: "hidden" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
