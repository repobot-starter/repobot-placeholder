import { getOpenAiWrapper } from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { Upload } from "../../Data/Storage/Upload.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { AI_CHAT_MODEL } from "../Ai/AiChatService.js"
import { storageService } from "../Storage/StorageService.js"
import { intakeFixtureMarker, intakeFixtures } from "./DocumentIntakeFixtures.js"

export const PDF_CONTENT_TYPE = "application/pdf"

export interface ExtractedPdfPage {
    /** 1-based, matching what a reader sees. */
    pageNumber: number
    text: string
}

export interface ExtractedPdf {
    pageCount: number
    pages: ExtractedPdfPage[]
    /** All pages joined with blank lines — the AI-extraction input. */
    text: string
}

export interface ExtractUploadRequest {
    /**
     * The upload's owner (PRIVATE files are owner-checked by the storage
     * kernel). Services reading a file for someone else authorize that
     * relationship themselves and pass the owner's id.
     */
    userId: string | undefined
    uploadId: string
}

export interface ExtractStructuredRequest {
    /** The document text (extractPdfText's output, or any plain text). */
    text: string
    /**
     * What to pull out of the document, written for the model: the fields,
     * their meaning, and the exact JSON shape to return. The service
     * appends the strict-JSON framing; callers describe only the domain.
     */
    instructions: string
}

/** The slice of the storage kernel the intake service reads through. */
export interface IntakeStorageReader {
    readFileBytes(request: { userId: string | undefined; uploadId: string }): Promise<{
        upload: Upload
        bytes: Buffer
    }>
}

/**
 * Document intake: the kernel's path from an uploaded file to usable data.
 * Two layers, deliberately separate:
 *
 * - Text extraction (extractPdfText / extractUploadText) is real and
 *   deterministic in every mode — pdfjs parses the actual bytes, so
 *   sandbox demos read the actual documents they bundle.
 * - Structured extraction (extractStructured) needs a model. With
 *   AI_MODE=openai|gateway it runs one strict-JSON model turn over the
 *   text; with AI_MODE=local it resolves deterministically from the
 *   fixture registry (DocumentIntakeFixtures.ts) via the marker line a
 *   bundled sample document carries — same contract, zero credentials.
 *
 * The generation side of documents (HTML-to-PDF) lives in
 * Services/Documents/; this service only reads.
 */
export class DocumentIntakeService {
    constructor(private readonly storageReader: () => IntakeStorageReader = () => storageService) {}

    /** Parses PDF bytes into per-page text. Rejects non-PDF bytes. */
    async extractPdfText(bytes: Buffer): Promise<ExtractedPdf> {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
        const task = pdfjs.getDocument({
            data: new Uint8Array(bytes),
            // Server-side parsing: no eval, no font fetching, no chatter.
            isEvalSupported: false,
            useSystemFonts: true,
            verbosity: 0,
        })
        try {
            const document = await task.promise
            const pages: ExtractedPdfPage[] = []
            for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
                const page = await document.getPage(pageNumber)
                const content = await page.getTextContent()
                let text = ""
                for (const item of content.items) {
                    if (!("str" in item)) {
                        continue
                    }
                    text += item.str
                    text += item.hasEOL ? "\n" : " "
                }
                pages.push({ pageNumber, text: text.trim() })
            }
            return {
                pageCount: document.numPages,
                pages,
                text: pages.map((page) => page.text).join("\n\n"),
            }
        } catch (error) {
            if (error instanceof RpcError) {
                throw error
            }
            throw new RpcError(
                "INVALID_ARGUMENT",
                "These bytes could not be read as a PDF. Only PDF documents can be ingested.",
            )
        } finally {
            await task.destroy()
        }
    }

    /** Reads a READY upload through the storage kernel and extracts its text. */
    async extractUploadText(request: ExtractUploadRequest): Promise<ExtractedPdf> {
        const { upload, bytes } = await this.storageReader().readFileBytes(request)
        if (upload.contentType !== PDF_CONTENT_TYPE) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `Document intake reads PDFs; this upload is ${upload.contentType}.`,
            )
        }
        return await this.extractPdfText(bytes)
    }

    /**
     * Pulls structured JSON out of document text. Callers own the shape:
     * the instructions describe the fields and the JSON to return, and the
     * result comes back parsed but untyped — validate it with the domain's
     * own zod schema at the call site.
     */
    async extractStructured(request: ExtractStructuredRequest): Promise<unknown> {
        if (validatedEnv().AI_MODE === "local") {
            return this.fixtureExtraction(request.text)
        }

        let output = ""
        await getOpenAiWrapper().streamModelTurn(
            {
                model: AI_CHAT_MODEL,
                instructions:
                    `${request.instructions.trim()}\n\n` +
                    "Respond with ONLY the JSON value — no prose, no markdown fences. " +
                    "Use null for fields the document does not state; never invent values.",
                input: [{ role: "user", content: request.text }],
                tools: [],
                reasoningEffort: "low",
            },
            {
                onResponseCreated: () => {},
                onReasoningSummaryDelta: () => {},
                onReasoningSummaryDone: () => {},
                onAssistantTextDelta: (delta) => {
                    output += delta
                },
                onFunctionCallCreated: () => {},
            },
        )
        return parseModelJson(output)
    }

    private fixtureExtraction(text: string): unknown {
        const marker = intakeFixtureMarker.exec(text)
        const fixture = marker === null ? undefined : intakeFixtures[marker[1]]
        if (fixture === undefined) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "AI_MODE=local resolves structured extraction from bundled fixtures, and this " +
                    "document carries no known REPOBOT-INTAKE-FIXTURE marker. Use one of the " +
                    "app's sample documents, or deploy with AI connected to extract from " +
                    "arbitrary documents.",
            )
        }
        // A fresh copy per call: callers may mutate what they receive.
        return structuredClone(fixture)
    }
}

/** Parses the model's reply as JSON, tolerating stray markdown fences. */
function parseModelJson(output: string): unknown {
    const stripped = output
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
    try {
        return JSON.parse(stripped)
    } catch {
        throw new RpcError(
            "INTERNAL",
            "The model's extraction reply was not valid JSON. Retry the extraction.",
        )
    }
}

export const documentIntakeService = new DocumentIntakeService()
