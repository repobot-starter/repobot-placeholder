import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { type UiToastPosition, type UiToastStyle } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import * as styles from "./Toast.styles.css"

export type ToastTone = "neutral" | "success" | "danger"

export interface ToastOptions {
    title: string
    description?: string
    tone?: ToastTone
    /** Auto-dismiss delay; defaults to 5000ms. */
    durationMs?: number
}

export interface ToastContextValue {
    publish: (toast: ToastOptions) => void
}

/*
 * Resolved through a global singleton rather than a bare module-level
 * createContext. In the dev workspace preview, a back/forward navigation can
 * resume a document whose MOUNTED provider came from an earlier Vite module
 * graph while later-mounted consumers import a re-transformed instance of
 * this module (the dev server restarted or invalidated modules while the
 * page was away on an external link). Two context objects would make every
 * consumer read null under a perfectly mounted provider — the "useToast
 * must be used inside a ToastProvider" crash on back-navigation. Keying the
 * context on globalThis keeps provider and consumers agreeing across module
 * instances; a genuinely missing provider still throws below.
 */
const TOAST_CONTEXT_KEY = "__repobotToastContext"
type ToastContextGlobal = typeof globalThis & {
    [TOAST_CONTEXT_KEY]?: React.Context<ToastContextValue | null>
}
const ToastContext = ((globalThis as ToastContextGlobal)[TOAST_CONTEXT_KEY] ??=
    createContext<ToastContextValue | null>(null))

/**
 * Fire a toast from anywhere under a ToastProvider:
 *
 *     const toast = useToast()
 *     toast.publish({ title: "Order saved", tone: "success" })
 */
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used inside a ToastProvider")
    }
    return context
}

interface ActiveToast extends ToastOptions {
    id: number
}

const DEFAULT_DURATION_MS = 5000

export interface ToastProviderProps {
    children: React.ReactNode
    /** Overrides the repobot.theme.json `ui.toasts.position` preset for this mount. */
    position?: UiToastPosition
    /** Overrides the repobot.theme.json `ui.toasts.style` preset for this mount. */
    variant?: UiToastStyle
}

/** Per-toast class list for a dressing: the base card plus its tone read. */
function toastClasses(style: UiToastStyle, tone: ToastTone): string {
    if (style === "solid") {
        return `${styles.toast} ${styles.tone[tone]} ${styles.solid}`
    }
    if (style === "soft") {
        // The soft fill owns every border side — the tone edge dissolves.
        return `${styles.toast} ${styles.soft[tone]}`
    }
    return `${styles.toast} ${styles.tone[tone]}`
}

/**
 * Global transient notifications for CRUD outcomes ("Saved", "Delete
 * failed"). Mount once near the app root; toasts stack (bottom-right by
 * default) and auto-dismiss. Placement and card dressing follow the
 * repobot.theme.json `ui.toasts` presets — the props override per mount.
 * Reserve dialogs for decisions — toasts are for outcomes.
 */
export function ToastProvider({ children, position, variant }: ToastProviderProps): React.ReactElement {
    // Absent props defer to the theme contract, so one repobot.theme.json
    // edit moves and re-dresses the whole notification surface live.
    const { ui } = useThemeContract()
    const resolvedPosition = position ?? ui.toasts.position
    const resolvedStyle = variant ?? ui.toasts.style
    const [toasts, setToasts] = useState<ActiveToast[]>([])
    const nextIdRef = useRef(1)

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const publish = useCallback(
        (options: ToastOptions) => {
            const id = nextIdRef.current
            nextIdRef.current += 1
            setToasts((current) => [...current, { ...options, id }])
            window.setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION_MS)
        },
        [dismiss],
    )

    const value = useMemo(() => ({ publish }), [publish])

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toasts.length > 0 ? (
                <div
                    className={`${styles.viewport} ${styles.position[resolvedPosition]}`}
                    data-position={resolvedPosition}
                    role="region"
                    aria-label="Notifications"
                >
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            role="status"
                            className={toastClasses(resolvedStyle, toast.tone ?? "neutral")}
                            data-style={resolvedStyle}
                        >
                            <div className={styles.body}>
                                <span
                                    className={
                                        resolvedStyle === "solid"
                                            ? `${styles.title} ${styles.solidText}`
                                            : styles.title
                                    }
                                >
                                    {toast.title}
                                </span>
                                {toast.description ? (
                                    <span
                                        className={
                                            resolvedStyle === "solid"
                                                ? `${styles.description} ${styles.solidMuted}`
                                                : styles.description
                                        }
                                    >
                                        {toast.description}
                                    </span>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                className={
                                    resolvedStyle === "solid"
                                        ? `${styles.dismiss} ${styles.dismissSolid}`
                                        : styles.dismiss
                                }
                                aria-label="Dismiss"
                                onClick={() => dismiss(toast.id)}
                            >
                                &#215;
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}
        </ToastContext.Provider>
    )
}
