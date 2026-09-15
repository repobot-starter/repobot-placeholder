import { existsSync } from "node:fs"
import { chromium } from "playwright-core"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { parsePageSize } from "./DocumentTemplateTypes.js"
import { PdfRenderRequest } from "./PdfRenderClient.js"

/**
 * Sandbox-only PDF rendering (DOCUMENTS_MODE=local): drives a Chromium that
 * is already on the machine via playwright-core, which ships no browsers of
 * its own. Deployed environments never take this path — they call the
 * platform render service.
 */
export async function renderHtmlToPdfWithLocalChromium(request: PdfRenderRequest): Promise<Buffer> {
    const browser = await chromium.launch({
        headless: true,
        executablePath: resolveChromiumExecutablePath(),
    })
    try {
        const page = await browser.newPage()
        await page.setContent(request.html, { waitUntil: "networkidle" })
        const { format, landscape } = parsePageSize(request.pageSize)
        return await page.pdf({ format, landscape, printBackground: true })
    } finally {
        await browser.close()
    }
}

/** Well-known Chromium/Chrome locations, checked when the env var is unset. */
const knownChromiumPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
]

function resolveChromiumExecutablePath(): string {
    const configured = validatedEnv().DOCUMENTS_CHROMIUM_PATH
    if (configured !== undefined && configured !== "") {
        if (!existsSync(configured)) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                `DOCUMENTS_CHROMIUM_PATH points at '${configured}', which does not exist.`,
            )
        }
        return configured
    }
    for (const candidate of knownChromiumPaths) {
        if (existsSync(candidate)) {
            return candidate
        }
    }
    throw new RpcError(
        "FAILED_PRECONDITION",
        "No Chromium found for local PDF rendering. Install Chrome/Chromium or set " +
            "DOCUMENTS_CHROMIUM_PATH to a Chromium executable.",
    )
}
