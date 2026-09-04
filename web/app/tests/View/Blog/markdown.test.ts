import { describe, expect, it } from "vitest"
import { parseInlines, parseMarkdown, readingTimeMinutes } from "../../../src/View/Blog/markdown"

describe("parseInlines", () => {
    it("parses the four inline marks around plain text", () => {
        const inlines = parseInlines("a **b** c *d* e `f` g [h](https://x.test) i")
        expect(inlines).toEqual([
            { kind: "text", text: "a " },
            { kind: "bold", text: "b" },
            { kind: "text", text: " c " },
            { kind: "italic", text: "d" },
            { kind: "text", text: " e " },
            { kind: "code", text: "f" },
            { kind: "text", text: " g " },
            { kind: "link", text: "h", href: "https://x.test" },
            { kind: "text", text: " i" },
        ])
    })

    it("treats unterminated marks as plain text", () => {
        expect(parseInlines("a **b and *c")).toEqual([{ kind: "text", text: "a **b and *c" }])
        expect(parseInlines("[label](no-close")).toEqual([{ kind: "text", text: "[label](no-close" }])
    })
})

describe("parseMarkdown", () => {
    it("parses headings, paragraphs, quotes, lists, dividers, and code fences", () => {
        const blocks = parseMarkdown(
            [
                "### Title",
                "",
                "One line",
                "wrapped onto two.",
                "",
                "> quoted first",
                "> quoted second",
                "",
                "- alpha",
                "- beta",
                "",
                "1. first",
                "2. second",
                "",
                "---",
                "",
                "```ts",
                "const x = 1",
                "```",
            ].join("\n"),
        )
        expect(blocks.map((b) => b.kind)).toEqual([
            "heading",
            "paragraph",
            "quote",
            "list",
            "list",
            "divider",
            "code",
        ])
        const [heading, paragraph, quote, unordered, orderedList, , code] = blocks
        expect(heading).toMatchObject({ level: 3 })
        expect(paragraph).toMatchObject({
            inlines: [{ kind: "text", text: "One line wrapped onto two." }],
        })
        expect(quote).toMatchObject({
            inlines: [{ kind: "text", text: "quoted first quoted second" }],
        })
        expect(unordered).toMatchObject({ ordered: false })
        expect((unordered as { items: unknown[] }).items).toHaveLength(2)
        expect(orderedList).toMatchObject({ ordered: true })
        expect(code).toMatchObject({ language: "ts", text: "const x = 1" })
    })

    it("keeps code fence contents verbatim, including markdown-looking lines", () => {
        const blocks = parseMarkdown("```\n# not a heading\n- not a list\n```")
        expect(blocks).toEqual([{ kind: "code", language: "", text: "# not a heading\n- not a list" }])
    })
})

describe("readingTimeMinutes", () => {
    it("rounds up at 220 words per minute with a one-minute floor", () => {
        expect(readingTimeMinutes("hi")).toBe(1)
        expect(readingTimeMinutes(Array(221).fill("word").join(" "))).toBe(2)
    })
})
