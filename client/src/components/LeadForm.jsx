import { STEPS, useLeadWizard } from "../hooks/useLeadWizard.js";

/**
 * Lead capture form, ported from the #client-ingestion-form block in
 * templates/agency/index.html.
 *
 * The Django version rendered all three panes stacked and let the wizard module
 * layer step behaviour on top, so the form still POSTed without scripting. In
 * the SPA the panes are conditionally styled rather than conditionally
 * rendered — every field stays mounted so a value typed on step 1 survives a
 * trip back from step 3, and the server-side validation contract is unchanged.
 */
export function LeadForm({ serviceChoices = [] }) {
  const {
    values,
    errors,
    activeIndex,
    isSubmitting,
    feedback,
    setField,
    goNext,
    goBack,
    handleSubmit,
    stepRefs,
    progress,
    nodeState,
    fieldProps,
  } = useLeadWizard();

  const stepClass = (index) => `form-step${index === activeIndex ? " is-active" : ""}`;

  return (
    <div className="contact-info-card">
      {/* Pre-existing live region: the outcome is written in here rather than
          inserted as a fresh node, which several screen-reader/browser pairs
          would fail to announce. */}
      <p
        className={`form-feedback${feedback ? (feedback.ok ? " success-box" : " error-box") : ""}`}
        data-form-feedback=""
        role="status"
        aria-live="polite"
        hidden={!feedback}
      >
        {feedback?.message}
      </p>

      <div className="form-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            data-progress-fill=""
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <ol className="progress-nodes">
          {STEPS.map((step, index) => (
            <li
              key={step.label}
              className="progress-node"
              data-step-node=""
              data-state={nodeState(index)}
            >
              <span className="node-marker" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.label}
            </li>
          ))}
        </ol>
      </div>

      <p className="form-intro">
        All submissions are encrypted at rest and never shared with third parties.
      </p>

      <form id="client-ingestion-form" onSubmit={handleSubmit} noValidate>
        {/* Honeypot: kept outside the step panes so it is never focused,
            validated, or revealed by the wizard. */}
        <div aria-hidden="true">
          <input
            type="text"
            name="website"
            className="honey-field"
            autoComplete="off"
            tabIndex={-1}
            value={values.website}
            onChange={(event) => setField("website", event.target.value)}
          />
        </div>

        <div
          className={stepClass(0)}
          data-step=""
          ref={(node) => {
            stepRefs.current[0] = node;
          }}
        >
          <div className="form-group">
            <label htmlFor="lead-name">Full name</label>
            <input
              {...fieldProps("name")}
              type="text"
              className="form-input"
              placeholder="Your Name"
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
              placeholder="Enterprise Email"
              required
            />
            <p className="field-error" data-error-for="lead-email">
              {errors.email}
            </p>
          </div>
          <div className="form-navigation">
            <button
              type="button"
              className="cta-button btn-primary step-next"
              data-step-action="next"
              onClick={goNext}
            >
              Continue
            </button>
          </div>
        </div>

        <div
          className={stepClass(1)}
          data-step=""
          ref={(node) => {
            stepRefs.current[1] = node;
          }}
        >
          <div className="form-group">
            <label htmlFor="lead-phone">Contact number</label>
            <input
              {...fieldProps("phone")}
              type="text"
              className="form-input"
              placeholder="Contact Number"
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
          <div className="form-navigation">
            <button
              type="button"
              className="cta-button btn-secondary step-prev"
              data-step-action="prev"
              onClick={goBack}
            >
              Back
            </button>
            <button
              type="button"
              className="cta-button btn-primary step-next"
              data-step-action="next"
              onClick={goNext}
            >
              Continue
            </button>
          </div>
        </div>

        <div
          className={stepClass(2)}
          data-step=""
          ref={(node) => {
            stepRefs.current[2] = node;
          }}
        >
          <div className="form-group">
            <label htmlFor="lead-info">
              Project brief <span className="visually-hidden">(optional)</span>
            </label>
            <textarea
              {...fieldProps("additional_info")}
              className="form-textarea"
              placeholder="Briefly describe your project requirements and target goals..."
              rows={4}
            />
            <p className="field-error" data-error-for="lead-info">
              {errors.additional_info}
            </p>
          </div>
          <div className="form-navigation">
            <button
              type="button"
              className="cta-button btn-secondary step-prev"
              data-step-action="prev"
              onClick={goBack}
            >
              Back
            </button>
            {/* The label swaps between its idle and busy text, as the vanilla
                wizard did by rewriting textContent. */}
            <button type="submit" className="cta-button btn-primary" data-submit="" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit form"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LeadForm;
