/**
 * The app's component registry: every page imports UI from `@ui` (this file),
 * never from `@base/design-system` directly.
 *
 * That indirection is the eject seam for customizing a base component
 * without touching `web/design-system/` (which must stay pristine so
 * design-system updates can land cleanly — see docs/design-system.md):
 *
 *   1. Copy the base component (its .tsx + .styles.css.ts) into
 *      `src/Theme/overrides/<Component>/`.
 *   2. Re-point the export here — explicit named exports win over `export *`:
 *
 *          export { Button, type ButtonProps } from "./overrides/Button/Button"
 *
 *   3. Edit the override copy freely; every import site picks it up.
 *
 * Prefer tokens (repobot.theme.json) and component props first — eject is the
 * last resort for structural changes the contract can't express.
 */
export * from "@base/design-system"
