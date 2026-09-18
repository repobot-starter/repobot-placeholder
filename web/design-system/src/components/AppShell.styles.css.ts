import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const SIDEBAR_EXPANDED_WIDTH = 240
export const SIDEBAR_COLLAPSED_WIDTH = 56

/** Below this width the sidebar becomes an off-canvas drawer (see AppShell). */
export const MOBILE_BREAKPOINT = 768

/**
 * One collapse clock for the whole shell: the rail width, labels, badges,
 * and the content column all ride the same duration/easing, so collapse
 * reads as a single gesture instead of a cascade. Both ride the contract's
 * motion preset (repobot.theme.json `motion`) — `instant` zeroes them.
 */
const COLLAPSE_TRANSITION = `${vars.motion.durationBase} ${vars.motion.easingEmphasis}`
const FADE_TRANSITION = `${vars.motion.durationFast} ${vars.motion.easing}`

const REDUCED_MOTION_OFF = {
    "(prefers-reduced-motion: reduce)": {
        transition: "none",
    },
} as const

/*
 * Fixed icon-rail geometry. The icon column must not move between the
 * expanded and collapsed states, so every row uses the same constant left
 * inset in both: rail padding (8) + row padding (10) + half the icon slot
 * (10) = 28px — the exact center of the 56px collapsed rail. The brand tile
 * (12 + 16) and the profile avatar (8 + 6 + 14) land on the same 28px axis.
 */
const RAIL_PADDING_X = "8px"
const ROW_PADDING_X = "10px"
const ICON_SLOT = "20px"

export const shell = style({
    display: "flex",
    height: ["100vh", "100dvh"],
    backgroundColor: vars.color.background,
    // The character's page wash ("none" for plain) gives the canvas a quiet
    // brand tint without touching any surface tokens.
    backgroundImage: vars.treatment.pageWash,
    // Page content (headings, plain text) inherits the mode's ink from the
    // shell instead of whatever surrounds the theme scope.
    color: vars.color.textPrimary,
})

/** `sidebar-topbar`: a full-width banner above a sidebar + content row. */
export const shellColumn = style({
    display: "flex",
    flexDirection: "column",
    height: ["100vh", "100dvh"],
    backgroundColor: vars.color.background,
    backgroundImage: vars.treatment.pageWash,
    color: vars.color.textPrimary,
})

export const shellRow = style({
    display: "flex",
    flex: 1,
    minHeight: 0,
})

export const sidebar = style({
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    boxSizing: "border-box",
    backgroundColor: vars.navigation.sidebarBg,
    borderRight: `1px solid ${vars.navigation.border}`,
    overflow: "hidden",
    transition: `width ${COLLAPSE_TRANSITION}, background-color ${FADE_TRANSITION}, border-color ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const sidebarWidth = styleVariants({
    expanded: { width: `${SIDEBAR_EXPANDED_WIDTH}px` },
    collapsed: { width: `${SIDEBAR_COLLAPSED_WIDTH}px` },
})

/** `sidebar-inset`: the rail sits naked on the canvas; the content card carries the chrome. */
export const sidebarOnCanvas = style({
    backgroundColor: "transparent",
    borderRight: "none",
})

/** `logo-rail` collapsed: chrome dissolves — the brand mark is all that remains. */
export const sidebarLogoRail = style({
    backgroundColor: "transparent",
    borderRightColor: "transparent",
})

/** Nav + footer inside the logo rail: fade out and leave the a11y tree. */
export const railSection = style({
    transition: `opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const railSectionHidden = style({
    opacity: 0,
    visibility: "hidden",
    transition: `opacity ${FADE_TRANSITION}, visibility 0s linear ${vars.motion.durationFast}`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
        },
    },
})

/**
 * Mobile: the sidebar leaves the flex row and becomes an off-canvas drawer.
 * AppShell gates these classes by viewport (a matchMedia hook), so desktop
 * keeps the plain flex sidebar with zero behavioral change.
 */
export const sidebarDrawer = style({
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    transform: "translateX(-100%)",
    transition: `transform ${vars.motion.durationBase} ${vars.motion.easing}`,
    "@media": REDUCED_MOTION_OFF,
})

export const sidebarDrawerOpen = style({
    transform: "translateX(0)",
    boxShadow: vars.shadow.lg,
})

export const drawerBackdrop = style({
    position: "fixed",
    inset: 0,
    zIndex: 35,
    border: "none",
    padding: 0,
    backgroundColor: vars.color.overlay,
    cursor: "pointer",
})

/** Hamburger in the content header; AppShell renders it only at mobile widths. */
export const menuButton = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    flexShrink: 0,
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.color.textPrimary,
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
})

/** `sidebar-only` has no header to host the hamburger, so it floats one at mobile widths. */
export const floatingMenuButton = style({
    position: "fixed",
    top: "10px",
    left: "10px",
    zIndex: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    boxShadow: vars.shadow.md,
    cursor: "pointer",
})

export const brandRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    // Fixed inset: the 32px tile centers on the collapsed rail's 28px axis.
    padding: "10px 12px",
    minHeight: "52px",
    boxSizing: "border-box",
    overflow: "hidden",
})

export const brandTile = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    flexShrink: 0,
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.color.textPrimary,
    cursor: "pointer",
    transition: `background-color ${FADE_TRANSITION}`,
    selectors: {
        "&:hover": { backgroundColor: vars.navigation.itemHoverBg },
    },
    "@media": REDUCED_MOTION_OFF,
})

export const brandTitle = style({
    overflow: "hidden",
    whiteSpace: "nowrap",
    fontFamily: vars.fontFamily.display,
    fontSize: vars.fontSize.md,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    // Brand text always sits on nav chrome (sidebar rail or top bar), so it
    // takes the navigation set's strong text — textPrimary would vanish on
    // an art-directed dark nav. Falls back to textPrimary without a nav block.
    color: vars.navigation.itemHoverText,
    transition: `opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

/** Collapsing text gives up its width and fades; the icons around it stay put. */
export const collapseFade = style({
    opacity: 0,
    width: 0,
    minWidth: 0,
    flex: "0 0 0px",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    pointerEvents: "none",
})

export const navScroller = style({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: vars.space.md,
    padding: `${vars.space.sm} ${RAIL_PADDING_X}`,
    overflowY: "auto",
    overflowX: "hidden",
})

export const section = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
})

export const sectionTitle = style({
    padding: `${vars.space.xs} ${ROW_PADDING_X} ${vars.space.xxs}`,
    maxHeight: "28px",
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    boxSizing: "border-box",
    transition: `opacity ${FADE_TRANSITION}, max-height ${COLLAPSE_TRANSITION}, padding ${COLLAPSE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const sectionTitleCollapsed = style({
    opacity: 0,
    maxHeight: 0,
    paddingTop: 0,
    paddingBottom: 0,
})

export const sectionSeparator = style({
    height: "1px",
    margin: `${vars.space.xs} ${ROW_PADDING_X}`,
    backgroundColor: vars.navigation.border,
})

export const navItem = style({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    width: "100%",
    padding: `${vars.space.xs} ${ROW_PADDING_X}`,
    minHeight: "34px",
    boxSizing: "border-box",
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.navigation.itemText,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    transition: `background-color ${FADE_TRANSITION}, color ${FADE_TRANSITION}`,
    selectors: {
        "&:hover": {
            backgroundColor: vars.navigation.itemHoverBg,
            color: vars.navigation.itemHoverText,
        },
        // Inset offset: the rail clips at its padding, so the ring draws inside.
        "&:focus-visible": {
            outline: `2px solid ${vars.navigation.ring}`,
            outlineOffset: "-2px",
        },
    },
    "@media": REDUCED_MOTION_OFF,
})

export const navItemActive = style({
    backgroundColor: vars.navigation.itemActiveBg,
    color: vars.navigation.itemActiveText,
    selectors: {
        "&:hover": {
            backgroundColor: vars.navigation.itemActiveBg,
            color: vars.navigation.itemActiveText,
        },
        // The selection accent: a leading bar on the item's edge, aligned
        // with the icon column so it reads in the collapsed rail too.
        "&::before": {
            content: "",
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "16px",
            borderRadius: vars.radius.pill,
            backgroundColor: vars.color.accent,
        },
    },
})

export const navItemChild = style({
    paddingLeft: vars.space.xl,
})

export const navIcon = style({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: ICON_SLOT,
    height: "18px",
    flexShrink: 0,
})

/** Letter glyph for top-level items without an icon, so the rail never goes blank. */
export const navIconFallback = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 700,
    textTransform: "uppercase",
    lineHeight: 1,
})

/** Collapsed-rail badge: counts reduce to a dot on the icon's shoulder; the tooltip carries the number. */
export const badgeDot = style({
    position: "absolute",
    top: "-2px",
    right: "-2px",
    width: "7px",
    height: "7px",
    borderRadius: vars.radius.pill,
    backgroundColor: vars.color.accent,
    boxShadow: `0 0 0 2px ${vars.navigation.sidebarBg}`,
})

export const navLabel = style({
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    transition: `opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const groupCaret = style({
    display: "inline-flex",
    flexShrink: 0,
    color: vars.color.textSecondary,
    transition: `transform ${FADE_TRANSITION}, opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const groupCaretOpen = style({
    transform: "rotate(90deg)",
})

/** Group children ride a grid-rows transition: expand and collapse both animate. */
export const groupChildren = style({
    display: "grid",
    gridTemplateRows: "0fr",
    opacity: 0,
    transition: `grid-template-rows ${COLLAPSE_TRANSITION}, opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const groupChildrenOpen = style({
    gridTemplateRows: "1fr",
    opacity: 1,
})

export const groupChildrenInner = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
    minHeight: 0,
    overflow: "hidden",
    visibility: "hidden",
    transition: `visibility 0s linear ${vars.motion.durationBase}`,
    selectors: {
        [`${groupChildrenOpen} &`]: {
            visibility: "visible",
            transition: "none",
        },
    },
})

export const badge = style({
    flexShrink: 0,
    padding: `0 ${vars.space.xs}`,
    borderRadius: vars.radius.pill,
    backgroundColor: vars.navigation.itemActiveBg,
    color: vars.navigation.itemActiveText,
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    lineHeight: "18px",
    transition: `opacity ${FADE_TRANSITION}`,
    "@media": REDUCED_MOTION_OFF,
})

export const drillUp = style({
    color: vars.color.textSecondary,
    fontWeight: 600,
})

export const tooltip = style({
    position: "fixed",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    borderRadius: vars.radius.md,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxShadow: vars.shadow.md,
    zIndex: 50,
    pointerEvents: "none",
})

export const tooltipHotkey = style({
    padding: `0 ${vars.space.xs}`,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.surfaceHover,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
})

// ------------------------------------------------------- top bars & banner

/** `sidebar-topbar`: the full-width bar that owns brand, slots, and profile. */
export const banner = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    height: "56px",
    padding: `0 ${vars.space.lg} 0 12px`,
    boxSizing: "border-box",
    flexShrink: 0,
    backgroundColor: vars.navigation.sidebarBg,
    borderBottom: `1px solid ${vars.navigation.border}`,
    zIndex: 20,
})

export const bannerTitle = style({
    overflow: "hidden",
    whiteSpace: "nowrap",
    fontFamily: vars.fontFamily.display,
    fontSize: vars.fontSize.md,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    // Strong text on the nav surface (falls back to textPrimary without a
    // nav block) — textPrimary is illegible on an art-directed dark bar.
    color: vars.navigation.itemHoverText,
})

export const shellStacked = style({
    display: "flex",
    flexDirection: "column",
    height: ["100vh", "100dvh"],
    backgroundColor: vars.color.background,
    backgroundImage: vars.treatment.pageWash,
})

export const topBar = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.lg,
    height: "56px",
    padding: `0 ${vars.space.lg}`,
    boxSizing: "border-box",
    flexShrink: 0,
    // Nav chrome, so the `palette.nav` art direction reaches this bar the
    // same way it reaches the sidebar rail. Without a nav block these
    // tokens resolve to surface/border — byte-identical to the old values.
    backgroundColor: vars.navigation.sidebarBg,
    borderBottom: `1px solid ${vars.navigation.border}`,
    position: "sticky",
    top: 0,
    zIndex: 20,
})

export const topBarBrand = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    flexShrink: 0,
})

export const topNavItems = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xxs,
    minWidth: 0,
    overflowX: "auto",
})

export const topNavItem = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.navigation.itemText,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: `background-color ${FADE_TRANSITION}, color ${FADE_TRANSITION}`,
    selectors: {
        "&:hover": {
            backgroundColor: vars.navigation.itemHoverBg,
            color: vars.navigation.itemHoverText,
        },
        "&:focus-visible": {
            outline: `2px solid ${vars.navigation.ring}`,
            outlineOffset: "-2px",
        },
    },
    "@media": REDUCED_MOTION_OFF,
})

export const topNavItemActive = style({
    backgroundColor: vars.navigation.itemActiveBg,
    color: vars.navigation.itemActiveText,
    selectors: {
        "&:hover": {
            backgroundColor: vars.navigation.itemActiveBg,
            color: vars.navigation.itemActiveText,
        },
    },
})

export const topBarSlots = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    marginLeft: "auto",
    flexShrink: 0,
})

// ------------------------------------------------------- content column

export const main = style({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
})

/** `sidebar-inset`: the content column floats as an elevated card on the canvas. */
export const mainInset = style({
    margin: vars.space.sm,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    boxShadow: vars.shadow.sm,
    overflow: "hidden",
})

export const header = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
    height: "52px",
    padding: `0 ${vars.space.xl}`,
    boxSizing: "border-box",
    flexShrink: 0,
    backgroundColor: vars.color.surface,
    borderBottom: `1px solid ${vars.color.border}`,
})

export const headerSlot = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    minWidth: 0,
})

export const content = style({
    flex: 1,
    minHeight: 0,
    padding: vars.space.xl,
    overflowY: "auto",
    "@media": {
        [`(max-width: ${MOBILE_BREAKPOINT}px)`]: {
            padding: vars.space.md,
        },
    },
})

/**
 * How pages relate to the shell (`shell.content` in the theme contract):
 * `full` keeps the standard gutter, `centered` constrains pages to a
 * readable column, `flush` hands the page the raw scroll region.
 */
export const contentMode = styleVariants({
    full: {},
    centered: {
        paddingInline: `max(${vars.space.xl}, calc((100% - 1120px) / 2))`,
    },
    flush: {
        padding: 0,
        "@media": {
            [`(max-width: ${MOBILE_BREAKPOINT}px)`]: {
                padding: 0,
            },
        },
    },
})
