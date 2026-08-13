import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Route, Routes, useLocation } from "react-router-dom";

import Admin from "./admin/Admin.jsx";
import { AuthProvider } from "./admin/AuthContext.jsx";
import { CookieBanner, Preloader, ScrollProgress } from "./components/Chrome.jsx";
import { Footer, Header, WhatsAppFloat } from "./components/Layout.jsx";
import { useScrollTopOnNavigate } from "./hooks/useNavigation.js";
import { CaseStudyDetail, ServiceDetail } from "./pages/Detail.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Contact } from "./pages/Contact.jsx";
import { NotFound, PrivacyPolicy, Terms } from "./pages/Legal.jsx";

const SITE_TITLE = "Aethera — Enterprise Software Agency & Cybersecurity";
const SITE_DESCRIPTION =
  "We build secure, high-performance, and ultra-scalable web platforms and enterprise applications aligned to the OWASP ASVS standard.";

/**
 * Site-wide head defaults, ported from the non-block parts of base.html.
 *
 * Django put canonical/OG/Twitter in base.html, so every template inherited them
 * and overrode only the blocks it cared about. Helmet resolves the same way —
 * the deepest, latest-rendered tag for a given name/property wins — so pages
 * below only declare what they actually change.
 *
 * The URL comes from the router rather than window.location.href because
 * href lags a client-side navigation by a render, which would publish the
 * previous route's canonical. The query string is deliberately dropped: Django's
 * request.build_absolute_uri kept it, so /?utm_source=x canonicalised to itself
 * and split ranking signals across every tracked variant of the same page.
 */
function SiteMeta() {
  const { pathname } = useLocation();
  const url = `${window.location.origin}${pathname}`;

  return (
    <Helmet>
      <title>{SITE_TITLE}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content="Aethera" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={SITE_TITLE} />
      <meta
        property="og:description"
        content="We engineer secure, high-performance, and ultra-scalable web platforms."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Aethera — Enterprise Software Agency" />
      <meta
        name="twitter:description"
        content="Hardened enterprise software and cyber-secure media platforms."
      />
    </Helmet>
  );
}

/**
 * Composition root, replacing templates/base.html and static/js/main.js.
 *
 * base.html wrapped every page in the same header/footer/chrome; that shell now
 * lives here and the router swaps only the <main> content. The preloader runs
 * once for the session rather than on every navigation, which is what the
 * multi-page Django site did implicitly by only loading it on a fresh document.
 */
function PublicSite() {
  const [introComplete, setIntroComplete] = useState(false);
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  useScrollTopOnNavigate();

  return (
    <>
      <SiteMeta />

      {/* Only the landing page had the intro sequence; deep links skip it. */}
      {isLanding && <Preloader onComplete={() => setIntroComplete(true)} />}
      <ScrollProgress />

      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Header />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Landing introComplete={!isLanding || introComplete} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <WhatsAppFloat />

      {/* Deferred until the intro resolves, matching the vanilla entry point. */}
      <CookieBanner enabled={!isLanding || introComplete} />
    </>
  );
}

/**
 * Top-level split between the public site and the admin console.
 *
 * The console gets none of the marketing chrome — no preloader, header, footer,
 * WhatsApp float or cookie banner — which is what Django achieved by serving the
 * admin from a separate template tree rather than from base.html.
 *
 * AuthProvider wraps only this branch, so a public visitor never triggers the
 * refresh-token probe on mount.
 */
export function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <AuthProvider>
            <Admin />
          </AuthProvider>
        }
      />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  );
}

export default App;
