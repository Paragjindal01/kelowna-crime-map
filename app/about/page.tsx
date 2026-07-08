import StaticPage from "../components/StaticPage";

export const metadata = { title: "About — Kelowna GeoDASH" };

export default function AboutPage() {
  return (
    <StaticPage title="About GeoDASH" subtitle="A community platform for a safer Okanagan">
      <p>
        Kelowna GeoDASH is an independent, community-run platform that brings together a live
        public-safety map, community alerts, and a lost &amp; found service for Kelowna and the
        Central Okanagan. It is built on a simple idea:{" "}
        <strong>neighbours looking out for neighbours.</strong>
      </p>

      <h2>What we do</h2>
      <ul>
        <li><strong>Live Safety Map</strong> — moderated incident reports plotted across the city.</li>
        <li><strong>Community Alerts</strong> — road closures, fires, outages, hazards, and public notices.</li>
        <li><strong>Lost &amp; Found</strong> — post lost items, help return found ones, and earn community reputation.</li>
        <li><strong>Public data, attributed</strong> — incidents sourced from publicly available reporting (RCMP news releases, local news) are always attributed and linked.</li>
      </ul>

      <h2>How content is verified</h2>
      <p>
        Every community submission goes into a moderation queue and is reviewed before it becomes
        public. Entries confirmed by official sources carry a <strong>✔ Verified</strong> badge.
        Members who verify their email get a <strong>✓ verified member</strong> mark, and helpful
        actions earn reputation over time — so you can see who has a track record of contributing
        reliably.
      </p>

      <h2>Disclaimer</h2>
      <ul>
        <li>
          <strong>GeoDASH is not an emergency service.</strong> In an emergency, always call{" "}
          <strong>911</strong>. For non-emergency police matters, call the Kelowna RCMP at
          250-762-3300.
        </li>
        <li>
          GeoDASH is an independent platform and is <strong>not affiliated with the RCMP, the City
          of Kelowna, or any government agency</strong>.
        </li>
        <li>Incident locations may be approximate — news reports rarely include exact coordinates.</li>
        <li>All reports are for informational purposes only and may contain inaccuracies despite moderation.</li>
        <li>Community submissions reflect the observations of individual members, not official findings.</li>
        <li>Do not use this platform to make safety-critical decisions; rely on official emergency channels.</li>
      </ul>

      <h2>Data sources &amp; attribution</h2>
      <p>
        Publicly reported incidents are drawn only from reliable public sources — RCMP news
        releases, Central Okanagan Emergency Operations, EmergencyInfoBC, and established local
        news outlets. We store only factual details (what, where, when), written in our own words,
        with a link to the original source. Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{" "}
        contributors; tiles by{" "}
        <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>.
      </p>

      <h2>Who builds this</h2>
      <p>
        GeoDASH is designed and developed by{" "}
        <a href="https://www.instagram.com/Parag_jindl23/" target="_blank" rel="noopener noreferrer">
          Parag Jindal
        </a>
        , with direction from the community — see the <a href="/roadmap">public roadmap</a> and
        vote on what gets built next.
      </p>
    </StaticPage>
  );
}
