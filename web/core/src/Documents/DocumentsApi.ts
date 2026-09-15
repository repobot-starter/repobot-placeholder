/**
 * Transport for the documents kernel endpoint (documents__request__api).
 * Templates are files in the repo (firebase/functions/documents/templates/);
 * this client lists them and turns overrides into downloadable PDFs. See
 * docs/documents.md.
 */

export type DocumentPageSize = "Letter" | "A4" | "Letter-landscape" | "A4-landscape"

/** One field in a template's schema, as served by GET /templates. */
export interface DocumentTemplateField {
    type?: "string" | "number" | "boolean" | "array" | "object"
    required?: boolean
    format?: string
    fields?: Record<string, DocumentTemplateField>
    items?: DocumentTemplateField
}

export interface DocumentTemplateSummary {
    key: string
    name: string
    description?: string
    pageSize: DocumentPageSize
    fields: Record<string, DocumentTemplateField>
    /** Sample overrides, handy as form seed data. */
    sample: Record<string, unknown>
}

export interface GeneratedDocument {
    fileName: string
    blob: Blob
}

/**
 * A non-2xx answer from the documents endpoint. Carries the HTTP status and
 * the server's RPC code (asyncRoute serializes RpcErrors as
 * `{ error: { code, message } }`) so callers can react to the failure CLASS
 * instead of matching message strings — the documents transport is a raw
 * fetch, so unlike GraphQL it gets none of the Apollo links' UNAUTHENTICATED
 * handling, and callers that want the same self-heal need the code.
 */
export class DocumentsRequestError extends Error {
    readonly status: number
    readonly code: string | undefined

    constructor(message: string, details: { status: number; code?: string }) {
        super(message)
        this.name = "DocumentsRequestError"
        this.status = details.status
        this.code = details.code
    }
}

/** Whether a documents call failed because the presented session is invalid. */
export function isUnauthenticatedDocumentsError(error: unknown): boolean {
    return (
        error instanceof DocumentsRequestError && (error.code === "UNAUTHENTICATED" || error.status === 401)
    )
}

/**
 * The documents endpoint is the documents__request__api function, which
 * lives next to the GraphQL function in every environment — the emulator and
 * the platform deployer treat all exports uniformly — so its URL is the
 * GraphQL URL with the trailing function name swapped. The app passes its
 * GraphQL URL (import.meta.env.VITE_GRAPHQL_URL); core never reads env
 * directly.
 */
export function deriveDocumentsEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "documents__request__api")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the documents endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

/** Lists the repo's document templates. */
export async function fetchDocumentTemplates(endpoint: string): Promise<DocumentTemplateSummary[]> {
    const response = await fetch(`${endpoint}/templates`)
    if (!response.ok) {
        throw await documentsRequestError(response, "Listing document templates failed")
    }
    const body = (await response.json()) as { templates: DocumentTemplateSummary[] }
    return body.templates
}

/**
 * Generates one PDF: POSTs the overrides and returns the bytes as a Blob
 * with the server-chosen file name. Callers typically hand the blob to an
 * <a download> click.
 *
 * POST /generate requires an authenticated principal (any session counts,
 * including an anonymous guest one), so pass the auth client's current
 * bearer token; without it the server refuses with UNAUTHENTICATED.
 */
export async function generateDocumentPdf(
    endpoint: string,
    request: { templateKey: string; overrides: Record<string, unknown> },
    options: { authToken?: string } = {},
): Promise<GeneratedDocument> {
    const headers: Record<string, string> = { "content-type": "application/json" }
    if (options.authToken !== undefined) {
        headers.Authorization = `Bearer ${options.authToken}`
    }
    const response = await fetch(`${endpoint}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
    })
    if (!response.ok) {
        throw await documentsRequestError(response, "Generating the document failed")
    }
    return {
        fileName: fileNameFromContentDisposition(
            response.headers.get("content-disposition"),
            `${request.templateKey}.pdf`,
        ),
        blob: await response.blob(),
    }
}

/** Exported for tests. */
export function fileNameFromContentDisposition(header: string | null, fallback: string): string {
    if (header === null) {
        return fallback
    }
    const match = /filename="([^"]+)"/.exec(header)
    return match?.[1] ?? fallback
}

async function documentsRequestError(response: Response, prefix: string): Promise<DocumentsRequestError> {
    let code: string | undefined
    let message = `${prefix} with status ${response.status}.`
    try {
        const body = (await response.json()) as { error?: { code?: string; message?: string } }
        if (typeof body.error?.message === "string" && body.error.message !== "") {
            message = `${prefix}: ${body.error.message}`
        }
        if (typeof body.error?.code === "string" && body.error.code !== "") {
            code = body.error.code
        }
    } catch {
        // Non-JSON error body; keep the status line.
    }
    return new DocumentsRequestError(message, { status: response.status, code })
}
