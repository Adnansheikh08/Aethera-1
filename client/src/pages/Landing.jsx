import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { getLandingContent } from "../api/client.js";
import { LeadForm } from "../components/LeadForm.jsx";
import {
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

      <Hero introComplete={introComplete} services={services} />
      <Marquee />
      <Statement />
      <Focus services={services} />
      <SelectedWork services={services} portfolioItems={portfolioItems} />
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

        <LeadForm serviceChoices={serviceChoices} />
      </section>
    </>
  );
}

export default Landing;
