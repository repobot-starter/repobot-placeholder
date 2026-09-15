/**
 * Builds a small, valid, uncompressed PDF from plain text lines — a real
 * document for intake tests without a PDF-writing dependency. One content
 * stream per page, Helvetica, one Tj per line. pdfjs parses these exactly
 * like documents from the wild (they are spec-conformant PDF 1.4).
 */
export function makeTestPdf(pages: string[][]): Buffer {
    // Object layout: 1 catalog, 2 pages root, then per page i (0-based):
    // 3+2i the page, 4+2i its content stream; the font is the last object.
    const pageObjectNumber = (index: number): number => 3 + index * 2
    const contentObjectNumber = (index: number): number => 4 + index * 2
    const fontObjectNumber = 3 + pages.length * 2

    const objects: string[] = []
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`)
    const kids = pages.map((_, index) => `${pageObjectNumber(index)} 0 R`).join(" ")
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`)

    pages.forEach((lines, index) => {
        objects.push(
            `${pageObjectNumber(index)} 0 obj\n` +
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
                `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> ` +
                `/Contents ${contentObjectNumber(index)} 0 R >>\nendobj\n`,
        )
        const escaped = lines.map((line) => line.replace(/([\\()])/g, "\\$1"))
        const stream =
            `BT\n/F1 12 Tf\n14 TL\n72 720 Td\n` +
            escaped.map((line) => `(${line}) Tj\nT*\n`).join("") +
            `ET\n`
        objects.push(
            `${contentObjectNumber(index)} 0 obj\n` +
                `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream\nendobj\n`,
        )
    })

    objects.push(
        `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    )

    const header = `%PDF-1.4\n`
    let body = header
    const offsets: number[] = []
    for (const object of objects) {
        offsets.push(Buffer.byteLength(body))
        body += object
    }

    const xrefOffset = Buffer.byteLength(body)
    const xrefEntries = offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")
    const xref = `xref\n0 ${objects.length + 1}\n` + `0000000000 65535 f \n` + xrefEntries
    const trailer =
        `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` + `startxref\n${xrefOffset}\n%%EOF\n`

    return Buffer.from(body + xref + trailer, "latin1")
}
