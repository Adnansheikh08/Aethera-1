import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { ContactSection } from "../components/ContactSection.jsx";

/**
 * Dedicated contact/inquiry form page.
 */
export function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact Us — Aethera</title>
        <meta name="description" content="Get in touch with the Aethera engineering team. We reply to every qualified inquiry within two business hours." />
        <meta property="og:title" content="Contact Us — Aethera" />
        <meta property="og:description" content="Reach out to discuss your project requirements." />
        <meta name="twitter:title" content="Contact Us — Aethera" />
        <meta name="twitter:description" content="Get in touch with the Aethera engineering team." />
      </Helmet>

      {/* The section markup itself lives in ContactSection, shared with the
          landing page; here it owns the page (h1) and fetches its own choices. */}
      <ContactSection TitleTag="h1">
        <div className="container">
          <nav className="contact-back" aria-label="Page navigation">
            <Link to="/" className="contact-back-link">
              ← Back to home
            </Link>
          </nav>
        </div>
      </ContactSection>
    </>
  );
}

export default Contact;
