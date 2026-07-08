import StaticPage from "../components/StaticPage";

export const metadata = { title: "Privacy Policy — Kelowna GeoDASH" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="How GeoDASH collects, uses, and protects information" updated="July 6, 2026">
      <p>
        This Privacy Policy describes how Kelowna GeoDASH (&ldquo;GeoDASH&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, discloses, and safeguards information when you use our
        website and services. GeoDASH is an independent community platform operated in British
        Columbia, Canada. By using the platform, you consent to the practices described below.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When you register, we collect your display name,
          email address, and a password. Passwords are stored only as salted cryptographic hashes
          and are never accessible in plain text.
        </li>
        <li>
          <strong>Community submissions.</strong> Content you voluntarily submit, including crime
          reports, community alerts, lost &amp; found listings, comments, private messages, and
          feature votes.
        </li>
        <li>
          <strong>Uploaded images.</strong> Photos attached to lost &amp; found listings. Do not
          upload images containing other people&rsquo;s faces, licence plates, or personal
          information without consent.
        </li>
        <li>
          <strong>Technical data.</strong> A session cookie (described below) and standard server
          logs (IP address, timestamps, requested pages) used for security and abuse prevention.
        </li>
      </ul>

      <h2>2. Cookies</h2>
      <p>
        GeoDASH sets a single first-party, httpOnly session cookie used solely to keep you signed
        in. We do not use advertising cookies, cross-site tracking cookies, or third-party
        analytics trackers. Deleting the cookie signs you out; nothing else is stored on your
        device.
      </p>

      <h2>3. Analytics</h2>
      <p>
        We do not currently run third-party analytics. If aggregate, privacy-respecting analytics
        are introduced in the future, this policy will be updated before deployment and no
        personally identifying information will be shared with third parties.
      </p>

      <h2>4. How your information is used</h2>
      <ul>
        <li>To operate the map, community alerts, lost &amp; found, and reputation features.</li>
        <li>To send essential account email (verification and security notices only).</li>
        <li>To moderate submissions, enforce our Terms of Service, and prevent spam and abuse.</li>
        <li>To display public activity (see &ldquo;What others can see&rdquo; below).</li>
      </ul>
      <p>We do not sell, rent, or trade personal information. Ever.</p>

      <h2>5. What others can see</h2>
      <ul>
        <li>
          Your display name, avatar colour, community level, XP, achievements, join date, and
          public submissions appear on your profile and next to content you post.
        </li>
        <li>
          <strong>Your email address is never displayed to other users.</strong> Contact between
          members happens exclusively through the platform&rsquo;s private messaging system.
        </li>
        <li>Crime reports appear on the public map without account attribution.</li>
      </ul>

      <h2>6. Community submissions &amp; moderation</h2>
      <p>
        All submissions are reviewed by moderators before publication. Moderators can see
        submission details, including the submitting account, for review purposes. Rejected
        content is not displayed publicly but may be retained for abuse-prevention records.
      </p>

      <h2>7. Data retention</h2>
      <ul>
        <li>Account data is retained while your account is active.</li>
        <li>Sessions expire automatically after 30 days.</li>
        <li>
          Upon a verified deletion request, we remove your account, sessions, private messages,
          and personal details within 30 days. Public safety reports may be retained in anonymized
          form to preserve the accuracy of the historical map.
        </li>
        <li>Server logs used for security are rotated on a short schedule.</li>
      </ul>

      <h2>8. Security practices</h2>
      <ul>
        <li>Passwords hashed with scrypt and per-user salts; sessions stored server-side.</li>
        <li>HttpOnly, SameSite cookies; HTTPS required in production.</li>
        <li>Rate limiting, input validation, and upload restrictions to prevent abuse.</li>
        <li>Administrative functions are access-controlled and fail closed.</li>
      </ul>
      <p>
        No system is perfectly secure. If we become aware of a breach affecting personal
        information, we will notify affected users promptly and in accordance with applicable
        Canadian privacy law (PIPEDA / BC PIPA).
      </p>

      <h2>9. Third-party services</h2>
      <ul>
        <li>
          <strong>Map data.</strong> Map tiles and geocoding are provided by{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors and{" "}
          <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">
            CARTO
          </a>
          . Your browser requests tiles directly from these services, which may log standard
          request metadata under their own privacy policies.
        </li>
        <li>
          <strong>Database hosting.</strong> Data is stored with a managed database provider under
          contractual safeguards.
        </li>
        <li>
          <strong>News sources.</strong> Publicly reported incidents are attributed and linked to
          their original publishers (e.g., RCMP news releases, local news outlets).
        </li>
      </ul>

      <h2>10. Your rights</h2>
      <p>
        Subject to applicable law, you may request access to, correction of, or deletion of your
        personal information, and you may withdraw consent to non-essential processing. To
        exercise these rights, contact us from the email address on your account via the{" "}
        <a href="/contact">contact page</a>. We respond to verified requests within 30 days.
      </p>

      <h2>11. Children</h2>
      <p>
        GeoDASH is not directed at children under 13, and we do not knowingly collect their
        personal information. If you believe a child has created an account, contact us and we
        will remove it.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy as the platform evolves. Material changes will be announced on
        the platform with an updated &ldquo;last updated&rdquo; date. Continued use after changes
        constitutes acceptance.
      </p>

      <h2>13. Contact</h2>
      <p>
        Privacy questions and requests: see the <a href="/contact">contact page</a>. We aim to
        acknowledge all privacy inquiries within 7 days.
      </p>
    </StaticPage>
  );
}
