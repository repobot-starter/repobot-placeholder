import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { configuredDefaultMode } from "./themeConfig"
import { darkTheme, lightTheme } from "./tokens.css"
import { themeRoot } from "./UiThemeProvider.styles.css"

export type UiThemeMode = "light" | "dark"

export interface UiThemeContextValue {
    mode: UiThemeMode
    setMode: (mode: UiThemeMode) => void
    toggleMode: () => void
}

const UiThemeContext = createContext<UiThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "base.themeMode"

function readStoredMode(): UiThemeMode | undefined {
    if (typeof window === "undefined") {
        return undefined
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" ? stored : undefined
}

/** The repobot.theme.json default; "system" follows the OS preference. */
function readConfiguredMode(): UiThemeMode {
    if (configuredDefaultMode === "system") {
        if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
            return "dark"
        }
        return "light"
    }
    return configuredDefaultMode
}

export interface UiThemeProviderProps {
    /** Overrides the repobot.theme.json `mode` for this mount (rarely needed). */
    defaultMode?: UiThemeMode
    children: React.ReactNode
}

/** Applies the vanilla-extract theme class and exposes mode switching via useUiTheme(). */
export function UiThemeProvider({ defaultMode, children }: UiThemeProviderProps): React.ReactElement {
    const [mode, setModeState] = useState<UiThemeMode>(
        () => readStoredMode() ?? defaultMode ?? readConfiguredMode(),
    )

    // Radix portals (Dialog, Select dropdowns) render outside the themed div,
    // so the theme class must also live on <body> for portaled content.
    useEffect(() => {
        const themeClass = mode === "dark" ? darkTheme : lightTheme
        document.body.classList.add(themeClass)
        return () => document.body.classList.remove(themeClass)
    }, [mode])

    const setMode = useCallback((nextMode: UiThemeMode) => {
        setModeState(nextMode)
        try {
            window.localStorage.setItem(STORAGE_KEY, nextMode)
        } catch {
            // Storage may be unavailable (e.g. sandboxed iframes); mode still works in-memory.
        }
    }, [])

    const toggleMode = useCallback(() => {
        setModeState((previous) => {
            const nextMode = previous === "light" ? "dark" : "light"
            try {
                window.localStorage.setItem(STORAGE_KEY, nextMode)
            } catch {
                // Ignore storage failures.
            }
            return nextMode
        })
    }, [])

    const value = useMemo<UiThemeContextValue>(
        () => ({ mode, setMode, toggleMode }),
        [mode, setMode, toggleMode],
    )

    return (
        <UiThemeContext.Provider value={value}>
            <div
                className={`${mode === "dark" ? darkTheme : lightTheme} ${themeRoot}`}
                data-theme-mode={mode}
            >
                {children}
            </div>
        </UiThemeContext.Provider>
    )
}

export function useUiTheme(): UiThemeContextValue {
    const value = useContext(UiThemeContext)
    if (value === undefined) {
        throw new Error("useUiTheme must be used within UiThemeProvider.")
    }
    return value
}
