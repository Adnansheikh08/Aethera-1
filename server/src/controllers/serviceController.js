import { Service } from "../models/Service.js";
import { assertServiceUnreferenced } from "../services/agencyService.js";
import { createCrudController } from "./crudFactory.js";

// Reinstates Django's on_delete=PROTECT: a service in use cannot be deleted.
export const serviceController = createCrudController({
  model: Service,
  label: "service",
  beforeDelete: (doc) => assertServiceUnreferenced(doc._id),
});
