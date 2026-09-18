package com.baseapp.android

import com.baseapp.android.view.blog.BlogBlock
import com.baseapp.android.view.blog.BlogInline
import com.baseapp.android.view.blog.BlogMarkdown
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Mirrors the web pack's markdown.test.ts — the parser is the blog's
 * "engine", and all three platforms must produce the same block structure
 * from the same post bodies.
 */
class BlogMarkdownTest {
    @Test
    fun `parses the four inline marks around plain text`() {
        val inlines = BlogMarkdown.parseInlines("a **b** c *d* e `f` g [h](https://x.test) i")
        assertEquals(
            listOf(
                BlogInline.Text("a "),
                BlogInline.Bold("b"),
                BlogInline.Text(" c "),
                BlogInline.Italic("d"),
                BlogInline.Text(" e "),
                BlogInline.Code("f"),
                BlogInline.Text(" g "),
                BlogInline.Link("h", "https://x.test"),
                BlogInline.Text(" i"),
            ),
            inlines,
        )
    }

    @Test
    fun `treats unterminated marks as plain text`() {
        assertEquals(
            listOf<BlogInline>(BlogInline.Text("a **b and *c")),
            BlogMarkdown.parseInlines("a **b and *c"),
        )
        assertEquals(
            listOf<BlogInline>(BlogInline.Text("[label](no-close")),
            BlogMarkdown.parseInlines("[label](no-close"),
        )
    }

    @Test
    fun `parses every block kind`() {
        val markdown = listOf(
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
        ).joinToString("\n")

        val blocks = BlogMarkdown.parseMarkdown(markdown)
        assertEquals(7, blocks.size)
        assertEquals(BlogBlock.Heading(3, listOf(BlogInline.Text("Title"))), blocks[0])
        assertEquals(BlogBlock.Paragraph(listOf(BlogInline.Text("One line wrapped onto two."))), blocks[1])
        assertEquals(BlogBlock.Quote(listOf(BlogInline.Text("quoted first quoted second"))), blocks[2])
        assertEquals(
            BlogBlock.ListBlock(
                ordered = false,
                items = listOf(listOf(BlogInline.Text("alpha")), listOf(BlogInline.Text("beta"))),
            ),
            blocks[3],
        )
        assertEquals(
            BlogBlock.ListBlock(
                ordered = true,
                items = listOf(listOf(BlogInline.Text("first")), listOf(BlogInline.Text("second"))),
            ),
            blocks[4],
        )
        assertEquals(BlogBlock.Divider, blocks[5])
        assertEquals(BlogBlock.Code("ts", "const x = 1"), blocks[6])
    }

    @Test
    fun `keeps code fence contents verbatim`() {
        val blocks = BlogMarkdown.parseMarkdown("```\n# not a heading\n- not a list\n```")
        assertEquals(
            listOf<BlogBlock>(BlogBlock.Code("", "# not a heading\n- not a list")),
            blocks,
        )
    }

    @Test
    fun `reading time rounds up with a one-minute floor`() {
        assertEquals(1, BlogMarkdown.readingTimeMinutes("hi"))
        val long = List(221) { "word" }.joinToString(" ")
        assertEquals(2, BlogMarkdown.readingTimeMinutes(long))
    }
}
