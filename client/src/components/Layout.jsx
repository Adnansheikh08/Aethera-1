import { Link, NavLink, useLocation } from "react-router-dom";

import { useNavigation, useSectionSpy } from "../hooks/useNavigation.js";
import { useHeaderCondensed } from "../hooks/useScrollProgress.js";

/** The in-page anchors, mirroring the nav in templates/base.html. */
const NAV_ITEMS = [
  { id: "focus-section", label: "Focus" },
  { id: "work-section", label: "Work" },
  { id: "proof-section", label: "Proof" },
];

const SPY_IDS = NAV_ITEMS.map((item) => item.id);

export function Header() {
  const { isOpen, isMobile, toggle, close, toggleRef, panelRef } = useNavigation();
  const isCondensed = useHeaderCondensed();
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  // The section spy only has sections to watch on the landing page.
  const activeId = useSectionSpy(isLanding ? SPY_IDS : []);

  return (
    <header className={`site-header${isCondensed ? " is-condensed" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="brand" aria-label="Aethera home">
          Aethera
          <span className="orange-char" aria-hidden="true">
            .
          </span>
        </Link>

        <nav aria-label="Primary">
          <button
            type="button"
            className="nav-toggle"
            ref={toggleRef}
            onClick={toggle}
            aria-expanded={String(isOpen)}
            aria-controls="primary-navigation"
            aria-label="Toggle navigation menu"
          >
            <span className="nav-toggle-bar" aria-hidden="true" />
          </button>

          <ul
            className="nav-links"
            id="primary-navigation"
            ref={panelRef}
            // Only collapsed while the mobile query matches, exactly as the
            // source's syncToViewport guaranteed.
            data-collapsed={isMobile ? String(!isOpen) : undefined}
            onClick={close}
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`/#${item.id}`}
                  className="nav-item"
                  aria-current={isLanding && activeId === item.id ? "true" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/#contact-section" className="header-btn">
                Enquiry
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link to="/" className="footer-brand">
              Aethera
            </Link>
            <p className="footer-tagline">
              Hardened enterprise software and cyber-secure media platforms, engineered for
              organisations that treat downtime and data loss as unacceptable outcomes.
            </p>
          </div>

          <div>
            <h2 className="footer-heading">Navigate</h2>
            <ul className="footer-list">
              <li>
                <a href="/#focus-section" className="contact-link">
                  Focus
                </a>
              </li>
              <li>
                <a href="/#work-section" className="contact-link">
                  Selected Work
                </a>
              </li>
              <li>
                <a href="/#proof-section" className="contact-link">
                  Engineering Proof
                </a>
              </li>
              <li>
                <a href="/#contact-section" className="contact-link">
                  Start a Project
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer-heading">Contact</h2>
            <ul className="footer-list">
              <li>
                <a href="mailto:mohammadharoonu@gmail.com" className="contact-link">
                  mohammadharoonu@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917985765985" className="contact-link">
                  +91 79857 65985
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/aethera09?igsh=MXV1djFtbWpkNjJqeA=="
                  className="contact-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @aethera09
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer-heading">Assurance</h2>
            <div className="badge-container">
              <span className="security-badge">OWASP ASVS Hardened</span>
              <span className="security-badge">ISO 27001 Ready</span>
              <span className="security-badge">WAF &amp; IP Lockout Active</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          {/* Django rendered this with {% now "Y" %}; the client computes it. */}
          <p>&copy; {new Date().getFullYear()} Aethera Agency</p>
          <div className="footer-legal">
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
            <NavLink to="/terms">Terms of Service</NavLink>
            <NavLink to="/data-erasure">Data Erasure</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Fixed WhatsApp affordance from base.html. */
export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/917985765985"
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact Aethera on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12.031 2c-5.514 0-9.99 4.476-9.99 9.99 0 2.08.637 4.01 1.728 5.613L2 22l4.56-1.674c1.5.952 3.272 1.493 5.471 1.493 5.514 0 9.99-4.476 9.99-9.99 0-5.514-4.476-9.99-9.99-9.99zM6.836 7.428c.18-.396.36-.396.54-.396.144 0 .306.018.468.018.162 0 .378.054.558.27.18.216.684 1.674.756 1.818.072.144.126.306.018.486-.09.18-.18.306-.306.45-.126.144-.27.324-.378.432-.126.126-.252.27-.108.522.144.252.648 1.062 1.386 1.728.954.846 1.746 1.116 2.016 1.242.27.126.432.108.594-.072.162-.18.702-.81 0-.99-.108-.036-.216-.018-.324.018l-1.026.486c-.468.216-.846.036-1.116-.27l-1.134-1.35c-.324-.378-.234-.918.162-1.296.216-.216.486-.54.684-.792.054-.072.09-.162.054-.252-.036-.09-.27-.72-.45-1.152-.162-.396-.342-.396-.54-.396z" />
      </svg>
    </a>
  );
}
