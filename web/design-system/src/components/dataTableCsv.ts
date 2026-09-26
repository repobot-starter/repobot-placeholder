/** CSV building + download for DataTable's export button. */

function escapeCsvValue(value: string): string {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

export interface CsvColumn<TRow> {
    header: string
    value: (row: TRow) => string
}

export function buildCsv<TRow>(columns: CsvColumn<TRow>[], rows: readonly TRow[]): string {
    const lines = [columns.map((column) => escapeCsvValue(column.header)).join(",")]
    for (const row of rows) {
        lines.push(columns.map((column) => escapeCsvValue(column.value(row))).join(","))
    }
    return lines.join("\n")
}

export function downloadCsv(filename: string, csv: string): void {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}
