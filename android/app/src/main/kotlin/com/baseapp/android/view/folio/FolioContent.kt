package com.baseapp.android.view.folio

import androidx.compose.ui.graphics.Color

/**
 * Everything the FolioBot surface renders — the native twin of
 * `web/app/src/View/Folio/content.ts`. Edit this file (or ask the agent to)
 * and the app updates; there is no backend and no CMS.
 */
object FolioContent {
    data class Profile(
        val name: String,
        val role: String,
        val statement: String,
        val availability: String,
        val location: String,
        val email: String,
    )

    data class Project(
        val title: String,
        val year: String,
        val description: String,
        val tags: List<String>,
        val emoji: String,
        /** Accent tint behind the emoji artwork. */
        val accent: Color,
        val url: String,
    )

    data class SocialLink(
        val label: String,
        val url: String,
    )

    val profile = Profile(
        name = "Mina Okafor",
        role = "Product designer who codes",
        statement = "I design and build interfaces that feel obvious in hindsight.",
        availability = "Open to freelance projects",
        location = "Toronto, Canada",
        email = "mina@example.com",
    )

    val projects = listOf(
        Project(
            title = "Tidepool",
            year = "2026",
            description = "A calm budgeting app that rounds every balance to feelings, not cents. " +
                "Led design and shipped the React front end.",
            tags = listOf("Product", "Mobile"),
            emoji = "🌊",
            accent = Color(0xFFCFE3F7),
            url = "https://mina.example/tidepool",
        ),
        Project(
            title = "Letterloop",
            year = "2025",
            description = "A group-newsletter tool for families. Designed the prompt system that " +
                "gets grandparents to actually write back.",
            tags = listOf("Product", "Brand"),
            emoji = "💌",
            accent = Color(0xFFF7D9CF),
            url = "https://mina.example/letterloop",
        ),
        Project(
            title = "Wayfare",
            year = "2025",
            description = "Design system for a travel startup: 84 components, dark mode, and docs " +
                "the engineers actually read.",
            tags = listOf("Design systems"),
            emoji = "🧭",
            accent = Color(0xFFD9F0D5),
            url = "https://mina.example/wayfare",
        ),
        Project(
            title = "Perch",
            year = "2024",
            description = "A tiny window-seat reservation app for a café chain. Two weeks from " +
                "sketch to launch; tripled weekday bookings.",
            tags = listOf("Product", "Mobile"),
            emoji = "🪑",
            accent = Color(0xFFF2E4C9),
            url = "https://mina.example/perch",
        ),
        Project(
            title = "Field Notes for Figma",
            year = "2024",
            description = "A plugin that turns annotation chaos into a tidy handoff doc. " +
                "12k installs and a lifetime supply of thank-you DMs.",
            tags = listOf("Tools"),
            emoji = "🗒️",
            accent = Color(0xFFE3D7F4),
            url = "https://mina.example/field-notes",
        ),
        Project(
            title = "The Long Way",
            year = "2023",
            description = "A personal essay series on slow software, hand-illustrated. Featured in " +
                "three design newsletters I admire.",
            tags = listOf("Writing", "Brand"),
            emoji = "🚲",
            accent = Color(0xFFF6D3E0),
            url = "https://mina.example/long-way",
        ),
    )

    val aboutParagraphs = listOf(
        "I spent five years at agencies making things look right, then five more at startups " +
            "learning why they break. Now I sit in the middle: close enough to the pixels to " +
            "care, close enough to the code to ship.",
        "When I'm not working I'm restoring a 1978 road bike, learning Yoruba, and losing " +
            "gracefully at chess.",
    )

    val skills = listOf(
        "Product design", "Design systems", "Prototyping", "React & TypeScript",
        "SwiftUI", "Illustration", "Design ops", "Workshop facilitation",
    )

    val socials = listOf(
        SocialLink("GitHub", "https://github.com"),
        SocialLink("Dribbble", "https://dribbble.com"),
        SocialLink("LinkedIn", "https://linkedin.com"),
    )

    /** Union of all project tags, in first-appearance order — the filter chips. */
    fun allTags(list: List<Project> = projects): List<String> {
        val seen = mutableListOf<String>()
        list.forEach { project ->
            project.tags.forEach { tag ->
                if (tag !in seen) seen.add(tag)
            }
        }
        return seen
    }
}
