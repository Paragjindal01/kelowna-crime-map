import StaticPage from "../components/StaticPage";

export const metadata = { title: "Terms of Service — SafeKelowna" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="The agreement governing your use of SafeKelowna" updated="July 6, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Kelowna
        SafeKelowna (&ldquo;SafeKelowna&rdquo;, &ldquo;the platform&rdquo;). By creating an account or
        using the platform, you agree to these Terms and to our{" "}
        <a href="/privacy">Privacy Policy</a> and <a href="/guidelines">Community Guidelines</a>.
        If you do not agree, do not use the platform.
      </p>

      <h2>1. About SafeKelowna</h2>
      <p>
        SafeKelowna is an independent, community-operated safety information and lost &amp; found
        platform for Kelowna and the Central Okanagan.{" "}
        <strong>
          SafeKelowna is not affiliated with, endorsed by, or operated by the RCMP, the City of
          Kelowna, or any government agency.
        </strong>{" "}
        It is not an emergency service. In an emergency, always call 911.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>You must provide accurate registration information and keep your credentials secure.</li>
        <li>You are responsible for all activity occurring under your account.</li>
        <li>One person, one account. Automated account creation is prohibited.</li>
      </ul>

      <h2>3. User responsibilities</h2>
      <ul>
        <li>Submit only truthful, first-hand or properly attributed information.</li>
        <li>Follow the <a href="/guidelines">Community Guidelines</a> in all submissions, comments, and messages.</li>
        <li>Respect other members&rsquo; privacy — no doxxing, no sharing others&rsquo; personal information.</li>
        <li>Use the private messaging system in good faith and only for its intended purpose.</li>
      </ul>

      <h2>4. Prohibited content and conduct</h2>
      <p>You must not post, upload, or transmit content that:</p>
      <ul>
        <li>
          <strong>Is false or misleading</strong> — including fabricated crime reports, fake
          alerts, or staged lost-item claims. False reports harm real victims and may itself be a
          criminal offence (public mischief) under the Criminal Code of Canada.
        </li>
        <li><strong>Is illegal</strong> — or promotes, facilitates, or instructs illegal activity.</li>
        <li><strong>Accuses or identifies individuals</strong> as suspects or criminals. Describe incidents, not people&rsquo;s identities.</li>
        <li><strong>Harasses, threatens, defames,</strong> or promotes hatred against any person or group.</li>
        <li><strong>Infringes copyright</strong> or other intellectual-property rights, including wholesale copying of news articles.</li>
        <li><strong>Contains malware, spam,</strong> advertising, or solicitation.</li>
        <li><strong>Circumvents platform protections</strong> — scraping, rate-limit evasion, unauthorized access attempts, or vote manipulation.</li>
      </ul>

      <h2>5. Moderation rights</h2>
      <p>
        All submissions are reviewed before publication. We reserve the right, at our sole
        discretion and without notice, to reject, edit for accuracy, remove, or archive any
        content; to suspend or terminate accounts; and to ban repeat or serious offenders. We may
        preserve and disclose content if required by law or to protect the safety of users or the
        public.
      </p>

      <h2>6. Account suspension and termination</h2>
      <ul>
        <li>We may suspend or ban accounts that violate these Terms, with or without warning depending on severity.</li>
        <li>Banned users may not create new accounts.</li>
        <li>You may stop using the platform and request account deletion at any time via the <a href="/contact">contact page</a>.</li>
      </ul>

      <h2>7. Content licence and copyright</h2>
      <ul>
        <li>
          You retain ownership of content you submit. You grant SafeKelowna a non-exclusive,
          royalty-free, worldwide licence to host, display, and distribute that content on the
          platform for as long as it remains published.
        </li>
        <li>
          News-derived incident entries contain only factual information with attribution and
          links to the original publisher. If you are a rights holder with a concern, contact us
          and we will respond promptly.
        </li>
        <li>
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{" "}
          contributors, tiles by <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>.
        </li>
      </ul>

      <h2>8. Disclaimers</h2>
      <ul>
        <li>All information is provided &ldquo;as is&rdquo; for general awareness only, without warranty of any kind.</li>
        <li>Incident locations may be approximate. Reports may contain errors despite moderation.</li>
        <li>Do not rely on SafeKelowna for emergency decisions. SafeKelowna does not replace 911, police, fire, or ambulance services.</li>
        <li>We are not responsible for interactions between members, including in-person meetings to return items. Meet in public places.</li>
      </ul>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, SafeKelowna and its operators shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages, or any loss of
        data, safety, property, or goodwill, arising from your use of (or inability to use) the
        platform, reliance on any content, or interactions with other users. Where liability
        cannot be excluded, it is limited to CAD $100.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless SafeKelowna and its operators from claims arising out
        of your content, your use of the platform, or your violation of these Terms.
      </p>

      <h2>11. Dispute resolution</h2>
      <p>
        These Terms are governed by the laws of British Columbia and the federal laws of Canada.
        Before commencing any formal proceeding, you agree to first contact us and attempt to
        resolve the dispute informally within 30 days. Any dispute that cannot be resolved
        informally shall be brought exclusively in the courts of British Columbia.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may revise these Terms as the platform evolves. Material changes will be announced on
        the platform. Continued use after changes take effect constitutes acceptance of the
        revised Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <a href="/contact">contact page</a>.
      </p>
    </StaticPage>
  );
}
