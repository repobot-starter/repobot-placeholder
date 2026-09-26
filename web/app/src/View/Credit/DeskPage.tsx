import { Badge, Button, EmptyState, Spinner, useToast } from "@ui"
import React from "react"
import { useNavigate } from "react-router-dom"
import { useCreditIngestLcMutation, useCreditLcsQuery } from "../../generated/graphql/types"
import {
    creditPaths,
    CreditLcNode,
    daysUntil,
    describeDaysUntil,
    findingCounts,
    formatCreditDate,
    formatCreditMoney,
} from "./creditShared"
import * as styles from "./DeskPage.styles.css"
import { PdfDropZone } from "./PdfDropZone"
import * as shared from "./creditStyles.css"

/**
 * The credit desk (manifest destination `/desk`, packs/credit): drop a letter
 * of credit PDF to get the SWIFT breakdown, and see every credit on the desk
 * as a card with its deadlines and discrepancy count at a glance. Bundled
 * sample PDFs make the demo work with nothing on hand.
 */
export default function DeskPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const lcsQuery = useCreditLcsQuery()
    const [ingestLc, ingestState] = useCreditIngestLcMutation()

    const ingest = async (uploadId: string): Promise<void> => {
        const result = await ingestLc({
            variables: { input: { idempotencyKey: crypto.randomUUID(), uploadId } },
            refetchQueries: ["CreditLcs"],
        })
        const lc = result.data?.creditIngestLc
        if (lc === undefined) {
            throw new Error("The letter of credit could not be ingested.")
        }
        toast.publish({
            title: `${lc.reference} ingested`,
            description: "The breakdown and checks are ready.",
            tone: "success",
        })
        navigate(`${creditPaths.review}?lc=${lc.id}`)
    }

    if (lcsQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    if (lcsQuery.error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{lcsQuery.error.message}</p>
                </div>
            </section>
        )
    }

    const lcs = lcsQuery.data?.creditLcs ?? []

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Credit desk</h1>
                <p className={shared.subtitle}>
                    Drop a letter of credit to get the breakdown that matters: deadlines, terms, and the
                    documents it calls for.
                </p>
            </header>

            <PdfDropZone
                title="Drop a letter of credit"
                hint="PDF only — the SWIFT MT700 fields are extracted automatically. Or click to pick a file."
                busyLabel="Reading the credit..."
                disabled={ingestState.loading}
                onUploaded={ingest}
                onError={(message) =>
                    toast.publish({ title: "Ingestion failed", description: message, tone: "danger" })
                }
            />
            <div className={shared.sampleLinks}>
                <span className={shared.dropZoneHint}>No LC on hand? Try the bundled samples:</span>
                <a className={shared.sampleLink} href="/samples/credit/sample-letter-of-credit.pdf" download>
                    Sample letter of credit
                </a>
                <a
                    className={shared.sampleLink}
                    href="/samples/credit/sample-commercial-invoice.pdf"
                    download
                >
                    Invoice
                </a>
                <a className={shared.sampleLink} href="/samples/credit/sample-bill-of-lading.pdf" download>
                    Bill of lading
                </a>
                <a className={shared.sampleLink} href="/samples/credit/sample-packing-list.pdf" download>
                    Packing list
                </a>
            </div>

            {lcs.length === 0 ? (
                <EmptyState
                    title="Nothing on the desk yet"
                    description="Drop your first letter of credit above — the sample set demonstrates the whole flow, deliberate discrepancies included."
                />
            ) : (
                <div className={styles.lcGrid}>
                    {lcs.map((lc) => (
                        <LcCard
                            key={lc.id}
                            lc={lc}
                            onOpen={() => navigate(`${creditPaths.review}?lc=${lc.id}`)}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

function LcCard({ lc, onOpen }: { lc: CreditLcNode; onOpen: () => void }): React.ReactElement {
    const counts = findingCounts(lc.findings)
    const shipDate = lc.latestShipmentDate
    return (
        <div className={shared.card}>
            <div className={shared.cardHeader}>
                <h2 className={shared.cardTitle}>{lc.reference}</h2>
                {counts.discrepancies > 0 ? (
                    <Badge tone="danger">
                        {counts.discrepancies} {counts.discrepancies === 1 ? "discrepancy" : "discrepancies"}
                    </Badge>
                ) : counts.warnings > 0 ? (
                    <Badge tone="warning">
                        {counts.warnings} {counts.warnings === 1 ? "warning" : "warnings"}
                    </Badge>
                ) : (
                    <Badge tone="success">Clean</Badge>
                )}
            </div>
            <p className={shared.mutedText}>
                {lc.applicant ?? "Applicant not stated"} → {lc.beneficiary ?? "Beneficiary not stated"}
            </p>
            <div className={styles.lcStats}>
                <div>
                    <p className={shared.fieldLabel}>Amount</p>
                    <p className={shared.fieldValue}>
                        {formatCreditMoney(lc.amountMinorUnits, lc.currency)}
                        {lc.tolerancePercent > 0 ? ` ±${lc.tolerancePercent}%` : ""}
                    </p>
                </div>
                <div>
                    <p className={shared.fieldLabel}>Ship by</p>
                    <p
                        className={
                            shipDate !== null && shipDate !== undefined && daysUntil(shipDate) < 0
                                ? shared.errorText
                                : shared.fieldValue
                        }
                    >
                        {shipDate !== null && shipDate !== undefined
                            ? `${formatCreditDate(shipDate)} (${describeDaysUntil(shipDate)})`
                            : "Not stated"}
                    </p>
                </div>
                <div>
                    <p className={shared.fieldLabel}>Expires</p>
                    <p className={daysUntil(lc.expiryDate) < 0 ? shared.errorText : shared.fieldValue}>
                        {formatCreditDate(lc.expiryDate)} ({describeDaysUntil(lc.expiryDate)})
                    </p>
                </div>
                <div>
                    <p className={shared.fieldLabel}>Documents</p>
                    <p className={shared.fieldValue}>
                        {lc.documents.length} of {lc.documentsRequired.length} kinds dropped
                    </p>
                </div>
            </div>
            <div className={shared.row}>
                <Button onClick={onOpen}>Open review</Button>
            </div>
        </div>
    )
}
