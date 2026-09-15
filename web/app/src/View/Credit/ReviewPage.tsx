import { Badge, Button, EmptyState, Spinner, useToast } from "@ui"
import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    useCreditAttachDocumentMutation,
    useCreditDeleteLcMutation,
    useCreditLcQuery,
    useCreditLcsQuery,
    useCreditRemoveDocumentMutation,
} from "../../generated/graphql/types"
import {
    CreditDocumentNode,
    CreditFindingNode,
    creditPaths,
    daysUntil,
    describeDaysUntil,
    documentKindLabels,
    formatCreditDate,
    formatCreditMoney,
    severityBadgeTones,
    severityLabels,
    shipmentTermLabels,
} from "./creditShared"
import * as shared from "./creditStyles.css"
import { PdfDropZone } from "./PdfDropZone"
import * as styles from "./ReviewPage.styles.css"

/**
 * The review surface for one letter of credit (manifest destination
 * `/review?lc=<id>`, packs/credit): the full MT700 breakdown, a drop zone for
 * supporting documents, what each document was read as, and the discrepancy
 * report — worst findings first, refreshed on every drop.
 */
export default function ReviewPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const lcId = searchParams.get("lc") ?? undefined
    return lcId === undefined ? <PickLc /> : <LcReview lcId={lcId} />
}

/** With no `lc` selected: link over to the desk (or straight to the only LC). */
function PickLc(): React.ReactElement {
    const navigate = useNavigate()
    const lcsQuery = useCreditLcsQuery()
    if (lcsQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    const lcs = lcsQuery.data?.creditLcs ?? []
    if (lcs.length === 1) {
        navigate(`${creditPaths.review}?lc=${lcs[0].id}`, { replace: true })
    }
    return (
        <section className={shared.page}>
            <EmptyState
                title="Pick a letter of credit"
                description="Reviews live against a specific credit. Open one from the desk."
                action={<Button onClick={() => navigate(creditPaths.desk)}>Go to the desk</Button>}
            />
        </section>
    )
}

function LcReview({ lcId }: { lcId: string }): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const lcQuery = useCreditLcQuery({ variables: { lcId } })
    const [attachDocument, attachState] = useCreditAttachDocumentMutation()
    const [removeDocument] = useCreditRemoveDocumentMutation()
    const [deleteLc, deleteState] = useCreditDeleteLcMutation()

    const attach = async (uploadId: string, fileName: string): Promise<void> => {
        const result = await attachDocument({
            variables: {
                input: { idempotencyKey: crypto.randomUUID(), lcId, uploadId, fileName },
            },
            refetchQueries: ["CreditLc", "CreditLcs"],
        })
        const doc = result.data?.creditAttachDocument
        toast.publish({
            title: doc ? `Read as ${documentKindLabels[doc.kind].toLowerCase()}` : "Document attached",
            description: "The discrepancy report has been refreshed.",
            tone: "success",
        })
    }

    const remove = async (documentId: string): Promise<void> => {
        try {
            await removeDocument({
                variables: { input: { documentId } },
                refetchQueries: ["CreditLc", "CreditLcs"],
            })
            toast.publish({ title: "Document removed", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Removing failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const removeLc = async (): Promise<void> => {
        try {
            await deleteLc({ variables: { input: { lcId } }, refetchQueries: ["CreditLcs"] })
            toast.publish({ title: "Letter of credit deleted", tone: "success" })
            navigate(creditPaths.desk)
        } catch (caught) {
            toast.publish({
                title: "Deleting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (lcQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    const lc = lcQuery.data?.creditLc
    if (lcQuery.error || lc === undefined) {
        return (
            <section className={shared.page}>
                <EmptyState
                    title="No such letter of credit"
                    description={lcQuery.error?.message}
                    action={<Button onClick={() => navigate(creditPaths.desk)}>Back to the desk</Button>}
                />
            </section>
        )
    }

    const shipDate = lc.latestShipmentDate ?? undefined

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>{lc.reference}</h1>
                <p className={shared.subtitle}>
                    {lc.issuingBank ?? "Issuing bank not stated"} · {lc.applicant ?? "applicant not stated"} →{" "}
                    {lc.beneficiary ?? "beneficiary not stated"}
                </p>
            </header>

            <div className={shared.card}>
                <div className={shared.cardHeader}>
                    <h2 className={shared.cardTitle}>The credit</h2>
                    <div className={shared.row}>
                        {shipDate !== undefined ? (
                            <Badge tone={daysUntil(shipDate) < 0 ? "danger" : "info"}>
                                Ship by {formatCreditDate(shipDate)} — {describeDaysUntil(shipDate)}
                            </Badge>
                        ) : null}
                        <Badge tone={daysUntil(lc.expiryDate) < 0 ? "danger" : "neutral"}>
                            Expires {formatCreditDate(lc.expiryDate)} — {describeDaysUntil(lc.expiryDate)}
                        </Badge>
                    </div>
                </div>
                <div className={shared.fieldGrid}>
                    <Field label="Amount">
                        {formatCreditMoney(lc.amountMinorUnits, lc.currency)}
                        {lc.tolerancePercent > 0 ? ` ±${lc.tolerancePercent}%` : ""}
                    </Field>
                    <Field label="Issued">
                        {lc.issueDate ? formatCreditDate(lc.issueDate) : "Not stated"}
                    </Field>
                    <Field label="Presentation period">
                        {lc.presentationPeriodDays !== null && lc.presentationPeriodDays !== undefined
                            ? `${lc.presentationPeriodDays} days after shipment`
                            : "Not stated"}
                    </Field>
                    <Field label="Port of loading">{lc.portOfLoading ?? "Not stated"}</Field>
                    <Field label="Port of discharge">{lc.portOfDischarge ?? "Not stated"}</Field>
                    <Field label="Partial shipments">{shipmentTermLabels[lc.partialShipments]}</Field>
                    <Field label="Transhipment">{shipmentTermLabels[lc.transhipment]}</Field>
                    <Field label="Goods">{lc.goodsDescription}</Field>
                </div>
                {lc.documentsRequired.length > 0 ? (
                    <div>
                        <p className={shared.fieldLabel}>Documents required</p>
                        <ul className={styles.requiredList}>
                            {lc.documentsRequired.map((entry) => (
                                <li key={entry} className={shared.fieldValue}>
                                    {entry}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

            <div className={shared.card}>
                <div className={shared.cardHeader}>
                    <h2 className={shared.cardTitle}>Discrepancy report</h2>
                    <p className={shared.mutedText}>Refreshed on every drop — worst findings first.</p>
                </div>
                <ul className={shared.findingList}>
                    {lc.findings.map((finding) => (
                        <FindingRow key={`${finding.code}:${finding.documentId ?? ""}`} finding={finding} />
                    ))}
                </ul>
            </div>

            <div className={shared.card}>
                <div className={shared.cardHeader}>
                    <h2 className={shared.cardTitle}>Supporting documents</h2>
                </div>
                <PdfDropZone
                    title="Drop a supporting document"
                    hint="Invoice, bill of lading, or packing list — it is read, classified, and checked against the credit."
                    busyLabel="Reading the document..."
                    disabled={attachState.loading}
                    onUploaded={attach}
                    onError={(message) =>
                        toast.publish({ title: "Attaching failed", description: message, tone: "danger" })
                    }
                />
                {lc.documents.length === 0 ? (
                    <p className={shared.mutedText}>Nothing dropped against this credit yet.</p>
                ) : (
                    <ul className={styles.documentList}>
                        {lc.documents.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} onRemove={() => void remove(doc.id)} />
                        ))}
                    </ul>
                )}
            </div>

            <div className={shared.row}>
                <Button variant="secondary" onClick={() => navigate(creditPaths.desk)}>
                    Back to the desk
                </Button>
                <Button variant="danger" onClick={() => void removeLc()} disabled={deleteState.loading}>
                    {deleteState.loading ? "Deleting..." : "Delete this credit"}
                </Button>
            </div>
        </section>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
    return (
        <div>
            <p className={shared.fieldLabel}>{label}</p>
            <p className={shared.fieldValue}>{children}</p>
        </div>
    )
}

function FindingRow({ finding }: { finding: CreditFindingNode }): React.ReactElement {
    return (
        <li className={shared.findingItem}>
            <Badge tone={severityBadgeTones[finding.severity]}>{severityLabels[finding.severity]}</Badge>
            <div className={shared.findingBody}>
                <p className={shared.findingTitle}>{finding.title}</p>
                <p className={shared.findingDetail}>{finding.detail}</p>
            </div>
        </li>
    )
}

function DocumentRow({
    doc,
    onRemove,
}: {
    doc: CreditDocumentNode
    onRemove: () => void
}): React.ReactElement {
    const facts: string[] = []
    if (doc.reference !== null && doc.reference !== undefined) {
        facts.push(doc.reference)
    }
    if (doc.amountMinorUnits !== null && doc.amountMinorUnits !== undefined && doc.currency) {
        facts.push(formatCreditMoney(doc.amountMinorUnits, doc.currency))
    }
    if (doc.shipmentDate !== null && doc.shipmentDate !== undefined) {
        facts.push(`shipped ${formatCreditDate(doc.shipmentDate)}`)
    }
    if (doc.portOfLoading && doc.portOfDischarge) {
        facts.push(`${doc.portOfLoading} → ${doc.portOfDischarge}`)
    }
    return (
        <li className={styles.documentItem}>
            <div className={shared.findingBody}>
                <p className={shared.findingTitle}>
                    {documentKindLabels[doc.kind]}
                    {doc.fileName ? ` — ${doc.fileName}` : ""}
                </p>
                <p className={shared.findingDetail}>
                    {facts.length > 0 ? facts.join(" · ") : "No fields read"}
                </p>
            </div>
            <Button variant="secondary" size="sm" onClick={onRemove}>
                Remove
            </Button>
        </li>
    )
}
