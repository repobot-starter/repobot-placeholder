import React from "react"
import { createPortal } from "react-dom"
import { Button } from "../primitives/Button"
import { useThemeContract } from "../theme/themeHotUpdate"
import { useUiTheme } from "../theme/UiThemeProvider"
import { ProfileFooter, type AppShellProfile } from "./AppShellProfile"
import * as styles from "./AppShell.styles.css"

export type { AppShellProfile, AppShellProfileItem } from "./AppShellProfile"

/**
 * The application shell: navigation chrome, a slotted header, a profile
 * modal with account options, and the content area. Purely presentational —
 * nav data and handlers are injected; routing and hotkeys are wired by the
 * app binder (see docs/shell.md). Structurally compatible with the
 * ShellNavItem/ShellNavSection schema in web/core with React nodes as icons.
 *
 * Layouts are stable, append-only keys shared with the setup flow — each a
 * designed treatment, not a parameter permutation (see docs/shell.md
 * "Shell variants" for when to pick which):
 * - `sidebar` — the icon-rail default: sections, badges, expandable
 *   children, drill-up, collapse to a fixed icon rail, profile footer,
 *   header over the content.
 * - `top-nav` — one horizontal bar: brand, the nav items flattened, header
 *   slots, profile on the right.
 * - `minimal` — no nav at all: brand, header slots, and profile over the
 *   content. For single-screen apps.
 * - `sidebar-inset` — the rail sits naked on the canvas and the content
 *   column floats as an elevated, rounded card (the Linear/Notion-class
 *   inset look).
 * - `sidebar-topbar` — a full-width top bar owns brand, slots, and profile;
 *   a nav-only rail hangs beneath it (the Vercel/GitHub relationship).
 * - `sidebar-only` — no top bar at all: the sidebar is the only chrome and
 *   every page owns its own header row (the Linear relationship). Header
 *   slots are unused on desktop.
 * - `logo-rail` — collapse hides everything except the brand mark; expanded
 *   it is the full sidebar (Repobot's own dashboard treatment).
 *
 * When `layout`/`contentMode` are absent they resolve from the theme
 * contract (`repobot.theme.json` → `shell.variant` / `shell.content`).
 */

export type AppShellLayout =
    "sidebar" | "top-nav" | "minimal" | "sidebar-inset" | "sidebar-topbar" | "sidebar-only" | "logo-rail"

/** Every shell layout — for manifest validation and tooling (append-only). */
export const appShellLayouts: readonly AppShellLayout[] = [
    "sidebar",
    "top-nav",
    "minimal",
    "sidebar-inset",
    "sidebar-topbar",
    "sidebar-only",
    "logo-rail",
]

/** How pages relate to the shell: standard gutter, readable column, or raw region. */
export type AppShellContentMode = "full" | "centered" | "flush"

export const appShellContentModes: readonly AppShellContentMode[] = ["full", "centered", "flush"]

type SidebarFamilyLayout = Exclude<AppShellLayout, "top-nav" | "minimal">

/** What each sidebar-family treatment does with the bar, the collapse, and the canvas. */
const SIDEBAR_VARIANT_SPECS: Record<
    SidebarFamilyLayout,
    {
        /** Where the horizontal bar lives: over the content, spanning the viewport, or nowhere. */
        topBar: "content" | "banner" | "none"
        /** Collapsed presentation: the fixed icon rail, or the brand mark alone. */
        collapse: "icon-rail" | "logo"
        /** Content column presentation: plain, or an elevated inset card. */
        contentSurface: "plain" | "inset"
    }
> = {
    sidebar: { topBar: "content", collapse: "icon-rail", contentSurface: "plain" },
    "sidebar-inset": { topBar: "content", collapse: "icon-rail", contentSurface: "inset" },
    "sidebar-topbar": { topBar: "banner", collapse: "icon-rail", contentSurface: "plain" },
    "sidebar-only": { topBar: "none", collapse: "icon-rail", contentSurface: "plain" },
    "logo-rail": { topBar: "content", collapse: "logo", contentSurface: "plain" },
}

export interface AppShellNavItem {
    id: string
    label: string
    icon?: React.ReactNode
    badgeText?: string
    children?: AppShellNavItem[]
}

export interface AppShellNavSection {
    id: string
    /** Optional uppercase heading; omitted titles render as plain separators. */
    title?: string
    items: AppShellNavItem[]
}

export interface AppShellDrillUp {
    /** e.g. "All projects" — rendered as a back row above the nav. */
    label: string
    onSelect: () => void
}

export interface AppShellProps {
    /** Navigation chrome; the theme contract's `shell.variant` when omitted. */
    layout?: AppShellLayout
    /** Page-to-shell relationship; the theme contract's `shell.content` when omitted. */
    contentMode?: AppShellContentMode
    /** Product identity next to the brand tile: a plain string or a branded node. */
    title: React.ReactNode
    /** Icon inside the collapse tile; defaults to a kernel mark. */
    brandIcon?: React.ReactNode
    sections: AppShellNavSection[]
    activeItemId?: string
    onItemSelect: (item: AppShellNavItem) => void
    /** Controlled collapse state; uncontrolled (internal) when omitted. */
    collapsed?: boolean
    onCollapsedChange?: (collapsed: boolean) => void
    /** Drill-up row for hierarchical nav levels (see ShellNavLevel in web/core). */
    drillUp?: AppShellDrillUp
    /** Display labels (e.g. "⌘⇧P") shown in collapsed tooltips, keyed by item id. */
    hotkeyLabelByItemId?: Record<string, string>
    topBarLeftSlot?: React.ReactNode
    topBarRightSlot?: React.ReactNode
    profile?: AppShellProfile
    children: React.ReactNode
}

/** Toggles between light and dark theme; must render inside UiThemeProvider. */
export function ThemeToggle(): React.ReactElement {
    const { mode, toggleMode } = useUiTheme()
    return (
        <Button variant="ghost" size="sm" onClick={toggleMode} aria-label="Toggle theme">
            {mode === "light" ? "Dark mode" : "Light mode"}
        </Button>
    )
}

function DefaultBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" />
            <rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity="0.45" />
            <rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity="0.45" />
            <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" />
        </svg>
    )
}

function CaretIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
                d="M6 3.5 L10.5 8 L6 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function BackIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
                d="M10 3.5 L5.5 8 L10 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function MenuIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
                d="M3 5.5 H17 M3 10 H17 M3 14.5 H17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

/** Whether the viewport is below the drawer breakpoint; tracks live resizes. */
function useIsMobile(): boolean {
    const query = `(max-width: ${styles.MOBILE_BREAKPOINT}px)`
    const [isMobile, setIsMobile] = React.useState(() => window.matchMedia(query).matches)
    React.useEffect(() => {
        const mediaQuery = window.matchMedia(query)
        const onChange = (event: MediaQueryListEvent): void => setIsMobile(event.matches)
        mediaQuery.addEventListener("change", onChange)
        return () => mediaQuery.removeEventListener("change", onChange)
    }, [query])
    return isMobile
}

function findFirstLeaf(item: AppShellNavItem): AppShellNavItem {
    let current = item
    while (current.children && current.children.length > 0) {
        current = current.children[0]
    }
    return current
}

function containsItem(item: AppShellNavItem, id: string | undefined): boolean {
    if (id === undefined) {
        return false
    }
    if (item.id === id) {
        return true
    }
    return (item.children ?? []).some((child) => containsItem(child, id))
}

function classNames(...names: Array<string | false | undefined>): string {
    return names.filter(Boolean).join(" ")
}

interface TooltipState {
    label: string
    hotkeyLabel?: string
    top: number
    left: number
}

interface NavEntryProps {
    item: AppShellNavItem
    isChild?: boolean
    collapsed: boolean
    activeItemId?: string
    hotkeyLabelByItemId?: Record<string, string>
    expandedGroupIds: string[]
    onSelect: (item: AppShellNavItem) => void
    onGroupToggle: (item: AppShellNavItem) => void
    onTooltip: (state: TooltipState | undefined) => void
}

function NavEntry({
    item,
    isChild,
    collapsed,
    activeItemId,
    hotkeyLabelByItemId,
    expandedGroupIds,
    onSelect,
    onGroupToggle,
    onTooltip,
}: NavEntryProps): React.ReactElement {
    const hasChildren = (item.children?.length ?? 0) > 0
    const isExpanded = expandedGroupIds.includes(item.id)
    const isActive = activeItemId === item.id
    const showBadge = item.badgeText !== undefined && item.badgeText !== "" && item.badgeText !== "0"

    const handleClick = (): void => {
        if (!hasChildren) {
            onSelect(item)
            return
        }
        if (collapsed) {
            // No room to expand a group in the icon rail — go to its first leaf.
            onSelect(findFirstLeaf(item))
            return
        }
        onGroupToggle(item)
    }

    const showTooltip = (target: HTMLElement): void => {
        const rect = target.getBoundingClientRect()
        onTooltip({
            label: showBadge ? `${item.label} (${item.badgeText})` : item.label,
            hotkeyLabel: hotkeyLabelByItemId?.[item.id],
            top: rect.top + rect.height / 2,
            left: rect.right + 10,
        })
    }

    return (
        <>
            <button
                type="button"
                className={classNames(
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isChild === true && !collapsed && styles.navItemChild,
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                aria-expanded={hasChildren && !collapsed ? isExpanded : undefined}
                onClick={handleClick}
                onMouseEnter={(event) => collapsed && showTooltip(event.currentTarget)}
                onMouseLeave={() => onTooltip(undefined)}
                onFocus={(event) => collapsed && showTooltip(event.currentTarget)}
                onBlur={() => onTooltip(undefined)}
            >
                {/* Top-level rows always carry an icon slot (fallback: the item's
                    initial) so the collapsed rail never goes blank; the slot keeps
                    a constant inset in both states so icons never move. */}
                {(item.icon !== undefined || isChild !== true) && (
                    <span className={styles.navIcon}>
                        {item.icon ?? (
                            <span className={styles.navIconFallback} aria-hidden="true">
                                {item.label.charAt(0)}
                            </span>
                        )}
                        {collapsed && showBadge && <span className={styles.badgeDot} aria-hidden="true" />}
                    </span>
                )}
                <span
                    className={classNames(styles.navLabel, collapsed && styles.collapseFade)}
                    aria-hidden={collapsed ? true : undefined}
                >
                    {item.label}
                </span>
                {showBadge && (
                    <span
                        className={classNames(styles.badge, collapsed && styles.collapseFade)}
                        aria-hidden={collapsed ? true : undefined}
                    >
                        {item.badgeText}
                    </span>
                )}
                {hasChildren && (
                    <span
                        className={classNames(
                            styles.groupCaret,
                            isExpanded && styles.groupCaretOpen,
                            collapsed && styles.collapseFade,
                        )}
                        aria-hidden={collapsed ? true : undefined}
                    >
                        <CaretIcon />
                    </span>
                )}
            </button>
            {!collapsed && hasChildren && (
                <div className={classNames(styles.groupChildren, isExpanded && styles.groupChildrenOpen)}>
                    <div className={styles.groupChildrenInner}>
                        {item.children!.map((child) => (
                            <NavEntry
                                key={child.id}
                                item={child}
                                isChild
                                collapsed={collapsed}
                                activeItemId={activeItemId}
                                hotkeyLabelByItemId={hotkeyLabelByItemId}
                                expandedGroupIds={expandedGroupIds}
                                onSelect={onSelect}
                                onGroupToggle={onGroupToggle}
                                onTooltip={onTooltip}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}

interface TopNavBarProps {
    layout: Extract<AppShellLayout, "top-nav" | "minimal">
    contentMode: AppShellContentMode
    title: React.ReactNode
    brandIcon?: React.ReactNode
    sections: AppShellNavSection[]
    activeItemId?: string
    onItemSelect: (item: AppShellNavItem) => void
    drillUp?: AppShellDrillUp
    topBarLeftSlot?: React.ReactNode
    topBarRightSlot?: React.ReactNode
    profile?: AppShellProfile
    children: React.ReactNode
}

/**
 * The horizontal layouts: one top bar carrying brand, nav items (`top-nav`
 * only), header slots, and the profile menu. Groups have no room to expand
 * in a bar, so an item with children goes to its first leaf — the same rule
 * as the collapsed icon rail.
 */
function TopNavShell({
    layout,
    contentMode,
    title,
    brandIcon,
    sections,
    activeItemId,
    onItemSelect,
    drillUp,
    topBarLeftSlot,
    topBarRightSlot,
    profile,
    children,
}: TopNavBarProps): React.ReactElement {
    const items = layout === "top-nav" ? sections.flatMap((section) => section.items) : []
    return (
        <div className={styles.shellStacked}>
            <header className={styles.topBar}>
                <div className={styles.topBarBrand}>
                    <span className={styles.brandTile} aria-hidden="true">
                        {brandIcon ?? <DefaultBrandIcon />}
                    </span>
                    <div className={styles.brandTitle}>{title}</div>
                </div>
                {items.length > 0 && (
                    <nav className={styles.topNavItems} aria-label="Primary">
                        {drillUp && (
                            <button
                                type="button"
                                className={`${styles.topNavItem} ${styles.drillUp}`}
                                aria-label={drillUp.label}
                                onClick={drillUp.onSelect}
                            >
                                <span className={styles.navIcon}>
                                    <BackIcon />
                                </span>
                                {drillUp.label}
                            </button>
                        )}
                        {items.map((item) => {
                            const isActive = containsItem(item, activeItemId)
                            const showBadge =
                                item.badgeText !== undefined &&
                                item.badgeText !== "" &&
                                item.badgeText !== "0"
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={classNames(
                                        styles.topNavItem,
                                        isActive && styles.topNavItemActive,
                                    )}
                                    aria-label={item.label}
                                    onClick={() => onItemSelect(findFirstLeaf(item))}
                                >
                                    {item.icon !== undefined && (
                                        <span className={styles.navIcon}>{item.icon}</span>
                                    )}
                                    <span>{item.label}</span>
                                    {showBadge && <span className={styles.badge}>{item.badgeText}</span>}
                                </button>
                            )
                        })}
                    </nav>
                )}
                <div className={styles.topBarSlots}>
                    {topBarLeftSlot}
                    {topBarRightSlot ?? <ThemeToggle />}
                    {profile && <ProfileFooter profile={profile} collapsed={false} placement="down" />}
                </div>
            </header>
            <main
                className={`${styles.content} ${styles.contentMode[contentMode]}`}
                data-content-mode={contentMode}
            >
                {children}
            </main>
        </div>
    )
}

interface SidebarShellProps extends Omit<AppShellProps, "layout" | "contentMode"> {
    variant: SidebarFamilyLayout
    contentMode: AppShellContentMode
}

/** The sidebar family: one rail chrome, five designed treatments (see SIDEBAR_VARIANT_SPECS). */
function SidebarShell({
    variant,
    contentMode,
    title,
    brandIcon,
    sections,
    activeItemId,
    onItemSelect,
    collapsed,
    onCollapsedChange,
    drillUp,
    hotkeyLabelByItemId,
    topBarLeftSlot,
    topBarRightSlot,
    profile,
    children,
}: SidebarShellProps): React.ReactElement {
    const spec = SIDEBAR_VARIANT_SPECS[variant]
    const [internalCollapsed, setInternalCollapsed] = React.useState(false)
    const isMobile = useIsMobile()
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    // The drawer is always the full-width nav: an icon rail behind a hamburger
    // would be two levels of disclosure for no gain.
    const resolvedCollapsed = isMobile ? false : (collapsed ?? internalCollapsed)
    // `logo-rail` collapse dissolves the whole rail, not just the labels.
    const logoOnly = spec.collapse === "logo" && resolvedCollapsed
    const [expandedGroupIds, setExpandedGroupIds] = React.useState<string[]>([])
    const [tooltip, setTooltip] = React.useState<TooltipState | undefined>(undefined)

    // Leaving mobile closes the drawer so the desktop sidebar never renders
    // with a stale open state (or a lingering backdrop).
    React.useEffect(() => {
        if (!isMobile) {
            setDrawerOpen(false)
        }
    }, [isMobile])

    // Keep the group containing the active item expanded (e.g. after deep links).
    React.useEffect(() => {
        if (activeItemId === undefined) {
            return
        }
        const groupIds = sections
            .flatMap((section) => section.items)
            .filter((item) => (item.children?.length ?? 0) > 0 && containsItem(item, activeItemId))
            .map((item) => item.id)
        setExpandedGroupIds((previous) => {
            const missing = groupIds.filter((id) => !previous.includes(id))
            return missing.length === 0 ? previous : [...previous, ...missing]
        })
    }, [activeItemId, sections])

    const toggleCollapsed = (): void => {
        if (isMobile) {
            setDrawerOpen(false)
            return
        }
        const next = !resolvedCollapsed
        if (collapsed === undefined) {
            setInternalCollapsed(next)
        }
        setTooltip(undefined)
        onCollapsedChange?.(next)
    }

    const handleGroupToggle = (item: AppShellNavItem): void => {
        setExpandedGroupIds((previous) =>
            previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id],
        )
    }

    const handleSelect = (item: AppShellNavItem): void => {
        setTooltip(undefined)
        setDrawerOpen(false)
        onItemSelect(item)
    }

    const brandRow = (
        <div className={styles.brandRow}>
            <button
                type="button"
                className={styles.brandTile}
                aria-label={resolvedCollapsed ? "Expand navigation" : "Collapse navigation"}
                title={resolvedCollapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={toggleCollapsed}
            >
                {brandIcon ?? <DefaultBrandIcon />}
            </button>
            <div
                className={classNames(
                    styles.brandTitle,
                    resolvedCollapsed && !isMobile && styles.collapseFade,
                )}
                aria-hidden={resolvedCollapsed && !isMobile ? true : undefined}
            >
                {title}
            </div>
        </div>
    )

    const navRail = (
        <nav
            className={classNames(
                styles.navScroller,
                styles.railSection,
                logoOnly && styles.railSectionHidden,
            )}
            aria-hidden={logoOnly ? true : undefined}
        >
            {drillUp && (
                <button
                    type="button"
                    className={classNames(styles.navItem, styles.drillUp)}
                    aria-label={drillUp.label}
                    onClick={drillUp.onSelect}
                    onMouseEnter={(event) => {
                        if (!resolvedCollapsed) {
                            return
                        }
                        const rect = event.currentTarget.getBoundingClientRect()
                        setTooltip({
                            label: drillUp.label,
                            top: rect.top + rect.height / 2,
                            left: rect.right + 10,
                        })
                    }}
                    onMouseLeave={() => setTooltip(undefined)}
                >
                    <span className={styles.navIcon}>
                        <BackIcon />
                    </span>
                    <span
                        className={classNames(styles.navLabel, resolvedCollapsed && styles.collapseFade)}
                        aria-hidden={resolvedCollapsed ? true : undefined}
                    >
                        {drillUp.label}
                    </span>
                </button>
            )}
            {sections.map((navSection, index) => (
                <div key={navSection.id} className={styles.section}>
                    {navSection.title !== undefined && (
                        <div
                            className={classNames(
                                styles.sectionTitle,
                                resolvedCollapsed && styles.sectionTitleCollapsed,
                            )}
                            aria-hidden={resolvedCollapsed ? true : undefined}
                        >
                            {navSection.title}
                        </div>
                    )}
                    {navSection.title === undefined && index > 0 && (
                        <div className={styles.sectionSeparator} />
                    )}
                    {navSection.items.map((item) => (
                        <NavEntry
                            key={item.id}
                            item={item}
                            collapsed={resolvedCollapsed}
                            activeItemId={activeItemId}
                            hotkeyLabelByItemId={hotkeyLabelByItemId}
                            expandedGroupIds={expandedGroupIds}
                            onSelect={handleSelect}
                            onGroupToggle={handleGroupToggle}
                            onTooltip={setTooltip}
                        />
                    ))}
                </div>
            ))}
        </nav>
    )

    // The banner owns brand and profile, so its sidebar is nav alone; the
    // other treatments keep both in the rail.
    const showBrandInRail = spec.topBar !== "banner" || isMobile
    const showProfileInRail = spec.topBar !== "banner"

    const aside = (
        <aside
            className={classNames(
                styles.sidebar,
                resolvedCollapsed && !isMobile ? styles.sidebarWidth.collapsed : styles.sidebarWidth.expanded,
                spec.contentSurface === "inset" && !isMobile && styles.sidebarOnCanvas,
                logoOnly && styles.sidebarLogoRail,
                isMobile && styles.sidebarDrawer,
                isMobile && drawerOpen && styles.sidebarDrawerOpen,
            )}
            aria-hidden={isMobile && !drawerOpen ? true : undefined}
        >
            {showBrandInRail && brandRow}
            {navRail}
            {profile && showProfileInRail && (
                <div
                    className={classNames(styles.railSection, logoOnly && styles.railSectionHidden)}
                    aria-hidden={logoOnly ? true : undefined}
                >
                    <ProfileFooter profile={profile} collapsed={resolvedCollapsed && !isMobile} />
                </div>
            )}
        </aside>
    )

    const backdrop = isMobile && drawerOpen && (
        <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
        />
    )

    const tooltipPortal =
        tooltip &&
        createPortal(
            <div className={styles.tooltip} style={{ top: tooltip.top, left: tooltip.left }}>
                {tooltip.label}
                {tooltip.hotkeyLabel !== undefined && (
                    <span className={styles.tooltipHotkey}>{tooltip.hotkeyLabel}</span>
                )}
            </div>,
            document.body,
        )

    const contentClass = `${styles.content} ${styles.contentMode[contentMode]}`

    if (spec.topBar === "banner") {
        return (
            <div className={styles.shellColumn}>
                <header className={styles.banner}>
                    {isMobile && (
                        <button
                            type="button"
                            className={styles.menuButton}
                            aria-label="Open navigation"
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen(true)}
                        >
                            <MenuIcon />
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.brandTile}
                        aria-label={resolvedCollapsed ? "Expand navigation" : "Collapse navigation"}
                        title={resolvedCollapsed ? "Expand navigation" : "Collapse navigation"}
                        onClick={toggleCollapsed}
                    >
                        {brandIcon ?? <DefaultBrandIcon />}
                    </button>
                    <div className={styles.bannerTitle}>{title}</div>
                    <div className={styles.topBarSlots}>
                        {topBarLeftSlot}
                        {topBarRightSlot ?? <ThemeToggle />}
                        {profile && <ProfileFooter profile={profile} collapsed={false} placement="down" />}
                    </div>
                </header>
                <div className={styles.shellRow}>
                    {backdrop}
                    {aside}
                    <div className={styles.main}>
                        <main className={contentClass} data-content-mode={contentMode}>
                            {children}
                        </main>
                    </div>
                </div>
                {tooltipPortal}
            </div>
        )
    }

    return (
        <div className={styles.shell}>
            {backdrop}
            {aside}
            <div
                className={classNames(
                    styles.main,
                    spec.contentSurface === "inset" && !isMobile && styles.mainInset,
                )}
            >
                {spec.topBar === "content" && (
                    <header className={styles.header}>
                        <div className={styles.headerSlot}>
                            {isMobile && (
                                <button
                                    type="button"
                                    className={styles.menuButton}
                                    aria-label="Open navigation"
                                    aria-expanded={drawerOpen}
                                    onClick={() => setDrawerOpen(true)}
                                >
                                    <MenuIcon />
                                </button>
                            )}
                            {topBarLeftSlot}
                        </div>
                        <div className={styles.headerSlot}>{topBarRightSlot ?? <ThemeToggle />}</div>
                    </header>
                )}
                {spec.topBar === "none" && isMobile && !drawerOpen && (
                    <button
                        type="button"
                        className={styles.floatingMenuButton}
                        aria-label="Open navigation"
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </button>
                )}
                <main className={contentClass} data-content-mode={contentMode}>
                    {children}
                </main>
            </div>
            {tooltipPortal}
        </div>
    )
}

/** Navigation chrome + header + content slot. Routing is wired by the app via nav callbacks. */
export function AppShell({ layout, contentMode, ...props }: AppShellProps): React.ReactElement {
    // Absent props defer to the theme contract, so one repobot.theme.json
    // edit restyles the signed-in chrome (mirrors MarketingShell's nav).
    const { shell } = useThemeContract()
    const resolvedLayout = layout ?? shell.variant
    const resolvedContentMode = contentMode ?? shell.content

    if (resolvedLayout === "top-nav" || resolvedLayout === "minimal") {
        return <TopNavShell layout={resolvedLayout} contentMode={resolvedContentMode} {...props} />
    }
    return <SidebarShell variant={resolvedLayout} contentMode={resolvedContentMode} {...props} />
}
