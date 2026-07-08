import StaticPage from "../components/StaticPage";

export const metadata = { title: "Community Guidelines — SafeKelowna" };

export default function GuidelinesPage() {
  return (
    <StaticPage
      title="Community Guidelines"
      subtitle="How we keep SafeKelowna useful and safe"
      updated="July 2026"
    >
      <p>
        SafeKelowna works because neighbours trust each other. These guidelines apply to every report,
        listing, comment, and message on the platform.
      </p>

      <h2>🚨 Emergencies go to 911 — always</h2>
      <p>
        <strong>SafeKelowna is not an emergency service and is not monitored in real time.</strong> If a
        crime is in progress or someone is in danger, call 911. For non-emergency police matters,
        call the Kelowna RCMP non-emergency line at 250-762-3300.
      </p>

      <h2>Report honestly</h2>
      <ul>
        <li>Only report incidents you witnessed or that affected you directly.</li>
        <li>Be as accurate as you can with locations, dates, and details.</li>
        <li>Never accuse or identify a specific person — describe the incident, not individuals.</li>
        <li>Fake or exaggerated reports harm real victims and will lead to account suspension.</li>
      </ul>

      <h2>Be kind in comments and messages</h2>
      <ul>
        <li>No harassment, hate speech, threats, or doxxing.</li>
        <li>No spam, advertising, or self-promotion.</li>
        <li>Assume good faith — most people here are trying to help.</li>
      </ul>

      <h2>Lost &amp; Found etiquette</h2>
      <ul>
        <li>Only claim items that genuinely belong to you.</li>
        <li>When returning an item, meet in a public place during daylight hours.</li>
        <li>Never share banking details, and never pay a "release fee" for a found item — that's a scam.</li>
      </ul>

      <h2>Moderation</h2>
      <p>
        Every report and listing is reviewed by a moderator before it appears publicly. Content that
        violates these guidelines is rejected, and repeat violations result in a ban. Moderation
        decisions aim to keep the platform trustworthy for everyone.
      </p>
    </StaticPage>
  );
}
