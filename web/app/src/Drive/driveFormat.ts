/**
 * Presentation helpers the Files and Images views share: byte counts, dates,
 * and the preview treatment a content type gets. Pure functions, no I/O.
 */

export function formatBytes(sizeBytes: number | null | undefined): string {
    if (sizeBytes == null) {
        return "—"
    }
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`
    }
    const units = ["KB", "MB", "GB"]
    let value = sizeBytes
    let unit = "B"
    for (const next of units) {
        if (value < 1024) {
            break
        }
        value = value / 1024
        unit = next
    }
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${unit}`
}

export function formatEntryDate(instant: string | Date | null | undefined): string {
    if (instant == null) {
        return "—"
    }
    return new Date(instant).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

/** How the preview surface renders an entry's bytes. */
export type DrivePreviewKind = "image" | "pdf" | "text" | "audio" | "video" | "none"

export function drivePreviewKind(contentType: string | null | undefined): DrivePreviewKind {
    if (contentType == null) {
        return "none"
    }
    if (contentType.startsWith("image/")) {
        return "image"
    }
    if (contentType === "application/pdf") {
        return "pdf"
    }
    if (
        contentType.startsWith("text/") ||
        contentType === "application/json" ||
        contentType === "text/markdown"
    ) {
        return "text"
    }
    if (contentType.startsWith("audio/")) {
        return "audio"
    }
    if (contentType.startsWith("video/")) {
        return "video"
    }
    return "none"
}

/** A short uppercase type tag for list chrome ("PDF", "PNG", "FOLDER"). */
export function driveTypeTag(kind: string, contentType: string | null | undefined): string {
    if (kind === "FOLDER") {
        return "DIR"
    }
    if (contentType == null) {
        return "FILE"
    }
    const subtype = contentType.split("/")[1] ?? contentType
    const cleaned = subtype.replace(/^vnd\..*\.(\w+)$/, "$1").replace(/^x-/, "")
    return cleaned.slice(0, 8).toUpperCase()
}
