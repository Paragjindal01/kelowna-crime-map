import StaticPage from "../components/StaticPage";

export const metadata = { title: "Privacy Policy — Kelowna GeoDASH" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="What we collect and how we use it" updated="July 2026">
      <p>
        GeoDASH is an independent community platform. We collect the minimum information needed to
        run the service, and we never sell your data.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your display name, email address, and a securely hashed password.</li>
        <li><strong>Content you submit:</strong> crime reports, lost &amp; found listings, photos, comments, and messages.</li>
        <li><strong>Session cookie:</strong> a single httpOnly cookie that keeps you signed in. No advertising or tracking cookies.</li>
      </ul>

      <h2>What others can see</h2>
      <ul>
        <li>Your display name, avatar, level, XP, and public activity appear on your profile and next to your posts.</li>
        <li><strong>Your email address is never shown to other users.</strong> All contact happens through private on-platform messages.</li>
        <li>Crime reports are shown without any account attribution on the public map.</li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To operate the map, lost &amp; found, and community features.</li>
        <li>To send account emails (verification, and nothing else without your consent).</li>
        <li>To moderate content and prevent abuse.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You can request account deletion at any time via the <a href="/contact">contact page</a> —
        we'll remove your account, sessions, and personal details. Public safety reports may remain
        in anonymized form to keep the map accurate.
      </p>

      <h2>Location data</h2>
      <p>
        Incident locations are provided by reporters and may be approximate. We recommend not
        pinpointing exact home addresses — a street or block-level location is enough.
      </p>
    </StaticPage>
  );
}
