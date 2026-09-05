import { useCallback, useRef, useState } from "react";

import { submitLead } from "../api/client.js";

const FALLBACK_SUCCESS = "Inquiry secured. Our team will respond within two business hours.";
const FALLBACK_FAILURE =
  "We could not process that request. Please review your details and try again.";

/**
 * The three wizard panes, in order. Each lists the fields it owns so a step can
 * be validated without reaching into the DOM the way the original module did.
 */
export const STEPS = [
  { label: "Contact", fields: ["name", "email"] },
  { label: "Scope", fields: ["phone", "service_type"] },
  { label: "Brief", fields: ["additional_info"] },
];

/** Mirrors LeadForm: everything but additional_info and the honeypot is required. */
const REQUIRED = new Set(["name", "email", "phone", "service_type"]);

const LABELS = {
  name: "Full name",
  email: "Work email",
  phone: "Contact number",
  service_type: "Service required",
  additional_info: "Project brief",
};

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  service_type: "",
  additional_info: "",
  website: "", // honeypot — never rendered into a step pane
};

/**
 * Progressive multi-step lead form, ported from static/js/modules/lead-wizard.js.
 *
 * The original layered a wizard over a fully server-rendered form so the
 * conversion path never depended on scripting. That fallback is gone with the
 * SPA, but the rest of the contract is kept deliberately: validation here is a
 * UX affordance only — the Express endpoint remains the authority and returns
 * Django-shaped {field: [message]} errors, which are merged into the same error
 * map. The honeypot is carried in state and never focused or validated; a value
 * that appears without a focus event is browser autofill, not a human, and is
 * stripped before submission (see honeypotTouched).
 */
export function useLeadWizard({ honeypotTouched } = {}) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, message }
  const stepRefs = useRef([]);

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error the moment the user corrects it.
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /** Native constraint validation, matching the original's checkValidity() use. */
  const validateStep = useCallback(
    (index) => {
      const found = {};
      for (const field of STEPS[index].fields) {
        if (!REQUIRED.has(field)) continue;
        const value = String(values[field] ?? "").trim();

        if (!value) {
          found[field] = `${LABELS[field]} is required.`;
        } else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          found[field] = "Enter a valid email address.";
        }
      }

      setErrors(found);
      if (Object.keys(found).length > 0) {
        // Focus the first invalid field, as the DOM version did.
        const first = Object.keys(found)[0];
        stepRefs.current[index]?.querySelector(`[name="${first}"]`)?.focus();
        return false;
      }
      return true;
    },
    [values],
  );

  const goNext = useCallback(() => {
    if (validateStep(activeIndex) && activeIndex < STEPS.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  }, [activeIndex, validateStep]);

  const goBack = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      // LeadForm shows every step's fields on one page, so validate them all —
      // the active pane is not a proxy for what the user can see and fill.
      const found = {};
      for (const step of STEPS) {
        for (const field of step.fields) {
          if (!REQUIRED.has(field)) continue;
          const value = String(values[field] ?? "").trim();
          if (!value) {
            found[field] = `${LABELS[field]} is required.`;
          } else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            found[field] = "Enter a valid email address.";
          }
        }
      }
      setErrors(found);
      if (Object.keys(found).length > 0) {
        // Focus the first invalid field, as validateStep does for a single step.
        const first = Object.keys(found)[0];
        stepRefs.current[0]?.querySelector(`[name="${first}"]`)?.focus();
        return;
      }

      setIsSubmitting(true);
      setFeedback(null);

      // Autofill and password managers populate the hidden honeypot without
      // ever focusing it — a value with no focus event behind it is a machine
      // artifact, not a human, so blank it before it reaches the bot gate.
      const payload = honeypotTouched?.current ? values : { ...values, website: "" };

      try {
        const result = await submitLead(payload);
        setValues(EMPTY);
        setErrors({});
        setActiveIndex(0);
        setFeedback({ ok: true, message: result?.message ?? FALLBACK_SUCCESS });
      } catch (error) {
        // The API returns {field: [message]} on a 400; surface those against
        // their fields and jump back to the earliest step that has one.
        const fieldErrors = error?.fieldErrors ?? {};
        const flattened = Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : String(value),
          ]),
        );

        if (Object.keys(flattened).length > 0) {
          setErrors(flattened);
          const earliest = STEPS.findIndex((step) =>
            step.fields.some((field) => field in flattened),
          );
          if (earliest >= 0) setActiveIndex(earliest);
        }

        setFeedback({ ok: false, message: error?.message || FALLBACK_FAILURE });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values],
  );

  return {
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
    /** 0 -> 1 across the panes, driving the progress bar's width. */
    progress: STEPS.length > 1 ? activeIndex / (STEPS.length - 1) : 1,
    /** "done" | "active" | "pending", matching the original data-state values. */
    nodeState: (index) =>
      index < activeIndex ? "done" : index === activeIndex ? "active" : "pending",
    /** Props for one field, including the error slot wiring. */
    fieldProps: (name) => ({
      name,
      id: `lead-${name === "service_type" ? "service" : name === "additional_info" ? "info" : name}`,
      value: values[name] ?? "",
      "aria-invalid": String(Boolean(errors[name])),
      onChange: (event) => setField(name, event.target.value),
    }),
  };
}

export { FALLBACK_SUCCESS, FALLBACK_FAILURE, LABELS };
