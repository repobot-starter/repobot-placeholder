/**
 * Entry point for the flow pack's `flow-grid` dashboard destination
 * (packs/flow/repobot.project.json): the IA scaffolder wires routes to
 * View/<PascalCase(id)>/<PascalCase(id)>Page, and because this file already
 * exists it is kept as-is (docs/project-ia.md). The real view lives with the
 * rest of the flow surface in View/Flow/.
 */
export { default } from "../Flow/GridPage"
