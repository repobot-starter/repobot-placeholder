import React from "react"
import { useResolvedThemeClassName } from "../theme/UiThemeProvider"
import * as styles from "./AuthShell.styles.css"

export interface AuthShellProps {
    /** Brand row for the panel's top-left, e.g. the app's BrandMark. */
    brand?: React.ReactNode
    /** The panel's welcome statement, e.g. "Everything your team ships, in one place." */
    headline?: string
    subheadline?: string
    /** Short value props rendered as a checked list. */
    highlights?: string[]
    /**
     * Product-fragment slot under the copy — real components (a StatCard, an
     * approval row) as panel art, so it always matches the live theme.
     */
    panelSlot?: React.ReactNode
    /** Bottom slot of the brand panel, e.g. a customer quote or legal line. */
    panelFooter?: React.ReactNode
    /** The auth surface itself — usually an AuthCard. */
    children: React.ReactNode
    /** Theme class applied to the shell; defaults to the app's active theme mode. */
    themeClassName?: string
}

/**
 * The full sign-in screen: a split layout with a token-branded panel on the
 * left (headline, value props, quote) and the auth card on the right. On
 * narrow screens the panel gives way and the card centers on the AuthScreen
 * backdrop. Purely presentational, like AuthCard — brand and copy are
 * injected, colors derive from the theme contract.
 */
export function AuthShell({
    brand,
    headline,
    subheadline,
    highlights,
    panelSlot,
    panelFooter,
    children,
    themeClassName,
}: AuthShellProps): React.ReactElement {
    const resolvedThemeClassName = useResolvedThemeClassName()
    const classes = [themeClassName ?? resolvedThemeClassName, styles.shell].join(" ")
    return (
        <div className={classes}>
            <aside className={styles.panel}>
                <div className={styles.panelBrand}>{brand}</div>
                <div className={styles.panelBody}>
                    {headline ? <h2 className={styles.panelHeadline}>{headline}</h2> : null}
                    {subheadline ? <p className={styles.panelSubheadline}>{subheadline}</p> : null}
                    {highlights && highlights.length > 0 ? (
                        <ul className={styles.panelHighlights}>
                            {highlights.map((highlight) => (
                                <li key={highlight} className={styles.panelHighlight}>
                                    <CheckIcon />
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {panelSlot ? <div className={styles.panelSlot}>{panelSlot}</div> : null}
                </div>
                {panelFooter ? <div className={styles.panelFooter}>{panelFooter}</div> : null}
            </aside>
            <main className={styles.content}>
                {/* The panel carries the brand on wide screens; when it gives
                    way on narrow ones, the brand moves above the card. */}
                {brand ? <div className={styles.contentBrand}>{brand}</div> : null}
                {children}
            </main>
        </div>
    )
}

function CheckIcon(): React.ReactElement {
    return (
        <svg
            className={styles.checkIcon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
            <path
                d="M4.5 8.3L7 10.6L11.5 5.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    )
}
