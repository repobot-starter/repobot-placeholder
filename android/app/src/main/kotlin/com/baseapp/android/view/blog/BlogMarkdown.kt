package com.baseapp.android.view.blog

import kotlin.math.ceil
import kotlin.math.max

/**
 * The blog's markdown subset, mirrored from the web pack's markdown.ts (and
 * BlogMarkdown.swift on iOS): headings #–###, paragraphs, fenced code,
 * > quotes, flat lists, --- dividers, and the four inline marks (**bold**,
 * *italic*, `code`, [link](url)). All three platforms parse the same post
 * bodies into the same block structure.
 */
sealed class BlogInline {
    data class Text(val text: String) : BlogInline()
    data class Bold(val text: String) : BlogInline()
    data class Italic(val text: String) : BlogInline()
    data class Code(val text: String) : BlogInline()
    data class Link(val text: String, val href: String) : BlogInline()
}

sealed class BlogBlock {
    data class Heading(val level: Int, val inlines: List<BlogInline>) : BlogBlock()
    data class Paragraph(val inlines: List<BlogInline>) : BlogBlock()
    data class Code(val language: String, val text: String) : BlogBlock()
    data class Quote(val inlines: List<BlogInline>) : BlogBlock()
    data class ListBlock(val ordered: Boolean, val items: List<List<BlogInline>>) : BlogBlock()
    object Divider : BlogBlock()
}

object BlogMarkdown {

    /** Parse the inline marks of a single line of text. */
    fun parseInlines(text: String): List<BlogInline> {
        val inlines = mutableListOf<BlogInline>()
        val plain = StringBuilder()
        var i = 0

        fun flush() {
            if (plain.isNotEmpty()) {
                inlines.add(BlogInline.Text(plain.toString()))
                plain.clear()
            }
        }

        // A closing * or ** only counts when the span is non-empty and
        // doesn't end in a space — stray asterisks stay plain text.
        fun closes(end: Int, contentStart: Int): Boolean =
            end > contentStart && text[end - 1] != ' '

        while (i < text.length) {
            if (text.startsWith("**", i)) {
                val end = text.indexOf("**", i + 2)
                if (end >= 0 && closes(end, i + 2)) {
                    flush()
                    inlines.add(BlogInline.Bold(text.substring(i + 2, end)))
                    i = end + 2
                    continue
                }
            }
            if (text[i] == '*') {
                val end = text.indexOf('*', i + 1)
                if (end >= 0 && closes(end, i + 1)) {
                    flush()
                    inlines.add(BlogInline.Italic(text.substring(i + 1, end)))
                    i = end + 1
                    continue
                }
            }
            if (text[i] == '`') {
                val end = text.indexOf('`', i + 1)
                if (end > i + 1) {
                    flush()
                    inlines.add(BlogInline.Code(text.substring(i + 1, end)))
                    i = end + 1
                    continue
                }
            }
            if (text[i] == '[') {
                val close = text.indexOf("](", i + 1)
                val end = if (close >= 0) text.indexOf(')', close + 2) else -1
                if (close > i && end > close) {
                    flush()
                    inlines.add(
                        BlogInline.Link(
                            text = text.substring(i + 1, close),
                            href = text.substring(close + 2, end),
                        ),
                    )
                    i = end + 1
                    continue
                }
            }
            plain.append(text[i])
            i += 1
        }
        flush()
        return inlines
    }

    private fun isUnordered(s: String) = s.startsWith("- ")

    private val orderedRegex = Regex("""^\d+\. """)

    private fun isOrdered(s: String) = orderedRegex.containsMatchIn(s)

    /** Parse a markdown document into a flat list of blocks. */
    fun parseMarkdown(markdown: String): List<BlogBlock> {
        val blocks = mutableListOf<BlogBlock>()
        val lines = markdown.split("\n")
        var i = 0
        while (i < lines.size) {
            val trimmed = lines[i].trim()

            if (trimmed.isEmpty()) {
                i += 1
                continue
            }

            if (trimmed.startsWith("```")) {
                val language = trimmed.removePrefix("```").trim()
                val body = mutableListOf<String>()
                i += 1
                while (i < lines.size && !lines[i].trim().startsWith("```")) {
                    body.add(lines[i])
                    i += 1
                }
                i += 1 // closing fence
                blocks.add(BlogBlock.Code(language, body.joinToString("\n")))
                continue
            }

            val headingMatch = Regex("""^(#{1,3}) (.*)$""").find(trimmed)
            if (headingMatch != null) {
                blocks.add(
                    BlogBlock.Heading(
                        level = headingMatch.groupValues[1].length,
                        inlines = parseInlines(headingMatch.groupValues[2]),
                    ),
                )
                i += 1
                continue
            }

            if (trimmed == "---") {
                blocks.add(BlogBlock.Divider)
                i += 1
                continue
            }

            if (trimmed.startsWith("> ")) {
                val parts = mutableListOf<String>()
                while (i < lines.size && lines[i].trim().startsWith("> ")) {
                    parts.add(lines[i].trim().removePrefix("> "))
                    i += 1
                }
                blocks.add(BlogBlock.Quote(parseInlines(parts.joinToString(" "))))
                continue
            }

            if (isUnordered(trimmed) || isOrdered(trimmed)) {
                val ordered = isOrdered(trimmed)
                val items = mutableListOf<List<BlogInline>>()
                while (i < lines.size) {
                    val line = lines[i].trim()
                    val matches = if (ordered) isOrdered(line) else isUnordered(line)
                    if (!matches) break
                    val text =
                        if (ordered) line.replaceFirst(orderedRegex, "") else line.removePrefix("- ")
                    items.add(parseInlines(text))
                    i += 1
                }
                blocks.add(BlogBlock.ListBlock(ordered, items))
                continue
            }

            // Paragraph: merge consecutive plain lines.
            val parts = mutableListOf(trimmed)
            i += 1
            while (i < lines.size) {
                val next = lines[i].trim()
                val isBlockStart =
                    next.isEmpty() || next.startsWith("```") || next.startsWith("#") ||
                        next.startsWith("> ") || next == "---" || isUnordered(next) || isOrdered(next)
                if (isBlockStart) break
                parts.add(next)
                i += 1
            }
            blocks.add(BlogBlock.Paragraph(parseInlines(parts.joinToString(" "))))
        }
        return blocks
    }

    /** Estimated reading time at 220 words per minute; never below one minute. */
    fun readingTimeMinutes(markdown: String): Int {
        val words = markdown.split(Regex("""\s+""")).count { it.isNotEmpty() }
        return max(1, ceil(words / 220.0).toInt())
    }
}
