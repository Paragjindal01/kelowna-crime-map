import StaticPage from "../components/StaticPage";

export const metadata = { title: "Contact — Kelowna GeoDASH" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact" subtitle="Get in touch with the GeoDASH team">
      <h2>🚨 Emergencies</h2>
      <p>
        <strong>GeoDASH is not monitored in real time.</strong> If a crime is in progress or someone
        is in danger, call <strong>911</strong>. Kelowna RCMP non-emergency:{" "}
        <strong>250-762-3300</strong>.
      </p>

      <h2>Platform questions &amp; feedback</h2>
      <p>
        Reach the creator on Instagram:{" "}
        <a href="https://www.instagram.com/Parag_jindl23/" target="_blank" rel="noopener noreferrer">
          @Parag_jindl23
        </a>
      </p>

      <h2>Report a problem</h2>
      <ul>
        <li><strong>Inappropriate content:</strong> message us with a link to the report or listing — moderators review every flag.</li>
        <li><strong>Account issues or deletion requests:</strong> contact us from the email on your account.</li>
        <li><strong>Security vulnerabilities:</strong> please report privately before public disclosure — we take these seriously.</li>
      </ul>

      <h2>Feature ideas</h2>
      <p>
        Have an idea that would make Kelowna safer? Check the <a href="/roadmap">public roadmap</a>{" "}
        and vote on what we build next.
      </p>
    </StaticPage>
  );
}
