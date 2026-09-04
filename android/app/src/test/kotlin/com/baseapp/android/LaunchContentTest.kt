package com.baseapp.android

import com.baseapp.android.view.launch.LaunchContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * LaunchBot has no engine — its correctness is content integrity. These
 * tests keep the agent-editable content file honest, especially the pricing
 * table (a wrong yearly price is the most embarrassing landing-page bug).
 */
class LaunchContentTest {
    @Test
    fun `product copy is present`() {
        assertFalse(LaunchContent.product.name.isEmpty())
        assertFalse(LaunchContent.product.headline.isEmpty())
        assertFalse(LaunchContent.product.subheadline.isEmpty())
        assertFalse(LaunchContent.product.waitlistCta.isEmpty())
    }

    @Test
    fun `features and steps are complete with unique titles`() {
        assertTrue(LaunchContent.features.size >= 3)
        val titles = LaunchContent.features.map { it.title }
        assertEquals(titles.toSet().size, titles.size)
        assertEquals("the how-it-works row is designed for 3 steps", 3, LaunchContent.steps.size)
    }

    @Test
    fun `pricing tiers are coherent`() {
        assertTrue(LaunchContent.pricing.isNotEmpty())
        val names = LaunchContent.pricing.map { it.name }
        assertEquals(names.toSet().size, names.size)
        assertEquals(
            "exactly one tier should carry the highlight",
            1,
            LaunchContent.pricing.count { it.highlighted },
        )
        LaunchContent.pricing.forEach { tier ->
            assertTrue(tier.monthly >= 0)
            assertTrue(
                "${tier.name}: yearly per-month price must not exceed monthly",
                tier.yearlyPerMonth <= tier.monthly,
            )
            assertTrue(tier.features.isNotEmpty())
        }
    }

    @Test
    fun `faq entries are complete`() {
        assertTrue(LaunchContent.faq.isNotEmpty())
        LaunchContent.faq.forEach { item ->
            assertFalse(item.question.isEmpty())
            assertFalse(item.answer.isEmpty())
        }
    }
}
