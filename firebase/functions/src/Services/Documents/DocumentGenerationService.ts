import Mustache from "mustache"
import { Upload, UploadVisibility } from "../../Data/Storage/Upload.js"
import { storageService, WriteFileRequest } from "../Storage/StorageService.js"
import { validateDocumentOverrides } from "./DocumentOverrideValidation.js"
import { getDocumentTemplate } from "./DocumentTemplates.js"
import { DocumentPageSize, parsePageSize } from "./DocumentTemplateTypes.js"
import { getPdfRenderer, PdfRenderer } from "./PdfRenderClient.js"

export interface GenerateDocumentRequest {
    templateKey: string
    overrides: Record<string, unknown>
}

export interface GenerateDocumentResponse {
    /** A download-friendly name, e.g. "invoice-2026-07-24-a1b2c3.pdf". */
    fileName: string
    pdf: Buffer
}

export interface GenerateAndFileDocumentRequest extends GenerateDocumentRequest {
    idempotencyKey: string
    /** The owner the filed upload records; undefined for principals without a user row. */
    userId: string | undefined
    visibility: UploadVisibility
}

export interface GenerateAndFileDocumentResponse {
    fileName: string
    /** The READY storage record — indistinguishable from a browser-filed upload. */
    upload: Upload
}

/** The slice of the storage kernel generateAndFileDocument files through. */
export interface DocumentStorageWriter {
    writeFile(request: WriteFileRequest): Promise<Upload>
}

/**
 * The one document generation path: load the template, validate the
 * overrides against its schema, Mustache-render html and css, wrap the
 * result as a printable document, and render it to PDF bytes. Generation
 * itself stays stateless — the caller decides what to do with the bytes:
 * stream them back as a download (the kernel endpoint) or file them with
 * the storage kernel in the same call (generateAndFileDocument, the
 * server-side auto-file path for domain services).
 */
export class DocumentGenerationService {
    constructor(
        private readonly pdfRenderer: () => PdfRenderer = getPdfRenderer,
        private readonly storageWriter: () => DocumentStorageWriter = () => storageService,
    ) {}

    async generateDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
        const template = getDocumentTemplate(request.templateKey)
        const overrides = validateDocumentOverrides({
            schema: {
                name: template.name,
                pageSize: template.pageSize,
                fields: template.fields,
            },
            overrides: request.overrides,
        })
        const populatedHtml = Mustache.render(template.html, overrides)
        const populatedCss = Mustache.render(template.css, overrides)
        const documentHtml = buildPrintableHtmlDocument(populatedHtml, populatedCss, template.pageSize)
        const pdf = await this.pdfRenderer().renderHtmlToPdf({
            html: documentHtml,
            pageSize: template.pageSize,
        })
        return { fileName: buildDocumentFileName(request.templateKey), pdf }
    }

    /**
     * Generate + file in one call: the PDF lands in the storage kernel
     * through its server-side write path (same allowlist, cap, and READY
     * record as a browser upload) — domain services never drive the
     * createUpload/PUT/finalize round-trip for bytes they already hold.
     */
    async generateAndFileDocument(
        request: GenerateAndFileDocumentRequest,
    ): Promise<GenerateAndFileDocumentResponse> {
        const generated = await this.generateDocument(request)
        const upload = await this.storageWriter().writeFile({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            contentType: "application/pdf",
            bytesBase64: generated.pdf.toString("base64"),
            visibility: request.visibility,
            fileName: generated.fileName,
        })
        return { fileName: generated.fileName, upload }
    }
}

export const documentGenerationService = new DocumentGenerationService()

/**
 * Wraps rendered template output as a complete printable HTML document. Full
 * documents get the print styles injected into <head>; fragments are wrapped
 * in a minimal document with a sheet container. The @page size always
 * matches the size the renderer is asked for — DocKit, this code's ancestor,
 * hardcoded Letter here but rendered A4, which subtly cropped every page.
 */
export function buildPrintableHtmlDocument(html: string, css: string, pageSize: DocumentPageSize): string {
    const parsed = parsePageSize(pageSize)
    const printStyles = `${css}
@page {
  size: ${parsed.format}${parsed.landscape ? " landscape" : ""};
  margin: 0;
}
html, body {
  margin: 0;
  padding: 0;
}`
    const trimmed = html.trimStart()
    const isFullHtmlDocument =
        /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed) || /<body[\s>]/i.test(trimmed)
    if (isFullHtmlDocument) {
        if (trimmed.includes("</head>")) {
            return trimmed.replace("</head>", `<style>\n${printStyles}\n</style>\n</head>`)
        }
        if (/<head[\s>]/i.test(trimmed)) {
            return trimmed.replace(/<head[^>]*>/i, (match) => `${match}\n<style>\n${printStyles}\n</style>\n`)
        }
        return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>\n${printStyles}\n</style></head><body>${html}</body></html>`
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
${printStyles}
.doc-sheet {
  box-sizing: border-box;
  width: 100%;
  padding: 40px;
}
</style></head><body><div class="doc-sheet">${html}</div></body></html>`
}

function buildDocumentFileName(templateKey: string): string {
    const date = new Date().toISOString().slice(0, 10)
    const suffix = Math.random().toString(36).slice(2, 8)
    return `${templateKey}-${date}-${suffix}.pdf`
}
