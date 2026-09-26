// Chromium discovery for the brief runner's browser adapter. Mirrors the
// documents kernel's resolver (firebase/functions/src/Services/Documents/
// LocalPdfRenderer.ts) including its DOCUMENTS_CHROMIUM_PATH override, so one
// env var configures both local PDF rendering and brief checks. Keep the
// known-paths lists in sync.

import { existsSync } from "node:fs"

const knownChromiumPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
]

/** Returns the Chromium executable path, or undefined (caller reports blocked). */
export function resolveChromiumExecutablePath() {
    const configured = process.env.DOCUMENTS_CHROMIUM_PATH
    if (configured !== undefined && configured !== "") {
        return existsSync(configured) ? configured : undefined
    }
    return knownChromiumPaths.find((candidate) => existsSync(candidate))
}
