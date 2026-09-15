import React from "react"
import { createPortal } from "react-dom"
import { useUiTheme } from "../theme/UiThemeProvider"
import * as styles from "./AppShellProfile.styles.css"

/**
 * The shell's account surface: an identity trigger (avatar + name) that
 * opens the profile modal — identity header, app-supplied account options,
 * a checkmarked theme picker, and sign out. Pattern-matched to Repobot's
 * own dashboard profile menu; the shell stays domain-agnostic because every
 * account option beyond theme + sign out is injected by the binder
 * (docs/shell.md "Profile menu items are config too").
 */

export interface AppShellProfileItem {
    id: string
    label: string
    /** Optional 16px leading glyph; rows without one keep an empty slot so labels align. */
    icon?: React.ReactNode
    onSelect: () => void
}

export interface AppShellProfile {
    /** Display name or email shown in the footer. */
    label: string
    sublabel?: string
    /** Avatar image URL; the label's initials render when omitted. */
    avatarUrl?: string
    /**
     * App-supplied menu entries (e.g. "Account settings") rendered in the
     * profile overlay between the identity header and the built-in theme
     * picker + sign out rows. The shell stays domain-agnostic: what the
     * items do is entirely the binder's concern.
     */
    items?: AppShellProfileItem[]
    onSignOut?: () => void
}

export function initialsOf(label: string): string {
    const parts = label
        .trim()
        .split(/[\s@._-]+/)
        .filter(Boolean)
    if (parts.length === 0) {
        return "?"
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2)
    }
    return `${parts[0][0]}${parts[1][0]}`
}

function SunIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path
                d="M8 1.5v1.6 M8 12.9v1.6 M1.5 8h1.6 M12.9 8h1.6 M3.4 3.4l1.1 1.1 M11.5 11.5l1.1 1.1 M12.6 3.4l-1.1 1.1 M4.5 11.5l-1.1 1.1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    )
}

function MoonIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
                d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function SignOutIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
                d="M6.2 3.2H4.1c-.7 0-1.3.6-1.3 1.3v7c0 .7.6 1.3 1.3 1.3h2.1 M10.2 10.6 13 8l-2.8-2.6 M13 8H6.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function CheckIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
                d="M3 8.5 6.5 12 13 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export interface ProfileFooterProps {
    profile: AppShellProfile
    collapsed: boolean
    /** Where the overlay opens relative to the trigger; `up` suits the sidebar footer, `down` the top bar. */
    placement?: "up" | "down"
}

/** The identity trigger plus its portal overlay — the shell's profile modal. */
export function ProfileFooter({
    profile,
    collapsed,
    placement = "up",
}: ProfileFooterProps): React.ReactElement {
    const { mode, setMode } = useUiTheme()
    const [open, setOpen] = React.useState(false)
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    const triggerRef = React.useRef<HTMLButtonElement | null>(null)
    const overlayRef = React.useRef<HTMLDivElement | null>(null)

    const reposition = React.useCallback(() => {
        const rect = triggerRef.current?.getBoundingClientRect()
        if (!rect) {
            return
        }
        if (placement === "down") {
            // Right-align under the trigger; clamp inside the viewport.
            setPosition({ top: rect.bottom + 8, left: Math.max(8, rect.right - 260) })
            return
        }
        setPosition({ top: rect.top - 8, left: rect.left })
    }, [placement])

    React.useEffect(() => {
        if (!open) {
            return
        }
        reposition()
        const onWindowChange = (): void => reposition()
        const onOutside = (event: MouseEvent): void => {
            const target = event.target as Node
            if (triggerRef.current?.contains(target) || overlayRef.current?.contains(target)) {
                return
            }
            setOpen(false)
        }
        const onEscape = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                setOpen(false)
            }
        }
        window.addEventListener("resize", onWindowChange)
        window.addEventListener("scroll", onWindowChange, true)
        window.addEventListener("mousedown", onOutside)
        window.addEventListener("keydown", onEscape)
        return () => {
            window.removeEventListener("resize", onWindowChange)
            window.removeEventListener("scroll", onWindowChange, true)
            window.removeEventListener("mousedown", onOutside)
            window.removeEventListener("keydown", onEscape)
        }
    }, [open, reposition])

    return (
        <div className={placement === "down" ? styles.footerInline : styles.footer}>
            <button
                ref={triggerRef}
                type="button"
                className={[styles.trigger, placement === "down" ? styles.triggerInline : undefined]
                    .filter(Boolean)
                    .join(" ")}
                aria-label={`Account: ${profile.label}`}
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
            >
                <span className={styles.avatar}>
                    {profile.avatarUrl !== undefined ? (
                        <img src={profile.avatarUrl} alt="" className={styles.avatarImage} />
                    ) : (
                        initialsOf(profile.label)
                    )}
                </span>
                {placement !== "down" && (
                    <span
                        className={[styles.labels, collapsed ? styles.labelsCollapsed : undefined]
                            .filter(Boolean)
                            .join(" ")}
                        aria-hidden={collapsed ? true : undefined}
                    >
                        <span className={styles.label}>{profile.label}</span>
                        {profile.sublabel !== undefined && (
                            <span className={styles.sublabel}>{profile.sublabel}</span>
                        )}
                    </span>
                )}
            </button>
            {open &&
                createPortal(
                    <div
                        ref={overlayRef}
                        className={styles.overlay}
                        style={{
                            top: position.top,
                            left: position.left,
                            transform: placement === "down" ? undefined : "translateY(-100%)",
                        }}
                    >
                        <div className={styles.overlayHeader}>
                            <span className={styles.avatar} aria-hidden="true">
                                {profile.avatarUrl !== undefined ? (
                                    <img src={profile.avatarUrl} alt="" className={styles.avatarImage} />
                                ) : (
                                    initialsOf(profile.label)
                                )}
                            </span>
                            <span className={styles.overlayHeaderLabels}>
                                <span className={styles.label}>{profile.label}</span>
                                {profile.sublabel !== undefined && (
                                    <span className={styles.sublabel}>{profile.sublabel}</span>
                                )}
                            </span>
                        </div>
                        {(profile.items?.length ?? 0) > 0 && (
                            <>
                                <div className={styles.separator} />
                                {profile.items!.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={styles.row}
                                        onClick={() => {
                                            setOpen(false)
                                            item.onSelect()
                                        }}
                                    >
                                        <span className={styles.rowIcon} aria-hidden="true">
                                            {item.icon}
                                        </span>
                                        <span className={styles.rowLabel}>{item.label}</span>
                                    </button>
                                ))}
                            </>
                        )}
                        <div className={styles.separator} />
                        <div className={styles.sectionLabel}>Theme</div>
                        {(["light", "dark"] as const).map((themeMode) => (
                            <button
                                key={themeMode}
                                type="button"
                                className={styles.row}
                                aria-pressed={mode === themeMode}
                                onClick={() => setMode(themeMode)}
                            >
                                <span className={styles.rowIcon} aria-hidden="true">
                                    {themeMode === "light" ? <SunIcon /> : <MoonIcon />}
                                </span>
                                <span className={styles.rowLabel}>
                                    {themeMode === "light" ? "Light" : "Dark"}
                                </span>
                                {mode === themeMode && (
                                    <span className={styles.rowCheck} aria-hidden="true">
                                        <CheckIcon />
                                    </span>
                                )}
                            </button>
                        ))}
                        {profile.onSignOut && (
                            <>
                                <div className={styles.separator} />
                                <button
                                    type="button"
                                    className={styles.row}
                                    onClick={() => {
                                        setOpen(false)
                                        profile.onSignOut?.()
                                    }}
                                >
                                    <span className={styles.rowIcon} aria-hidden="true">
                                        <SignOutIcon />
                                    </span>
                                    <span className={styles.rowLabel}>Sign out</span>
                                </button>
                            </>
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    )
}
