import { PortfolioItem } from "../models/PortfolioItem.js";
import { createCrudController } from "./crudFactory.js";

export const portfolioController = createCrudController({
  model: PortfolioItem,
  label: "portfolio item",
});
