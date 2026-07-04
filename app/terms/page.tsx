import StaticPage from "../components/StaticPage";

export const metadata = { title: "Terms of Service — Kelowna GeoDASH" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="The agreement for using GeoDASH" updated="July 2026">
      <h2>What GeoDASH is</h2>
      <p>
        Kelowna GeoDASH is an independent, community-run platform for sharing public-safety
        information and reuniting lost items with their owners. It is{" "}
        <strong>not affiliated with the RCMP, the City of Kelowna, or any government agency</strong>.
      </p>

      <h2>No warranty on information</h2>
      <p>
        All reports and listings are community-submitted. While moderators review submissions before
        they go live, we cannot guarantee accuracy, completeness, or timeliness. Incident locations
        may be approximate. Do not make safety-critical decisions based solely on GeoDASH data.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate information and follow the <a href="/guidelines">Community Guidelines</a>.</li>
        <li>Keep your account credentials private; you are responsible for activity on your account.</li>
        <li>Do not attempt to abuse, overload, or reverse-engineer the platform.</li>
        <li>You must be at least 13 years old to create an account.</li>
      </ul>

      <h2>Content</h2>
      <p>
        You retain ownership of the content you submit, and grant GeoDASH a licence to display it on
        the platform. We may remove any content or suspend any account that violates these terms or
        the community guidelines, at our discretion.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        GeoDASH is provided "as is", free of charge. To the maximum extent permitted by law, the
        operators are not liable for any damages arising from use of the platform, including
        reliance on community-submitted information or in-person meetings arranged through the
        lost &amp; found service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the platform evolves. Material changes will be announced on the
        platform. Continued use after changes means you accept the updated terms.
      </p>
    </StaticPage>
  );
}
