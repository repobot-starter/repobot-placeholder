// Verbatim-declaration extraction shared by the generated kernel references
// (docs/landing-content.md, docs/web-app-content.md). The generators keep
// declarations verbatim so the doc IS the source contract — see
// generate-landing-reference.mjs for the pattern's rationale.

/**
 * The JSDoc block that ends on the line directly above `index`, or "".
 * Extraction keeps declarations verbatim so the doc IS the source contract.
 */
export function docCommentBefore(lines, index) {
    let end = index - 1
    while (end >= 0 && lines[end].trim() === "") {
        end -= 1
    }
    if (end < 0 || !lines[end].trim().endsWith("*/")) {
        return ""
    }
    let start = end
    while (start >= 0 && !lines[start].trim().startsWith("/**")) {
        start -= 1
    }
    if (start < 0) {
        return ""
    }
    return lines.slice(start, end + 1).join("\n")
}

/** An exported declaration (type alias or interface) extracted verbatim. */
export function extractDeclaration(source, name) {
    const lines = source.split("\n")
    const headerPattern = new RegExp(`^export (type|interface) ${name}\\b`)
    const startIndex = lines.findIndex((line) => headerPattern.test(line))
    if (startIndex === -1) {
        return undefined
    }
    const doc = docCommentBefore(lines, startIndex)
    const isInterface = /^export interface/.test(lines[startIndex])
    let endIndex = startIndex
    if (isInterface || lines[startIndex].includes("{")) {
        let depth = 0
        for (let index = startIndex; index < lines.length; index += 1) {
            for (const char of lines[index]) {
                if (char === "{") depth += 1
                if (char === "}") depth -= 1
            }
            if (depth === 0 && lines[index].includes("}")) {
                endIndex = index
                break
            }
        }
    } else {
        // Type alias: runs until the first line that neither continues a
        // union (`|`, `=`) nor is indented continuation content.
        endIndex = startIndex
        for (let index = startIndex + 1; index < lines.length; index += 1) {
            const trimmed = lines[index].trim()
            if (trimmed === "" || /^(export|import|function|const|interface|type)\b/.test(trimmed)) {
                break
            }
            endIndex = index
        }
    }
    const body = lines.slice(startIndex, endIndex + 1).join("\n")
    return doc ? `${doc}\n${body}` : body
}

/** The JSDoc blurb above `export function <componentName>(`, or "". */
export function componentBlurb(source, componentName) {
    const lines = source.split("\n")
    const index = lines.findIndex((line) =>
        new RegExp(`^export function ${componentName}[(<]`).test(line),
    )
    if (index === -1) {
        return ""
    }
    return docCommentBefore(lines, index)
        .split("\n")
        .map((line) =>
            line
                .replace(/^\s*\/?\*+\/?\s?/, "")
                .replace(/\*\/\s*$/, "")
                .trim(),
        )
        .filter((line) => line.length > 0)
        .join(" ")
        .trim()
}

/** Every `export interface X` / `export type X` name in the module, in order. */
export function exportedDeclarationNames(source) {
    return [...source.matchAll(/^export (?:interface|type) (\w+)/gm)].map(([, name]) => name)
}
