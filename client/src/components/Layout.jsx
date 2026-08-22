import { Link, NavLink, useLocation } from "react-router-dom";

import { useNavigation, useSectionSpy } from "../hooks/useNavigation.js";
import { useHeaderCondensed } from "../hooks/useScrollProgress.js";

/**
 * Site-wide wayfinding order — Home, About, Services, Projects, Testimonial,
 * Contact Us.
 *
 * The header nav and the footer's Navigate list both render this array, wrapped
 * by the same Home and Contact entries, so the two lists cannot drift apart.
 * An entry with `id` is an anchor into a landing-page section, exactly as
 * base.html's nav was; an entry with `to` is a route of its own.
 */
const NAV_ITEMS = [
  { id: "statement-section", label: "About" },
  { id: "focus-section", label: "Services" },
  { to: "/projects", label: "Projects" },
  { id: "proof-section", label: "Testimonial" },
];

/** Closes every nav list: a button in the header, a plain link in the footer. */
const CONTACT = { id: "contact-section", label: "Contact Us" };

// Route entries have no section to observe, so they are excluded rather than
// contributing an id that getElementById will never resolve.
const SPY_IDS = NAV_ITEMS.filter((item) => item.id).map((item) => item.id);

const navKey = (item) => item.id ?? item.to;

/**
 * One nav entry, in whichever form the item calls for.
 *
 * Routes go through NavLink so the active state follows the router rather than
 * the section spy. Its `aria-current` is pinned to "true" because the
 * stylesheet keys the active treatment off that exact value, not off NavLink's
 * "page" default — and NavLink still only emits the attribute while active.
 */
function NavEntry({ item, className, activeId, isLanding }) {
  if (item.to) {
    return (
      <NavLink to={item.to} className={className} aria-current="true">
        {item.label}
      </NavLink>
    );
  }

  return (
    <a
      href={`/#${item.id}`}
      className={className}
      aria-current={isLanding && activeId === item.id ? "true" : undefined}
    >
      {item.label}
    </a>
  );
}

/**
 * Home needs the router rather than an anchor — and a nudge. Routing to "/"
 * while already on "/" is a no-op, which would leave someone who clicked Home
 * sitting exactly where they were, halfway down the page.
 */
function HomeLink({ className, isCurrent = false }) {
  const isLanding = useLocation().pathname === "/";

  return (
    <Link
      to="/"
      className={className}
      aria-current={isCurrent ? "true" : undefined}
      onClick={() => {
        // No `behavior`: that keeps the stylesheet's smooth scroll, which already
        // degrades to an instant jump under prefers-reduced-motion.
        if (isLanding) window.scrollTo({ top: 0 });
      }}
    >
      Home
    </Link>
  );
}

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
            <li>
              <HomeLink
                className="nav-item"
                // The spy has nothing to report above the first section, so
                // Home holds the marker while the hero is in view.
                isCurrent={isLanding && activeId === null}
              />
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={navKey(item)}>
                <NavEntry
                  item={item}
                  className="nav-item"
                  activeId={activeId}
                  isLanding={isLanding}
                />
              </li>
            ))}
            <li>
              <a href={`/#${CONTACT.id}`} className="header-btn">
                {CONTACT.label}
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
                <HomeLink className="contact-link" />
              </li>
              {NAV_ITEMS.map((item) => (
                <li key={navKey(item)}>
                  <NavEntry item={item} className="contact-link" />
                </li>
              ))}
              <li>
                <a href={`/#${CONTACT.id}`} className="contact-link">
                  {CONTACT.label}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer-heading">Contact</h2>
            <ul className="footer-list">
              <li>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "0.5rem", display: "inline" }}
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 6 10-6" />
                </svg>
                <a href="mailto:mohammadharoonu@gmail.com" className="contact-link">
                  mohammadharoonu@gmail.com
                </a>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "0.5rem", display: "inline" }}
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                </svg>
                <a href="tel:+917985765985" className="contact-link">
                  +91 79857 65985
                </a>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "0.5rem", display: "inline" }}
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
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
