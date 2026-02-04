import PublicMapClient from "../components/PublicMapClient";

export default function HomePage() {
  return (
    <main style={{ padding: "16px" }}>
      <h1>Kelowna Crime Map</h1>
      <p>Approved crime reports across Kelowna.</p>
      <PublicMapClient />
    </main>
  );
}
