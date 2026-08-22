import { CaseStudy } from "../models/CaseStudy.js";
import { createCrudController } from "./crudFactory.js";

export const caseStudyController = createCrudController({
  model: CaseStudy,
  label: "case study",
});
