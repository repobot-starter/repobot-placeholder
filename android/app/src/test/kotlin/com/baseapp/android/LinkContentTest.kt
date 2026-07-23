package com.baseapp.android

import com.baseapp.android.view.link.LinkContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * LinkBot has no engine — its correctness is content integrity. These tests
 * keep the agent-editable content file honest: every link must be openable
 * and the theme swatches must stay distinct.
 */
class LinkContentTest {
    @Test
    fun `profile fields are present`() {
        assertFalse(LinkContent.profile.name.isEmpty())
        assertTrue(LinkContent.profile.handle.startsWith("@"))
        assertFalse(LinkContent.profile.bio.isEmpty())
        assertFalse(LinkContent.profile.avatarEmoji.isEmpty())
    }

    @Test
    fun `every link has an https url and a unique label`() {
        assertTrue(LinkContent.links.isNotEmpty())
        val labels = LinkContent.links.map { it.label }
        assertEquals("labels must be unique", labels.toSet().size, labels.size)
        LinkContent.links.forEach { link ->
            assertFalse(link.label.isEmpty())
            assertFalse(link.note.isEmpty())
            assertTrue("${link.label} must use https", link.url.startsWith("https://"))
        }
    }

    @Test
    fun `every social has an https url`() {
        assertTrue(LinkContent.socials.isNotEmpty())
        LinkContent.socials.forEach { social ->
            assertTrue("${social.label} must use https", social.url.startsWith("https://"))
            assertFalse(social.monogram.isEmpty())
        }
    }

    @Test
    fun `themes have unique keys and gradient stops`() {
        assertTrue(LinkContent.themes.size >= 2)
        val keys = LinkContent.themes.map { it.key }
        assertEquals("theme keys must be unique", keys.toSet().size, keys.size)
        LinkContent.themes.forEach { theme ->
            assertTrue(
                "${theme.key} needs at least two gradient stops",
                theme.backgroundColors.size >= 2,
            )
        }
    }
}
