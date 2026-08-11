import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { ApiError, requestErasure } from "../api/client.js";

/** Ported from templates/legal/privacy-policy.html. */
export function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Aethera</title>
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Legal Compliance</p>
        <h1 id="privacy-heading" className="page-title">
          Privacy Policy
        </h1>
      </header>

      <section className="container" aria-labelledby="privacy-heading">
        <div className="prose">
          <p>
            <em>Last updated: 30 July 2026</em>
          </p>

          <h2>1. Data storage &amp; encryption standard</h2>
          <p>
            We process personal data — specifically lead names, email addresses, and phone numbers —
            exclusively in encrypted form using AES-256. Database fields are cryptographically
            protected via key rings, preventing unauthorised local data read operations.
          </p>

          <h2>2. Compliance rights (GDPR &amp; DPDP Act)</h2>
          <p>
            You have the absolute right to correct your data, retrieve it, or request immediate data
            scrub activities. We provide a{" "}
            <Link to="/data-erasure">self-service compliance portal</Link> to execute erasure queries
            cleanly.
          </p>

          <h2>3. Cookie consents &amp; tracking</h2>
          <p>
            Our cookie implementation sets session cookies using strict HTTP-only flags. We do not
            engage in third-party marketing tracking without your granular opt-in consent.
          </p>
        </div>
      </section>
    </>
  );
}

/** Ported from templates/legal/terms.html. */
export function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Aethera</title>
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Legal Definition</p>
        <h1 id="terms-heading" className="page-title">
          Terms of Service
        </h1>
      </header>

      <section className="container" aria-labelledby="terms-heading">
        <div className="prose">
          <p>
            <em>Last updated: 30 July 2026</em>
          </p>

          <h2>1. Service definition</h2>
          <p>
            Aethera Agency provides specialised cybersecurity architecture audits, enterprise
            software engineering, digital campaigns, and post-production video services. Delivery
            scopes are defined by separate Statements of Work (SOW).
          </p>

          <h2>2. Code liability &amp; hardening</h2>
          <p>
            While we execute comprehensive OWASP ASVS checks and code scans before deployment, the
            client assumes execution risks upon deployment to live production platforms. Maintenance
            clauses are subject to separate service level agreements.
          </p>
        </div>
      </section>
    </>
  );
}
/**
 * Ported from templates/legal/erasure.html plus erasure_success.html — the SPA
 * collapses Django's two templates into one component with a submitted state.
 *
 * The success copy comes from the API rather than from the old template. Django
 * rendered "records associated with <email> have been scrubbed", which confirmed
 * whether an address was on file; the ported endpoint deliberately answers the
 * same way whether or not it matched, so the wording stays non-committal.
 */
export function DataErasure() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  const isBusy = state.status === "busy";

  async function handleSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    setState({ status: "busy", message: "" });

    try {
      const result = await requestErasure(email);
      setState({ status: "done", message: result.message });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.fieldErrors?.email?.[0] || err.message
          : "Something went wrong. Please try again shortly.";
      setState({ status: "error", message });
    }
  }

  if (state.status === "done") {
    return (
      <>
        <Helmet>
          <title>Erasure Complete — Aethera</title>
        </Helmet>

        <header className="page-header">
          <p className="eyebrow">Purged</p>
          <h1 id="success-heading" className="page-title">
            Erasure request received
          </h1>
        </header>

        <section className="container" aria-labelledby="success-heading">
          <div className="prose">
            <p role="status">{state.message}</p>
            <p>A compliance audit entry has been logged.</p>
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

  return (
    <>
      <Helmet>
        <title>Right to Erasure Request — Aethera</title>
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Privacy Compliance</p>
        <h1 id="erasure-heading" className="page-title">
          Request data erasure
        </h1>
      </header>

      <section className="container" aria-labelledby="erasure-heading">
        <div className="prose">
          <p>
            Under the General Data Protection Regulation (GDPR) and India&apos;s Digital Personal
            Data Protection (DPDP) Act, you have the right to request the erasure of your personal
            data from our registries. Enter your registered email below to scrub your PII
            immediately.
          </p>

          {state.status === "error" && (
            <p className="form-feedback error-box" role="alert">
              {state.message}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="erasure-email">Registered email address</label>
              <input
                type="email"
                name="email"
                id="erasure-email"
                className="form-input"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={state.status === "error" ? "true" : undefined}
                autoComplete="email"
              />
            </div>
            <div className="form-navigation">
              <button type="submit" className="cta-button btn-primary" disabled={isBusy}>
                {isBusy ? "Executing…" : "Execute secure erasure"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

/**
 * Django delegated unmatched URLs to its own 404 handler; the SPA owns routing
 * now, so the catch-all route renders this.
 */
export function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found — Aethera</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Error 404</p>
        <h1 id="notfound-heading" className="page-title">
          Page not found
        </h1>
      </header>

      <section className="container" aria-labelledby="notfound-heading">
        <div className="prose">
          <p>That address does not resolve to anything on this site.</p>
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

