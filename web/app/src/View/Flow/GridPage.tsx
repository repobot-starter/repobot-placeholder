import { deriveStorageEndpoint, resolveStorageUrl } from "@base/core"
import { Button, EmptyState, Select, Spinner, useToast } from "@ui"
import React, { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    useFileUrlLazyQuery,
    useFlowAddLineMutation,
    useFlowExportTemplateXlsxMutation,
    useFlowLinkableCategoriesQuery,
    useFlowRemoveLineMutation,
    useFlowTemplateGridQuery,
    useFlowUpdateLineMutation,
    type FlowSection,
} from "../../generated/graphql/types"
import {
    budgetInputValue,
    FlowGridLine,
    FlowGridTemplate,
    flowPaths,
    flowSectionLabels,
    formatFlowMoney,
    formatFlowMonth,
    isFavorableVariance,
    parseMoneyInput,
    sectionTotals,
} from "./flowShared"
import * as shared from "./flowStyles.css"
import * as styles from "./GridPage.styles.css"

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/**
 * The budget grid (manifest destination `/grid?template=<id>`, packs/flow):
 * rows are budget lines (linkable to live P&L categories), columns are
 * months. Budget cells edit in place; actuals and variance render under
 * each cell from the live books. Exports to a workbook whose Budget sheet
 * round-trips through import.
 */
export default function GridPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const templateId = searchParams.get("template") ?? undefined
    const navigate = useNavigate()
    if (templateId === undefined) {
        return (
            <section className={shared.page}>
                <EmptyState
                    title="Pick a template"
                    description="Grids live against a specific template. Open one from the templates page."
                    action={<Button onClick={() => navigate(flowPaths.templates)}>Go to templates</Button>}
                />
            </section>
        )
    }
    return <TemplateGrid templateId={templateId} />
}

function TemplateGrid({ templateId }: { templateId: string }): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const gridQuery = useFlowTemplateGridQuery({ variables: { templateId } })
    const categoriesQuery = useFlowLinkableCategoriesQuery()
    const [exportXlsx, exportState] = useFlowExportTemplateXlsxMutation()
    const [fetchFileUrl] = useFileUrlLazyQuery()

    const download = async (): Promise<void> => {
        try {
            const result = await exportXlsx({
                variables: { input: { idempotencyKey: crypto.randomUUID(), templateId } },
            })
            const uploadId = result.data?.flowExportTemplateXlsx.id
            if (uploadId === undefined) {
                throw new Error("The export did not produce a file.")
            }
            const urlResult = await fetchFileUrl({ variables: { uploadId } })
            const url = urlResult.data?.fileUrl.url
            if (url === undefined) {
                throw new Error("The download link could not be created.")
            }
            window.open(resolveStorageUrl(storageEndpoint(), url), "_blank", "noopener")
        } catch (caught) {
            toast.publish({
                title: "Export failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (gridQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    const template = gridQuery.data?.flowTemplate
    if (gridQuery.error || template === undefined) {
        return (
            <section className={shared.page}>
                <EmptyState
                    title="No such template"
                    description={gridQuery.error?.message}
                    action={<Button onClick={() => navigate(flowPaths.templates)}>Back to templates</Button>}
                />
            </section>
        )
    }

    const categories = categoriesQuery.data?.flowLinkableCategories
    const hasBooks =
        categories !== undefined &&
        (categories.incomeCategories.length > 0 || categories.expenseCategories.length > 0)

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>{template.name}</h1>
                <p className={shared.subtitle}>
                    {formatFlowMonth(template.months[0])} –{" "}
                    {formatFlowMonth(template.months[template.months.length - 1])} · budgets edit in place;
                    actuals and variance come from your live books.
                    {hasBooks ? "" : " Connect your books to light up actuals."}
                </p>
            </header>

            <div className={shared.row}>
                <Button onClick={() => void download()} disabled={exportState.loading}>
                    {exportState.loading ? "Exporting..." : "Download workbook"}
                </Button>
                <Button variant="secondary" onClick={() => navigate(flowPaths.templates)}>
                    All templates
                </Button>
                {!hasBooks ? (
                    <Button variant="secondary" onClick={() => navigate(flowPaths.books)}>
                        Connect books
                    </Button>
                ) : null}
            </div>

            <SectionCard
                template={template}
                section="INCOME"
                categories={categories?.incomeCategories ?? []}
            />
            <SectionCard
                template={template}
                section="EXPENSES"
                categories={categories?.expenseCategories ?? []}
            />
        </section>
    )
}

function SectionCard({
    template,
    section,
    categories,
}: {
    template: FlowGridTemplate
    section: FlowSection
    categories: string[]
}): React.ReactElement {
    const toast = useToast()
    const [addLine, addState] = useFlowAddLineMutation()
    const lines = template.lines.filter((line) => line.section === section)
    const totals = sectionTotals(template.lines, section, template.monthCount)

    const add = async (): Promise<void> => {
        try {
            await addLine({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        templateId: template.id,
                        label: section === "INCOME" ? "New income line" : "New expense line",
                        section,
                    },
                },
                refetchQueries: ["FlowTemplateGrid"],
            })
        } catch (caught) {
            toast.publish({
                title: "Adding the line failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    return (
        <div className={shared.card}>
            <div className={shared.cardHeader}>
                <h2 className={shared.cardTitle}>{flowSectionLabels[section]}</h2>
                <Button variant="secondary" size="sm" onClick={() => void add()} disabled={addState.loading}>
                    Add line
                </Button>
            </div>
            {lines.length === 0 ? (
                <p className={shared.mutedText}>No lines yet — add one, or seed the grid from actuals.</p>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.gridTable}>
                        <thead>
                            <tr>
                                <th className={styles.lineHeadCell}>Line</th>
                                <th className={styles.linkHeadCell}>Linked to</th>
                                {template.months.map((month) => (
                                    <th key={month} className={styles.monthHeadCell}>
                                        {formatFlowMonth(month)}
                                    </th>
                                ))}
                                <th className={styles.actionHeadCell} />
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line) => (
                                <LineRow
                                    key={line.id}
                                    template={template}
                                    line={line}
                                    categories={categories}
                                />
                            ))}
                            <tr className={styles.totalRow}>
                                <td className={styles.lineCell}>
                                    Total {flowSectionLabels[section].toLowerCase()}
                                </td>
                                <td className={styles.linkCell} />
                                {template.months.map((month, index) => (
                                    <td key={month} className={styles.monthCell}>
                                        <span className={styles.totalBudget}>
                                            {formatFlowMoney(totals.budgets[index], template.currency)}
                                        </span>
                                        {totals.actuals[index] !== null ? (
                                            <span className={styles.actualText}>
                                                A{" "}
                                                {formatFlowMoney(
                                                    totals.actuals[index] as number,
                                                    template.currency,
                                                )}
                                            </span>
                                        ) : null}
                                    </td>
                                ))}
                                <td className={styles.actionCell} />
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function LineRow({
    template,
    line,
    categories,
}: {
    template: FlowGridTemplate
    line: FlowGridLine
    categories: string[]
}): React.ReactElement {
    const toast = useToast()
    const [updateLine] = useFlowUpdateLineMutation()
    const [removeLine] = useFlowRemoveLineMutation()
    const [label, setLabel] = useState(line.label)

    const fail = (title: string, caught: unknown): void => {
        toast.publish({
            title,
            description: caught instanceof Error ? caught.message : undefined,
            tone: "danger",
        })
    }

    const commitLabel = async (): Promise<void> => {
        const trimmed = label.trim()
        if (trimmed === "" || trimmed === line.label) {
            setLabel(line.label)
            return
        }
        try {
            await updateLine({ variables: { input: { lineId: line.id, label: trimmed } } })
        } catch (caught) {
            setLabel(line.label)
            fail("Renaming the line failed", caught)
        }
    }

    const commitLink = async (value: string): Promise<void> => {
        try {
            await updateLine({
                variables: { input: { lineId: line.id, linkedCategory: value === "none" ? "" : value } },
                refetchQueries: ["FlowTemplateGrid"],
            })
        } catch (caught) {
            fail("Linking failed", caught)
        }
    }

    const commitBudget = async (monthIndex: number, raw: string): Promise<void> => {
        const amount = parseMoneyInput(raw)
        if (amount === undefined || amount === line.budgetsMinorUnits[monthIndex]) {
            return
        }
        const budgets = [...line.budgetsMinorUnits]
        budgets[monthIndex] = amount
        try {
            await updateLine({
                variables: { input: { lineId: line.id, budgetsMinorUnits: budgets } },
                refetchQueries: ["FlowTemplateGrid"],
            })
        } catch (caught) {
            fail("Saving the budget failed", caught)
        }
    }

    const remove = async (): Promise<void> => {
        try {
            await removeLine({
                variables: { input: { lineId: line.id } },
                refetchQueries: ["FlowTemplateGrid"],
            })
        } catch (caught) {
            fail("Removing the line failed", caught)
        }
    }

    const linkOptions = [
        { value: "none", label: "Not linked" },
        ...categories.map((category) => ({ value: category, label: category })),
    ]

    return (
        <tr>
            <td className={styles.lineCell}>
                <input
                    className={styles.labelInput}
                    value={label}
                    aria-label="Line label"
                    onChange={(event) => setLabel(event.target.value)}
                    onBlur={() => void commitLabel()}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.currentTarget.blur()
                        }
                    }}
                />
            </td>
            <td className={styles.linkCell}>
                <Select
                    value={line.linkedCategory ?? "none"}
                    onValueChange={(value) => void commitLink(value)}
                    options={linkOptions}
                    aria-label="Linked category"
                />
            </td>
            {template.months.map((month, index) => {
                const actual = line.actualsMinorUnits[index]
                const variance = line.variancesMinorUnits[index]
                return (
                    <td key={month} className={styles.monthCell}>
                        <input
                            className={styles.budgetInput}
                            defaultValue={budgetInputValue(line.budgetsMinorUnits[index])}
                            aria-label={`${line.label} budget for ${month}`}
                            inputMode="decimal"
                            onBlur={(event) => void commitBudget(index, event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                        {actual !== null && actual !== undefined ? (
                            <span className={styles.actualText}>
                                A {formatFlowMoney(actual, template.currency)}
                                {variance !== null && variance !== undefined ? (
                                    <span
                                        className={
                                            isFavorableVariance(line.section, variance)
                                                ? styles.varianceGood
                                                : styles.varianceBad
                                        }
                                    >
                                        {" "}
                                        {variance >= 0 ? "+" : "−"}
                                        {formatFlowMoney(Math.abs(variance), template.currency)}
                                    </span>
                                ) : null}
                            </span>
                        ) : null}
                    </td>
                )
            })}
            <td className={styles.actionCell}>
                <Button variant="secondary" size="sm" onClick={() => void remove()}>
                    Remove
                </Button>
            </td>
        </tr>
    )
}
