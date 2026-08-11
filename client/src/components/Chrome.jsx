import { usePreloader } from "../hooks/usePreloader.js";
import { useScrollProgressValue } from "../hooks/useScrollProgress.js";
import { useCookieConsent } from "../hooks/useCookieConsent.js";

/**
 * Intro sequence from base.html. Permanently aria-hidden — it is decorative,
 * and the stylesheet fades it out via `.preloader.is-complete`.
 */
export function Preloader({ onComplete }) {
  const { label, className, barStyle } = usePreloader({ onComplete });

  return (
    <div className={className} data-preloader="" aria-hidden="true">
      <span className="preloader-brand">Aethera</span>
      <div className="preloader-track">
        <div className="preloader-bar" data-preloader-bar="" style={barStyle} />
      </div>
      <span className="preloader-count" data-preloader-count="">
        {label}
      </span>
    </div>
  );
}

export function ScrollProgress() {
  const progress = useScrollProgressValue();

  return (
    <div
      className="scroll-progress"
      data-scroll-progress=""
      aria-hidden="true"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

/**
 * Consent gate from base.html. Non-essential categories are opt-in and default
 * to unchecked; `enabled` defers the prompt until the intro has resolved, which
 * is what the vanilla composition root did by awaiting the preloader promise.
 */
export function CookieBanner({ enabled = true }) {
  const {
    isMounted,
    isVisible,
    selection,
    toggleCategory,
    acceptSelected,
    acceptEssentialOnly,
    bannerProps,
    className,
  } = useCookieConsent({ enabled });

  if (!isMounted) return null;

  return (
    <aside
      {...bannerProps}
      className={className}
      data-cookie-banner=""
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-heading"
      aria-describedby="cookie-copy"
      aria-hidden={isVisible ? undefined : "true"}
    >
      <div>
        <h2 className="footer-heading" id="cookie-heading">
          Cookie preferences
        </h2>
        <p className="cookie-copy" id="cookie-copy">
          Essential cookies keep this site secure and are always active. Choose whether we may also
          use analytics and marketing cookies.
        </p>
        <label className="cookie-option">
          <input
            type="checkbox"
            data-consent-category="analytics"
            checked={Boolean(selection.analytics)}
            onChange={(event) => toggleCategory("analytics", event.target.checked)}
          />{" "}
          Analytics
        </label>
        <label className="cookie-option">
          <input
            type="checkbox"
            data-consent-category="marketing"
            checked={Boolean(selection.marketing)}
            onChange={(event) => toggleCategory("marketing", event.target.checked)}
          />{" "}
          Marketing
        </label>
      </div>
      <div className="cookie-actions">
        <button
          type="button"
          className="cta-button btn-secondary"
          data-consent="essential"
          onClick={acceptEssentialOnly}
        >
          Essentials only
        </button>
        <button
          type="button"
          className="cta-button btn-primary"
          data-consent="accept"
          onClick={acceptSelected}
        >
          Save choices
        </button>
      </div>
    </aside>
  );
}
