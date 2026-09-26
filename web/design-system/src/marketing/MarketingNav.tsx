import React from "react"
import { marketingHomeHref, marketingHref, marketingSrc, type MarketingCta } from "./marketingContent"
import { marketingItemStamp } from "./marketingItemStamp"
import { MarketingGlyph } from "./MarketingGlyph"
import * as styles from "./MarketingNav.styles.css"

export type MarketingNavVariant = "inline" | "minimal"

export interface MarketingNavContent {
    /**
     * `tagline` stacks beneath the name as a small letter-spaced line.
     * `imageSrc` (a servable path, e.g. `/brand/logo-transparent.png`)
     * replaces the text wordmark with the real logo; `name` is its alt text.
     * `emoji` seeds a generative glyph mark next to the wordmark — raw
     * platform emoji are never rendered (same rule as the shell nav).
     */
    logo: { name: string; emoji?: string; tagline?: string; imageSrc?: string }
    /** Anchor links to on-page sections; hidden by the `minimal` variant. */
    links?: MarketingCta[]
    cta?: MarketingCta
}

export interface MarketingNavProps extends MarketingNavContent {
    variant?: MarketingNavVariant
    anchorId?: string
}

function MenuIcon({ open }: { open: boolean }): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            {open ? (
                <path
                    d="M5 5 L15 15 M15 5 L5 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            ) : (
                <path
                    d="M3 5.5 H17 M3 10 H17 M3 14.5 H17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            )}
        </svg>
    )
}

/**
 * Landing-page navigation. `inline`: logo, anchor links, CTA. `minimal`:
 * logo and CTA only (pre-launch and portfolio pages). At mobile widths the
 * inline links collapse behind a hamburger that discloses a panel — the
 * links must stay reachable, not vanish.
 */
export function MarketingNav({
    variant = "inline",
    anchorId,
    logo,
    links,
    cta,
}: MarketingNavProps): React.ReactElement {
    const showLinks = variant === "inline" && links !== undefined && links.length > 0
    const [menuOpen, setMenuOpen] = React.useState(false)
    return (
        <nav id={anchorId} className={styles.nav}>
            {/* A logo is a way home, on every page. */}
            <a href={marketingHomeHref()} className={styles.logoLink} aria-label={`${logo.name} — home`}>
                <span className={styles.logoStack}>
                    <span className={styles.logo}>
                        {logo.imageSrc ? (
                            <img
                                src={marketingSrc(logo.imageSrc)}
                                alt={logo.name}
                                className={styles.logoImage}
                            />
                        ) : (
                            <>
                                {/* An emoji brand mark renders as a seeded glyph —
                                    platform emoji next to the wordmark reads as
                                    template filler (same rule as MarketingShell). */}
                                {logo.emoji !== undefined ? (
                                    <span aria-hidden style={{ display: "inline-flex" }}>
                                        <MarketingGlyph seed={`${logo.name}${logo.emoji}`} size={22} />
                                    </span>
                                ) : null}
                                {logo.name}
                            </>
                        )}
                    </span>
                    {logo.tagline !== undefined ? (
                        <span className={styles.logoTagline}>{logo.tagline}</span>
                    ) : null}
                </span>
            </a>
            {showLinks ? (
                <div className={styles.links}>
                    {links.map((link, index) => (
                        <a
                            key={link.label}
                            className={styles.link}
                            href={marketingHref(link)}
                            {...marketingItemStamp("links", index)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            ) : null}
            {showLinks ? (
                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((previous) => !previous)}
                >
                    <MenuIcon open={menuOpen} />
                </button>
            ) : null}
            {cta ? (
                <a
                    className={showLinks ? styles.cta : `${styles.ctaSlot} ${styles.cta}`}
                    href={marketingHref(cta)}
                >
                    {cta.label}
                </a>
            ) : null}
            {showLinks && menuOpen ? (
                <div className={styles.menuPanel}>
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className={styles.menuLink}
                            href={marketingHref(link)}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            ) : null}
        </nav>
    )
}
