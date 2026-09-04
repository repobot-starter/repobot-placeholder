/**
 * Entry point for the accounting pack's `accounting-advisor` dashboard
 * destination (packs/accounting/repobot.project.json): the IA scaffolder
 * wires routes to View/<PascalCase(id)>/<PascalCase(id)>Page, and because
 * this file already exists it is kept as-is (docs/project-ia.md). The real
 * view lives with the rest of the accounting surface in View/Accounting/.
 */
export { default } from "../Accounting/AdvisorPage"
