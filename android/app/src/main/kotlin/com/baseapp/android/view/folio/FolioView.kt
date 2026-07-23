package com.baseapp.android.view.folio

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri

/** Editorial paper-and-ink palette mirroring the web FolioPage styles. */
private object FolioPalette {
    val paper = Color(0xFFFAF6EF)
    val card = Color(0xFFFFFDF8)
    val ink = Color(0xFF221D15)
    val inkSoft = Color(0xFF6F6759)
    val line = Color(0xFFE2DACA)
    val accent = Color(0xFFD4552B)
    val availabilityText = Color(0xFF2F7A45)
    val availabilityFill = Color(0xFFE5F2E3)
}

/**
 * Home surface for the `folio` pack: a one-page portfolio rendered entirely
 * from [FolioContent] — hero statement, filterable project list, about, and
 * a contact CTA. Owners edit FolioContent.kt.
 */
@Composable
fun FolioView() {
    val context = LocalContext.current
    var activeTag by remember { mutableStateOf<String?>(null) }
    val visibleProjects = activeTag?.let { tag ->
        FolioContent.projects.filter { tag in it.tags }
    } ?: FolioContent.projects

    fun open(url: String) {
        context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FolioPalette.paper),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(32.dp),
            modifier = Modifier
                .widthIn(max = 700.dp)
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 22.dp, vertical = 28.dp),
        ) {
            Hero()
            WorkSection(
                activeTag = activeTag,
                visibleProjects = visibleProjects,
                onPickTag = { activeTag = if (activeTag == it) null else it },
                open = ::open,
            )
            AboutSection()
            ContactSection(::open)
        }
    }
}

@Composable
private fun Hero() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (FolioContent.profile.availability.isNotEmpty()) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .clip(CircleShape)
                    .background(FolioPalette.availabilityFill)
                    .padding(horizontal = 14.dp, vertical = 6.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(FolioPalette.availabilityText),
                )
                Text(
                    text = FolioContent.profile.availability,
                    color = FolioPalette.availabilityText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        Text(
            text = FolioContent.profile.statement,
            color = FolioPalette.ink,
            fontSize = 32.sp,
            lineHeight = 38.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
        )

        Text(
            text = "${FolioContent.profile.role} · ${FolioContent.profile.location}",
            color = FolioPalette.inkSoft,
            fontSize = 15.sp,
        )
    }
}

@Composable
private fun SectionHeader(kicker: String, title: String) {
    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(FolioPalette.line),
        )
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            text = kicker.uppercase(),
            color = FolioPalette.accent,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.4.sp,
        )
        Text(
            text = title,
            color = FolioPalette.ink,
            fontSize = 24.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
        )
    }
}

@Composable
private fun WorkSection(
    activeTag: String?,
    visibleProjects: List<FolioContent.Project>,
    onPickTag: (String?) -> Unit,
    open: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionHeader(kicker = "Selected work", title = "Things I'm proud of")

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.horizontalScroll(rememberScrollState()),
        ) {
            FilterChip(label = "All", isActive = activeTag == null) { onPickTag(null) }
            FolioContent.allTags().forEach { tag ->
                FilterChip(label = tag, isActive = activeTag == tag) { onPickTag(tag) }
            }
        }

        visibleProjects.forEach { project ->
            ProjectCard(project, open)
        }
    }
}

@Composable
private fun FilterChip(label: String, isActive: Boolean, onClick: () -> Unit) {
    Text(
        text = label,
        color = if (isActive) FolioPalette.paper else FolioPalette.inkSoft,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (isActive) FolioPalette.ink else Color.Transparent)
            .border(1.dp, if (isActive) FolioPalette.ink else FolioPalette.line, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 7.dp),
    )
}

@Composable
private fun ProjectCard(project: FolioContent.Project, open: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(FolioPalette.card)
            .border(1.dp, FolioPalette.line, RoundedCornerShape(18.dp))
            .clickable { open(project.url) },
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(project.accent),
        ) {
            Text(text = project.emoji, fontSize = 52.sp)
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = project.title,
                    color = FolioPalette.ink,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Serif,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    text = project.year,
                    color = FolioPalette.inkSoft,
                    fontSize = 13.sp,
                )
            }

            Text(
                text = project.description,
                color = FolioPalette.inkSoft,
                fontSize = 14.sp,
                lineHeight = 21.sp,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                project.tags.forEach { tag ->
                    Text(
                        text = tag,
                        color = FolioPalette.inkSoft,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(FolioPalette.paper)
                            .border(1.dp, FolioPalette.line, CircleShape)
                            .padding(horizontal = 10.dp, vertical = 3.dp),
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AboutSection() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(kicker = "About", title = "The short version")

        FolioContent.aboutParagraphs.forEach { paragraph ->
            Text(
                text = paragraph,
                color = FolioPalette.inkSoft,
                fontSize = 15.sp,
                lineHeight = 24.sp,
            )
        }

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FolioContent.skills.forEach { skill ->
                Text(
                    text = skill,
                    color = FolioPalette.ink,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(FolioPalette.card)
                        .border(1.dp, FolioPalette.line, CircleShape)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun ContactSection(open: (String) -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(FolioPalette.line),
        )
        Text(
            text = "Let's make something.",
            color = FolioPalette.ink,
            fontSize = 28.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = FolioContent.profile.email,
            color = FolioPalette.paper,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(CircleShape)
                .background(FolioPalette.ink)
                .clickable { open("mailto:${FolioContent.profile.email}") }
                .padding(horizontal = 28.dp, vertical = 13.dp)
                .semantics { contentDescription = "Email ${FolioContent.profile.name}" },
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FolioContent.socials.forEach { social ->
                Text(
                    text = social.label,
                    color = FolioPalette.inkSoft,
                    fontSize = 13.sp,
                    modifier = Modifier.clickable { open(social.url) },
                )
            }
            Text(text = "·", color = FolioPalette.inkSoft, fontSize = 13.sp)
            Text(text = "Made with FolioBot", color = FolioPalette.inkSoft, fontSize = 13.sp)
        }
    }
}
