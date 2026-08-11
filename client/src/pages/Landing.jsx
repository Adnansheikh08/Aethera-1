import { useEffect, useState } from "react";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "../components/LeadForm.jsx";
import {
  Comparison,
  Focus,
  Hero,
  Locations,
  Marquee,
  Proof,
  SelectedWork,
  Statement,
} from "../components/sections.jsx";

/**
 * Landing page, ported from templates/agency/index.html.
 *
 * Django rendered services, portfolio items and case studies from the view
 * context; here one call to /api/content/landing supplies all three plus the
 * service choices the lead form's select needs.
 */
export function Landing({ introComplete }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getLandingContent(controller.signal)
      .then(setContent)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      });

    return () => controller.abort();
  }, []);

  const services = content?.services ?? [];
  const portfolioItems = content?.portfolio_items ?? [];
  const caseStudies = content?.case_studies ?? [];
  const serviceChoices = content?.service_choices ?? [];

  return (
    <>
      {/*
        The landing page is what base.html's defaults were written for, so it
        overrides nothing — SiteMeta in App.jsx supplies title, description,
        canonical and the social tags. Kept as an explicit no-op comment so the
        absence reads as intentional rather than as a missed port.
      */}

      <Hero introComplete={introComplete} />
      <Marquee />
      <Statement />
      <Focus services={services} />
      <SelectedWork services={services} portfolioItems={portfolioItems} />
      <Comparison />
      <Proof caseStudies={caseStudies} />
      <Locations />

      <section
        id="contact-section"
        className="container"
        aria-labelledby="contact-heading"
        data-reveal-group=""
      >
        <div className="section-head">
          <p className="eyebrow">Selective Enquiries</p>
          <div>
            <h2 id="contact-heading" className="section-heading">
              Initiate connection
            </h2>
            <p className="section-subtitle">
              Tell us what you are building. We reply to every qualified inquiry within two business
              hours.
            </p>
          </div>
        </div>

        {error && (
          <p className="form-feedback error-box" role="alert">
            The service catalogue could not be loaded. You can still reach us directly by email.
          </p>
        )}

        <div className="contact-layout">
          <div className="contact-aside">
            <p>
              Prefer to skip the form? Reach the engineering team directly — these go to the same
              inbox as the inquiry queue.
            </p>
            <ul className="contact-methods">
              <li className="contact-method">
                <span className="method-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 6 10-6" />
                  </svg>
                </span>
                <a href="mailto:mohammadharoonu@gmail.com" className="contact-link">
                  mohammadharoonu@gmail.com
                </a>
              </li>
              <li className="contact-method">
                <span className="method-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                </span>
                <a href="tel:+917985765985" className="contact-link">
                  +91 79857 65985
                </a>
              </li>
              <li className="contact-method">
                <span className="method-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </span>
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

          <LeadForm serviceChoices={serviceChoices} />
        </div>
      </section>
    </>
  );
}

export default Landing;
