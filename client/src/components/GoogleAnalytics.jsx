import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { readStoredConsent } from "../hooks/useCookieConsent.js";

const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
const SCRIPT_ID = "google-analytics-script";
const CONSENT_EVENT = "aethera:consent-change";

function hasAnalyticsConsent() {
  return readStoredConsent()?.analytics === true;
}

function ensureGoogleTag() {
  if (!MEASUREMENT_ID) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!window.__servexGoogleTagInitialized) {
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
    window.__servexGoogleTagInitialized = true;
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  return true;
}

/**
 * Consent-aware GA4 page-view tracking for the public SPA.
 *
 * The Google tag is not loaded until analytics consent is explicitly granted.
 * Automatic page views are disabled so React Router navigations can be sent
 * exactly once per location without duplicate initial hits.
 */
export function GoogleAnalytics() {
  const { pathname } = useLocation();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(hasAnalyticsConsent);
  const lastPageRef = useRef(null);

  useEffect(() => {
    const updateConsent = () => setAnalyticsEnabled(hasAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, updateConsent);
    window.addEventListener("storage", updateConsent);

    return () => {
      window.removeEventListener(CONSENT_EVENT, updateConsent);
      window.removeEventListener("storage", updateConsent);
    };
  }, []);

  useEffect(() => {
    if (!analyticsEnabled || !MEASUREMENT_ID) {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
      return;
    }

    if (!ensureGoogleTag()) return;
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled || !MEASUREMENT_ID) return;

    // Do not forward query strings: campaign URLs can contain email
    // addresses, tokens, or other values that must not reach analytics.
    const pagePath = pathname;
    if (lastPageRef.current === pagePath) return;
    lastPageRef.current = pagePath;

    if (!ensureGoogleTag()) return;
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: `${window.location.origin}${pagePath}`,
    });
  }, [analyticsEnabled, pathname]);

  return null;
}

export default GoogleAnalytics;
