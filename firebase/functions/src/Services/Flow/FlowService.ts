import { asc, desc, eq } from "drizzle-orm"
import {
    allFlowSections,
    FlowLine,
    flowLineInsertSchema,
    flowLinesTable,
    FlowSection,
} from "../../Data/Flow/FlowLine.js"
import {
    FLOW_MAX_MONTH_COUNT,
    FlowTemplate,
    flowTemplateInsertSchema,
    flowTemplatesTable,
} from "../../Data/Flow/FlowTemplate.js"
import { flowDb } from "../../Data/FlowDatabase.js"
import { idempotentInsertAndGet } from "../../Data/Utils/index.js"
import { Upload } from "../../Data/Storage/Upload.js"
import { RpcError } from "../../Utils/RpcError.js"
import { quickBooksService } from "../QuickBooks/QuickBooksService.js"
import { storageService } from "../Storage/StorageService.js"
import { XlsxCellValue, XlsxSheet, xlsxService } from "../Xlsx/XlsxService.js"

/** The importable worksheet's name; export writes it, import looks for it. */
const BUDGET_SHEET_NAME = "Budget"

/**
 * The budgeting domain: named budget/forecast templates as month-grids whose
 * rows can link to P&L categories on the owner's live accounting connection.
 * Only the plan (the budgets) is stored — actuals and variance are computed
 * at read time from the live books, so the grid is always current and
 * nothing ever goes stale. Any template exports to a workbook whose Budget
 * sheet round-trips through import.
 */
class FlowService {
    /**
     * Creates a template. With seedFromActuals (and connected books) the
     * grid starts with one linked row per P&L category, budgets prefilled
     * from the most recent actual month — a plan to react to instead of a
     * wall of zeros.
     */
    async createTemplate(request: CreateTemplateRequest): Promise<FlowTemplate> {
        const newTemplate = flowTemplateInsertSchema.parse({
            userId: request.userId,
            name: request.name,
            startMonth: request.startMonth,
            monthCount: request.monthCount,
        })
        const template = await idempotentInsertAndGet(
            flowDb,
            flowTemplatesTable,
            newTemplate,
            request.idempotencyKey,
        )
        if (request.seedFromActuals === true) {
            await this.seedLinesFromActuals(template)
        }
        return template
    }

    /** The caller's templates, newest first. */
    async listTemplates(userId: string): Promise<FlowTemplate[]> {
        return await flowDb
            .select()
            .from(flowTemplatesTable)
            .where(eq(flowTemplatesTable.userId, userId))
            .orderBy(desc(flowTemplatesTable.rowCreatedAt))
    }

    /** One template, owner-checked. */
    async getTemplate(request: { userId: string; templateId: string }): Promise<FlowTemplate> {
        const [template] = await flowDb
            .select()
            .from(flowTemplatesTable)
            .where(eq(flowTemplatesTable.id, request.templateId))
            .limit(1)
        if (template === undefined || template.userId !== request.userId) {
            throw new RpcError("NOT_FOUND", "There is no such template.")
        }
        return template
    }

    async renameTemplate(request: {
        userId: string
        templateId: string
        name: string
    }): Promise<FlowTemplate> {
        const template = await this.getTemplate(request)
        const name = request.name.trim()
        if (name.length === 0 || name.length > 120) {
            throw new RpcError("INVALID_ARGUMENT", "Template names are 1-120 characters.")
        }
        const [updated] = await flowDb
            .update(flowTemplatesTable)
            .set({ name, rowUpdatedAt: new Date() })
            .where(eq(flowTemplatesTable.id, template.id))
            .returning()
        return updated
    }

    /** Deletes a template and its lines (owner-checked). */
    async deleteTemplate(request: { userId: string; templateId: string }): Promise<void> {
        const template = await this.getTemplate(request)
        await flowDb.delete(flowLinesTable).where(eq(flowLinesTable.templateId, template.id))
        await flowDb.delete(flowTemplatesTable).where(eq(flowTemplatesTable.id, template.id))
    }

    /** The template's lines: income first, then expenses, by position. */
    async listLines(templateId: string): Promise<FlowLine[]> {
        return await flowDb
            .select()
            .from(flowLinesTable)
            .where(eq(flowLinesTable.templateId, templateId))
            .orderBy(asc(flowLinesTable.position), asc(flowLinesTable.rowCreatedAt))
    }

    /** Appends a row to the grid (owner-checked), budgets all zero. */
    async addLine(request: AddLineRequest): Promise<FlowLine> {
        const template = await this.getTemplate(request)
        const lines = await this.listLines(template.id)
        const newLine = flowLineInsertSchema.parse({
            templateId: template.id,
            position: lines.length === 0 ? 0 : Math.max(...lines.map((line) => line.position)) + 1,
            label: request.label,
            section: request.section,
            linkedCategory: normalizedCategory(request.linkedCategory),
            budgets: serializeBudgets(new Array<number>(template.monthCount).fill(0)),
        })
        return await idempotentInsertAndGet(flowDb, flowLinesTable, newLine, request.idempotencyKey)
    }

    /** Updates a row's label, link, and/or budgets (owner-checked). */
    async updateLine(request: UpdateLineRequest): Promise<FlowLine> {
        const { line, template } = await this.getOwnedLine(request.userId, request.lineId)
        const changes: Partial<FlowLine> = { rowUpdatedAt: new Date() }
        if (request.label !== undefined && request.label !== null) {
            const label = request.label.trim()
            if (label.length === 0 || label.length > 120) {
                throw new RpcError("INVALID_ARGUMENT", "Line labels are 1-120 characters.")
            }
            changes.label = label
        }
        if (request.linkedCategory !== undefined) {
            changes.linkedCategory = normalizedCategory(request.linkedCategory)
        }
        if (request.budgetsMinorUnits !== undefined && request.budgetsMinorUnits !== null) {
            if (request.budgetsMinorUnits.length !== template.monthCount) {
                throw new RpcError(
                    "INVALID_ARGUMENT",
                    `Budgets must carry exactly ${template.monthCount} amounts (one per grid month).`,
                )
            }
            if (request.budgetsMinorUnits.some((amount) => !Number.isSafeInteger(amount))) {
                throw new RpcError("INVALID_ARGUMENT", "Budget amounts are integer minor units.")
            }
            changes.budgets = serializeBudgets(request.budgetsMinorUnits)
        }
        const [updated] = await flowDb
            .update(flowLinesTable)
            .set(changes)
            .where(eq(flowLinesTable.id, line.id))
            .returning()
        return updated
    }

    /** Removes a row from the grid (owner-checked). */
    async removeLine(request: { userId: string; lineId: string }): Promise<void> {
        const { line } = await this.getOwnedLine(request.userId, request.lineId)
        await flowDb.delete(flowLinesTable).where(eq(flowLinesTable.id, line.id))
    }

    /**
     * The computed grid: months, and every line with its budgets plus
     * actuals and variance from the owner's live books (null where the
     * month has no actuals yet — future months, or no connection).
     */
    async computeGrid(template: FlowTemplate): Promise<ComputedGrid> {
        const months = monthsFor(template.startMonth, template.monthCount)
        const lines = await this.listLines(template.id)
        const actualsByMonth = await this.actualsByMonth(template.userId)
        const computedLines = lines.map((line): ComputedGridLine => {
            const budgetsMinorUnits = parseBudgets(line.budgets, template.monthCount)
            const actualsMinorUnits = months.map((month): number | null => {
                if (line.linkedCategory === null) {
                    return null
                }
                const monthActuals = actualsByMonth.get(month)
                if (monthActuals === undefined) {
                    return null
                }
                return monthActuals.get(categoryKey(line.section, line.linkedCategory)) ?? 0
            })
            const variancesMinorUnits = actualsMinorUnits.map((actual, index) =>
                actual === null ? null : actual - budgetsMinorUnits[index],
            )
            return { line, budgetsMinorUnits, actualsMinorUnits, variancesMinorUnits }
        })
        return { months, lines: computedLines }
    }

    /**
     * The P&L categories the owner's books serve, for the link dropdown.
     * Empty when the books are not connected yet.
     */
    async linkableCategories(userId: string): Promise<LinkableCategories> {
        const connection = await quickBooksService.getConnectionForUser(userId)
        if (connection === undefined) {
            return { incomeCategories: [], expenseCategories: [] }
        }
        const periods = await quickBooksService.profitAndLossForConnection(connection)
        const latest = periods[periods.length - 1]
        return {
            incomeCategories: latest.incomeLines.map((line) => line.category),
            expenseCategories: latest.expenseLines.map((line) => line.category),
        }
    }

    /**
     * Renders the template to a workbook: the importable "Budget" sheet
     * (the plan alone) plus a computed "Actuals vs budget" sheet, filed
     * PRIVATE for the owner through the storage kernel.
     */
    async exportTemplateXlsx(request: {
        idempotencyKey: string
        userId: string
        templateId: string
    }): Promise<Upload> {
        const template = await this.getTemplate(request)
        const grid = await this.computeGrid(template)

        const budgetSheet: XlsxSheet = {
            name: BUDGET_SHEET_NAME,
            columns: [
                { header: "Line", width: 28 },
                { header: "Section", width: 12 },
                { header: "Linked category", width: 24 },
                ...grid.months.map((month) => ({
                    header: month,
                    width: 14,
                    numberFormat: "#,##0.00",
                })),
            ],
            rows: grid.lines.map(({ line, budgetsMinorUnits }) => [
                line.label,
                line.section,
                line.linkedCategory,
                ...budgetsMinorUnits.map((amount) => amount / 100),
            ]),
        }

        const comparisonRows: XlsxCellValue[][] = []
        for (const { line, budgetsMinorUnits, actualsMinorUnits, variancesMinorUnits } of grid.lines) {
            comparisonRows.push([
                `${line.label} — budget`,
                ...budgetsMinorUnits.map((amount) => amount / 100),
            ])
            comparisonRows.push([
                `${line.label} — actual`,
                ...actualsMinorUnits.map((amount) => (amount === null ? null : amount / 100)),
            ])
            comparisonRows.push([
                `${line.label} — variance`,
                ...variancesMinorUnits.map((amount) => (amount === null ? null : amount / 100)),
            ])
        }
        const comparisonSheet: XlsxSheet = {
            name: "Actuals vs budget",
            columns: [
                { header: "Line", width: 34 },
                ...grid.months.map((month) => ({
                    header: month,
                    width: 14,
                    numberFormat: "#,##0.00",
                })),
            ],
            rows: comparisonRows,
        }

        return await xlsxService.writeWorkbook({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            visibility: "PRIVATE",
            fileName: templateFileName(template.name),
            sheets: [budgetSheet, comparisonSheet],
        })
    }

    /**
     * Seeds a new template from a workbook's "Budget" sheet (the shape
     * export writes — months in the header, one row per line). The grid
     * dimensions come from the header months.
     */
    async importTemplateXlsx(request: ImportTemplateRequest): Promise<FlowTemplate> {
        const file = await storageService.readFileBytes({
            userId: request.userId,
            uploadId: request.uploadId,
        })
        const sheets = await xlsxService.parseWorkbook(file.bytes)
        const budgetSheet = sheets.find((sheet) => sheet.name === BUDGET_SHEET_NAME) ?? sheets[0]
        if (budgetSheet === undefined || budgetSheet.rows.length < 2) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                `This workbook has no importable budget. Expected a "${BUDGET_SHEET_NAME}" sheet ` +
                    "with a header row (Line, Section, Linked category, then one column per month) " +
                    "and at least one line — the shape the export produces.",
            )
        }
        const [header, ...dataRows] = budgetSheet.rows
        const monthHeaders = header.slice(3).map((cell) => String(cell ?? "").trim())
        if (monthHeaders.length === 0 || monthHeaders.some((month) => !/^\d{4}-\d{2}$/.test(month))) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "The budget sheet's month columns must be ISO months (yyyy-mm) after the first " +
                    "three columns, the shape the export produces.",
            )
        }
        if (monthHeaders.length > FLOW_MAX_MONTH_COUNT) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `Grids cap at ${FLOW_MAX_MONTH_COUNT} months; this sheet has ${monthHeaders.length}.`,
            )
        }

        const template = await this.createTemplate({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            name: request.name,
            startMonth: monthHeaders[0],
            monthCount: monthHeaders.length,
        })
        const existingLines = await this.listLines(template.id)
        if (existingLines.length > 0) {
            // Idempotency replay: the import already ran.
            return template
        }
        let position = 0
        for (const row of dataRows) {
            const label = String(row[0] ?? "").trim()
            if (label.length === 0) {
                continue
            }
            const section = String(row[1] ?? "").trim() as FlowSection
            if (!allFlowSections.includes(section)) {
                throw new RpcError(
                    "FAILED_PRECONDITION",
                    `Line "${label}" has section "${row[1]}"; expected INCOME or EXPENSES.`,
                )
            }
            const budgets = monthHeaders.map((_, index) => {
                const cell = row[3 + index]
                if (cell === null || cell === undefined || cell === "") {
                    return 0
                }
                const amount = Number(cell)
                if (!Number.isFinite(amount)) {
                    throw new RpcError(
                        "FAILED_PRECONDITION",
                        `Line "${label}" has a non-numeric budget in month ${monthHeaders[index]}.`,
                    )
                }
                return Math.round(amount * 100)
            })
            const newLine = flowLineInsertSchema.parse({
                templateId: template.id,
                position,
                label,
                section,
                linkedCategory: normalizedCategory(
                    row[2] === null || row[2] === undefined ? null : String(row[2]),
                ),
                budgets: serializeBudgets(budgets),
            })
            await flowDb.insert(flowLinesTable).values({ ...newLine })
            position += 1
        }
        return template
    }

    private async getOwnedLine(
        userId: string,
        lineId: string,
    ): Promise<{ line: FlowLine; template: FlowTemplate }> {
        const [line] = await flowDb
            .select()
            .from(flowLinesTable)
            .where(eq(flowLinesTable.id, lineId))
            .limit(1)
        if (line === undefined) {
            throw new RpcError("NOT_FOUND", "There is no such line.")
        }
        const template = await this.getTemplate({ userId, templateId: line.templateId })
        return { line, template }
    }

    /** month -> section:category -> actual minor units, from the live books. */
    private async actualsByMonth(userId: string): Promise<Map<string, Map<string, number>>> {
        const connection = await quickBooksService.getConnectionForUser(userId)
        const byMonth = new Map<string, Map<string, number>>()
        if (connection === undefined) {
            return byMonth
        }
        for (const period of await quickBooksService.profitAndLossForConnection(connection)) {
            const monthActuals = new Map<string, number>()
            for (const line of period.incomeLines) {
                monthActuals.set(categoryKey("INCOME", line.category), line.minorUnits)
            }
            for (const line of period.expenseLines) {
                monthActuals.set(categoryKey("EXPENSES", line.category), line.minorUnits)
            }
            byMonth.set(period.month, monthActuals)
        }
        return byMonth
    }

    private async seedLinesFromActuals(template: FlowTemplate): Promise<void> {
        const existing = await this.listLines(template.id)
        if (existing.length > 0) {
            // Idempotency replay, or the caller already built rows.
            return
        }
        const connection = await quickBooksService.getConnectionForUser(template.userId)
        if (connection === undefined) {
            return
        }
        const periods = await quickBooksService.profitAndLossForConnection(connection)
        const latest = periods[periods.length - 1]
        let position = 0
        const seed = async (section: FlowSection, category: string, amount: number): Promise<void> => {
            const newLine = flowLineInsertSchema.parse({
                templateId: template.id,
                position,
                label: category,
                section,
                linkedCategory: category,
                budgets: serializeBudgets(new Array<number>(template.monthCount).fill(amount)),
            })
            await flowDb.insert(flowLinesTable).values({ ...newLine })
            position += 1
        }
        for (const line of latest.incomeLines) {
            await seed("INCOME", line.category, line.minorUnits)
        }
        for (const line of latest.expenseLines) {
            await seed("EXPENSES", line.category, line.minorUnits)
        }
    }
}

export const flowService = new FlowService()

export interface CreateTemplateRequest {
    idempotencyKey: string
    userId: string
    name: string
    /** First grid month, ISO yyyy-mm. */
    startMonth: string
    monthCount: number
    seedFromActuals?: boolean | null
}

export interface AddLineRequest {
    idempotencyKey: string
    userId: string
    templateId: string
    label: string
    section: FlowSection
    linkedCategory?: string | null
}

export interface UpdateLineRequest {
    userId: string
    lineId: string
    label?: string | null
    /** Explicit null clears the link; undefined leaves it unchanged. */
    linkedCategory?: string | null
    budgetsMinorUnits?: number[] | null
}

export interface ImportTemplateRequest {
    idempotencyKey: string
    userId: string
    uploadId: string
    name: string
}

export interface LinkableCategories {
    incomeCategories: string[]
    expenseCategories: string[]
}

export interface ComputedGrid {
    /** ISO yyyy-mm, one per grid column. */
    months: string[]
    lines: ComputedGridLine[]
}

export interface ComputedGridLine {
    line: FlowLine
    budgetsMinorUnits: number[]
    /** null where the month has no actuals (unlinked row, future month, no connection). */
    actualsMinorUnits: (number | null)[]
    variancesMinorUnits: (number | null)[]
}

/** Consecutive ISO months starting at startMonth. */
export function monthsFor(startMonth: string, monthCount: number): string[] {
    const [yearText, monthText] = startMonth.split("-")
    const year = Number(yearText)
    const month = Number(monthText)
    return Array.from({ length: monthCount }, (_, index) => {
        const total = year * 12 + (month - 1) + index
        const outYear = Math.floor(total / 12)
        const outMonth = (total % 12) + 1
        return `${outYear}-${String(outMonth).padStart(2, "0")}`
    })
}

function categoryKey(section: FlowSection, category: string): string {
    return `${section}:${category}`
}

function normalizedCategory(category: string | null | undefined): string | null {
    if (category === null || category === undefined) {
        return null
    }
    const trimmed = category.trim()
    return trimmed.length === 0 ? null : trimmed
}

function serializeBudgets(budgets: number[]): string {
    return budgets.join(",")
}

function parseBudgets(text: string, monthCount: number): number[] {
    const parsed = text.split(",").map((entry) => Number(entry))
    // The service owns the length invariant, but stay safe on legacy rows.
    return Array.from({ length: monthCount }, (_, index) => {
        const value = parsed[index]
        return Number.isSafeInteger(value) ? value : 0
    })
}

function templateFileName(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    const date = new Date().toISOString().slice(0, 10)
    return `${slug.length > 0 ? slug : "budget"}-${date}.xlsx`
}
