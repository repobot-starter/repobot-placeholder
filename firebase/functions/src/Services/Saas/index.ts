// Module-level exports for the Saas domain. Cross-domain callers import
// from here, never from deep paths inside the domain.
export { saasService } from "./SaasService.js"
export { getSaasPlan, saasPlans, type SaasPlan } from "./SaasPlanCatalog.js"
