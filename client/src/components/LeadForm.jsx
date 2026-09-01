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

/**
 * Lead capture form — single page form with all fields visible.
 */
export function LeadForm({ serviceChoices = [] }) {
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
        <h2 className="lead-form-title">Start a conversation</h2>
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
            <input
              {...fieldProps("name")}
              type="text"
              className="form-input"
              placeholder="Your name"
              maxLength={150}
              required
            />
            <p className="field-error" data-error-for="lead-name">
              {errors.name}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="lead-email">Work email</label>
            <input
              {...fieldProps("email")}
              type="email"
              className="form-input"
              placeholder="you@company.com"
              required
            />
            <p className="field-error" data-error-for="lead-email">
              {errors.email}
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lead-phone">Contact number</label>
            <input
              {...fieldProps("phone")}
              type="text"
              className="form-input"
              placeholder="+91 XXXXX XXXXX"
              maxLength={20}
              required
            />
            <p className="field-error" data-error-for="lead-phone">
              {errors.phone}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="lead-service">Service required</label>
            <select {...fieldProps("service_type")} className="form-select" required>
              <option value="">Select a service</option>
              {serviceChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
            <p className="field-error" data-error-for="lead-service">
              {errors.service_type}
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lead-info">
            Project brief <span className="visually-hidden">(optional)</span>
          </label>
          <textarea
            {...fieldProps("additional_info")}
            className="form-textarea"
            placeholder="Tell us about your project — goals, requirements, timeline..."
            rows={4}
          />
          <p className="field-error" data-error-for="lead-info">
            {errors.additional_info}
          </p>
        </div>

        <div className="form-navigation">
          <button type="submit" className="cta-button lead-submit" data-submit="" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Start a Conversation →"}
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
