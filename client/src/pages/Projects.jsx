import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { getProjectsContent } from "../api/client.js";
import { PortfolioBoard } from "../components/sections.jsx";

/**
 * Dedicated projects index.
 *
 * The landing page already carries a Selected Work section, but it lives
 * mid-scroll and cannot be linked to or shared on its own. This gives the
 * portfolio a real URL, its own title and description for search and social
 * cards, and a sitemap entry — while rendering the exact same grid component,
 * so the two views can never disagree about what has shipped.
 *
 * Both the grid and the filter chips come from one /content/projects request,
 * mirroring how Landing sources everything from /content/landing.
 */
export function Projects() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getProjectsContent(controller.signal)
      .then(setContent)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      });

    return () => controller.abort();
  }, []);

  const services = content?.services ?? [];
  const portfolioItems = content?.portfolio_items ?? [];

  return (
    <>
      <Helmet>
        <title>Projects — Aethera</title>
        <meta
          name="description"
          content="Platforms, applications and campaigns Aethera has shipped to production — filter the portfolio by discipline."
        />
        <meta property="og:title" content="Projects — Aethera" />
        <meta
          property="og:description"
          content="A complete index of the platforms and campaigns we have delivered."
        />
        <meta name="twitter:title" content="Projects — Aethera" />
        <meta
          name="twitter:description"
          content="A complete index of the platforms and campaigns we have delivered."
        />
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Our Work</p>
        <h1 id="projects-title" className="page-title">
          Projects
        </h1>
      </header>

      <section className="container" aria-labelledby="projects-title">
        <p className="section-subtitle" style={{ marginBlockEnd: "var(--space-10)" }}>
          Every engagement below is live in production. Filter by discipline to see the work closest
          to what you are building.
        </p>

        {error && (
          <p className="form-feedback error-box" role="alert">
            The project index could not be loaded. Please try again shortly, or reach us directly and
            we will send the portfolio over.
          </p>
        )}

        {/* An empty grid reads as "no work" rather than "not loaded yet", which
            is why this page announces the pending state that the landing
            section — a fragment of a much larger page — can afford to skip. */}
        {!content && !error && (
          <p className="filter-empty" role="status">
            Loading projects…
          </p>
        )}

        {content && <PortfolioBoard services={services} portfolioItems={portfolioItems} />}

        <div className="hero-ctas">
          <a href="/#contact-section" className="cta-button btn-primary">
            Start a project
          </a>
          <Link to="/" className="cta-button btn-secondary">
            Back to home
          </Link>
        </div>
      </section>
    </>
  );
}

export default Projects;
