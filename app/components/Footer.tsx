const INSTAGRAM_URL = "https://www.instagram.com/Parag_jindl23/";

export default function Footer() {
  return (
    <footer className="site-footer">
      <span className="site-footer__left">© 2026 GeoDASH. All rights reserved.</span>

      <nav className="site-footer__links" aria-label="Legal and info">
        <a href="/guidelines">Guidelines</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
        <a href="/roadmap">Roadmap</a>
      </nav>

      <span className="site-footer__center">
        Crafted with <span aria-hidden="true">❤️</span> by{" "}
        <a
          className="creator-link"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Parag Jindal
        </a>
      </span>

      <span className="site-footer__right">
        <a
          className="insta-icon"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram @Parag_jindl23"
          title="@Parag_jindl23"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
          </svg>
        </a>
      </span>
    </footer>
  );
}
