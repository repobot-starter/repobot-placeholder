import ExcelJS from "exceljs"
import { Upload, UploadVisibility } from "../../Data/Storage/Upload.js"
import { storageService, WriteFileRequest } from "../Storage/StorageService.js"
import { RpcError } from "../../Utils/RpcError.js"

export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** One worksheet: a header row (bolded) followed by data rows. */
export interface XlsxSheet {
    /** Worksheet tab name; Excel caps these at 31 characters. */
    name: string
    /** Column headers, written as the bold first row. */
    columns: XlsxColumn[]
    /** Data rows, positionally aligned with `columns`. */
    rows: XlsxCellValue[][]
}

export interface XlsxColumn {
    header: string
    /** Column width in Excel character units; sized to the header when omitted. */
    width?: number
    /** Excel number format applied to the column's data cells (e.g. '#,##0.00'). */
    numberFormat?: string
}

export type XlsxCellValue = string | number | null

export interface BuildWorkbookRequest {
    sheets: XlsxSheet[]
}

export interface WriteWorkbookRequest extends BuildWorkbookRequest {
    idempotencyKey: string
    /** The owner the filed upload records; undefined for principals without a user row. */
    userId: string | undefined
    visibility: UploadVisibility
    /** Download-friendly name, e.g. "profit-and-loss-2026-08.xlsx". */
    fileName: string
}

/** A parsed worksheet: raw cell values by row, empty cells as null. */
export interface ParsedXlsxSheet {
    name: string
    rows: XlsxCellValue[][]
}

/** The slice of the storage kernel writeWorkbook files through. */
export interface XlsxStorageWriter {
    writeFile(request: WriteFileRequest): Promise<Upload>
}

/**
 * The spreadsheet kernel: every workbook the app produces or ingests goes
 * through this service — domains hand it plain sheet JSON (headers + rows)
 * and get xlsx bytes, or hand it uploaded bytes and get sheet JSON back.
 * Mirrors DocumentGenerationService: building stays stateless, and
 * writeWorkbook files the result through the storage kernel's server-side
 * write path so the record is indistinguishable from a browser upload.
 */
export class XlsxService {
    constructor(private readonly storageWriter: () => XlsxStorageWriter = () => storageService) {}

    /** Renders the given sheets to xlsx bytes. */
    async buildWorkbook(request: BuildWorkbookRequest): Promise<Buffer> {
        if (request.sheets.length === 0) {
            throw new RpcError("INVALID_ARGUMENT", "A workbook needs at least one sheet.")
        }
        const workbook = new ExcelJS.Workbook()
        for (const sheet of request.sheets) {
            const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31))
            worksheet.columns = sheet.columns.map((column) => ({
                header: column.header,
                width: column.width ?? Math.max(column.header.length + 2, 10),
            }))
            worksheet.getRow(1).font = { bold: true }
            for (const row of sheet.rows) {
                worksheet.addRow(row)
            }
            sheet.columns.forEach((column, index) => {
                if (column.numberFormat !== undefined) {
                    const worksheetColumn = worksheet.getColumn(index + 1)
                    worksheetColumn.numFmt = column.numberFormat
                }
            })
        }
        const bytes = await workbook.xlsx.writeBuffer()
        return Buffer.from(bytes)
    }

    /**
     * Build + file in one call: the workbook lands in the storage kernel
     * (same allowlist, cap, and READY record as a browser upload); the
     * client downloads it via the fileUrl query.
     */
    async writeWorkbook(request: WriteWorkbookRequest): Promise<Upload> {
        const bytes = await this.buildWorkbook(request)
        return await this.storageWriter().writeFile({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            contentType: XLSX_CONTENT_TYPE,
            bytesBase64: bytes.toString("base64"),
            visibility: request.visibility,
            fileName: request.fileName,
        })
    }

    /**
     * Parses xlsx bytes back to plain sheet JSON (the import seam: a domain
     * seeds its own rows from the values). Formulas surface as their last
     * computed result; empty cells as null.
     */
    async parseWorkbook(bytes: Buffer): Promise<ParsedXlsxSheet[]> {
        const workbook = new ExcelJS.Workbook()
        try {
            await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer)
        } catch {
            throw new RpcError("INVALID_ARGUMENT", "The file is not a readable xlsx workbook.")
        }
        return workbook.worksheets.map((worksheet) => {
            const rows: XlsxCellValue[][] = []
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                const values: XlsxCellValue[] = []
                for (let cellIndex = 1; cellIndex <= worksheet.columnCount; cellIndex += 1) {
                    values.push(plainCellValue(row.getCell(cellIndex).value))
                }
                rows.push(values)
            })
            return { name: worksheet.name, rows }
        })
    }
}

/** Flattens exceljs cell values (rich text, formulas, dates) to string | number | null. */
function plainCellValue(value: ExcelJS.CellValue): XlsxCellValue {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value === "number" || typeof value === "string") {
        return value
    }
    if (typeof value === "boolean") {
        return value ? "TRUE" : "FALSE"
    }
    if (value instanceof Date) {
        return value.toISOString()
    }
    if (typeof value === "object") {
        if ("result" in value && value.result !== undefined && !(value.result instanceof Date)) {
            return typeof value.result === "number" ? value.result : String(value.result)
        }
        if ("richText" in value) {
            return value.richText.map((part) => part.text).join("")
        }
        if ("text" in value && typeof value.text === "string") {
            return value.text
        }
    }
    return String(value)
}

export const xlsxService = new XlsxService()
