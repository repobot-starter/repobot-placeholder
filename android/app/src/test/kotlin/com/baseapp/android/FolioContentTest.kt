package com.baseapp.android

import com.baseapp.android.view.folio.FolioContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * FolioBot has no engine — its correctness is content integrity. These tests
 * keep the agent-editable content file honest.
 */
class FolioContentTest {
    @Test
    fun `profile fields are present`() {
        assertFalse(FolioContent.profile.name.isEmpty())
        assertFalse(FolioContent.profile.statement.isEmpty())
        assertTrue(FolioContent.profile.email.contains("@"))
    }

    @Test
    fun `every project is complete with a unique title and https url`() {
        assertTrue(FolioContent.projects.isNotEmpty())
        val titles = FolioContent.projects.map { it.title }
        assertEquals("titles must be unique", titles.toSet().size, titles.size)
        FolioContent.projects.forEach { project ->
            assertFalse(project.title.isEmpty())
            assertFalse(project.description.isEmpty())
            assertTrue("${project.title} needs at least one tag", project.tags.isNotEmpty())
            assertTrue("${project.title} must use https", project.url.startsWith("https://"))
        }
    }

    @Test
    fun `allTags preserves first-appearance order without duplicates`() {
        val tags = FolioContent.allTags()
        assertEquals("tags must be unique", tags.toSet().size, tags.size)
        assertEquals(FolioContent.projects.first().tags.first(), tags.first())
        assertEquals(FolioContent.projects.flatMap { it.tags }.toSet(), tags.toSet())
    }

    @Test
    fun `about and socials are present`() {
        assertTrue(FolioContent.aboutParagraphs.isNotEmpty())
        assertTrue(FolioContent.skills.isNotEmpty())
        FolioContent.socials.forEach { social ->
            assertTrue(social.url.startsWith("https://"))
        }
    }
}
