import { applyOptimisticThemeDocument, discardOptimisticThemeDocument } from "@ui"
import {
    applyOptimisticLandingDocument,
    discardOptimisticLandingDocument,
} from "../View/Landing/landingDocument"

const PREVIEW_CHANNEL = "repobot-preview"
const OPTIMISTIC_VISUAL_DOCS_TYPE = "optimistic-visual-docs"
const THEME_DOC_PATH = "repobot.theme.json"
const LANDING_DOC_PATH = "repobot.landing.json"

function coerceRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
}

function parseJson(contents: string): unknown | undefined {
    try {
        return JSON.parse(contents) as unknown
    } catch {
        return undefined
    }
}

function applyOptimisticWrite(path: string, contents: string): void {
    const parsed = parseJson(contents)
    if (parsed === undefined) {
        return
    }
    // Ordering guarantee: durable HMR writes call the same target setters
    // (`applyDurable*Document`) and always replace the active runtime state,
    // so optimistic paints can never outlive the real landed document.
    if (path === THEME_DOC_PATH) {
        applyOptimisticThemeDocument(parsed)
    } else if (path === LANDING_DOC_PATH) {
        applyOptimisticLandingDocument(parsed)
    }
}

function applyOptimisticDiscard(path: string): void {
    if (path === THEME_DOC_PATH) {
        discardOptimisticThemeDocument()
    } else if (path === LANDING_DOC_PATH) {
        discardOptimisticLandingDocument()
    }
}

/** Handles one platform preview bridge payload when it's optimistic docs. */
export function handleOptimisticVisualDocsMessage(data: unknown): void {
    const message = coerceRecord(data)
    if (message?.channel !== PREVIEW_CHANNEL || message.type !== OPTIMISTIC_VISUAL_DOCS_TYPE) {
        return
    }
    const action = message.action
    if (action === "write") {
        const files = Array.isArray(message.files) ? message.files : []
        for (const file of files) {
            const entry = coerceRecord(file)
            if (typeof entry?.path === "string" && typeof entry.contents === "string") {
                applyOptimisticWrite(entry.path, entry.contents)
            }
        }
    } else if (action === "discard") {
        const seen = new Set<string>()
        const paths = Array.isArray(message.paths) ? message.paths : []
        for (const path of paths) {
            if (typeof path !== "string" || seen.has(path)) {
                continue
            }
            seen.add(path)
            applyOptimisticDiscard(path)
        }
    }
}

let installed = false

/** Installs the platform preview message bridge for optimistic visual docs. */
export function installPreviewBridge(): void {
    if (installed) {
        return
    }
    const onMessage = (event: MessageEvent): void => {
        handleOptimisticVisualDocsMessage(event.data)
    }
    window.addEventListener("message", onMessage)
    installed = true
    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            window.removeEventListener("message", onMessage)
            installed = false
        })
    }
}
