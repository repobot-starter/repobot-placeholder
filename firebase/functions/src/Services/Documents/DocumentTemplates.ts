import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { RpcError } from "../../Utils/RpcError.js"
import {
    DOCUMENT_PAGE_SIZES,
    DocumentPageSize,
    DocumentTemplate,
    DocumentTemplateSchema,
} from "./DocumentTemplateTypes.js"

/**
 * Loads document templates from /firebase/functions/documents/templates.
 * Each template is a directory whose name is the template key, containing
 * template.html, template.css, schema.json, and sample.json. Loaded once and
 * cached: template files are immutable within a running process (edits land
 * via redeploy, or emulator restart locally).
 */

let cachedTemplates: Map<string, DocumentTemplate> | undefined

/** All templates, sorted by key. */
export function listDocumentTemplates(): DocumentTemplate[] {
    return [...loadTemplates().values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** One template by key, or NOT_FOUND with the known keys spelled out. */
export function getDocumentTemplate(key: string): DocumentTemplate {
    const template = loadTemplates().get(key)
    if (template === undefined) {
        const known = [...loadTemplates().keys()].sort().join(", ")
        throw new RpcError(
            "NOT_FOUND",
            `Unknown document template '${key}'. Known templates: ${known === "" ? "(none)" : known}. ` +
                "Templates live in firebase/functions/documents/templates/<key>/.",
        )
    }
    return template
}

/** Test-only: clears the cache so suites can exercise loading paths. */
export function resetDocumentTemplatesForTests(): void {
    cachedTemplates = undefined
}

function loadTemplates(): Map<string, DocumentTemplate> {
    if (cachedTemplates !== undefined) {
        return cachedTemplates
    }
    const templatesRoot = resolveTemplatesRoot()
    const templates = new Map<string, DocumentTemplate>()
    for (const entry of readdirSync(templatesRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue
        }
        templates.set(entry.name, loadTemplate(join(templatesRoot, entry.name), entry.name))
    }
    cachedTemplates = templates
    return templates
}

/**
 * The templates directory relative to this module. Two layouts exist: tests
 * run the TypeScript sources (src/Services/Documents -> three levels up) and
 * deployed code runs compiled output (lib/src/Services/Documents -> four
 * levels up); both land on the functions package root.
 */
function resolveTemplatesRoot(): string {
    const moduleDir = dirname(fileURLToPath(import.meta.url))
    for (const levelsUp of ["../../..", "../../../.."]) {
        const candidate = join(moduleDir, levelsUp, "documents", "templates")
        if (existsSync(candidate)) {
            return candidate
        }
    }
    throw new RpcError(
        "FAILED_PRECONDITION",
        "The documents/templates directory was not found in the functions package. " +
            "Templates must live in firebase/functions/documents/templates/<key>/.",
    )
}

function loadTemplate(templateDir: string, key: string): DocumentTemplate {
    const schema = parseSchemaFile(templateDir, key)
    return {
        key,
        name: schema.name,
        description: schema.description,
        pageSize: validatedPageSize(schema.pageSize, key),
        html: readTemplateFile(templateDir, key, "template.html"),
        css: readTemplateFile(templateDir, key, "template.css"),
        fields: schema.fields ?? {},
        sample: parseJsonFile(templateDir, key, "sample.json"),
    }
}

function parseSchemaFile(templateDir: string, key: string): DocumentTemplateSchema {
    const parsed = parseJsonFile(templateDir, key, "schema.json")
    if (typeof parsed.name !== "string" || parsed.name === "") {
        throw new RpcError("FAILED_PRECONDITION", `Template '${key}' schema.json needs a non-empty "name".`)
    }
    if (parsed.fields === null || typeof parsed.fields !== "object" || Array.isArray(parsed.fields)) {
        throw new RpcError(
            "FAILED_PRECONDITION",
            `Template '${key}' schema.json needs a "fields" object declaring its variables.`,
        )
    }
    return parsed as unknown as DocumentTemplateSchema
}

function validatedPageSize(pageSize: unknown, key: string): DocumentPageSize {
    if (pageSize === undefined) {
        return "Letter"
    }
    if (DOCUMENT_PAGE_SIZES.includes(pageSize as DocumentPageSize)) {
        return pageSize as DocumentPageSize
    }
    throw new RpcError(
        "FAILED_PRECONDITION",
        `Template '${key}' schema.json has unsupported pageSize '${String(pageSize)}'; ` +
            `use one of: ${DOCUMENT_PAGE_SIZES.join(", ")}.`,
    )
}

function parseJsonFile(templateDir: string, key: string, fileName: string): Record<string, unknown> {
    const raw = readTemplateFile(templateDir, key, fileName)
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new RpcError("FAILED_PRECONDITION", `Template '${key}' ${fileName} is not valid JSON.`, {
            cause: error,
        })
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new RpcError("FAILED_PRECONDITION", `Template '${key}' ${fileName} must be a JSON object.`)
    }
    return parsed as Record<string, unknown>
}

function readTemplateFile(templateDir: string, key: string, fileName: string): string {
    const filePath = join(templateDir, fileName)
    if (!existsSync(filePath)) {
        throw new RpcError(
            "FAILED_PRECONDITION",
            `Template '${key}' is missing ${fileName}. Every template directory needs ` +
                "template.html, template.css, schema.json, and sample.json.",
        )
    }
    return readFileSync(filePath, "utf8")
}
