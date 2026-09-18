/**
 * The document template contract. Templates are files in the repo (see
 * /firebase/functions/documents/templates/<key>/), not database rows, so
 * agents and humans edit them like any other source file and they ship with
 * the functions bundle. docs/documents.md describes the authoring recipe.
 */

/** Page sizes the PDF renderer accepts; @page CSS and the renderer agree. */
export type DocumentPageSize = "Letter" | "A4" | "Letter-landscape" | "A4-landscape"

/** All accepted pageSize values, for validation and error messages. */
export const DOCUMENT_PAGE_SIZES: readonly DocumentPageSize[] = [
    "Letter",
    "A4",
    "Letter-landscape",
    "A4-landscape",
]

/**
 * Splits a pageSize into the pieces Chromium's print API takes: the paper
 * format plus an orientation flag. The CSS @page equivalent is
 * `size: <format> landscape`.
 */
export function parsePageSize(pageSize: DocumentPageSize): { format: "Letter" | "A4"; landscape: boolean } {
    return pageSize === "Letter-landscape"
        ? { format: "Letter", landscape: true }
        : pageSize === "A4-landscape"
          ? { format: "A4", landscape: true }
          : { format: pageSize, landscape: false }
}

/**
 * One field in a template's data schema. Mirrors the shape agents author in
 * schema.json: a named tree of typed fields with optional nested objects
 * (fields) and typed array items (items).
 */
export interface DocumentTemplateField {
    type?: "string" | "number" | "boolean" | "array" | "object"
    required?: boolean
    /** Extra string validation: "email" or "date" (YYYY-MM-DD). */
    format?: string
    fields?: Record<string, DocumentTemplateField>
    items?: DocumentTemplateField
}

/** The parsed schema.json of one template. */
export interface DocumentTemplateSchema {
    /** Human display name, e.g. "Invoice". */
    name: string
    description?: string
    /** Defaults to "Letter" when omitted. */
    pageSize?: DocumentPageSize
    fields: Record<string, DocumentTemplateField>
}

/** A fully loaded template: schema plus its Mustache-tagged html and css. */
export interface DocumentTemplate {
    /** The directory name under documents/templates; the API identifier. */
    key: string
    name: string
    description?: string
    pageSize: DocumentPageSize
    html: string
    css: string
    fields: Record<string, DocumentTemplateField>
    /** Sample overrides (sample.json) used for previews and tests. */
    sample: Record<string, unknown>
}
