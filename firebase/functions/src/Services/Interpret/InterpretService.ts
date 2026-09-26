import { z } from "zod"
import { validatedEnv } from "../../Utils/Env.js"
import { documentIntakeService, ExtractedPdf } from "../DocumentIntake/DocumentIntakeService.js"

/**
 * The interpret pack's domain: one stateless reading of an uploaded PDF.
 * Text extraction is the document-intake kernel's real pdfjs parse in every
 * mode. The interpretation layer has two modes, mirroring the intake
 * service's own split:
 *
 * - AI_MODE=openai|gateway: one strict-JSON model turn over the extracted
 *   text (documentIntakeService.extractStructured), validated here.
 * - AI_MODE=local (the sandbox): a deterministic heuristic reading of the
 *   extracted text — title from the first line, summary from the leading
 *   sentences, key points from the strongest lines, fields from recognizable
 *   patterns (dates, amounts, emails, references). Any PDF works with zero
 *   credentials, which is the pack's demo story (packs/interpret/PACK.md).
 */

export interface InterpretedField {
    label: string
    value: string
}

export interface DocumentInterpretation {
    documentType: string
    /** Absent (not null) when the document states no title — the GraphQL layer's nullable shape. */
    title?: string
    summary: string
    keyPoints: string[]
    fields: InterpretedField[]
    pageCount: number
}

export interface InterpretDocumentRequest {
    /** The upload's owner (uploads are PRIVATE; the storage kernel owner-checks). */
    userId: string
    uploadId: string
}

const interpretationSchema = z.object({
    documentType: z.string().min(1),
    // The model is told to send null for an untitled document; GraphQL
    // nullable fields are `undefined` here, so normalize on the way in.
    title: z
        .string()
        .nullish()
        .transform((value) => value ?? undefined),
    summary: z.string().min(1),
    keyPoints: z.array(z.string().min(1)).max(8),
    fields: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).max(12),
})

const MODEL_INSTRUCTIONS = `You are reading one document for a person who has not opened it.
Return a JSON object with exactly these fields:
- "documentType": what kind of document this is, in 2-4 plain words (e.g. "Commercial invoice", "Employment contract", "Research paper").
- "title": the document's own title when it states one, else null.
- "summary": 2-4 plain-language sentences a non-expert understands.
- "keyPoints": up to 6 short strings — the points a careful reader would flag.
- "fields": up to 10 {"label", "value"} pairs for the concrete facts worth extracting: parties, dates, amounts, reference numbers, contact details. Values exactly as the document states them.`

export class InterpretService {
    async interpretDocument(request: InterpretDocumentRequest): Promise<DocumentInterpretation> {
        const extracted = await documentIntakeService.extractUploadText({
            userId: request.userId,
            uploadId: request.uploadId,
        })
        if (validatedEnv().AI_MODE === "local") {
            return { ...heuristicInterpretation(extracted), pageCount: extracted.pageCount }
        }
        const raw = await documentIntakeService.extractStructured({
            text: extracted.text,
            instructions: MODEL_INSTRUCTIONS,
        })
        const parsed = interpretationSchema.parse(raw)
        return { ...parsed, pageCount: extracted.pageCount }
    }
}

//
// The sandbox reading: deterministic, honest about being mechanical (the
// PACK.md says so), and useful enough to demo the product on any PDF.
//

const TYPE_HINTS: [RegExp, string][] = [
    [/letter of credit|documentary credit|MT700/i, "Letter of credit"],
    [/\binvoice\b/i, "Invoice"],
    [/bill of lading/i, "Bill of lading"],
    [/packing list/i, "Packing list"],
    [/\bagreement\b|\bcontract\b/i, "Contract or agreement"],
    [/\brésumé\b|\bresume\b|\bcurriculum vitae\b/i, "Résumé"],
    [/\breceipt\b/i, "Receipt"],
    [/\breport\b/i, "Report"],
    [/\bstatement\b/i, "Statement"],
    [/\bpolicy\b/i, "Policy document"],
    [/\bproposal\b/i, "Proposal"],
]

const FIELD_PATTERNS: [string, RegExp][] = [
    ["Email", /[\w.+-]+@[\w-]+\.[\w.]+/],
    ["Date", /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/],
    ["Amount", /(?:USD|EUR|GBP|\$|€|£)\s?\d[\d,]*(?:\.\d{2})?/],
    ["Reference", /\b(?:no\.?|number|ref\.?|#)\s*[:#]?\s*([A-Z0-9][A-Z0-9/-]{3,})\b/i],
    ["Phone", /\+?\d[\d\s().-]{8,}\d/],
]

export function heuristicInterpretation(extracted: ExtractedPdf): Omit<DocumentInterpretation, "pageCount"> {
    const lines = extracted.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")

    const titleLine = lines.find((line) => line.length >= 4 && line.length <= 90)
    const documentType = TYPE_HINTS.find(([pattern]) => pattern.test(extracted.text))?.[1] ?? "Document"

    const sentences = extracted.text
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 30 && sentence.length <= 240)
    const summaryBody = sentences.slice(0, 2).join(" ")
    const summary =
        `This looks like a ${documentType.toLowerCase()} of ${extracted.pageCount} ` +
        `page${extracted.pageCount === 1 ? "" : "s"}.` +
        (summaryBody !== "" ? ` It opens: ${summaryBody}` : "")

    // The strongest lines: substantial, not the title, preferring ones that
    // carry a number or a date (facts over prose).
    const keyPoints = lines
        .filter((line) => line !== titleLine && line.length >= 20 && line.length <= 160)
        .sort((a, b) => Number(/\d/.test(b)) - Number(/\d/.test(a)))
        .slice(0, 5)

    const fields: InterpretedField[] = []
    for (const [label, pattern] of FIELD_PATTERNS) {
        const match = pattern.exec(extracted.text)
        if (match !== null) {
            fields.push({ label, value: (match[1] ?? match[0]).trim() })
        }
    }

    return {
        documentType,
        title: titleLine,
        summary,
        keyPoints,
        fields,
    }
}

export const interpretService = new InterpretService()
