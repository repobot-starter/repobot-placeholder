import React, { useEffect, useState } from "react"
import { useThemeContract } from "../theme/themeHotUpdate"
import { marketingHomeHref, marketingHref, marketingSrc, type MarketingCta } from "./marketingContent"
import { MarketingGlyph } from "./MarketingGlyph"
import { marketingItemStamp, marketingLinkKey } from "./marketingItemStamp"
import { LeadCaptureFields, type MarketingLeadCaptureContent } from "./MarketingLeadForm"
import * as styles from "./MarketingShell.styles.css"

/**
 * Page chrome for marketing sites: a scroll-aware sticky top nav and a
 * footer, shared across every page instead of repeated as per-page
 * sections. Renders inside `MarketingPage` (the preset/token scope), around
 * the section stream. The legacy `nav`/`footer` section types remain
 * renderable for pre-shell configs — new scaffolds emit shell config.
 *
 * Variant names are public, append-only vocabulary shared with the setup
 * architect (docs/landing-kernel-spec.md §8), like section types.
 *
 * Nav variants (each a designed treatment, not a parameter permutation —
 * see docs/landing.md "Page chrome" for when to pick which):
 * - `full-width` — an edge-to-edge translucent band flush against the top
 *   of the viewport, hairline-ruled, content re-constrained to the preset's
 *   max width. The kernel default: inset floating bars read weaker than a
 *   flush full-width band.
 * - `inline` — the inset bar that lifts into a floating card on scroll;
 *   logo left, plain links and CTA right.
 * - `centered` — links left, logo centered, CTA right, same floating card.
 * - `burger-overlay` — logo plus a burger at every width; links live in the
 *   fullscreen overlay.
 * - `split` — squared editorial bar ruled underneath: logo left, links
 *   right in full text color with an accent underline growing in on hover,
 *   and the CTA a size up — the bar's strongest element.
 * - `pill-links` — logo left, CTA right, and the links centered in a
 *   bordered pill cluster that follows the preset's control radius.
 * - `logo-only` — the mark alone, centered; `links`/`cta` are ignored.
 *   For blogs and single-surface sites where the content is the nav.
 *
 * Any link may carry a `menu` (MarketingNavLink): hovering or focusing it
 * opens a panel of titled columns of described links under the bar — the
 * mega-menu treatment. Menus flatten into the burger overlay on mobile.
 *
 * When `nav.variant` is absent, the default comes from the theme contract
 * (`repobot.theme.json` → `navigation.variant`), falling back to
 * `full-width`.
 */

export type MarketingShellNavVariant =
    "inline" | "centered" | "burger-overlay" | "full-width" | "split" | "pill-links" | "logo-only"
export type MarketingShellFooterVariant = "simple" | "multi-column" | "newsletter"

/** Every shell nav variant — for manifest validation and tooling. */
export const marketingShellNavVariants: readonly MarketingShellNavVariant[] = [
    "inline",
    "centered",
    "burger-overlay",
    "full-width",
    "split",
    "pill-links",
    "logo-only",
]

/** One entry in a hover menu: a link plus an optional one-line description. */
export interface MarketingNavMenuLink extends MarketingCta {
    description?: string
}

/** A titled group of menu entries — one column of the hover panel. */
export interface MarketingNavMenuColumn {
    title?: string
    links: MarketingNavMenuLink[]
}

/**
 * A top-level nav link. With `menu`, hovering (or focusing) the link opens
 * a panel of grouped, described links under the bar — the full-nav
 * treatment strong marketing sites use for their Product/Solutions menus.
 * The link itself stays a normal navigation target for click and mobile.
 */
export interface MarketingNavLink extends MarketingCta {
    menu?: { columns: MarketingNavMenuColumn[] }
}

export interface MarketingShellNavContent {
    /**
     * `tagline` stacks beneath the name as a small letter-spaced line — the
     * two-line brand wordmark. `imageSrc` (a servable path, e.g. the
     * manifest's committed `/brand/logo-transparent.png`) replaces the text
     * wordmark with the real logo; `name` stays as its alt text.
     */
    logo: { name: string; emoji?: string; tagline?: string; imageSrc?: string }
    /** Cross-page or anchor links; collapse into the burger menu on mobile. */
    links?: MarketingNavLink[]
    cta?: MarketingCta
    /** One-line banner above the bar, e.g. "Now in early access". */
    announcement?: string
}

export interface MarketingShellFooterColumn {
    title: string
    links: MarketingCta[]
}

/** Data-only content; the newsletter's persistence handlers are injected by the binder. */
export interface MarketingShellFooterContent {
    blurb?: string
    /** `simple` variant: the single link row. */
    links?: MarketingCta[]
    /** `multi-column` and `newsletter` variants: titled link groups. */
    columns?: MarketingShellFooterColumn[]
    /** Trailing note, e.g. attribution or copyright. */
    note?: string
    /** `newsletter` variant: the embedded email capture. */
    newsletter?: MarketingLeadCaptureContent & { title?: string }
}

export interface MarketingShellConfig {
    nav?: { variant?: MarketingShellNavVariant; content: MarketingShellNavContent }
    footer?: { variant?: MarketingShellFooterVariant; content: MarketingShellFooterContent }
}

export interface MarketingShellProps extends MarketingShellConfig {
    /** Newsletter footer capture state, injected like the lead-form's. */
    newsletterJoined?: boolean
    onNewsletterSubmit?: (email: string) => void
    children: React.ReactNode
}

function useScrolled(): boolean {
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const onScroll = (): void => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])
    return scrolled
}

function BurgerIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

function ChevronIcon({ open }: { open: boolean }): React.ReactElement {
    return (
        <svg
            viewBox="0 0 10 10"
            width="9"
            height="9"
            aria-hidden="true"
            className={open ? `${styles.linkChevron} ${styles.linkChevronOpen}` : styles.linkChevron}
        >
            <path
                d="M2 3.5 L5 6.5 L8 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Logo({ logo, className }: { logo: MarketingShellNavContent["logo"]; className?: string }) {
    // The committed brand logo replaces the text wordmark outright (logos
    // usually carry the name already); the name stays as alt text.
    const wordmark = logo.imageSrc ? (
        <span className={className ?? styles.logo}>
            <img src={marketingSrc(logo.imageSrc)} alt={logo.name} className={styles.logoImage} />
        </span>
    ) : (
        <span className={className ?? styles.logo}>
            {/* An emoji brand mark renders as a seeded glyph — platform
                emoji next to the wordmark reads as template filler. */}
            {logo.emoji !== undefined ? (
                <span aria-hidden style={{ display: "inline-flex" }}>
                    <MarketingGlyph seed={`${logo.name}${logo.emoji}`} size={22} />
                </span>
            ) : null}
            {logo.name}
        </span>
    )
    const stacked =
        logo.tagline === undefined ? (
            wordmark
        ) : (
            <span className={styles.logoStack}>
                {wordmark}
                <span className={styles.logoTagline}>{logo.tagline}</span>
            </span>
        )
    // A logo is a way home, on every page.
    return (
        <a href={marketingHomeHref()} className={styles.logoLink} aria-label={`${logo.name} — home`}>
            {stacked}
        </a>
    )
}

/** Per-variant class picks; every new variant slots in here, not in JSX. */
function navClasses(variant: MarketingShellNavVariant): {
    wrap: string
    bar?: string
    barScrolled: string
    linkRow: string
    link: string
} {
    switch (variant) {
        case "centered":
            return {
                wrap: `${styles.stickyWrap} ${styles.stickyWrapFlush}`,
                bar: `${styles.barCentered} ${styles.barMasthead}`,
                barScrolled: styles.barFlushScrolled,
                linkRow: `${styles.links} ${styles.linksCentered}`,
                link: styles.link,
            }
        case "burger-overlay":
            return {
                wrap: `${styles.stickyWrap} ${styles.stickyWrapFlush}`,
                bar: styles.barChromeless,
                barScrolled: styles.barFlushScrolled,
                linkRow: styles.links,
                link: styles.link,
            }
        case "full-width":
            return {
                wrap: `${styles.stickyWrap} ${styles.stickyWrapFullWidth}`,
                bar: styles.barFullWidth,
                barScrolled: styles.barFullWidthScrolled,
                linkRow: styles.links,
                link: styles.link,
            }
        case "split":
            return {
                wrap: `${styles.stickyWrap} ${styles.stickyWrapFlush}`,
                bar: styles.barSplit,
                barScrolled: styles.barFlushScrolled,
                linkRow: `${styles.links} ${styles.linksSplit}`,
                link: styles.linkUnderline,
            }
        case "pill-links":
            return {
                wrap: styles.stickyWrap,
                bar: styles.barPills,
                barScrolled: styles.barScrolled,
                linkRow: `${styles.links} ${styles.pillBox}`,
                link: styles.linkPill,
            }
        case "logo-only":
            return {
                wrap: `${styles.stickyWrap} ${styles.stickyWrapFlush}`,
                bar: styles.barLogoOnly,
                barScrolled: `${styles.barFlushScrolled} ${styles.barLogoOnlyScrolled}`,
                linkRow: styles.links,
                link: styles.link,
            }
        default:
            return {
                wrap: styles.stickyWrap,
                barScrolled: styles.barScrolled,
                linkRow: styles.links,
                link: styles.link,
            }
    }
}

function ShellNav({
    variant: variantProp,
    content,
}: {
    variant?: MarketingShellNavVariant
    content: MarketingShellNavContent
}): React.ReactElement {
    // Absent props defer to the theme contract (live under dev HMR). An
    // explicitly-declared contract variant (the design panel's Site
    // navigation toggle writes it; the template ships without one) is the
    // user's global choice and outranks per-page pins — those are
    // agent/blueprint art direction, the default when nobody has chosen.
    const { navigation } = useThemeContract()
    const variant = navigation.declared ? navigation.variant : (variantProp ?? navigation.variant)
    const scrolled = useScrolled()
    const [open, setOpen] = useState(false)
    const { logo, links, cta, announcement } = content
    const burgerOnly = variant === "burger-overlay"
    const logoOnly = variant === "logo-only"
    const hasLinks = !logoOnly && (links?.length ?? 0) > 0
    const classes = navClasses(variant)

    // Hover menu state: the open link's index, with a short grace period on
    // hover-out so the pointer can travel from the link into the panel.
    const [menuIndex, setMenuIndex] = useState<number | null>(null)
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const cancelScheduledClose = (): void => {
        if (closeTimer.current !== null) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }
    const openMenu = (index: number | null): void => {
        cancelScheduledClose()
        setMenuIndex(index)
    }
    const scheduleMenuClose = (): void => {
        cancelScheduledClose()
        closeTimer.current = setTimeout(() => setMenuIndex(null), 140)
    }
    useEffect(() => cancelScheduledClose, [])
    const activeMenu = !burgerOnly && menuIndex !== null ? links?.[menuIndex]?.menu : undefined

    // The fullscreen menu owns the viewport while open.
    useEffect(() => {
        if (!open) {
            return
        }
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = previous
        }
    }, [open])

    const barClass = [styles.bar, classes.bar, scrolled ? classes.barScrolled : undefined]
        .filter(Boolean)
        .join(" ")

    // data-rb-shell marks the shared chrome's link row for the platform's
    // preview editor (the item stamps' scope when there's no enclosing
    // data-rb-section); data-rb-item-key is each link's stable identity —
    // shell link order persists by key, not index, because the current page
    // drops out of its own links (see marketingLinkKey). Primary rendering
    // only: the burger overlay mirrors these links unstamped.
    const linkRow = hasLinks ? (
        <div className={classes.linkRow} data-rb-shell="nav">
            {links!.map((link, index) => {
                const hasMenu = (link.menu?.columns.length ?? 0) > 0
                return (
                    <a
                        key={link.label}
                        className={classes.link}
                        href={marketingHref(link)}
                        {...marketingItemStamp("links", index)}
                        data-rb-item-key={marketingLinkKey(link)}
                        aria-haspopup={hasMenu ? "true" : undefined}
                        aria-expanded={hasMenu ? menuIndex === index : undefined}
                        onMouseEnter={() => openMenu(hasMenu ? index : null)}
                        onMouseLeave={scheduleMenuClose}
                        onFocus={() => openMenu(hasMenu ? index : null)}
                    >
                        {link.label}
                        {hasMenu ? <ChevronIcon open={menuIndex === index} /> : null}
                    </a>
                )
            })}
        </div>
    ) : null

    const burger =
        !logoOnly && (hasLinks || cta) ? (
            <button
                type="button"
                className={burgerOnly ? `${styles.burger} ${styles.burgerAlways}` : styles.burger}
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <BurgerIcon />
            </button>
        ) : null

    // Grid variants keep three tracks alive with placeholder spans.
    const row = logoOnly ? (
        <Logo logo={logo} />
    ) : variant === "centered" ? (
        <>
            {linkRow ?? <span />}
            <Logo logo={logo} className={`${styles.logo} ${styles.logoCentered}`} />
            {cta ? (
                <a className={`${styles.cta} ${styles.ctaCentered}`} href={marketingHref(cta)}>
                    {cta.label}
                </a>
            ) : (
                <span />
            )}
            {burger}
        </>
    ) : variant === "pill-links" ? (
        <>
            <Logo logo={logo} />
            {linkRow ?? <span />}
            {cta ? (
                <a className={`${styles.cta} ${styles.ctaCentered}`} href={marketingHref(cta)}>
                    {cta.label}
                </a>
            ) : (
                <span />
            )}
            {burger}
        </>
    ) : (
        <>
            <Logo logo={logo} />
            {!burgerOnly ? linkRow : null}
            {cta && !burgerOnly ? (
                <a
                    className={[
                        hasLinks ? styles.cta : `${styles.ctaSlot} ${styles.cta}`,
                        variant === "split" ? styles.ctaSplit : undefined,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    href={marketingHref(cta)}
                >
                    {cta.label}
                </a>
            ) : null}
            {burger}
        </>
    )

    return (
        <>
            {announcement !== undefined ? <div className={styles.announcement}>{announcement}</div> : null}
            <div
                className={classes.wrap}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setMenuIndex(null)
                }}
            >
                <nav className={barClass} aria-label="Site">
                    {variant === "full-width" ? <div className={styles.fullWidthInner}>{row}</div> : row}
                </nav>
                {activeMenu !== undefined ? (
                    <div
                        className={styles.menuPanel}
                        onMouseEnter={cancelScheduledClose}
                        onMouseLeave={scheduleMenuClose}
                    >
                        <div className={styles.menuColumns}>
                            {activeMenu.columns.map((column, columnIndex) => (
                                <div key={column.title ?? columnIndex}>
                                    {column.title !== undefined ? (
                                        <span className={styles.menuColumnTitle}>{column.title}</span>
                                    ) : null}
                                    {column.links.map((entry) => (
                                        <a
                                            key={entry.label}
                                            className={styles.menuEntry}
                                            href={marketingHref(entry)}
                                            onClick={() => setMenuIndex(null)}
                                        >
                                            <span className={styles.menuEntryLabel}>{entry.label}</span>
                                            {entry.description !== undefined ? (
                                                <span className={styles.menuEntryDescription}>
                                                    {entry.description}
                                                </span>
                                            ) : null}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
            {open ? (
                <div className={styles.overlay} role="dialog" aria-label="Site menu">
                    <div className={styles.overlayTop}>
                        <Logo logo={logo} />
                        <button
                            type="button"
                            className={styles.close}
                            aria-label="Close menu"
                            onClick={() => setOpen(false)}
                        >
                            ×
                        </button>
                    </div>
                    {(links ?? []).map((link) => (
                        <React.Fragment key={link.label}>
                            <a
                                className={styles.overlayLink}
                                href={marketingHref(link)}
                                onClick={() => setOpen(false)}
                            >
                                {link.label}
                            </a>
                            {/* Hover menus flatten into the overlay on mobile. */}
                            {(link.menu?.columns ?? [])
                                .flatMap((column) => column.links)
                                .map((entry) => (
                                    <a
                                        key={entry.label}
                                        className={styles.overlaySubLink}
                                        href={marketingHref(entry)}
                                        onClick={() => setOpen(false)}
                                    >
                                        {entry.label}
                                    </a>
                                ))}
                        </React.Fragment>
                    ))}
                    {cta ? (
                        <a
                            className={styles.overlayCta}
                            href={marketingHref(cta)}
                            onClick={() => setOpen(false)}
                        >
                            {cta.label}
                        </a>
                    ) : null}
                </div>
            ) : null}
        </>
    )
}

function ShellFooter({
    variant = "simple",
    content,
    newsletterJoined,
    onNewsletterSubmit,
}: {
    variant?: MarketingShellFooterVariant
    content: MarketingShellFooterContent
    newsletterJoined?: boolean
    onNewsletterSubmit?: (email: string) => void
}): React.ReactElement {
    const { blurb, links, columns, note, newsletter } = content

    if (variant === "simple") {
        return (
            <footer className={`${styles.footer} ${styles.footerSimple}`}>
                {blurb !== undefined ? <span>{blurb}</span> : null}
                {(links ?? []).map((link) => (
                    <a key={link.label} className={styles.footerLink} href={marketingHref(link)}>
                        {link.label}
                    </a>
                ))}
                {note !== undefined ? <span>{note}</span> : null}
            </footer>
        )
    }

    return (
        <footer className={styles.footer}>
            <div className={styles.footerGrid}>
                <div className={styles.footerBrand}>
                    {blurb !== undefined ? <p className={styles.footerBlurb}>{blurb}</p> : null}
                    {variant === "newsletter" && newsletter !== undefined ? (
                        <div className={styles.footerNewsletter}>
                            {newsletter.title !== undefined ? (
                                <h3 className={styles.footerNewsletterTitle}>{newsletter.title}</h3>
                            ) : null}
                            <LeadCaptureFields
                                placeholder={newsletter.placeholder}
                                cta={newsletter.cta}
                                confirmation={newsletter.confirmation}
                                joined={newsletterJoined ?? false}
                                onSubmit={onNewsletterSubmit ?? (() => undefined)}
                            />
                        </div>
                    ) : null}
                </div>
                {(columns ?? []).map((column) => (
                    <div key={column.title} className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>{column.title}</span>
                        {column.links.map((link) => (
                            <a key={link.label} className={styles.footerLink} href={marketingHref(link)}>
                                {link.label}
                            </a>
                        ))}
                    </div>
                ))}
            </div>
            {note !== undefined ? <div className={styles.footerNote}>{note}</div> : null}
        </footer>
    )
}

/** Nav above, footer below, sections between. Chrome-less when neither is given. */
export function MarketingShell({
    nav,
    footer,
    newsletterJoined,
    onNewsletterSubmit,
    children,
}: MarketingShellProps): React.ReactElement {
    return (
        <>
            {nav ? <ShellNav variant={nav.variant} content={nav.content} /> : null}
            {children}
            {footer ? (
                <ShellFooter
                    variant={footer.variant}
                    content={footer.content}
                    newsletterJoined={newsletterJoined}
                    onNewsletterSubmit={onNewsletterSubmit}
                />
            ) : null}
        </>
    )
}
