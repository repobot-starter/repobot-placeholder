package com.baseapp.android.view.link

import androidx.compose.ui.graphics.Color

/**
 * Everything the LinkBot surface renders — the native twin of
 * `web/app/src/View/Link/content.ts`. Edit this file (or ask the agent to)
 * and the app updates; there is no backend and no CMS.
 */
object LinkContent {
    data class Profile(
        val name: String,
        val handle: String,
        val bio: String,
        val avatarEmoji: String,
        val location: String,
    )

    data class LinkItem(
        val emoji: String,
        val label: String,
        val note: String,
        val url: String,
    )

    data class SocialLink(
        val label: String,
        val monogram: String,
        val url: String,
    )

    val profile = Profile(
        name = "Robo Rivera",
        handle = "@robo",
        bio = "Creative technologist building tiny, joyful things on the internet.",
        avatarEmoji = "🤖",
        location = "Lisbon, Portugal",
    )

    val links = listOf(
        LinkItem("🎨", "Portfolio", "Selected projects & case studies", "https://robo.example/work"),
        LinkItem("✉️", "Weekly newsletter", "One tiny idea every Friday", "https://robo.example/letters"),
        LinkItem("🎬", "Latest video", "Building a synth in the browser", "https://robo.example/video"),
        LinkItem("🎧", "Studio playlist", "What I code to", "https://robo.example/playlist"),
        LinkItem("📅", "Book a call", "15 minutes — let's talk shop", "https://robo.example/call"),
        LinkItem("☕", "Buy me a coffee", "Fuel the next project", "https://robo.example/coffee"),
    )

    val socials = listOf(
        SocialLink("GitHub", "gh", "https://github.com"),
        SocialLink("X", "𝕏", "https://x.com"),
        SocialLink("Instagram", "ig", "https://instagram.com"),
        SocialLink("YouTube", "▶", "https://youtube.com"),
    )

    data class Theme(
        val key: String,
        val label: String,
        /** Page background gradient, top-left to bottom-right. */
        val backgroundColors: List<Color>,
        val surface: Color,
        val surfaceBorder: Color,
        val text: Color,
        val subtleText: Color,
        val accent: Color,
    )

    /**
     * Palette presets cycled by the swatches in the footer; the pick persists
     * via SharedPreferences. Mirrors the `themes` array on web.
     */
    val themes = listOf(
        Theme(
            key = "midnight",
            label = "Midnight",
            backgroundColors = listOf(Color(0xFF2B1A4D), Color(0xFF120A24), Color(0xFF0A0614)),
            surface = Color.White.copy(alpha = 0.06f),
            surfaceBorder = Color.White.copy(alpha = 0.14f),
            text = Color(0xFFF1EAFF),
            subtleText = Color(0xFFA898CC),
            accent = Color(0xFF9D7BFF),
        ),
        Theme(
            key = "sunrise",
            label = "Sunrise",
            backgroundColors = listOf(Color(0xFFFFE8D6), Color(0xFFFFD0B0), Color(0xFFFFB4A2)),
            surface = Color.White.copy(alpha = 0.65f),
            surfaceBorder = Color(0xFF945233).copy(alpha = 0.25f),
            text = Color(0xFF4A2513),
            subtleText = Color(0xFF96604A),
            accent = Color(0xFFE2711D),
        ),
        Theme(
            key = "meadow",
            label = "Meadow",
            backgroundColors = listOf(Color(0xFFEAF7E4), Color(0xFFCDEBC9), Color(0xFFA9D9B0)),
            surface = Color.White.copy(alpha = 0.7f),
            surfaceBorder = Color(0xFF2F5D3A).copy(alpha = 0.22f),
            text = Color(0xFF1E3A26),
            subtleText = Color(0xFF5B7D64),
            accent = Color(0xFF2F9E57),
        ),
        Theme(
            key = "paper",
            label = "Paper",
            backgroundColors = listOf(Color(0xFFF5F2EC), Color(0xFFF5F2EC)),
            surface = Color.White,
            surfaceBorder = Color(0xFFD8D2C4),
            text = Color(0xFF26221A),
            subtleText = Color(0xFF7D766A),
            accent = Color(0xFF26221A),
        ),
    )
}
