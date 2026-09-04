import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { configuredDefaultMode, type ThemeConfiguredMode } from "./themeConfig"
import { useThemeContract } from "./themeHotUpdate"
import { darkTheme, lightTheme } from "./tokens.css"
import { themeRoot } from "./UiThemeProvider.styles.css"

export type UiThemeMode = "light" | "dark"

export interface UiThemeContextValue {
    mode: UiThemeMode
    setMode: (mode: UiThemeMode) => void
    toggleMode: () => void
}

/*
 * Global-singleton context for the same reason as ToastContext (Toast.tsx):
 * a back/forward-restored dev document can mix module instances from two
 * Vite graphs, and a second createContext would sever consumers from the
 * mounted provider. One shared context object per page keeps useUiTheme
 * honest across re-transformed module instances.
 */
const UI_THEME_CONTEXT_KEY = "__repobotUiThemeContext"
type UiThemeContextGlobal = typeof globalThis & {
    [UI_THEME_CONTEXT_KEY]?: React.Context<UiThemeContextValue | undefined>
}
const UiThemeContext = ((globalThis as UiThemeContextGlobal)[UI_THEME_CONTEXT_KEY] ??= createContext<
    UiThemeContextValue | undefined
>(undefined))

const STORAGE_KEY = "base.themeMode"

function readStoredMode(): UiThemeMode | undefined {
    if (typeof window === "undefined") {
        return undefined
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" ? stored : undefined
}

/** The repobot.theme.json default; "system" follows the OS preference. */
function resolveConfiguredUiMode(configured: ThemeConfiguredMode): UiThemeMode {
    if (configured === "system") {
        if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
            return "dark"
        }
        return "light"
    }
    return configured
}

function readConfiguredMode(): UiThemeMode {
    return resolveConfiguredUiMode(configuredDefaultMode)
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

    // A live repobot.theme.json edit (dev HMR) can change the configured
    // default mode; follow it unless the user pinned a mode themselves.
    const contract = useThemeContract()
    useEffect(() => {
        if (defaultMode !== undefined || readStoredMode() !== undefined) return
        setModeState(resolveConfiguredUiMode(contract.mode))
    }, [contract.mode, defaultMode])

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

/**
 * The theme class for the current mode, resolvable outside UiThemeProvider
 * (e.g. AuthScreen in an isolated Storybook story): without a provider it
 * falls back to the repobot.theme.json default mode.
 */
export function useResolvedThemeClassName(): string {
    const context = useContext(UiThemeContext)
    const mode = context?.mode ?? readConfiguredMode()
    return mode === "dark" ? darkTheme : lightTheme
}

/**
 * The resolved light/dark mode itself, provider-optional the same way.
 * MarketingPage reads this to pick a preset's appearance variant — the one
 * place the app theme's mode reaches the marketing token system.
 */
export function useResolvedUiMode(): UiThemeMode {
    const context = useContext(UiThemeContext)
    return context?.mode ?? readConfiguredMode()
}
