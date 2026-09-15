import React from "react"
import { Link } from "react-router-dom"
import { projectManifest } from "../../Config/projectManifest"
import * as styles from "./BrandMark.styles.css"

// Name precedence: the site name committed during project setup
// (repobot.project.json marketing.siteName), then the VITE_APP_NAME env
// override, then a neutral placeholder. Projects are branded out of the box
// without any env plumbing. The placeholder must stay generic: it surfaces
// on the login card whenever a manifest has no site name (blank trees,
// template previews mid-switch), and a pack-flavored name there reads as
// another product's branding leaking into the user's app.
export const appName = projectManifest.marketing.siteName || import.meta.env.VITE_APP_NAME || "My App"

// Committed brand paths are root-relative servable paths; under a non-root
// Vite base (template preview bundles) they need the base prefixed, same as
// marketingSrc in the design system. Deployed products serve at "/".
const BASE_PATH = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")
const basedPath = (src: string | undefined): string | undefined =>
    src !== undefined && src.startsWith("/") ? `${BASE_PATH}${src}` : src

/**
 * The committed brand marks (repobot.project.json marketing.brand) — setup
 * stamps servable paths when the user uploads a logo/app icon, so branded
 * surfaces render the real mark with no wiring. Paths are base-aware.
 */
export const brand = ((): typeof projectManifest.marketing.brand & object => {
    const committed = projectManifest.marketing.brand ?? {}
    return {
        logo: basedPath(committed.logo),
        logoMark: basedPath(committed.logoMark),
        icon: basedPath(committed.icon),
        social: basedPath(committed.social),
    }
})()

/**
 * The product identity used on every surface (login card, app shell sidebar):
 * the project's own logo when one was committed during setup, else an
 * accent-colored rounded-square mark with the app's initial next to the app
 * name. Always a link home — the universal expectation for a logo.
 */
export function BrandMark(): React.ReactElement {
    return (
        <Link to="/" className={styles.homeLink} aria-label={`${appName} — home`}>
            {brand.logo ? (
                <img src={brand.logo} alt={appName} className={styles.logoImage} />
            ) : (
                <span className={styles.row}>
                    <span className={styles.mark} aria-hidden="true">
                        {appName.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.name}>{appName}</span>
                </span>
            )}
        </Link>
    )
}
