import { useState } from "react";
import { Link } from "react-router-dom";

import { Reveal } from "./Reveal.jsx";
import { useCounter } from "../hooks/useCounter.js";
import { useCardTilt } from "../hooks/useCardTilt.js";
import { useLocalClock } from "../hooks/useLocalClock.js";
import { useComparisonSlider } from "../hooks/useComparisonSlider.js";
import { usePortfolioFilter, ALL_CATEGORIES } from "../hooks/usePortfolioFilter.js";
import { splitWords, useHeadlineReveal } from "../hooks/useReveal.js";
import { useScrollLock } from "../hooks/useScrollLock.js";
import { serviceBackground } from "../data/serviceBackgrounds.js";

const CAPABILITIES = [
  "Web Development",
  "Mobile Applications",
  "Digital Advertising",
  "Video & Photo Editing",
  "Thumbnail Design",
  "On-Location Shoots",
];

/**
 * Stat figures are authored here as strings so the decimal precision survives —
 * useCounter derives its precision from the authored form, and 99.98 as a
 * number would already have lost that information.
 */
const STATS = [
  { value: "140", suffix: "%", label: "Median performance uplift" },
  { value: "99.98", suffix: "%", label: "Measured platform uptime" },
  { value: "48", suffix: "+", label: "Systems shipped to production" },
  { value: "2", suffix: "h", label: "First-response commitment" },
];

const LOCATIONS = [
  { tag: "Main office", city: "Lucknow", address: "Uttar Pradesh, India", zone: "Asia/Kolkata" },
  { tag: "Remote", city: "Delhi", address: "India", zone: "Asia/Kolkata" },
  { tag: "Remote", city: "Noida", address: "Uttar Pradesh, India", zone: "Asia/Kolkata" },
];

export function Hero({ introComplete }) {
  // The headline cascade waits for the intro to resolve, as the vanilla
  // composition root did by awaiting the preloader's promise.
  const isRevealed = useHeadlineReveal(120, { enabled: introComplete });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-content">
        <p className="badge-pill">Cybersecurity &amp; Enterprise Software</p>
        <h1
          id="hero-heading"
          className={`hero-headline${isRevealed ? " is-revealed" : ""}`}
        >
          {/* Rendered as per-word spans so the stylesheet can stagger them;
              whitespace chunks stay plain text to preserve spacing. */}
          {splitWords("Building enterprise-grade ").map(({ chunk, isWord, wordIndex }, i) =>
            isWord ? (
              <span
                key={`${chunk}-${i}`}
                className="reveal-word"
                style={{ "--word-index": wordIndex }}
              >
                {chunk}
              </span>
            ) : (
              chunk
            ),
          )}
          <span className="serif-italic">digital systems</span>
        </h1>
        <p className="hero-desc">
          We engineer secure, high-performance platforms and multimedia campaigns for organisations
          that demand zero downtime and provable security compliance.
        </p>
        <div className="hero-ctas">
          <a href="#contact-section" className="cta-button btn-primary">
            Contact
          </a>
          <a href="#work-section" className="cta-button btn-secondary">
            Selected Work
          </a>
        </div>
        <a href="#statement-section" className="hero-scroll-hint">
          Scroll
        </a>
      </div>
    </section>
  );
}

/** The duplicate half is aria-hidden so the list is announced exactly once. */
export function Marquee() {
  return (
    <div className="marquee" aria-label="Capabilities">
      <div className="marquee-track">
        {CAPABILITIES.map((item) => (
          <span className="marquee-item" key={item}>
            {item}
          </span>
        ))}
        {CAPABILITIES.map((item) => (
          <span className="marquee-item" key={`echo-${item}`} aria-hidden="true">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Statement() {
  return (
    <section
      id="statement-section"
      className="container"
      aria-labelledby="statement-heading"
      data-reveal-group=""
    >
      <div className="section-head">
        <p className="eyebrow">Built Deliberately</p>
        <div>
          <Reveal as="h2" id="statement-heading" className="statement" staggerIndex={0}>
            We take on a small number of engagements each year, and treat security as a design
            constraint rather than a closing audit.
          </Reveal>
          <Reveal as="p" className="statement-note" staggerIndex={1}>
            Every platform we ship is threat-modelled before the first line of code, hardened
            against the OWASP ASVS standard, and handed over with the documentation an internal team
            needs to own it outright.
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** One service card; the tilt hook needs its own ref per card. */
function ServiceCard({ service, index, onDetailClick }) {
  const tiltRef = useCardTilt();
  const artwork = serviceBackground(service.slug);

  return (
    <Reveal as="article" className="card service-card" staggerIndex={index} ref={tiltRef}>
      {/* Its own layer, not a background on the card: useCardTilt tilts the card
          itself and rewrites its `background` on every mousemove, which would
          wipe the image out on hover. Decorative, so it stays out of the a11y
          tree.

          The quotes inside url() are load-bearing. Vite inlines an SVG this
          small as a data URI that carries single quotes around its attributes,
          and an unquoted url() token may not contain a quote character — the
          declaration parses as invalid and is dropped without any error. */}
      {artwork ? (
        <span
          className="service-card-art"
          style={{ backgroundImage: `url("${artwork}")` }}
          aria-hidden="true"
        />
      ) : null}
      <div>
        <h3 className="card-title">{service.title}</h3>
        <p>{service.short_description}</p>
        <button
          className="learn-more"
          onClick={() => onDetailClick(service)}
          type="button"
        >
          Detail<span className="visually-hidden"> about {service.title}</span>
        </button>
      </div>
    </Reveal>
  );
}

function ServiceModal({ service, onClose }) {
  // The backdrop and panel are position-fixed divs, not a <dialog>, so the page
  // underneath stays a live scroll container — the wheel goes straight past them
  // to the section behind. Nothing but locking the body stops that.
  useScrollLock();

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        role="presentation"
      />
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-content">
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close service details"
            type="button"
          >
            <span aria-hidden="true">✕</span>
          </button>
          <div className="modal-body">
            <h2 id="modal-title" className="modal-title">{service.title}</h2>
            <div className="modal-description" dangerouslySetInnerHTML={{ __html: service.description }} />
            <div className="modal-actions">
              <Link
                to={`/services/${service.slug}`}
                className="cta-button btn-primary"
                onClick={onClose}
              >
                View Full Details
              </Link>
              <button
                className="cta-button btn-secondary"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Focus({ services }) {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <section
      id="focus-section"
      className="container"
      aria-labelledby="focus-heading"
      data-reveal-group=""
    >
      <div className="section-head">
        <p className="eyebrow">Services</p>
        <div>
          <h2 id="focus-heading" className="section-heading">
            Our core offerings
          </h2>
          <p className="section-subtitle">
            Robust digital platforms built to modern engineering standards, delivered end to end.
          </p>
        </div>
      </div>

      <div className="services-grid">
        {services.length === 0 ? (
          <p className="filter-empty">Service catalogue is being updated. Please check back shortly.</p>
        ) : (
          services.map((service, index) => (
            <ServiceCard
              key={service.slug}
              service={service}
              index={index}
              onDetailClick={setSelectedService}
            />
          ))
        )}
      </div>

      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </section>
  );
}

function PortfolioCard({ item, index, cardProps }) {
  const { className, hidden } = cardProps(item);

  return (
    <Reveal
      as="article"
      className={`portfolio-card${className ? ` ${className}` : ""}`}
      data-card-category={item.service?.slug}
      staggerIndex={index}
      hidden={hidden}
    >
      <div className="portfolio-media" aria-hidden="true">
        <div className="window-header">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        <div className="window-content">
          <span className="symbol">&lt;/&gt;</span>
          <span className="code-line">build passing</span>
        </div>
      </div>
      <span className="metric-badge">{item.service?.title}</span>
      <h3 className="card-title">{item.title}</h3>
      <p>{item.description}</p>
      {item.project_url && (
        <a
          href={item.project_url}
          className="portfolio-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          View<span className="visually-hidden"> {item.title} (opens in a new tab)</span>
        </a>
      )}
    </Reveal>
  );
}

/**
 * The interactive half of the portfolio: filter chips, the live-region count and
 * the card grid — everything except the surrounding heading.
 *
 * Extracted so the landing page's Selected Work section and the /projects index
 * render the same markup from the same filter hook instead of two copies that
 * drift. Only one board mounts per route, so the ids below stay unique.
 */
export function PortfolioBoard({ services, portfolioItems }) {
  const { statusText, isEmpty, cardProps, chipProps } = usePortfolioFilter(
    portfolioItems,
    (item) => item.service?.slug,
  );

  return (
    <>
      <div
        className="filter-bar"
        data-filter-bar=""
        role="group"
        aria-label="Filter projects by discipline"
      >
        <button type="button" className="filter-chip" {...chipProps(ALL_CATEGORIES)}>
          All
        </button>
        {services.map((service) => (
          <button
            key={service.slug}
            type="button"
            className="filter-chip"
            {...chipProps(service.slug)}
          >
            {service.title}
          </button>
        ))}
      </div>

      {/* Filtering is a purely visual change, so the resulting count is
          mirrored here for screen-reader users. */}
      <p className="visually-hidden" id="portfolio-status" role="status" aria-live="polite">
        {statusText}
      </p>

      <div className="portfolio-grid" id="portfolio-grid">
        {portfolioItems.map((item, index) => (
          <PortfolioCard
            key={item.slug ?? item.id}
            item={item}
            index={index}
            cardProps={cardProps}
          />
        ))}

        <p className="filter-empty" data-filter-empty="" hidden={!isEmpty}>
          No projects match that discipline yet.
        </p>
      </div>
    </>
  );
}

export function SelectedWork({ services, portfolioItems }) {
  return (
    <section
      id="work-section"
      className="container"
      aria-labelledby="work-heading"
      data-reveal-group=""
    >
      <div className="section-head">
        <p className="eyebrow">Selected Work</p>
        <div>
          <h2 id="work-heading" className="section-heading">
            Delivered engagements
          </h2>
          <p className="section-subtitle">
            A cross-section of platforms and campaigns shipped to production.
          </p>
        </div>
      </div>

      <PortfolioBoard services={services} portfolioItems={portfolioItems} />

      <div className="hero-ctas">
        <Link to="/projects" className="cta-button btn-secondary">
          View all projects
        </Link>
      </div>
    </section>
  );
}

export function Comparison() {
  const { rootProps, rangeProps } = useComparisonSlider(50);

  return (
    <section className="container" aria-labelledby="compare-heading" data-reveal-group="">
      <div className="section-head">
        <p className="eyebrow">Post-Production</p>
        <div>
          <h2 id="compare-heading" className="section-heading">
            Before and after
          </h2>
          <p className="section-subtitle">
            Drag the divider, or focus it and use the arrow keys, to compare source footage against
            our graded delivery.
          </p>
        </div>
      </div>

      <Reveal className="compare" data-compare="" staggerIndex={0} {...rootProps}>
        <div className="compare-panel compare-panel-before">Source</div>
        <div className="compare-panel compare-panel-after">Graded</div>
        {/* The native range is the source of truth; the handle beside it is
            decorative and stays the range's next sibling so :focus-visible
            styling can reach it. */}
        <input
          className="compare-range"
          data-compare-range=""
          step="1"
          aria-label="Reveal the edited version"
          {...rangeProps}
        />
        <span className="compare-handle" aria-hidden="true" />
        <p className="compare-caption">
          Colour grade, cleanup and delivery encode — typical 48-hour turnaround.
        </p>
      </Reveal>
    </section>
  );
}

function StatTile({ stat, index }) {
  const { ref, value } = useCounter(stat.value);

  return (
    <Reveal className="stat-tile" staggerIndex={index}>
      {/* The authored figure stays in the markup so it is correct before the
          counter runs; the hook only rewrites the digit node. */}
      <p className="stat-value" ref={ref} data-count-to={stat.value}>
        <span data-count-digits="">{value}</span>
        <span className="stat-suffix">{stat.suffix}</span>
      </p>
      <p className="stat-label">{stat.label}</p>
    </Reveal>
  );
}

function CaseStudyCard({ study, index }) {
  const tiltRef = useCardTilt();

  return (
    <Reveal as="article" className="card" key={study.slug} staggerIndex={index} ref={tiltRef}>
      <p className="card-index">{study.metrics}</p>
      <h3 className="card-title">{study.client_name}</h3>
      <p>{study.challenge}</p>
      <Link to={`/case-studies/${study.slug}`} className="learn-more">
        Case study<span className="visually-hidden"> for {study.client_name}</span>
      </Link>
    </Reveal>
  );
}

export function Proof({ caseStudies }) {
  return (
    <section
      id="proof-section"
      className="container"
      aria-labelledby="proof-heading"
      data-reveal-group=""
    >
      <div className="section-head">
        <p className="eyebrow">Testimonials</p>
        <div>
          <h2 id="proof-heading" className="section-heading">
            Measured outcomes
          </h2>
          <p className="section-subtitle">
            Numbers taken from delivered engagements — performance, availability and response times
            we hold ourselves to contractually.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {STATS.map((stat, index) => (
          <StatTile key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {caseStudies.length > 0 && (
        /* --space-16, not the --space-2xl this used to name: the scale in
           style.css is numeric (--space-1 … --space-20), so --space-2xl never
           resolved and the whole declaration was dropped at computed-value
           time. The case-study grid was butting straight up against the stats. */
        <div className="services-grid" style={{ marginBlockStart: "var(--space-16)" }}>
          {caseStudies.map((study, index) => (
            <CaseStudyCard study={study} index={index} key={study.slug} />
          ))}
        </div>
      )}
    </section>
  );
}

function LocationCard({ location, index }) {
  const { time, isLive } = useLocalClock(location.zone);

  return (
    <Reveal className="location" staggerIndex={index}>
      <p className="location-tag">{location.tag}</p>
      <h3 className="location-city">{location.city}</h3>
      <p className="location-address">{location.address}</p>
      <p
        className={`location-clock${isLive ? " is-live" : ""}`}
        data-clock=""
        data-timezone={location.zone}
      >
        <span className="visually-hidden">Current local time: </span>
        {/* The placeholder stays until the first client tick resolves. */}
        <span data-clock-value="">{isLive ? time : "—"}</span>
      </p>
    </Reveal>
  );
}

export function Locations() {
  return (
    /* The id is here for the section spy in Layout.jsx, not for a link: this
       section has no nav entry, and without an id the spy cannot tell that the
       reader has moved past Testimonial. */
    <section
      id="locations-section"
      className="container band"
      aria-labelledby="locations-heading"
      data-reveal-group=""
    >
      <div className="section-head">
        <p className="eyebrow">Where We Are</p>
        <div>
          <h2 id="locations-heading" className="section-heading">
            Operating hours
          </h2>
        </div>
      </div>

      <div className="locations-grid">
        {LOCATIONS.map((location, index) => (
          <LocationCard key={location.city} location={location} index={index} />
        ))}
      </div>
    </section>
  );
}
