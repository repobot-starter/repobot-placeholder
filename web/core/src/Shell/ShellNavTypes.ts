/**
 * The shell navigation contract: one schema that names everything the app
 * shell knows how to render — sections, items, badges, hotkeys, and nav
 * levels. Templates describe their navigation as data against this schema,
 * so changing a product's IA is config — not chrome rewritten per platform.
 *
 * The iOS (ShellNavModels.swift) and Android (ShellNavModels.kt) twins mirror
 * this file; change all three together. Icons are platform-native values
 * supplied by each binder (a React node on web, an SF Symbol name on iOS, an
 * ImageVector on Android) — the mirrored part is the shape and the matching
 * semantics, pinned by the ShellNavigation parity tests.
 */

export interface ShellNavItem<TIcon = unknown> {
    /** Stable id; route items use their path (e.g. "/projects") so active matching works. */
    id: string
    label: string
    icon?: TIcon
    badgeText?: string
    /** Single character; platforms bind it to their nav chord (e.g. Cmd/Ctrl+Shift+key). */
    hotkey?: string
    /** Nested children rendered as an expandable group under the parent row. */
    children?: ShellNavItem<TIcon>[]
}

export interface ShellNavSection<TIcon = unknown> {
    id: string
    /** Optional uppercase heading; omit for a plain separator between groups. */
    title?: string
    items: ShellNavItem<TIcon>[]
}

/**
 * A nav level is one rung of a drill-down hierarchy (e.g. organization →
 * project). Flat apps use a single level; hierarchical apps switch the active
 * level and the shell renders a drill-up row back to the parent.
 */
export interface ShellNavLevel<TIcon = unknown> {
    id: string
    sections: ShellNavSection<TIcon>[]
    parentLevelId?: string
    /** Label of the drill-up row shown when parentLevelId is set, e.g. "All projects". */
    drillUpLabel?: string
}
