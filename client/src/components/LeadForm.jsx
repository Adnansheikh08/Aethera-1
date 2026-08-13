import { useLeadWizard } from "../hooks/useLeadWizard.js";

/**
 * Lead capture form — single page form with all fields visible.
 */
export function LeadForm({ serviceChoices = [] }) {
  const {
    values,
    errors,
    isSubmitting,
    feedback,
    setField,
    handleSubmit,
    fieldProps,
  } = useLeadWizard();

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

      <p className="form-intro">
        All submissions are encrypted at rest and never shared with third parties.
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
            onChange={(event) => setField("website", event.target.value)}
          />
        </div>

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
          <button type="submit" className="cta-button btn-primary" data-submit="" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit form"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeadForm;
