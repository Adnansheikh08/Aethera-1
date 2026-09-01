import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { ThemeToggle } from "./ThemeToggle.jsx";
import { AdminAccessModal } from "../admin/AdminAccessModal.jsx";
import { useAuth } from "../admin/AuthContext.jsx";
import {
  fastScrollTo,
  fastScrollToElement,
  useNavigation,
  useSectionSpy,
} from "../hooks/useNavigation.js";
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
  // Routes to its own page, but the landing page also previews it as
  // #work-section, so that id still needs to feed the section spy below.
  { to: "/projects", spyId: "work-section", label: "Projects" },
  { id: "proof-section", label: "Testimonial" },
];

/** Closes every nav list: a button in the header, a plain link in the footer. */
const CONTACT = { id: "contact-section", label: "Contact Us" };

/**
 * Landing sections the spy watches without owning a highlight of their own.
 *
 * The spy marks whichever watched section holds the viewport, so a section it
 * cannot see leaves the previous entry lit long after that entry's section has
 * scrolled by — Testimonial used to stay marked through Operating hours and the
 * enquiry form, all the way to the footer. Naming them here hands the active
 * state over to a section with no nav entry, which reads as "nothing is current".
 *
 * The hero and the marquee are deliberately left out. Nothing being active above
 * the first section is exactly what puts the marker on Home.
 */
const UNMAPPED_SPY_IDS = ["locations-section", CONTACT.id];

// Route entries have no section of their own, but some still preview a
// landing-page section (spyId) that the observer needs to watch. Order is
// irrelevant — useSectionSpy sorts by document position.
const SPY_IDS = [
  ...NAV_ITEMS.map((item) => item.id ?? item.spyId).filter(Boolean),
  ...UNMAPPED_SPY_IDS,
];

const navKey = (item) => item.id ?? item.to;

/**
 * Same-document section jumps take the fast guided scroll rather than the
 * browser's `scroll-behavior: smooth`, whose distance-scaled duration is what
 * made a header click feel like a second of waiting. Off the landing page the
 * anchor must still travel: the router lands on "/" and useScrollTopOnNavigate
 * performs the same fast scroll once the section is mounted.
 */
function jumpToSection(event, sectionId) {
  if (window.location.pathname !== "/") return;
  event.preventDefault();
  const target = document.getElementById(sectionId);
  if (target) fastScrollToElement(target);
  // replaceState keeps the URL honest without pushing a history entry the
  // back button would then "navigate" without any scroll at all.
  window.history.replaceState(null, "", `/#${sectionId}`);
}

/**
 * One nav entry, in whichever form the item calls for.
 *
 * A route entry has two different owners of its active state, and they need two
 * different elements:
 *
 *   off the landing page  NavLink, so the router decides. `aria-current` is
 *                         pinned to "true" because the stylesheet keys the active
 *                         treatment off that exact value rather than NavLink's
 *                         "page" default, and NavLink only emits it while active.
 *   on the landing page   Link, because the spy decides — Projects highlights
 *                         while its preview section is in view. NavLink cannot be
 *                         used here: the very behaviour relied on above works
 *                         against us, since it re-emits `aria-current` only when
 *                         its own route matches, and on "/" the /projects route
 *                         never does. Whatever the spy worked out was dropped on
 *                         the floor, so the tab never lit up at all.
 */
function NavEntry({ item, className, activeId, isLanding }) {
  if (item.to) {
    if (isLanding) {
      const isSpiedActive = Boolean(item.spyId) && activeId === item.spyId;

      return (
        <Link
          to={item.to}
          className={className}
          aria-current={isSpiedActive ? "true" : undefined}
        >
          {item.label}
        </Link>
      );
    }

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
      onClick={(event) => jumpToSection(event, item.id)}
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
        // The same fast guided scroll the section links use, so returning to
        // the top costs the same ~350ms as any other jump.
        if (isLanding) fastScrollTo(0);
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
  const { token } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);

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

        <div className="header-actions">
          <ThemeToggle />

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
              {/* Styled as the header's filled button rather than a nav item, so
                  there is no `.header-btn[aria-current]` rule and this changes
                  nothing visually — it is here so the attribute does not lie to
                  a screen reader while the enquiry form is the section in view. */}
              <a
                href={`/#${CONTACT.id}`}
                className="header-btn"
                aria-current={isLanding && activeId === CONTACT.id ? "true" : undefined}
                onClick={(event) => jumpToSection(event, CONTACT.id)}
              >
                {CONTACT.label}
              </a>
            </li>
            <li>
              {token ? (
                <Link to="/admin" className="nav-item nav-admin-link">
                  Admin console
                </Link>
              ) : (
                <button
                  type="button"
                  className="nav-item nav-admin-trigger"
                  onClick={() => setShowAdminModal(true)}
                >
                  Are you an admin?
                </button>
              )}
            </li>
          </ul>
          </nav>
        </div>
      </div>

      {showAdminModal && <AdminAccessModal onClose={() => setShowAdminModal(false)} />}
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
                <a
                  href={`/#${CONTACT.id}`}
                  className="contact-link"
                  onClick={(event) => jumpToSection(event, CONTACT.id)}
                >
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
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Lucknow+Near+City+Station"
                  className="contact-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lucknow, Near City Station
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
