import { Service } from "../models/Service.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { serialize } from "../models/base.js";
import { ApiError } from "../middleware/errors.js";

/**
 * Ported from apps/agency/selectors.py.
 * Ordering matches the original querysets exactly: services oldest-first,
 * portfolio and case studies newest-first.
 *
 * Every selector is .lean() for speed and then serialize()d, because lean
 * skips the schema's toJSON transform — without it these would return `_id`
 * while the admin write endpoints return `id`.
 */
export async function getActiveServices() {
  return serialize(await Service.find({ is_active: true }).sort({ created_at: 1 }).lean());
}

export async function getFeaturedPortfolioItems() {
  // select_related("service") -> populate()
  return serialize(
    await PortfolioItem.find({ is_published: true })
      .populate("service", "title slug")
      .sort({ created_at: -1 })
      .lean(),
  );
}

export async function getPublishedCaseStudies() {
  return serialize(
    await CaseStudy.find({ is_published: true })
      .populate("service", "title slug")
      .sort({ created_at: -1 })
      .lean(),
  );
}

/** get_object_or_404(Service, slug=..., is_active=True) */
export async function getServiceBySlug(slug) {
  const service = await Service.findOne({ slug, is_active: true }).lean();
  if (!service) throw new ApiError(404, "Service not found");
  return serialize(service);
}

/** get_object_or_404(CaseStudy, slug=..., is_published=True) */
export async function getCaseStudyBySlug(slug) {
  const caseStudy = await CaseStudy.findOne({ slug, is_published: true })
    .populate("service", "title slug")
    .lean();
  if (!caseStudy) throw new ApiError(404, "Case study not found");
  return serialize(caseStudy);
}

/**
 * Enforces what Django's on_delete=PROTECT did at the database level:
 * a Service still referenced by portfolio items or case studies cannot be
 * deleted. Mongo will not do this for us.
 */
export async function assertServiceUnreferenced(serviceId) {
  const [portfolioCount, caseStudyCount] = await Promise.all([
    PortfolioItem.countDocuments({ service: serviceId }),
    CaseStudy.countDocuments({ service: serviceId }),
  ]);

  if (portfolioCount > 0 || caseStudyCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete service: still referenced by ${portfolioCount} portfolio item(s) and ${caseStudyCount} case study(ies)`,
    );
  }
}
