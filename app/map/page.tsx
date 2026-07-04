import PublicMapClient from "../../components/PublicMapClient";

export const metadata = {
  title: "Live Map — Kelowna GeoDASH",
};

export default function MapPage() {
  return (
    <main style={{ height: "100%", width: "100%" }}>
      <PublicMapClient />
    </main>
  );
}
