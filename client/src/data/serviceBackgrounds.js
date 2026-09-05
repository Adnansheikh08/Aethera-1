import webDevelopment from "../assets/services/web-development.svg";
import mobileAppDevelopment from "../assets/services/mobile-app-development.svg";
import digitalAdvertisingCampaigns from "../assets/services/digital-advertising-campaigns.svg";
import videoPhotoEditing from "../assets/services/video-photo-editing.svg";
import highCtrThumbnailDesign from "../assets/services/high-ctr-thumbnail-design.svg";
import onLocationVlogShoots from "../assets/services/on-location-vlog-shoots.svg";
import uiUxDesign from "../assets/services/ui-ux-design.svg";
import softwareTesting from "../assets/services/software-testing.svg";
import odooErpSolutions from "../assets/services/odoo-erp-solutions.svg";

/**
 * Background artwork for the service cards, keyed by the slug the API already
 * returns — no new field on the Service model, so the admin CRUD form and the
 * migration both stay as they are.
 *
 * Imported rather than referenced by path so Vite fingerprints and bundles each
 * file; a bare "/assets/..." string would resolve at runtime and 404 in the
 * production build. An unmapped slug (a service added through the admin later)
 * simply gets no artwork, which is why every consumer must treat this lookup as
 * optional.
 */
const SERVICE_BACKGROUNDS = {
  "web-development": webDevelopment,
  "web-dev": webDevelopment,
  "mobile-app-development": mobileAppDevelopment,
  "mobile-dev": mobileAppDevelopment,
  "digital-advertising-campaigns": digitalAdvertisingCampaigns,
  "a-d": digitalAdvertisingCampaigns,
  "video-photo-editing": videoPhotoEditing,
  "high-ctr-thumbnail-design": highCtrThumbnailDesign,
  "on-location-vlog-shoots": onLocationVlogShoots,
  "ui-ux-design": uiUxDesign,
  "software-testing": softwareTesting,
  "odoo-erp-solutions": odooErpSolutions,
};

export const serviceBackground = (slug) => SERVICE_BACKGROUNDS[slug] ?? null;

export default SERVICE_BACKGROUNDS;
