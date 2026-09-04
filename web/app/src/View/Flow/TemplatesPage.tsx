import { deriveStorageEndpoint, putUploadBytes } from "@base/core"
import { Button, Checkbox, EmptyState, Input, Label, Select, Spinner, useToast } from "@ui"
import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    useCreateUploadMutation,
    useFinalizeUploadMutation,
    useFlowCreateTemplateMutation,
    useFlowDeleteTemplateMutation,
    useFlowImportTemplateXlsxMutation,
    useFlowTemplatesQuery,
    useMyBooksConnectionQuery,
} from "../../generated/graphql/types"
import { flowPaths, formatFlowMonth } from "./flowShared"
import * as shared from "./flowStyles.css"
import * as styles from "./TemplatesPage.styles.css"

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/** The current month as the month-input default (ISO yyyy-mm, UTC). */
function currentIsoMonth(): string {
    return new Date().toISOString().slice(0, 7)
}

/**
 * The template roster (manifest destination `/templates`, packs/flow): create
 * a budget/forecast grid (optionally seeded from live actuals), import one
 * from a workbook, open or delete existing ones.
 */
export default function TemplatesPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const templatesQuery = useFlowTemplatesQuery()
    const booksQuery = useMyBooksConnectionQuery()
    const [createTemplate, createState] = useFlowCreateTemplateMutation()
    const [deleteTemplate] = useFlowDeleteTemplateMutation()

    const [name, setName] = useState("")
    const [startMonth, setStartMonth] = useState(currentIsoMonth())
    const [monthCount, setMonthCount] = useState("12")
    const [seedFromActuals, setSeedFromActuals] = useState(true)

    const connected = booksQuery.data?.myBooksConnection != null

    const create = async (): Promise<void> => {
        const trimmed = name.trim()
        if (trimmed === "") {
            toast.publish({ title: "Name the template first", tone: "danger" })
            return
        }
        try {
            const result = await createTemplate({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        name: trimmed,
                        startMonth,
                        monthCount: Number(monthCount),
                        seedFromActuals: seedFromActuals && connected,
                    },
                },
                refetchQueries: ["FlowTemplates"],
            })
            const template = result.data?.flowCreateTemplate
            setName("")
            if (template !== undefined) {
                navigate(`${flowPaths.grid}?template=${template.id}`)
            }
        } catch (caught) {
            toast.publish({
                title: "Creating the template failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const remove = async (templateId: string): Promise<void> => {
        try {
            await deleteTemplate({
                variables: { input: { templateId } },
                refetchQueries: ["FlowTemplates"],
            })
            toast.publish({ title: "Template deleted", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Deleting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (templatesQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    if (templatesQuery.error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{templatesQuery.error.message}</p>
                </div>
            </section>
        )
    }

    const templates = templatesQuery.data?.flowTemplates ?? []

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Templates</h1>
                <p className={shared.subtitle}>
                    Budget and forecast grids whose rows link to your live books — actuals fill in by
                    themselves, variance is always current.
                </p>
            </header>

            <div className={shared.card}>
                <h2 className={shared.cardTitle}>New template</h2>
                <div className={styles.createRow}>
                    <div className={styles.createField}>
                        <Label htmlFor="flow-name">Name</Label>
                        <Input
                            id="flow-name"
                            value={name}
                            placeholder="FY27 operating budget"
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    <div className={styles.createField}>
                        <Label htmlFor="flow-start">First month</Label>
                        <Input
                            id="flow-start"
                            type="month"
                            value={startMonth}
                            onChange={(event) => setStartMonth(event.target.value)}
                        />
                    </div>
                    <div className={styles.createField}>
                        <Label htmlFor="flow-months">Months</Label>
                        <Select
                            id="flow-months"
                            value={monthCount}
                            onValueChange={setMonthCount}
                            options={["3", "6", "12", "18", "24"].map((value) => ({
                                value,
                                label: `${value} months`,
                            }))}
                        />
                    </div>
                    <Button onClick={() => void create()} disabled={createState.loading}>
                        {createState.loading ? "Creating..." : "Create template"}
                    </Button>
                </div>
                <Checkbox
                    checked={seedFromActuals && connected}
                    onCheckedChange={setSeedFromActuals}
                    disabled={!connected}
                    label="Start from your live actuals"
                    description={
                        connected
                            ? "One linked row per P&L category, budgets prefilled from the latest month."
                            : "Connect your books first to seed a plan from real numbers."
                    }
                />
                <ImportControl />
            </div>

            {templates.length === 0 ? (
                <EmptyState
                    title="No templates yet"
                    description="Create your first grid above — seeding from live actuals gives you a plan to react to instead of a wall of zeros."
                />
            ) : (
                <div className={styles.templateGrid}>
                    {templates.map((template) => (
                        <div key={template.id} className={shared.card}>
                            <div className={shared.cardHeader}>
                                <h2 className={shared.cardTitle}>{template.name}</h2>
                            </div>
                            <p className={shared.mutedText}>
                                {formatFlowMonth(template.months[0])} –{" "}
                                {formatFlowMonth(template.months[template.months.length - 1])} ·{" "}
                                {template.monthCount} months
                            </p>
                            <div className={shared.row}>
                                <Button onClick={() => navigate(`${flowPaths.grid}?template=${template.id}`)}>
                                    Open grid
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void remove(template.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

/** "Import a workbook": upload the xlsx, seed a template from its Budget sheet. */
function ImportControl(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const [createUpload] = useCreateUploadMutation()
    const [finalizeUpload] = useFinalizeUploadMutation()
    const [importTemplate] = useFlowImportTemplateXlsxMutation()

    const importFile = async (file: File): Promise<void> => {
        setBusy(true)
        try {
            const slotResult = await createUpload({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: {
                            contentType: XLSX_CONTENT_TYPE,
                            sizeBytes: file.size,
                            visibility: "PRIVATE",
                        },
                    },
                },
            })
            const slot = slotResult.data?.createUpload
            if (slot === undefined) {
                throw new Error("The upload could not be created.")
            }
            await putUploadBytes({
                endpoint: storageEndpoint(),
                uploadUrl: slot.uploadUrl,
                headersJson: slot.headersJson,
                body: file,
            })
            await finalizeUpload({ variables: { input: { uploadId: slot.uploadId } } })
            const result = await importTemplate({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        uploadId: slot.uploadId,
                        name: file.name.replace(/\.xlsx$/i, ""),
                    },
                },
                refetchQueries: ["FlowTemplates"],
            })
            const template = result.data?.flowImportTemplateXlsx
            toast.publish({ title: "Workbook imported", tone: "success" })
            if (template !== undefined) {
                navigate(`${flowPaths.grid}?template=${template.id}`)
            }
        } catch (caught) {
            toast.publish({
                title: "Importing failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className={shared.row}>
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? "Importing..." : "Import a workbook"}
            </Button>
            <p className={shared.mutedText}>
                Any exported template round-trips; a Budget sheet with months as columns works too.
            </p>
            <input
                ref={inputRef}
                type="file"
                accept={`${XLSX_CONTENT_TYPE},.xlsx`}
                hidden
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ""
                    if (file !== undefined) {
                        void importFile(file)
                    }
                }}
            />
        </div>
    )
}
