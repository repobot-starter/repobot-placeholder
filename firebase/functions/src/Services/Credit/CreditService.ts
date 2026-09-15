import { and, asc, desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
    allCreditDocumentKinds,
    CreditDocument,
    creditDocumentInsertSchema,
    creditDocumentsTable,
    CreditDocumentKind,
} from "../../Data/Credit/CreditDocument.js"
import {
    allShipmentTerms,
    CreditLc,
    creditLcInsertSchema,
    creditLcsTable,
} from "../../Data/Credit/CreditLc.js"
import { creditDb } from "../../Data/CreditDatabase.js"
import { idempotentInsertAndGet } from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"
import { documentIntakeService } from "../DocumentIntake/index.js"

/**
 * The letter-of-credit domain: drop an LC PDF and get the SWIFT MT700-family
 * breakdown; drop supporting documents against it and get a discrepancy
 * report. Ingestion rides the document-intake kernel (real text extraction
 * everywhere; structured extraction from the model on AI deploys, from the
 * bundled-fixture registry in the sandbox). The discrepancy engine is
 * deliberately deterministic — dates, amounts, currencies, ports, tolerance —
 * so the same documents always produce the same report in every mode.
 */
class CreditService {
    /** Ingests a dropped LC PDF: extract, validate, persist the breakdown. */
    async ingestLc(request: IngestLcRequest): Promise<CreditLc> {
        const extracted = await documentIntakeService.extractUploadText({
            userId: request.userId,
            uploadId: request.uploadId,
        })
        const structured = await documentIntakeService.extractStructured({
            text: extracted.text,
            instructions: LC_EXTRACTION_INSTRUCTIONS,
        })
        const parsed = lcExtractionSchema.safeParse(structured)
        if (!parsed.success) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "This document does not read as a letter of credit. Drop the LC itself " +
                    "(the MT700 advice or the bank's PDF), not a supporting document.",
            )
        }
        const lc = parsed.data

        const newLc = creditLcInsertSchema.parse({
            userId: request.userId,
            uploadId: request.uploadId,
            reference: lc.reference,
            issuingBank: lc.issuingBank ?? null,
            applicant: lc.applicant ?? null,
            beneficiary: lc.beneficiary ?? null,
            currency: lc.currency.toLowerCase(),
            amountMinorUnits: toMinorUnits(lc.amount),
            tolerancePercent: lc.tolerancePercent ?? 0,
            issueDate: lc.issueDate ?? null,
            expiryDate: lc.expiryDate,
            latestShipmentDate: lc.latestShipmentDate ?? null,
            presentationPeriodDays: lc.presentationPeriodDays ?? null,
            portOfLoading: lc.portOfLoading ?? null,
            portOfDischarge: lc.portOfDischarge ?? null,
            partialShipments: lc.partialShipments ?? "NOT_STATED",
            transhipment: lc.transhipment ?? "NOT_STATED",
            goodsDescription: lc.goodsDescription,
            documentsRequired: lc.documentsRequired.join("\n"),
        })
        return await idempotentInsertAndGet(creditDb, creditLcsTable, newLc, request.idempotencyKey)
    }

    /** The caller's letters of credit, newest first. */
    async listLcs(userId: string): Promise<CreditLc[]> {
        return await creditDb
            .select()
            .from(creditLcsTable)
            .where(eq(creditLcsTable.userId, userId))
            .orderBy(desc(creditLcsTable.rowCreatedAt))
    }

    /** One LC, owner-checked. */
    async getLc(request: { userId: string; lcId: string }): Promise<CreditLc> {
        const [lc] = await creditDb
            .select()
            .from(creditLcsTable)
            .where(eq(creditLcsTable.id, request.lcId))
            .limit(1)
        if (lc === undefined || lc.userId !== request.userId) {
            throw new RpcError("NOT_FOUND", "There is no such letter of credit.")
        }
        return lc
    }

    /** Deletes an LC and its attached documents (owner-checked). */
    async deleteLc(request: { userId: string; lcId: string }): Promise<void> {
        const lc = await this.getLc(request)
        await creditDb.delete(creditDocumentsTable).where(eq(creditDocumentsTable.lcId, lc.id))
        await creditDb.delete(creditLcsTable).where(eq(creditLcsTable.id, lc.id))
    }

    /** Ingests a supporting document dropped against an LC. */
    async attachDocument(request: AttachDocumentRequest): Promise<CreditDocument> {
        const lc = await this.getLc({ userId: request.userId, lcId: request.lcId })
        const extracted = await documentIntakeService.extractUploadText({
            userId: request.userId,
            uploadId: request.uploadId,
        })
        const structured = await documentIntakeService.extractStructured({
            text: extracted.text,
            instructions: DOCUMENT_EXTRACTION_INSTRUCTIONS,
        })
        const parsed = documentExtractionSchema.safeParse(structured)
        if (!parsed.success) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "This document could not be read as a supporting trade document " +
                    "(commercial invoice, bill of lading, or packing list).",
            )
        }
        const doc = parsed.data

        const newDocument = creditDocumentInsertSchema.parse({
            lcId: lc.id,
            userId: request.userId,
            uploadId: request.uploadId,
            kind: documentKindFromExtraction(doc.documentKind),
            fileName: request.fileName ?? null,
            reference: doc.reference ?? null,
            currency: doc.currency?.toLowerCase() ?? null,
            amountMinorUnits:
                doc.amount === undefined || doc.amount === null ? null : toMinorUnits(doc.amount),
            shipmentDate: doc.shipmentDate ?? null,
            portOfLoading: doc.portOfLoading ?? null,
            portOfDischarge: doc.portOfDischarge ?? null,
            goodsDescription: doc.goodsDescription ?? null,
        })
        return await idempotentInsertAndGet(
            creditDb,
            creditDocumentsTable,
            newDocument,
            request.idempotencyKey,
        )
    }

    /** The documents attached to an LC, oldest first (owner-checked). */
    async listDocuments(request: { userId: string; lcId: string }): Promise<CreditDocument[]> {
        await this.getLc(request)
        return await creditDb
            .select()
            .from(creditDocumentsTable)
            .where(
                and(
                    eq(creditDocumentsTable.lcId, request.lcId),
                    eq(creditDocumentsTable.userId, request.userId),
                ),
            )
            .orderBy(asc(creditDocumentsTable.rowCreatedAt))
    }

    /** Removes one attached document (owner-checked via the LC). */
    async removeDocument(request: { userId: string; documentId: string }): Promise<void> {
        const [document] = await creditDb
            .select()
            .from(creditDocumentsTable)
            .where(eq(creditDocumentsTable.id, request.documentId))
            .limit(1)
        if (document === undefined || document.userId !== request.userId) {
            throw new RpcError("NOT_FOUND", "There is no such document.")
        }
        await creditDb.delete(creditDocumentsTable).where(eq(creditDocumentsTable.id, document.id))
    }

    /**
     * The discrepancy report: every check the credit desk would run, as
     * findings ordered worst-first. Deterministic by design — the same LC
     * and documents produce the same report in every AI_MODE.
     */
    async checkDiscrepancies(request: { userId: string; lcId: string }): Promise<CreditFinding[]> {
        const lc = await this.getLc(request)
        const documents = await this.listDocuments(request)
        return computeFindings(lc, documents, todayIso())
    }
}

export const creditService = new CreditService()

export interface IngestLcRequest {
    idempotencyKey: string
    userId: string
    uploadId: string
}

export interface AttachDocumentRequest {
    idempotencyKey: string
    userId: string
    lcId: string
    uploadId: string
    fileName?: string
}

export type CreditFindingSeverity = "OK" | "WARNING" | "DISCREPANCY"

export interface CreditFinding {
    /** Stable machine code, e.g. "AMOUNT_OVER_TOLERANCE". */
    code: string
    severity: CreditFindingSeverity
    title: string
    detail: string
    /** The document the finding is about; undefined for LC-level checks. */
    documentId?: string
}

/**
 * The discrepancy engine proper, pure and exported for tests: LC +
 * documents + "today" in, findings out (worst first).
 */
export function computeFindings(lc: CreditLc, documents: CreditDocument[], today: string): CreditFinding[] {
    const findings: CreditFinding[] = []

    // LC-level clocks.
    if (lc.expiryDate < today) {
        findings.push({
            code: "LC_EXPIRED",
            severity: "DISCREPANCY",
            title: "Letter of credit expired",
            detail: `The credit expired ${lc.expiryDate}; documents can no longer be presented against it.`,
        })
    } else if (daysBetween(today, lc.expiryDate) <= 14) {
        findings.push({
            code: "LC_EXPIRING_SOON",
            severity: "WARNING",
            title: "Letter of credit expiring soon",
            detail: `The credit expires ${lc.expiryDate} — ${daysBetween(today, lc.expiryDate)} day(s) from now.`,
        })
    } else {
        findings.push({
            code: "LC_IN_FORCE",
            severity: "OK",
            title: "Letter of credit in force",
            detail: `The credit is valid until ${lc.expiryDate}.`,
        })
    }

    const billsOfLading = documents.filter((document) => document.kind === "BILL_OF_LADING")
    if (lc.latestShipmentDate !== null && billsOfLading.length === 0) {
        if (lc.latestShipmentDate < today) {
            findings.push({
                code: "SHIPMENT_WINDOW_PASSED",
                severity: "DISCREPANCY",
                title: "Latest shipment date passed without a bill of lading",
                detail: `Shipment was due by ${lc.latestShipmentDate} and no bill of lading is attached.`,
            })
        } else {
            findings.push({
                code: "SHIPMENT_WINDOW_OPEN",
                severity: "OK",
                title: "Shipment window open",
                detail: `${daysBetween(today, lc.latestShipmentDate)} day(s) remain to ship (latest ${lc.latestShipmentDate}).`,
            })
        }
    }

    for (const document of documents) {
        findings.push(...documentFindings(lc, document, today))
    }

    const rank: Record<CreditFindingSeverity, number> = { DISCREPANCY: 0, WARNING: 1, OK: 2 }
    return findings.sort((a, b) => rank[a.severity] - rank[b.severity])
}

function documentFindings(lc: CreditLc, document: CreditDocument, today: string): CreditFinding[] {
    const findings: CreditFinding[] = []
    const label = documentLabel(document)

    if (document.currency !== null && document.currency !== lc.currency) {
        findings.push({
            code: "CURRENCY_MISMATCH",
            severity: "DISCREPANCY",
            title: `${label}: currency differs from the credit`,
            detail: `The document is in ${document.currency.toUpperCase()}; the credit is in ${lc.currency.toUpperCase()}.`,
            documentId: document.id,
        })
    }

    if (document.amountMinorUnits !== null && document.currency === lc.currency) {
        const ceiling = Math.round(lc.amountMinorUnits * (1 + lc.tolerancePercent / 100))
        if (document.amountMinorUnits > ceiling) {
            findings.push({
                code: "AMOUNT_OVER_TOLERANCE",
                severity: "DISCREPANCY",
                title: `${label}: amount exceeds the credit`,
                detail:
                    `${formatAmount(document.amountMinorUnits, lc.currency)} drawn against ` +
                    `${formatAmount(lc.amountMinorUnits, lc.currency)}` +
                    (lc.tolerancePercent > 0
                        ? ` (+${lc.tolerancePercent}% tolerance = ${formatAmount(ceiling, lc.currency)})`
                        : "") +
                    `.`,
                documentId: document.id,
            })
        } else if (document.amountMinorUnits > lc.amountMinorUnits) {
            findings.push({
                code: "AMOUNT_WITHIN_TOLERANCE",
                severity: "WARNING",
                title: `${label}: amount above face value, within tolerance`,
                detail:
                    `${formatAmount(document.amountMinorUnits, lc.currency)} exceeds the face value ` +
                    `${formatAmount(lc.amountMinorUnits, lc.currency)} but stays inside the ` +
                    `+${lc.tolerancePercent}% tolerance.`,
                documentId: document.id,
            })
        } else {
            findings.push({
                code: "AMOUNT_OK",
                severity: "OK",
                title: `${label}: amount within the credit`,
                detail: `${formatAmount(document.amountMinorUnits, lc.currency)} against ${formatAmount(lc.amountMinorUnits, lc.currency)}.`,
                documentId: document.id,
            })
        }
    }

    if (document.kind === "BILL_OF_LADING" && document.shipmentDate !== null) {
        if (lc.latestShipmentDate !== null) {
            if (document.shipmentDate > lc.latestShipmentDate) {
                findings.push({
                    code: "LATE_SHIPMENT",
                    severity: "DISCREPANCY",
                    title: `${label}: shipped after the latest shipment date`,
                    detail: `On board ${document.shipmentDate}; the credit requires shipment by ${lc.latestShipmentDate}.`,
                    documentId: document.id,
                })
            } else {
                findings.push({
                    code: "SHIPMENT_ON_TIME",
                    severity: "OK",
                    title: `${label}: shipped inside the window`,
                    detail: `On board ${document.shipmentDate}, within the ${lc.latestShipmentDate} deadline.`,
                    documentId: document.id,
                })
            }
        }
        if (lc.presentationPeriodDays !== null) {
            const deadline = minIso(addDays(document.shipmentDate, lc.presentationPeriodDays), lc.expiryDate)
            if (deadline < today) {
                findings.push({
                    code: "PRESENTATION_WINDOW_CLOSED",
                    severity: "DISCREPANCY",
                    title: "Presentation window closed",
                    detail: `Documents had to be presented by ${deadline} (${lc.presentationPeriodDays} days from shipment, capped by expiry).`,
                    documentId: document.id,
                })
            } else {
                findings.push({
                    code: "PRESENTATION_WINDOW_OPEN",
                    severity: "OK",
                    title: "Presentation window open",
                    detail: `${daysBetween(today, deadline)} day(s) remain to present documents (deadline ${deadline}).`,
                    documentId: document.id,
                })
            }
        }
    }

    for (const [side, lcPort, documentPort] of [
        ["loading", lc.portOfLoading, document.portOfLoading],
        ["discharge", lc.portOfDischarge, document.portOfDischarge],
    ] as const) {
        if (lcPort === null || documentPort === null) {
            continue
        }
        if (normalize(lcPort) !== normalize(documentPort)) {
            findings.push({
                code: side === "loading" ? "PORT_OF_LOADING_MISMATCH" : "PORT_OF_DISCHARGE_MISMATCH",
                severity: "DISCREPANCY",
                title: `${label}: port of ${side} differs from the credit`,
                detail: `The document states ${documentPort}; the credit requires ${lcPort}.`,
                documentId: document.id,
            })
        }
    }

    if (document.goodsDescription !== null) {
        const overlap = tokenOverlap(lc.goodsDescription, document.goodsDescription)
        if (overlap < 0.5) {
            findings.push({
                code: "GOODS_DESCRIPTION_DIFFERS",
                severity: "WARNING",
                title: `${label}: goods description differs from the credit`,
                detail:
                    `"${document.goodsDescription}" reads differently from the credit's ` +
                    `"${lc.goodsDescription}" — verify the descriptions correspond.`,
                documentId: document.id,
            })
        }
    }

    return findings
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** What the model (or a fixture) must return for a dropped LC. */
const lcExtractionSchema = z.object({
    documentKind: z.literal("LETTER_OF_CREDIT"),
    reference: z.string().min(1),
    issuingBank: z.string().nullish(),
    applicant: z.string().nullish(),
    beneficiary: z.string().nullish(),
    currency: z.string().length(3),
    amount: z.number().positive(),
    tolerancePercent: z.number().int().min(0).max(100).nullish(),
    issueDate: isoDate.nullish(),
    expiryDate: isoDate,
    latestShipmentDate: isoDate.nullish(),
    presentationPeriodDays: z.number().int().positive().nullish(),
    portOfLoading: z.string().nullish(),
    portOfDischarge: z.string().nullish(),
    partialShipments: z.enum(allShipmentTerms).nullish(),
    transhipment: z.enum(allShipmentTerms).nullish(),
    goodsDescription: z.string().min(1),
    documentsRequired: z.array(z.string()),
})

/** What the model (or a fixture) must return for a supporting document. */
const documentExtractionSchema = z.object({
    documentKind: z.string(),
    reference: z.string().nullish(),
    currency: z.string().length(3).nullish(),
    amount: z.number().positive().nullish(),
    shipmentDate: isoDate.nullish(),
    portOfLoading: z.string().nullish(),
    portOfDischarge: z.string().nullish(),
    goodsDescription: z.string().nullish(),
})

const LC_EXTRACTION_INSTRUCTIONS = `You are reading a letter of credit (SWIFT MT700 family or a bank's PDF advice).
Extract exactly this JSON shape:
{
  "documentKind": "LETTER_OF_CREDIT",
  "reference": string,              // field 20, the documentary credit number
  "issuingBank": string | null,
  "applicant": string | null,       // field 50
  "beneficiary": string | null,     // field 59
  "currency": string,               // ISO 4217 from field 32B
  "amount": number,                 // field 32B, major units
  "tolerancePercent": number | null, // field 39A plus-side tolerance
  "issueDate": "yyyy-mm-dd" | null,  // field 31C
  "expiryDate": "yyyy-mm-dd",        // field 31D
  "latestShipmentDate": "yyyy-mm-dd" | null, // field 44C
  "presentationPeriodDays": number | null,   // field 48
  "portOfLoading": string | null,    // field 44E
  "portOfDischarge": string | null,  // field 44F
  "partialShipments": "ALLOWED" | "NOT_ALLOWED" | "NOT_STATED", // field 43P
  "transhipment": "ALLOWED" | "NOT_ALLOWED" | "NOT_STATED",     // field 43T
  "goodsDescription": string,        // field 45A
  "documentsRequired": string[]      // field 46A, one entry per required document
}`

const DOCUMENT_EXTRACTION_INSTRUCTIONS = `You are reading a trade document presented under a letter of credit
(commercial invoice, ocean bill of lading, or packing list). Extract exactly this JSON shape:
{
  "documentKind": "COMMERCIAL_INVOICE" | "BILL_OF_LADING" | "PACKING_LIST" | "OTHER",
  "reference": string | null,        // invoice number, B/L number, or list number
  "currency": string | null,         // ISO 4217, invoices only
  "amount": number | null,           // total amount in major units, invoices only
  "shipmentDate": "yyyy-mm-dd" | null, // shipped-on-board date, bills of lading only
  "portOfLoading": string | null,
  "portOfDischarge": string | null,
  "goodsDescription": string | null
}`

function documentKindFromExtraction(documentKind: string): CreditDocumentKind {
    return (allCreditDocumentKinds as readonly string[]).includes(documentKind)
        ? (documentKind as CreditDocumentKind)
        : "OTHER"
}

function documentLabel(document: CreditDocument): string {
    const labels: Record<CreditDocumentKind, string> = {
        COMMERCIAL_INVOICE: "Commercial invoice",
        BILL_OF_LADING: "Bill of lading",
        PACKING_LIST: "Packing list",
        OTHER: "Document",
    }
    const base = labels[document.kind]
    return document.reference === null ? base : `${base} ${document.reference}`
}

function toMinorUnits(amountMajorUnits: number): number {
    return Math.round(amountMajorUnits * 100)
}

function formatAmount(minorUnits: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(minorUnits / 100)
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
    const date = new Date(`${iso}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

function daysBetween(fromIso: string, toIso: string): number {
    const from = Date.UTC(
        Number(fromIso.slice(0, 4)),
        Number(fromIso.slice(5, 7)) - 1,
        Number(fromIso.slice(8, 10)),
    )
    const to = Date.UTC(Number(toIso.slice(0, 4)), Number(toIso.slice(5, 7)) - 1, Number(toIso.slice(8, 10)))
    return Math.round((to - from) / (24 * 60 * 60 * 1000))
}

function minIso(a: string, b: string): string {
    return a < b ? a : b
}

function normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Share of the LC description's meaningful tokens the document repeats. */
function tokenOverlap(lcDescription: string, documentDescription: string): number {
    const tokens = (value: string): Set<string> =>
        new Set(
            value
                .toLowerCase()
                .replace(/[^a-z0-9% ]/g, " ")
                .split(/\s+/)
                .filter((token) => token.length > 2),
        )
    const lcTokens = tokens(lcDescription)
    if (lcTokens.size === 0) {
        return 1
    }
    const documentTokens = tokens(documentDescription)
    let shared = 0
    for (const token of lcTokens) {
        if (documentTokens.has(token)) {
            shared += 1
        }
    }
    return shared / lcTokens.size
}
