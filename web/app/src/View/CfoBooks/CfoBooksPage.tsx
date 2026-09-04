/**
 * Entry point for the CFO pack's `cfo-books` dashboard destination
 * (packs/cfo/repobot.project.json): the IA scaffolder wires routes to
 * View/<PascalCase(id)>/<PascalCase(id)>Page, and because this file already
 * exists it is kept as-is (docs/project-ia.md). The real view lives with the
 * rest of the CFO surface in View/Cfo/.
 */
export { default } from "../Cfo/BooksPage"
