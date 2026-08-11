import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { getCaseStudy, getService } from "../api/client.js";

/**
 * Django applied |linebreaks, which wraps blank-line-separated blocks in <p>
 * and turns single newlines into <br>. Rendering as an array of paragraphs
 * reproduces that without dangerouslySetInnerHTML — the copy is admin-authored,
 * so injecting it as HTML would turn a CMS field into a stored-XSS vector.
 */
function Prose({ text }) {
  if (!text) return null;

  return (
    <>
      {String(text)
        .split(/\n\s*\n/)
        .map((block, index) => (
          <p key={index}>
            {block.split("\n").map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
    </>
  );
}

/** Shared loading / not-found shell for both detail pages. */
function DetailState({ error, children }) {
  if (error) {
    return (
      <>
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
            <title>{`${service.title} — Aethera`}</title>
            <meta name="description" content={service.short_description} />
            <meta property="og:title" content={`${service.title} — Aethera`} />
            <meta property="og:description" content={service.short_description} />
            <meta name="twitter:title" content={`${service.title} — Aethera`} />
            <meta name="twitter:description" content={service.short_description} />
          </Helmet>

          <header className="page-header">
            <p className="eyebrow">Service Capability</p>
            <h1 id="service-title" className="page-title">
              {service.title}
            </h1>
          </header>

          <section className="container" aria-labelledby="service-title">
            <p className="section-subtitle">{service.short_description}</p>

            <div className="prose">
              <Prose text={service.description} />
            </div>

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
            <title>{`${study.client_name} Case Study — Aethera`}</title>
            <meta name="description" content={study.metrics} />
            {/* Django's base.html allowed a per-page og:type; case studies are
                editorial write-ups, so they announce themselves as articles.
                Everything else is inherited from SiteMeta. */}
            <meta property="og:type" content="article" />
            <meta property="og:title" content={`${study.client_name} Case Study — Aethera`} />
            <meta property="og:description" content={study.metrics} />
            <meta name="twitter:title" content={`${study.client_name} Case Study — Aethera`} />
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
