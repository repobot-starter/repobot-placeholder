import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { DocumentPageSize } from "./DocumentTemplateTypes.js"

export interface PdfRenderRequest {
    /** A complete printable HTML document (see buildPrintableHtmlDocument). */
    html: string
    pageSize: DocumentPageSize
}

/** Turns printable HTML into PDF bytes. */
export interface PdfRenderer {
    renderHtmlToPdf(request: PdfRenderRequest): Promise<Buffer>
}

let instance: PdfRenderer | undefined

/**
 * The renderer the Documents domain calls. DOCUMENTS_MODE=platform (every
 * deploy) POSTs to the platform's shared Chromium render service;
 * DOCUMENTS_MODE=local (the sandbox) drives a local Chromium via
 * playwright-core. Constructed lazily so booting without documents env never
 * fails. Tests may replace it via setPdfRendererForTests.
 */
export function getPdfRenderer(): PdfRenderer {
    if (instance === undefined) {
        instance =
            validatedEnv().DOCUMENTS_MODE === "local"
                ? new LazyLocalPdfRenderer()
                : new PlatformPdfRenderClient()
    }
    return instance
}

/** Test-only: substitutes a fake and returns to the real renderer when undefined. */
export function setPdfRendererForTests(renderer: PdfRenderer | undefined): void {
    instance = renderer
}

/**
 * Calls the platform-hosted render service. The endpoint and its bearer
 * token are injected by the platform when the deploy manifest declares the
 * DOCUMENTS capability; missing values fail at first use with the setup
 * spelled out, mirroring how the OpenAI wrapper handles a missing key.
 */
class PlatformPdfRenderClient implements PdfRenderer {
    async renderHtmlToPdf(request: PdfRenderRequest): Promise<Buffer> {
        const env = validatedEnv()
        if (env.DOCUMENTS_RENDER_URL === undefined || env.DOCUMENTS_RENDER_URL === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "DOCUMENTS_RENDER_URL is not set. Deployed environments get it from the platform " +
                    "when repobot.deploy.json declares the DOCUMENTS capability; local sandboxes " +
                    "should run DOCUMENTS_MODE=local instead.",
            )
        }
        const endpoint = `${env.DOCUMENTS_RENDER_URL.replace(/\/$/, "")}/render-pdf`
        let response: Response
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    ...(env.DOCUMENTS_TOKEN !== undefined && env.DOCUMENTS_TOKEN !== ""
                        ? { authorization: `Bearer ${env.DOCUMENTS_TOKEN}` }
                        : {}),
                },
                body: JSON.stringify({ html: request.html, pageSize: request.pageSize }),
            })
        } catch (error) {
            throw new RpcError("UNAVAILABLE", "The document render service could not be reached.", {
                cause: error,
            })
        }
        if (!response.ok) {
            const detail = await response.text().catch(() => "")
            throw new RpcError(
                "UNAVAILABLE",
                `The document render service failed with status ${response.status}` +
                    (detail !== "" ? `: ${detail.slice(0, 500)}` : "."),
            )
        }
        return Buffer.from(await response.arrayBuffer())
    }
}

/**
 * Defers the playwright-core import to first use so the deployed code path
 * (always DOCUMENTS_MODE=platform) never loads it.
 */
class LazyLocalPdfRenderer implements PdfRenderer {
    async renderHtmlToPdf(request: PdfRenderRequest): Promise<Buffer> {
        const { renderHtmlToPdfWithLocalChromium } = await import("./LocalPdfRenderer.js")
        return renderHtmlToPdfWithLocalChromium(request)
    }
}
