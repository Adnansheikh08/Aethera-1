import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { getCaseStudy, getService } from "../api/client.js";
import { Prose } from "../components/Prose.jsx";
import { PortfolioBoard } from "../components/sections.jsx";
import { serviceBackground } from "../data/serviceBackgrounds.js";

/** Shared loading / not-found shell for both detail pages. */
function DetailState({ error, children }) {
  if (error) {
    return (
      <>
        <Helmet>
          <title>
            {error.status === 404
              ? "Page Not Found — ServeXservices"
              : "Page Unavailable — ServeXservices"}
          </title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <header className="page-header">
          <p className="eyebrow">Not found</p>
          <h1 className="page-title">{error.status === 404 ? "Page not found" : "Unavailable"}</h1>
        </header>
        <section className="container">
          <div className="prose">
            <p>
              {error.status === 404
                ? "That entry does not exist, or is no longer published."
                : "We could not load that entry. Please try again shortly."}
            </p>
            <div className="form-navigation">
              <Link to="/" className="cta-button btn-primary">
                Return to homepage
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return children;
}

export function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setService(null);
    setError(null);

    getService(slug, controller.signal)
      .then((data) => setService(data.service))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      });

    return () => controller.abort();
  }, [slug]);

  return (
    <DetailState error={error}>
      {service && (
        <>
          {/*
            Overrides only what Django's blocks overrode. og:site_name, og:type,
            twitter:card and the canonical/og:url pair are inherited from
            SiteMeta, which derives the URL from the router.
          */}
          <Helmet>
            <title>{`${service.title} — ServeXservices`}</title>
            <meta name="description" content={service.short_description} />
            <meta property="og:title" content={`${service.title} — ServeXservices`} />
            <meta property="og:description" content={service.short_description} />
            <meta name="twitter:title" content={`${service.title} — ServeXservices`} />
            <meta name="twitter:description" content={service.short_description} />
          </Helmet>

          <header className="page-header">
            <div className="service-detail-hero">
              {serviceBackground(service.slug) && (
                <img
                  className="service-detail-art"
                  src={serviceBackground(service.slug)}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="eyebrow">Service Capability</p>
                <h1 id="service-title" className="page-title">
                  {service.title}
                </h1>
              </div>
            </div>
          </header>

          <section className="container" aria-labelledby="service-title">
            <p className="section-subtitle">{service.short_description}</p>

            <div className="prose">
              <Prose text={service.description} />
            </div>

            <section className="service-skills" aria-labelledby="skills-title">
              <p className="eyebrow">Core skills</p>
              <h2 id="skills-title" className="section-heading">Tools and capabilities</h2>
              {service.skills?.length ? (
                <ul className="skill-list">
                  {service.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              ) : (
                <p className="section-subtitle">Skills used across our work in this discipline.</p>
              )}
            </section>

            <section className="service-projects" aria-labelledby="service-projects-title">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected work</p>
                  <h2 id="service-projects-title" className="section-heading">Projects in {service.title}</h2>
                </div>
              </div>
              {service.projects?.length ? (
                <PortfolioBoard services={[service]} portfolioItems={service.projects} />
              ) : (
                <p className="filter-empty">Projects for this capability are being prepared.</p>
              )}
            </section>

            <div className="hero-ctas">
              <a href="/#contact-section" className="cta-button btn-primary">
                Request capability deck
              </a>
              <Link to="/" className="cta-button btn-secondary">
                Back to home
              </Link>
            </div>
          </section>
        </>
      )}
    </DetailState>
  );
}

export function CaseStudyDetail() {
  const { slug } = useParams();
  const [study, setStudy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setStudy(null);
    setError(null);

    getCaseStudy(slug, controller.signal)
      .then((data) => setStudy(data.case_study))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      });

    return () => controller.abort();
  }, [slug]);

  return (
    <DetailState error={error}>
      {study && (
        <>
          <Helmet>
            <title>{`${study.client_name} Case Study — ServeXservices`}</title>
            <meta name="description" content={study.metrics} />
            {/* Django's base.html allowed a per-page og:type; case studies are
                editorial write-ups, so they announce themselves as articles.
                Everything else is inherited from SiteMeta. */}
            <meta property="og:type" content="article" />
            <meta property="og:title" content={`${study.client_name} Case Study — ServeXservices`} />
            <meta property="og:description" content={study.metrics} />
            <meta name="twitter:title" content={`${study.client_name} Case Study — ServeXservices`} />
            <meta name="twitter:description" content={study.metrics} />
          </Helmet>

          <header className="page-header">
            <p className="eyebrow">{study.metrics}</p>
            <h1 id="case-title" className="page-title">
              {study.client_name}
            </h1>
          </header>

          <section className="container" aria-labelledby="case-title">
            <div className="prose">
              <h2>The challenge</h2>
              <Prose text={study.challenge} />

              <h2>The result</h2>
              <Prose text={study.result} />
            </div>

            <div className="hero-ctas">
              <a href="/#contact-section" className="cta-button btn-primary">
                Schedule consultation
              </a>
              <Link to="/" className="cta-button btn-secondary">
                Back to home
              </Link>
            </div>
          </section>
        </>
      )}
    </DetailState>
  );
}
