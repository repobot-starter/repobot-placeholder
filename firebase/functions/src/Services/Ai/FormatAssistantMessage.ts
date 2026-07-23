import { AiChatSegment } from "./AiChatTypes.js"

/**
 * Splits streaming assistant text into displayable segments. The model writes
 * light markdown (headings, bullets, fenced code, quotes); clients render
 * typed segments instead of parsing markdown themselves. The function is
 * re-run on the full accumulated text at every stream delta, so it must be
 * fast and tolerant of half-written trailing lines.
 */
export function formatAssistantMessage(text: string): AiChatSegment[] {
    const segments: AiChatSegment[] = []
    let paragraph = ""
    let codeBlock: string | undefined

    const flushParagraph = (): void => {
        const content = paragraph.trim()
        if (content !== "") {
            segments.push({ format: "PARAGRAPH", content })
        }
        paragraph = ""
    }

    for (const line of text.split("\n")) {
        const trimmed = line.trim()

        if (trimmed.startsWith("```")) {
            if (codeBlock === undefined) {
                flushParagraph()
                codeBlock = ""
            } else {
                segments.push({ format: "CODE", content: codeBlock.replace(/\n$/, "") })
                codeBlock = undefined
            }
            continue
        }
        if (codeBlock !== undefined) {
            codeBlock += `${line}\n`
            continue
        }

        if (trimmed === "") {
            flushParagraph()
            continue
        }
        if (/^#{1,6}\s+/.test(trimmed)) {
            flushParagraph()
            segments.push({ format: "TITLE", content: trimmed.replace(/^#{1,6}\s+/, "") })
            continue
        }
        if (/^(\*\*[^*]+\*\*:?)$/.test(trimmed)) {
            flushParagraph()
            segments.push({ format: "TITLE", content: trimmed.replace(/\*\*/g, "").replace(/:$/, "") })
            continue
        }
        if (/^([-*•]|\d+[.)])\s+/.test(trimmed)) {
            flushParagraph()
            segments.push({ format: "LIST_ITEM", content: trimmed.replace(/^([-*•]|\d+[.)])\s+/, "") })
            continue
        }
        if (trimmed.startsWith(">")) {
            flushParagraph()
            segments.push({ format: "QUOTE", content: trimmed.replace(/^>\s?/, "") })
            continue
        }

        paragraph += (paragraph === "" ? "" : " ") + trimmed
    }

    // A still-open fence means the model is mid-code-block; show what we have.
    if (codeBlock !== undefined && codeBlock.trim() !== "") {
        segments.push({ format: "CODE", content: codeBlock.replace(/\n$/, "") })
    }
    flushParagraph()

    return segments
}
