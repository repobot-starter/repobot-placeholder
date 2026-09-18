import { DocumentTemplateSummary } from "@base/core"

/**
 * The workbench's data layer: the JSON pane edits the full document — the
 * template's sample seeded verbatim — and the parsed object goes to POST
 * /generate as the overrides, arrays and objects included. The template's
 * schema still guards the door: required top-level fields are checked
 * client-side so the status bar can name what's missing before the server
 * would refuse.
 */

export type ParsedDocument =
    { kind: "ok"; data: Record<string, unknown> } | { kind: "error"; message: string }

export function parseDocumentJson(text: string): ParsedDocument {
    try {
        const parsed: unknown = JSON.parse(text)
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return { kind: "error", message: "The document must be a JSON object." }
        }
        return { kind: "ok", data: parsed as Record<string, unknown> }
    } catch (error) {
        return {
            kind: "error",
            message: error instanceof Error ? error.message : "The JSON does not parse.",
        }
    }
}

/** The editor's starting JSON: the template's sample document, pretty-printed. */
export function seedJson(template: DocumentTemplateSummary): string {
    return JSON.stringify(template.sample, null, 2) + "\n"
}

/** Required top-level fields the edited document leaves empty, as labels. */
export function missingRequired(template: DocumentTemplateSummary, data: Record<string, unknown>): string[] {
    return Object.entries(template.fields)
        .filter(([key, field]) => {
            if (field.required !== true) {
                return false
            }
            const value = data[key]
            return value === undefined || value === null || (typeof value === "string" && value.trim() === "")
        })
        .map(([key]) => fieldLabel(key))
}

/** A human label from a schema key: "clientEmail" -> "Client email". */
export function fieldLabel(key: string): string {
    const spaced = key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .toLowerCase()
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
