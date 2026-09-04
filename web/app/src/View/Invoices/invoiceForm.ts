/**
 * Form state and money math for the invoice pack. The documents kernel
 * template (firebase/functions/documents/templates/invoice/) takes
 * preformatted money strings, so all currency math and formatting happens
 * here in the binder, never in the template.
 */

import { formatCurrencyMinorUnits } from "@ui"

export interface InvoiceLineItemDraft {
    id: string
    description: string
    quantity: string
    unitPrice: string
}

export interface InvoiceDraft {
    businessName: string
    businessEmail: string
    businessAddress: string
    clientName: string
    clientEmail: string
    clientAddress: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    taxRatePercent: string
    notes: string
    lineItems: InvoiceLineItemDraft[]
}

let nextLineItemId = 1

export function newLineItem(): InvoiceLineItemDraft {
    return { id: `line-${nextLineItemId++}`, description: "", quantity: "1", unitPrice: "" }
}

/** Seed content so the first render already looks like a real invoice. */
export function seedInvoiceDraft(): InvoiceDraft {
    const today = new Date()
    const due = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return {
        businessName: "Northwind Studio",
        businessEmail: "billing@northwind.example",
        businessAddress: "410 Harbor Lane, Suite 220, Portland, OR 97209",
        clientName: "Acme Corporation",
        clientEmail: "accounts@acme.example",
        clientAddress: "1 Coyote Plaza, Albuquerque, NM 87102",
        invoiceNumber: `INV-${today.getFullYear()}-0001`,
        issueDate: isoDate(today),
        dueDate: isoDate(due),
        taxRatePercent: "0",
        notes: "Payment is due within 30 days. Please reference the invoice number on your transfer.",
        lineItems: [{ ...newLineItem(), description: "Design services", quantity: "1", unitPrice: "1200" }],
    }
}

export interface InvoiceTotals {
    subtotal: number
    tax: number
    total: number
}

export function computeTotals(draft: InvoiceDraft): InvoiceTotals {
    const subtotal = draft.lineItems.reduce((sum, item) => sum + lineTotal(item), 0)
    const taxRate = parseNumber(draft.taxRatePercent) / 100
    const tax = roundMoney(subtotal * Math.max(taxRate, 0))
    return { subtotal: roundMoney(subtotal), tax, total: roundMoney(subtotal + tax) }
}

export function lineTotal(item: InvoiceLineItemDraft): number {
    return roundMoney(Math.max(parseNumber(item.quantity), 0) * Math.max(parseNumber(item.unitPrice), 0))
}

/** Major-unit USD amounts ("$24.00") via the design system's shared formatter. */
export function formatMoney(amount: number): string {
    return formatCurrencyMinorUnits(Math.round(amount * 100), "usd")
}

/**
 * The overrides payload for the documents kernel's invoice template: every
 * money value preformatted, empty optionals omitted so the template's
 * Mustache sections skip their rows.
 */
export function buildInvoiceOverrides(draft: InvoiceDraft): Record<string, unknown> {
    const totals = computeTotals(draft)
    const overrides: Record<string, unknown> = {
        businessName: draft.businessName.trim(),
        clientName: draft.clientName.trim(),
        invoiceNumber: draft.invoiceNumber.trim(),
        issueDate: draft.issueDate,
        lineItems: draft.lineItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity.trim() === "" ? "0" : item.quantity.trim(),
            unitPrice: formatMoney(parseNumber(item.unitPrice)),
            lineTotal: formatMoney(lineTotal(item)),
        })),
        subtotal: formatMoney(totals.subtotal),
        total: formatMoney(totals.total),
    }
    setOptional(overrides, "businessEmail", draft.businessEmail)
    setOptional(overrides, "businessAddress", draft.businessAddress)
    setOptional(overrides, "clientEmail", draft.clientEmail)
    setOptional(overrides, "clientAddress", draft.clientAddress)
    setOptional(overrides, "dueDate", draft.dueDate)
    setOptional(overrides, "notes", draft.notes)
    if (totals.tax > 0) {
        overrides.tax = formatMoney(totals.tax)
    }
    return overrides
}

/** The fields the schema requires before generate can succeed. */
export function draftProblems(draft: InvoiceDraft): string[] {
    const problems: string[] = []
    if (draft.businessName.trim() === "") {
        problems.push("Add your business name.")
    }
    if (draft.clientName.trim() === "") {
        problems.push("Add the client's name.")
    }
    if (draft.invoiceNumber.trim() === "") {
        problems.push("Add an invoice number.")
    }
    if (draft.issueDate === "") {
        problems.push("Pick an issue date.")
    }
    if (draft.lineItems.length === 0 || draft.lineItems.every((item) => item.description.trim() === "")) {
        problems.push("Add at least one line item with a description.")
    }
    return problems
}

function setOptional(target: Record<string, unknown>, key: string, value: string): void {
    if (value.trim() !== "") {
        target[key] = value.trim()
    }
}

function parseNumber(value: string): number {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""))
    return Number.isFinite(parsed) ? parsed : 0
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100
}

function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10)
}
