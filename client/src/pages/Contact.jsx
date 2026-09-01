import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "../components/LeadForm.jsx";

/** Trust cards under the pitch. Static content — the details rarely change. */
const CONTACT_DETAILS = [
  {
    label: "Email",
    value: "mohammadharoonu@gmail.com",
    href: "mailto:mohammadharoonu@gmail.com",
  },
  { label: "Response time", value: "Within two business hours" },
  { label: "Main office", value: "Lucknow, Uttar Pradesh, India" },
];

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
              Have a <span className="contact-accent">project</span> in mind?
            </h1>
            <p className="contact-lede">
              Tell us what you are building. Share your requirements and the Aethera
              team will come back with a concrete plan — every qualified inquiry
              gets a reply.
            </p>

            <ul className="contact-details">
              {CONTACT_DETAILS.map((detail) => (
                <li key={detail.label}>
                  <span className="contact-detail-label">{detail.label}</span>
                  {detail.href ? (
                    <a className="contact-detail-value" href={detail.href}>
                      {detail.value}
                    </a>
                  ) : (
                    <span className="contact-detail-value">{detail.value}</span>
                  )}
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
