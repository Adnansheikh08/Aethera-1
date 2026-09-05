import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { getLandingContent } from "../api/client.js";
import { ContactSection } from "../components/ContactSection.jsx";
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
      <Marquee services={services} />
      <Statement />
      <Focus services={services} />
      <SelectedWork services={services} portfolioItems={portfolioItems} />
      <Proof caseStudies={caseStudies} />
      <Locations />

      {/* The same complete contact section the /contact page renders — pitch
          column plus form — fed with the choices this page already fetched. */}
      <ContactSection serviceChoices={serviceChoices} error={error} />
    </>
  );
}

export default Landing;
