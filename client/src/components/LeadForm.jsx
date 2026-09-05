import { useEffect, useRef } from "react";

import { useLeadWizard } from "../hooks/useLeadWizard.js";

/** Inline checkmark for the compact success note. */
function CheckIcon() {
  return (
    <svg
      className="feedback-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/** Clock for the reply-time badge in the card head. */
function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/** Arrow that nudges right on CTA hover. */
function ArrowRightIcon() {
  return (
    <svg
      className="lead-submit-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Feather-style glyphs that sit inside the inputs, one per field. */
const FIELD_ICONS = {
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  email: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  message: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
};

function FieldIcon({ name }) {
  return (
    <span className="field-glyph" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {FIELD_ICONS[name]}
      </svg>
    </span>
  );
}

/**
 * Wraps a control in the icon layout — but only in the `detailed` variant used
 * by the contact page. The landing page renders the bare control, exactly as
 * before, so its contact section is untouched by this component's styling.
 */
function FieldWrap({ icon, detailed, children }) {
  if (!detailed) return children;
  return (
    <div className="field-icon-wrap">
      <FieldIcon name={icon} />
      {children}
    </div>
  );
}

/**
 * Lead capture form — single page form with all fields visible.
 *
 * `detailed` opts into the richer contact-page presentation (field icons,
 * reply-time badge, wide CTA); the default is the compact landing-page form.
 */
export function LeadForm({ serviceChoices = [], detailed = false }) {
  // Focused-once flag for the honeypot: browsers autofill it without focus, so
  // focus is the one signal separating a human-driven fill from autofill.
  const honeypotTouched = useRef(false);
  const {
    values,
    errors,
    isSubmitting,
    feedback,
    setField,
    handleSubmit,
    fieldProps,
  } = useLeadWizard({ honeypotTouched });

  // The feedback note sits above the fields, out of sight after a submit from the
  // bottom of the form — bring it into view so the outcome is never silent.
  const feedbackRef = useRef(null);
  useEffect(() => {
    if (feedback) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [feedback]);

  return (
    <div className="lead-form-card">
      <div className="lead-form-head">
        <div className="lead-form-head-row">
          <h2 className="lead-form-title">Start a conversation</h2>
          {detailed && (
            <span className="lead-form-badge">
              <ClockIcon />
              Replies within 2 hrs
            </span>
          )}
        </div>
        <p className="lead-form-sub">Tell us a little about your project.</p>
      </div>

      {/* Pre-existing live region: the outcome is written in here rather than
          inserted as a fresh node, which several screen-reader/browser pairs
          would fail to announce. The success copy is a compact line so the note
          reads as an acknowledgement, not a banner. */}
      <p
        ref={feedbackRef}
        className={`form-feedback${feedback ? (feedback.ok ? " success-box" : " error-box") : ""}`}
        data-form-feedback=""
        role="status"
        aria-live="polite"
        hidden={!feedback}
      >
        {feedback?.ok && <CheckIcon />}
        <span>
          {feedback?.ok
            ? "Message received. We'll be in touch shortly."
            : feedback?.message}
        </span>
      </p>

      <form id="client-ingestion-form" onSubmit={handleSubmit} noValidate>
        {/* Honeypot: kept outside the visible form so it is never focused or validated. */}
        <div aria-hidden="true">
          <input
            type="text"
            name="website"
            className="honey-field"
            autoComplete="off"
            tabIndex={-1}
            value={values.website}
            onFocus={() => {
              honeypotTouched.current = true;
            }}
            onChange={(event) => setField("website", event.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lead-name">Full name</label>
            <FieldWrap icon="user" detailed={detailed}>
              <input
                {...fieldProps("name")}
                type="text"
                className="form-input"
                placeholder="Your name"
                maxLength={150}
                required
              />
            </FieldWrap>
            <p className="field-error" data-error-for="lead-name">
              {errors.name}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="lead-email">Work email</label>
            <FieldWrap icon="email" detailed={detailed}>
              <input
                {...fieldProps("email")}
                type="email"
                className="form-input"
                placeholder="you@company.com"
                required
              />
            </FieldWrap>
            <p className="field-error" data-error-for="lead-email">
              {errors.email}
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lead-phone">Contact number</label>
            <FieldWrap icon="phone" detailed={detailed}>
              <input
                {...fieldProps("phone")}
                type="text"
                className="form-input"
                placeholder="+91 XXXXX XXXXX"
                maxLength={20}
                required
              />
            </FieldWrap>
            <p className="field-error" data-error-for="lead-phone">
              {errors.phone}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="lead-service">Service required</label>
            <FieldWrap icon="briefcase" detailed={detailed}>
              <select {...fieldProps("service_type")} className="form-select" required>
                <option value="">Select a service</option>
                {serviceChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </FieldWrap>
            <p className="field-error" data-error-for="lead-service">
              {errors.service_type}
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lead-info">
            Project brief <span className="visually-hidden">(optional)</span>
          </label>
          <FieldWrap icon="message" detailed={detailed}>
            <textarea
              {...fieldProps("additional_info")}
              className="form-textarea"
              placeholder="Tell us about your project — goals, requirements, timeline..."
              rows={4}
            />
          </FieldWrap>
          <p className="field-error" data-error-for="lead-info">
            {errors.additional_info}
          </p>
        </div>

        <div className="form-navigation">
          <button type="submit" className="cta-button lead-submit" data-submit="" disabled={isSubmitting}>
            {isSubmitting ? (
              "Submitting…"
            ) : detailed ? (
              <>
                Start a Conversation <ArrowRightIcon />
              </>
            ) : (
              "Start a Conversation →"
            )}
          </button>
        </div>

        <p className="form-intro">
          Your information is secure and never shared with third parties.
        </p>
      </form>
    </div>
  );
}

export default LeadForm;
