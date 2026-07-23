/**
 * A tiny markdown parser for the blog pack.
 *
 * Deliberately a subset — headings, paragraphs, fenced code, quotes, flat
 * lists, dividers, and the four inline marks (**bold**, *italic*, `code`,
 * [link](url)). Posts are written by the project owner (often via the
 * agent), not arbitrary users, so a predictable subset beats a full
 * CommonMark dependency. The same parser is mirrored in
 * BlogMarkdown.swift and BlogMarkdown.kt so all three platforms render
 * identical structure from the same content.
 */

export type Inline =
    | { kind: "text"; text: string }
    | { kind: "bold"; text: string }
    | { kind: "italic"; text: string }
    | { kind: "code"; text: string }
    | { kind: "link"; text: string; href: string }

export type Block =
    | { kind: "heading"; level: number; inlines: Inline[] }
    | { kind: "paragraph"; inlines: Inline[] }
    | { kind: "code"; language: string; text: string }
    | { kind: "quote"; inlines: Inline[] }
    | { kind: "list"; ordered: boolean; items: Inline[][] }
    | { kind: "divider" }

/** Parse the inline marks of a single line of text. */
export function parseInlines(text: string): Inline[] {
    const inlines: Inline[] = []
    let plain = ""
    let i = 0
    const flush = (): void => {
        if (plain.length > 0) {
            inlines.push({ kind: "text", text: plain })
            plain = ""
        }
    }
    // A closing * or ** only counts when the span is non-empty and doesn't
    // end in a space — so a stray "4 * 5 * 6" or an unterminated mark stays
    // plain text instead of becoming surprise emphasis.
    const closes = (end: number, contentStart: number): boolean => end > contentStart && text[end - 1] !== " "
    while (i < text.length) {
        if (text.startsWith("**", i)) {
            const end = text.indexOf("**", i + 2)
            if (end >= 0 && closes(end, i + 2)) {
                flush()
                inlines.push({ kind: "bold", text: text.slice(i + 2, end) })
                i = end + 2
                continue
            }
        }
        if (text[i] === "*") {
            const end = text.indexOf("*", i + 1)
            if (end >= 0 && closes(end, i + 1)) {
                flush()
                inlines.push({ kind: "italic", text: text.slice(i + 1, end) })
                i = end + 1
                continue
            }
        }
        if (text[i] === "`") {
            const end = text.indexOf("`", i + 1)
            if (end > i + 1) {
                flush()
                inlines.push({ kind: "code", text: text.slice(i + 1, end) })
                i = end + 1
                continue
            }
        }
        if (text[i] === "[") {
            const close = text.indexOf("](", i + 1)
            const end = close >= 0 ? text.indexOf(")", close + 2) : -1
            if (close > i && end > close) {
                flush()
                inlines.push({
                    kind: "link",
                    text: text.slice(i + 1, close),
                    href: text.slice(close + 2, end),
                })
                i = end + 1
                continue
            }
        }
        plain += text[i]
        i += 1
    }
    flush()
    return inlines
}

/** Parse a markdown document into a flat list of blocks. */
export function parseMarkdown(markdown: string): Block[] {
    const blocks: Block[] = []
    const lines = markdown.split("\n")
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        if (trimmed.length === 0) {
            i += 1
            continue
        }

        if (trimmed.startsWith("```")) {
            const language = trimmed.slice(3).trim()
            const body: string[] = []
            i += 1
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                body.push(lines[i])
                i += 1
            }
            i += 1 // closing fence
            blocks.push({ kind: "code", language, text: body.join("\n") })
            continue
        }

        const headingMatch = /^(#{1,3}) (.*)$/.exec(trimmed)
        if (headingMatch) {
            blocks.push({
                kind: "heading",
                level: headingMatch[1].length,
                inlines: parseInlines(headingMatch[2]),
            })
            i += 1
            continue
        }

        if (trimmed === "---") {
            blocks.push({ kind: "divider" })
            i += 1
            continue
        }

        if (trimmed.startsWith("> ")) {
            const parts: string[] = []
            while (i < lines.length && lines[i].trim().startsWith("> ")) {
                parts.push(lines[i].trim().slice(2))
                i += 1
            }
            blocks.push({ kind: "quote", inlines: parseInlines(parts.join(" ")) })
            continue
        }

        const isUnordered = (s: string): boolean => s.startsWith("- ")
        const isOrdered = (s: string): boolean => /^\d+\. /.test(s)
        if (isUnordered(trimmed) || isOrdered(trimmed)) {
            const ordered = isOrdered(trimmed)
            const matches = (s: string): boolean => (ordered ? isOrdered(s) : isUnordered(s))
            const items: Inline[][] = []
            while (i < lines.length && matches(lines[i].trim())) {
                const item = lines[i].trim()
                const text = ordered ? item.replace(/^\d+\. /, "") : item.slice(2)
                items.push(parseInlines(text))
                i += 1
            }
            blocks.push({ kind: "list", ordered, items })
            continue
        }

        // Paragraph: merge consecutive plain lines.
        const parts: string[] = [trimmed]
        i += 1
        while (i < lines.length) {
            const next = lines[i].trim()
            const isBlockStart =
                next.length === 0 ||
                next.startsWith("```") ||
                next.startsWith("#") ||
                next.startsWith("> ") ||
                next === "---" ||
                isUnordered(next) ||
                isOrdered(next)
            if (isBlockStart) break
            parts.push(next)
            i += 1
        }
        blocks.push({ kind: "paragraph", inlines: parseInlines(parts.join(" ")) })
    }
    return blocks
}

/** Estimated reading time at 220 words per minute; never below one minute. */
export function readingTimeMinutes(markdown: string): number {
    const words = markdown.split(/\s+/).filter((w) => w.length > 0).length
    return Math.max(1, Math.ceil(words / 220))
}
