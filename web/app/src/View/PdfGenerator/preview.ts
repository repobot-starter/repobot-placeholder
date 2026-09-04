/**
 * The live preview's renderer: a dependency-free subset of Mustache
 * covering exactly what the repo's document templates use — `{{variable}}`
 * (HTML-escaped, dot paths allowed), `{{#section}}` over arrays / truthy
 * values, and `{{^section}}` inverted blocks. The server renders the real
 * PDF from the same tags (firebase/functions/documents), so a faithful
 * client-side pass keeps the preview honest without shipping an editor or
 * template dependency.
 */

type TemplateNode =
    | { kind: "text"; text: string }
    | { kind: "variable"; path: string }
    | { kind: "section"; inverted: boolean; path: string; children: TemplateNode[] }

const TAG_PATTERN = /\{\{\s*([#^/]?)\s*([\w$][\w$.-]*)\s*\}\}/g

export function renderTemplate(template: string, data: Record<string, unknown>): string {
    return renderNodes(parseTemplate(template), [data])
}

/**
 * Builds the srcdoc for the preview iframe: the mustache-rendered HTML with
 * the editable stylesheet injected. Templates are full documents, so the
 * style rides in </head> when one exists and is prepended otherwise.
 */
export function buildPreviewHtml(html: string, css: string, data: Record<string, unknown>): string {
    const rendered = renderTemplate(html, data)
    const styleTag = `<style>\n${css}\n</style>`
    if (rendered.includes("</head>")) {
        return rendered.replace("</head>", `${styleTag}\n</head>`)
    }
    return `${styleTag}\n${rendered}`
}

function parseTemplate(template: string): TemplateNode[] {
    const root: TemplateNode[] = []
    const openSections: TemplateNode[][] = []
    let children = root
    let cursor = 0
    for (const match of template.matchAll(TAG_PATTERN)) {
        const index = match.index ?? 0
        if (index > cursor) {
            children.push({ kind: "text", text: template.slice(cursor, index) })
        }
        cursor = index + match[0].length
        const sigil = match[1]
        const path = match[2] ?? ""
        if (sigil === "#" || sigil === "^") {
            const section: TemplateNode = { kind: "section", inverted: sigil === "^", path, children: [] }
            children.push(section)
            openSections.push(children)
            children = section.children
        } else if (sigil === "/") {
            // A stray close renders as nothing rather than throwing — the
            // user is mid-edit most of the time.
            children = openSections.pop() ?? root
        } else {
            children.push({ kind: "variable", path })
        }
    }
    if (cursor < template.length) {
        children.push({ kind: "text", text: template.slice(cursor) })
    }
    return root
}

function renderNodes(nodes: TemplateNode[], stack: unknown[]): string {
    let output = ""
    for (const node of nodes) {
        if (node.kind === "text") {
            output += node.text
        } else if (node.kind === "variable") {
            output += escapeHtml(stringify(lookup(node.path, stack)))
        } else {
            const value = lookup(node.path, stack)
            const truthy = isTruthySection(value)
            if (node.inverted) {
                if (!truthy) {
                    output += renderNodes(node.children, stack)
                }
            } else if (Array.isArray(value)) {
                for (const item of value) {
                    output += renderNodes(node.children, [...stack, item])
                }
            } else if (truthy) {
                output += renderNodes(node.children, [...stack, value])
            }
        }
    }
    return output
}

function isTruthySection(value: unknown): boolean {
    if (Array.isArray(value)) {
        return value.length > 0
    }
    return value !== undefined && value !== null && value !== false && value !== "" && value !== 0
}

/** Mustache resolution: the nearest context frame that owns the first key. */
function lookup(path: string, stack: unknown[]): unknown {
    const segments = path.split(".")
    const first = segments[0] ?? ""
    for (let index = stack.length - 1; index >= 0; index -= 1) {
        const frame = stack[index]
        if (typeof frame === "object" && frame !== null && first in (frame as Record<string, unknown>)) {
            let value: unknown = frame
            for (const segment of segments) {
                if (typeof value !== "object" || value === null) {
                    return undefined
                }
                value = (value as Record<string, unknown>)[segment]
            }
            return value
        }
    }
    return undefined
}

function stringify(value: unknown): string {
    if (value === undefined || value === null) {
        return ""
    }
    if (typeof value === "string") {
        return value
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value)
    }
    return ""
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}
