package com.baseapp.android.view.menu

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar

/** Warm café palette, mirrored from MenuPage.styles.css.ts. */
private object MenuPalette {
    val cream = Color(0xFFFAF5EC)
    val espresso = Color(0xFF2B211A)
    val espressoSoft = Color(0xFF7A6A5C)
    val line = Color(0xFFE6DCCB)
    val copper = Color(0xFFB4622D)
    val copperSoft = Color(0xFFF4E5D5)
    val open = Color(0xFF3E6B4F)
    val closed = Color(0xFFA04B3C)
}

@Composable
fun MenuView() {
    var activeSection by remember { mutableStateOf(MenuContent.menu.first().title) }
    var filters by remember { mutableStateOf(setOf<MenuContent.Dietary>()) }
    val context = LocalContext.current

    val section = MenuContent.menu.firstOrNull { it.title == activeSection }
        ?: MenuContent.menu.first()
    val visibleItems = section.items.filter { item -> filters.all { it in item.dietary } }

    fun open(uri: String) {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)))
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MenuPalette.cream)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(bottom = 48.dp),
    ) {
        Hero()
        SectionTabs(activeSection) { activeSection = it }
        DietaryRow(filters) { mark ->
            filters = if (mark in filters) filters - mark else filters + mark
        }
        section.note?.let { note ->
            Text(
                text = note,
                fontSize = 13.sp,
                fontStyle = FontStyle.Italic,
                color = MenuPalette.espressoSoft,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
            )
        }
        visibleItems.forEach { item -> ItemRow(item) }
        if (visibleItems.isEmpty()) {
            Text(
                text = "Nothing in ${section.title.lowercase()} fits that filter — try another section.",
                fontSize = 13.sp,
                fontStyle = FontStyle.Italic,
                color = MenuPalette.espressoSoft,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 28.dp),
            )
        }
        HoursSection()
        ContactSection(::open)
        Text(
            text = "${MenuContent.NAME} — ${MenuContent.TAGLINE}. Built with Repobot.",
            fontSize = 12.sp,
            color = MenuPalette.espressoSoft,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 28.dp),
        )
    }
}

@Composable
private fun Hero() {
    val now = Calendar.getInstance()
    val day = now.get(Calendar.DAY_OF_WEEK) - 1 // 1..7 -> 0..6
    val minute = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    val status = MenuHours.statusAt(MenuContent.weeklyHours, day, minute)
    val label = MenuHours.statusLabel(MenuContent.weeklyHours, day, minute)

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 40.dp),
    ) {
        Text(
            text = MenuContent.NAME,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = MenuPalette.espresso,
            textAlign = TextAlign.Center,
        )
        Text(
            text = MenuContent.TAGLINE,
            fontSize = 15.sp,
            color = MenuPalette.espressoSoft,
            modifier = Modifier.padding(top = 6.dp),
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .padding(top = 14.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Color.White)
                .border(1.dp, MenuPalette.line, RoundedCornerShape(999.dp))
                .padding(horizontal = 16.dp, vertical = 8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (status.open) MenuPalette.open else MenuPalette.closed),
            )
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = MenuPalette.espresso,
                modifier = Modifier.padding(start = 8.dp),
            )
        }
        Text(
            text = MenuContent.ABOUT,
            fontSize = 13.sp,
            lineHeight = 20.sp,
            color = MenuPalette.espressoSoft,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 14.dp),
        )
    }
}

@Composable
private fun SectionTabs(active: String, onSelect: (String) -> Unit) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(top = 22.dp),
    ) {
        MenuContent.menu.forEach { section ->
            val isActive = section.title == active
            Text(
                text = section.title,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isActive) MenuPalette.cream else MenuPalette.espressoSoft,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (isActive) MenuPalette.copper else Color.Transparent)
                    .border(
                        1.dp,
                        if (isActive) MenuPalette.copper else MenuPalette.line,
                        RoundedCornerShape(999.dp),
                    )
                    .clickable { onSelect(section.title) }
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }
    }
}

@Composable
private fun DietaryRow(filters: Set<MenuContent.Dietary>, onToggle: (MenuContent.Dietary) -> Unit) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
    ) {
        MenuContent.Dietary.entries.forEach { mark ->
            val isActive = mark in filters
            Text(
                text = mark.label,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isActive) MenuPalette.copper else MenuPalette.espressoSoft,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (isActive) MenuPalette.copperSoft else Color.Transparent)
                    .border(
                        1.dp,
                        if (isActive) MenuPalette.copper else MenuPalette.line,
                        RoundedCornerShape(999.dp),
                    )
                    .clickable { onToggle(mark) }
                    .padding(horizontal = 12.dp, vertical = 5.dp),
            )
        }
    }
}

@Composable
private fun ItemRow(item: MenuContent.Item) {
    Column(modifier = Modifier.padding(top = 14.dp)) {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = item.name,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.Serif,
                        color = MenuPalette.espresso,
                    )
                    if (item.popular) {
                        Text(
                            text = "Popular",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MenuPalette.copper,
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(MenuPalette.copperSoft)
                                .padding(horizontal = 8.dp, vertical = 2.dp),
                        )
                    }
                    item.dietary.forEach { mark ->
                        Text(
                            text = mark.mark,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MenuPalette.open,
                            modifier = Modifier
                                .border(1.dp, MenuPalette.open, RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp),
                        )
                    }
                }
                Text(
                    text = item.description,
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = MenuPalette.espressoSoft,
                    modifier = Modifier.padding(top = 3.dp),
                )
            }
            Text(
                text = MenuContent.formatPrice(item.priceCents),
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Serif,
                color = MenuPalette.espresso,
                modifier = Modifier.padding(start = 12.dp),
            )
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp)
                .height(1.dp)
                .background(MenuPalette.line),
        )
    }
}

@Composable
private fun HoursSection() {
    val today = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1
    Column(modifier = Modifier.padding(top = 36.dp)) {
        Text(
            text = "Hours",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
            color = MenuPalette.espresso,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        MenuHours.dayNames.forEachIndexed { d, name ->
            val entry = MenuContent.weeklyHours.firstOrNull { it.day == d }
            val text = entry?.intervals?.joinToString(", ") { (open, close) ->
                "${MenuHours.formatMinute(open)} – ${MenuHours.formatMinute(close)}"
            } ?: "Closed"
            val weight = if (d == today) FontWeight.Bold else FontWeight.Normal
            Row(modifier = Modifier.padding(vertical = 3.dp)) {
                Text(
                    text = name,
                    fontSize = 14.sp,
                    fontWeight = weight,
                    color = if (d == today) MenuPalette.espresso else MenuPalette.espressoSoft,
                )
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = text,
                    fontSize = 14.sp,
                    fontWeight = weight,
                    color = MenuPalette.espresso,
                )
            }
        }
        Text(
            text = MenuContent.HOURS_NOTE,
            fontSize = 12.sp,
            fontStyle = FontStyle.Italic,
            color = MenuPalette.espressoSoft,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}

@Composable
private fun ContactSection(open: (String) -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.padding(top = 30.dp),
    ) {
        Text(
            text = "Find us",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
            color = MenuPalette.espresso,
        )
        Text(text = MenuContent.ADDRESS, fontSize = 13.sp, color = MenuPalette.espresso)
        ContactLink("Get directions →") {
            open("https://maps.google.com/?q=${Uri.encode(MenuContent.MAPS_QUERY)}")
        }
        ContactLink(MenuContent.PHONE) {
            open("tel:${MenuContent.PHONE.filter { it.isDigit() || it == '+' }}")
        }
        ContactLink(MenuContent.EMAIL) { open("mailto:${MenuContent.EMAIL}") }
        ContactLink("Instagram →") { open(MenuContent.INSTAGRAM) }
    }
}

@Composable
private fun ContactLink(label: String, onClick: () -> Unit) {
    Text(
        text = label,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = MenuPalette.copper,
        modifier = Modifier.clickable(onClick = onClick),
    )
}
