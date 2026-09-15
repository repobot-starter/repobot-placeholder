import { deriveDocumentsEndpoint } from "@base/core"
import { AppShell, Button, Input, Label, TextArea } from "@ui"
import React, { useMemo, useState } from "react"
import { generateAuthenticatedDocumentPdf } from "../../Config/documentsAuth"
import {
    buildInvoiceOverrides,
    computeTotals,
    draftProblems,
    formatMoney,
    InvoiceDraft,
    InvoiceLineItemDraft,
    lineTotal,
    newLineItem,
    seedInvoiceDraft,
} from "./invoiceForm"
import * as styles from "./InvoicePage.styles.css"

interface DownloadEntry {
    fileName: string
    url: string
    atLabel: string
}

/** The studio is a single form — no in-app navigation to offer the shell. */
const NO_NAV_SECTIONS: never[] = []

/** The old wordmark's accent dot, worn as the shell brand mark. */
function StudioBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="4.75" fill="currentColor" />
        </svg>
    )
}

/**
 * The invoice pack's home surface: a thin binder that turns a form into
 * overrides for the documents kernel's invoice template and downloads the
 * generated PDF. Generation is stateless — the template lives in
 * firebase/functions/documents/templates/invoice/ and the PDF streams back
 * from documents__request__api. The chrome is the kernel AppShell in its
 * top-nav treatment (the studio is one surface; its old chrome was a lone
 * topbar), so the theme contract restyles the studio too. See
 * packs/invoice/PACK.md and docs/documents.md.
 */
export default function InvoicePage(): React.ReactElement {
    const [draft, setDraft] = useState<InvoiceDraft>(seedInvoiceDraft)
    const [generating, setGenerating] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [downloads, setDownloads] = useState<DownloadEntry[]>([])

    const totals = useMemo(() => computeTotals(draft), [draft])
    const problems = useMemo(() => draftProblems(draft), [draft])

    const setField = (field: keyof InvoiceDraft) => (value: string) =>
        setDraft((current) => ({ ...current, [field]: value }))

    const setLineItem = (id: string, patch: Partial<InvoiceLineItemDraft>) =>
        setDraft((current) => ({
            ...current,
            lineItems: current.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }))

    const generate = async (): Promise<void> => {
        setGenerating(true)
        setErrorMessage(undefined)
        try {
            const generated = await generateAuthenticatedDocumentPdf(
                deriveDocumentsEndpoint(import.meta.env.VITE_GRAPHQL_URL),
                { templateKey: "invoice", overrides: buildInvoiceOverrides(draft) },
            )
            const url = URL.createObjectURL(generated.blob)
            triggerDownload(url, generated.fileName)
            const atLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            setDownloads((current) => [{ fileName: generated.fileName, url, atLabel }, ...current])
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Generating the invoice failed.")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <AppShell
            title="Invoice Studio"
            brandIcon={<StudioBrandIcon />}
            sections={NO_NAV_SECTIONS}
            onItemSelect={() => undefined}
        >
            <div className={styles.page}>
                {/* The old topbar's tagline, now a page toolbar above the form. */}
                <div className={styles.toolbar}>
                    <span className={styles.tagline}>Fill the form, download the PDF.</span>
                </div>

                <div className={styles.layout}>
                    <div className={styles.form}>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Your business</h2>
                            <div className={styles.fieldGrid}>
                                <Field label="Business name">
                                    <Input
                                        value={draft.businessName}
                                        onChange={(event) => setField("businessName")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Billing email">
                                    <Input
                                        type="email"
                                        value={draft.businessEmail}
                                        onChange={(event) => setField("businessEmail")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Address" full>
                                    <Input
                                        value={draft.businessAddress}
                                        onChange={(event) => setField("businessAddress")(event.target.value)}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Bill to</h2>
                            <div className={styles.fieldGrid}>
                                <Field label="Client name">
                                    <Input
                                        value={draft.clientName}
                                        onChange={(event) => setField("clientName")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Client email">
                                    <Input
                                        type="email"
                                        value={draft.clientEmail}
                                        onChange={(event) => setField("clientEmail")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Address" full>
                                    <Input
                                        value={draft.clientAddress}
                                        onChange={(event) => setField("clientAddress")(event.target.value)}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Invoice details</h2>
                            <div className={styles.fieldGrid}>
                                <Field label="Invoice number">
                                    <Input
                                        value={draft.invoiceNumber}
                                        onChange={(event) => setField("invoiceNumber")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Tax rate (%)">
                                    <Input
                                        inputMode="decimal"
                                        value={draft.taxRatePercent}
                                        onChange={(event) => setField("taxRatePercent")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Issue date">
                                    <Input
                                        type="date"
                                        value={draft.issueDate}
                                        onChange={(event) => setField("issueDate")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Due date">
                                    <Input
                                        type="date"
                                        value={draft.dueDate}
                                        onChange={(event) => setField("dueDate")(event.target.value)}
                                    />
                                </Field>
                                <Field label="Notes" full>
                                    <TextArea
                                        rows={2}
                                        value={draft.notes}
                                        onChange={(event) => setField("notes")(event.target.value)}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Line items</h2>
                            <div className={styles.lineItemHeader}>
                                <span>Description</span>
                                <span>Qty</span>
                                <span>Unit price</span>
                                <span style={{ textAlign: "right" }}>Amount</span>
                                <span />
                            </div>
                            {draft.lineItems.map((item) => (
                                <div key={item.id} className={styles.lineItemRow}>
                                    <Input
                                        value={item.description}
                                        placeholder="What was the work?"
                                        onChange={(event) =>
                                            setLineItem(item.id, { description: event.target.value })
                                        }
                                    />
                                    <Input
                                        inputMode="decimal"
                                        value={item.quantity}
                                        onChange={(event) =>
                                            setLineItem(item.id, { quantity: event.target.value })
                                        }
                                    />
                                    <Input
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={item.unitPrice}
                                        onChange={(event) =>
                                            setLineItem(item.id, { unitPrice: event.target.value })
                                        }
                                    />
                                    <span className={styles.lineItemTotal}>
                                        {formatMoney(lineTotal(item))}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        aria-label="Remove line item"
                                        onClick={() =>
                                            setDraft((current) => ({
                                                ...current,
                                                lineItems: current.lineItems.filter(
                                                    (candidate) => candidate.id !== item.id,
                                                ),
                                            }))
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div className={styles.addLineButton}>
                                <Button
                                    variant="secondary"
                                    onClick={() =>
                                        setDraft((current) => ({
                                            ...current,
                                            lineItems: [...current.lineItems, newLineItem()],
                                        }))
                                    }
                                >
                                    Add line item
                                </Button>
                            </div>
                        </section>
                    </div>

                    <aside className={styles.sidebar}>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Summary</h2>
                            <div className={styles.totalsRow}>
                                <span>Subtotal</span>
                                <span>{formatMoney(totals.subtotal)}</span>
                            </div>
                            <div className={styles.totalsRow}>
                                <span>Tax</span>
                                <span>{formatMoney(totals.tax)}</span>
                            </div>
                            <div className={styles.grandTotalRow}>
                                <span>Total due</span>
                                <span>{formatMoney(totals.total)}</span>
                            </div>
                            <div className={styles.generateButton}>
                                <Button
                                    onClick={() => void generate()}
                                    disabled={generating || problems.length > 0}
                                >
                                    {generating ? "Generating…" : "Generate PDF"}
                                </Button>
                            </div>
                            {problems.length > 0 && (
                                <ul className={styles.problemList}>
                                    {problems.map((problem) => (
                                        <li key={problem}>{problem}</li>
                                    ))}
                                </ul>
                            )}
                            {errorMessage !== undefined && <p className={styles.errorText}>{errorMessage}</p>}
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Downloads</h2>
                            {downloads.length === 0 ? (
                                <p className={styles.emptyDownloads}>
                                    Generated invoices appear here for re-download.
                                </p>
                            ) : (
                                <ul className={styles.downloadsList}>
                                    {downloads.map((download) => (
                                        <li key={download.url}>
                                            <a
                                                className={styles.downloadLink}
                                                href={download.url}
                                                download={download.fileName}
                                            >
                                                <span>{download.fileName}</span>
                                                <span className={styles.downloadTime}>
                                                    {download.atLabel}
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </AppShell>
    )
}

function Field(props: { label: string; full?: boolean; children: React.ReactNode }): React.ReactElement {
    return (
        <div className={`${styles.field} ${props.full === true ? styles.fieldFull : ""}`}>
            <Label>{props.label}</Label>
            {props.children}
        </div>
    )
}

function triggerDownload(url: string, fileName: string): void {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
}
