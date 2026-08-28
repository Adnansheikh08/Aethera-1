import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "../components/LeadForm.jsx";

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

      <header className="page-header">
        <p className="eyebrow">Selective Enquiries</p>
        <h1 className="page-title">Initiate connection</h1>
      </header>

      <section className="container" aria-labelledby="contact-heading">
        <div className="prose" style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            Tell us what you are building. We reply to every qualified inquiry within two business hours. All submissions are encrypted at rest and never shared with third parties.
          </p>
        </div>

        {error && (
          <p className="form-feedback error-box" role="alert">
            The service catalogue could not be loaded. You can still reach us directly by email.
          </p>
        )}

        <div style={{ maxWidth: "100%", marginBottom: "3rem" }}>
          <LeadForm serviceChoices={serviceChoices} />
        </div>

        <div className="form-navigation" style={{ textAlign: "center" }}>
          <Link to="/" className="cta-button btn-secondary">
            Back to home
          </Link>
        </div>
      </section>
    </>
  );
}

export default Contact;
