/**
 * Entry point for the saas pack's `overview` dashboard destination
 * (packs/saas/repobot.project.json): the IA scaffolder wires routes to
 * View/<PascalCase(id)>/<PascalCase(id)>Page, and because this file already
 * exists it is kept as-is (docs/project-ia.md). The real view lives with the
 * rest of the Outlay spend surface in View/Spend/.
 */
export { default } from "../Spend/OverviewPage"
