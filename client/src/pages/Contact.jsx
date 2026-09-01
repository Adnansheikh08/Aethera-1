import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "../components/LeadForm.jsx";

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

/**
 * Dedicated contact/inquiry form page.
 */
export function Contact() {
  const [serviceChoices, setServiceChoices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getLandingContent(controller.signal)
      .then((data) => setServiceChoices(data.service_choices ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <Helmet>
        <title>Contact Us — Aethera</title>
        <meta name="description" content="Get in touch with the Aethera engineering team. We reply to every qualified inquiry within two business hours." />
        <meta property="og:title" content="Contact Us — Aethera" />
        <meta property="og:description" content="Reach out to discuss your project requirements." />
        <meta name="twitter:title" content="Contact Us — Aethera" />
        <meta name="twitter:description" content="Get in touch with the Aethera engineering team." />
      </Helmet>

      <section className="contact-section" aria-labelledby="contact-heading">
        <div className="container contact-grid">
          <div className="contact-intro">
            <p className="eyebrow">Let&apos;s build something</p>
            <h1 id="contact-heading" className="contact-title">
              Have an idea?
              <br />
              Let&apos;s <span className="contact-accent">make it real.</span>
            </h1>
            <p className="contact-lede">
              Tell us what you&apos;re building, what you&apos;re solving, or where you want
              to go next. We&apos;ll help turn the idea into something meaningful.
            </p>

            <ul className="contact-details">
              {CONTACT_DETAILS.map((detail) => (
                <li key={detail.label}>
                  <span className="contact-detail-label">{detail.label}</span>
                  <a
                    className="contact-detail-value"
                    href={detail.href}
                    {...(detail.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <DetailIcon name={detail.icon} />
                    {detail.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="contact-form-side">
            {error && (
              <p className="form-feedback error-box" role="alert">
                The service catalogue could not be loaded. You can still reach us directly by email.
              </p>
            )}
            <LeadForm serviceChoices={serviceChoices} />
          </div>
        </div>

        <div className="container">
          <nav className="contact-back" aria-label="Page navigation">
            <Link to="/" className="contact-back-link">
              ← Back to home
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}

export default Contact;
