import React from "react"
import { Button } from "../primitives/Button"
import { useUiTheme } from "../theme/UiThemeProvider"
import * as styles from "./AppShell.styles.css"

export interface AppShellNavItem {
    id: string
    label: string
    active?: boolean
    onSelect: () => void
}

export interface AppShellProps {
    /** Product identity in the sidebar: a plain string or a branded node (logo + name). */
    title: React.ReactNode
    navItems: AppShellNavItem[]
    /** Rendered on the right side of the header, e.g. user email + sign out. */
    userSlot?: React.ReactNode
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

/** Sidebar navigation + header + content slot. Routing is wired by the app via nav item callbacks. */
export function AppShell({ title, navItems, userSlot, children }: AppShellProps): React.ReactElement {
    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>{title}</div>
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={[styles.navItem, item.active ? styles.navItemActive : undefined]
                                .filter(Boolean)
                                .join(" ")}
                            onClick={item.onSelect}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
            <div className={styles.main}>
                <header className={styles.header}>
                    <ThemeToggle />
                    {userSlot}
                </header>
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    )
}
