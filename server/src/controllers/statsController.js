import { Service } from "../models/Service.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Lead } from "../models/Lead.js";
import { Transaction } from "../models/Transaction.js";
import { DataErasureRequest } from "../models/DataErasureRequest.js";

/** Dashboard summary counts. */
export async function getStats(_req, res) {
  const [services, portfolio, caseStudies, leads, newLeads, transactions, erasures] =
    await Promise.all([
      Service.countDocuments({ is_active: true }),
      PortfolioItem.countDocuments({ is_published: true }),
      CaseStudy.countDocuments({ is_published: true }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: "NEW" }),
      Transaction.countDocuments(),
      DataErasureRequest.countDocuments({ status: "COMPLETED" }),
    ]);
  res.json({
    services,
    portfolio_items: portfolio,
    case_studies: caseStudies,
    leads,
    new_leads: newLeads,
    transactions,
    completed_erasures: erasures,
  });
}

export const statsController = { getStats };
