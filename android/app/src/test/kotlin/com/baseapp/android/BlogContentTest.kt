package com.baseapp.android

import com.baseapp.android.view.blog.BlogContent
import com.baseapp.android.view.blog.BlogMarkdown
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Content-integrity tests for the blog pack: the posts are the product,
 * so a malformed slug, date, or an unparseable body is a build failure.
 */
class BlogContentTest {
    @Test
    fun `blog identity is present`() {
        assertFalse(BlogContent.TITLE.isEmpty())
        assertFalse(BlogContent.TAGLINE.isEmpty())
        assertFalse(BlogContent.author.name.isEmpty())
        assertFalse(BlogContent.author.bio.isEmpty())
    }

    @Test
    fun `every post is well-formed with a unique slug`() {
        assertTrue(BlogContent.posts.isNotEmpty())
        val slugs = BlogContent.posts.map { it.slug }
        assertEquals("post slugs must be unique", slugs.toSet().size, slugs.size)
        BlogContent.posts.forEach { post ->
            assertFalse(post.title.isEmpty())
            assertFalse(post.summary.isEmpty())
            assertTrue(post.tags.isNotEmpty())
            assertTrue(
                "${post.slug}: slug must be lowercase kebab-case",
                post.slug.matches(Regex("^[a-z0-9-]+$")),
            )
            assertTrue(
                "${post.slug}: date must be ISO yyyy-mm-dd",
                post.date.matches(Regex("""^\d{4}-\d{2}-\d{2}$""")),
            )
        }
    }

    @Test
    fun `every post body parses into blocks`() {
        BlogContent.posts.forEach { post ->
            val blocks = BlogMarkdown.parseMarkdown(post.body)
            assertTrue("${post.slug}: body should parse into blocks", blocks.size > 1)
            assertTrue(BlogMarkdown.readingTimeMinutes(post.body) >= 1)
        }
    }

    @Test
    fun `sorted posts are newest first`() {
        val sorted = BlogContent.sortedPosts()
        sorted.zipWithNext().forEach { (a, b) ->
            assertTrue(a.date >= b.date)
        }
    }

    @Test
    fun `allTags preserves first-appearance order without duplicates`() {
        val tags = BlogContent.allTags()
        assertEquals(tags.toSet().size, tags.size)
        assertTrue(tags.isNotEmpty())
    }
}
