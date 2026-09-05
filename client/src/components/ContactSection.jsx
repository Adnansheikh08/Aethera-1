import { useEffect, useState } from "react";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "./LeadForm.jsx";

/** Small facts under the pitch — the quiet, factual half of the page. */
const CONTACT_DETAILS = [
  {
    label: "Location",
    value: "Lucknow, Near City Station",
    href: "https://www.google.com/maps/search/?api=1&query=Lucknow+Near+City+Station",
    icon: "location",
    external: true,
  },
  {
    label: "Email",
    value: "mohammadharoonu@gmail.com",
    href: "mailto:mohammadharoonu@gmail.com",
    icon: "email",
  },
  {
    label: "Phone",
    value: "+91 79857 65985",
    href: "tel:+917985765985",
    icon: "phone",
  },
  {
    label: "Instagram",
    value: "@aethera09",
    href: "https://www.instagram.com/aethera09",
    icon: "instagram",
    external: true,
  },
];

/** One 24px-grid stroke icon per detail, Feather-style so the set reads as a family. */
const DETAIL_ICONS = {
  location: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  email: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
};

function DetailIcon({ name }) {
  return (
    <svg
      className="contact-detail-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DETAIL_ICONS[name]}
    </svg>
  );
}

/** Chevron shown on card hover — the affordance that the whole card is a link. */
function ArrowIcon() {
  return (
    <svg
      className="contact-detail-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * The complete contact section — pitch column on the left, lead form on the
 * right — shared verbatim by the contact page and the landing page so the two
 * can never drift apart.
 *
 * Service choices come from the parent when it already has them (the landing
 * page fetches landing content anyway); with no `serviceChoices` the section
 * fetches its own, which is what the contact page needs.
 */
export function ContactSection({ serviceChoices = null, error = null, TitleTag = "h2", children = null }) {
  const [ownChoices, setOwnChoices] = useState(null);
  const [ownError, setOwnError] = useState(null);

  // Only pages that don't hand us choices need the fetch.
  const shouldFetch = serviceChoices === null;

  useEffect(() => {
    if (!shouldFetch) return undefined;

    const controller = new AbortController();

    getLandingContent(controller.signal)
      .then((data) => setOwnChoices(data.service_choices ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setOwnError(err);
      });

    return () => controller.abort();
  }, [shouldFetch]);

  const choices = serviceChoices ?? ownChoices ?? [];
  const loadError = error ?? ownError;

  return (
    <section
      id="contact-section"
      className="contact-section"
      aria-labelledby="contact-heading"
      data-reveal-group=""
    >
      <div className="container contact-grid">
        <div className="contact-intro">
          <p className="contact-status">
            <span className="contact-status-dot" aria-hidden="true" />
            Accepting new projects
          </p>
          <p className="eyebrow">Let&apos;s build something</p>
          <TitleTag id="contact-heading" className="contact-title">
            Have an idea?
            <br />
            Let&apos;s <span className="contact-accent">make it real.</span>
          </TitleTag>
          <p className="contact-lede">
            Tell us what you&apos;re building, what you&apos;re solving, or where you want
            to go next. We&apos;ll help turn the idea into something meaningful.
          </p>

          <ul className="contact-details">
            {CONTACT_DETAILS.map((detail) => (
              <li key={detail.label}>
                <a
                  className="contact-detail-card"
                  href={detail.href}
                  {...(detail.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <span className="contact-detail-chip" aria-hidden="true">
                    <DetailIcon name={detail.icon} />
                  </span>
                  <span className="contact-detail-text">
                    <span className="contact-detail-label">{detail.label}</span>
                    <span className="contact-detail-value">{detail.value}</span>
                  </span>
                  <ArrowIcon />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="contact-form-side">
          {loadError && (
            <p className="form-feedback error-box" role="alert">
              The service catalogue could not be loaded. You can still reach us directly by email.
            </p>
          )}
          <LeadForm serviceChoices={choices} detailed />
        </div>
      </div>

      {/* Page-specific tail (the contact page's back link) — rendered inside
          the section so it keeps its original place in the DOM. */}
      {children}
    </section>
  );
}

export default ContactSection;
