package com.baseapp.android.view.sugar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import java.util.Calendar
import java.util.Date

/** Bakery-pink palette, mirrored from SugarPage.styles.css.ts. */
private object SugarPalette {
    val paper = Color(0xFFFDF3F6)
    val ink = Color(0xFF46242F)
    val inkSoft = Color(0xFF93707C)
    val line = Color(0xFFF3DBE4)
    val raspberry = Color(0xFFD2447E)
    val raspberrySoft = Color(0xFFFBE3ED)
    val pinkDeep = Color(0xFFF6BDD4)
    val mint = Color(0xFF2F6B52)
    val mintSoft = Color(0xFFE2F0E8)
    val amber = Color(0xFFB07A24)
    val amberSoft = Color(0xFFF8ECD8)
    val neutral = Color(0xFF8D8189)
    val neutralSoft = Color(0xFFF0EAED)
}

@Composable
fun SugarView() {
    val now = remember { Date() }
    val calendar = remember { Calendar.getInstance().apply { time = now } }
    val day = calendar.get(Calendar.DAY_OF_WEEK) - 1
    val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    val lineup =
        SugarContent.lineups[
            SugarFreshness.lineupIndexForDay(
                SugarFreshness.epochDay(now),
                SugarContent.lineups.size,
            ),
        ]

    Column(
        modifier =
            Modifier.fillMaxSize()
                .background(SugarPalette.paper)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(44.dp))
        Text(
            SugarContent.NAME,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = SugarPalette.raspberry,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            SugarContent.TAGLINE,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = SugarPalette.ink,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            SugarContent.STORY,
            fontSize = 13.sp,
            lineHeight = 20.sp,
            color = SugarPalette.inkSoft,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(26.dp))
        MachineIllustration(lineup)

        SectionTitle("How it works", "Same promise at every machine, every day.")
        SugarContent.howItWorks.forEach { step ->
            Spacer(Modifier.height(12.dp))
            Card {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(step.emoji, fontSize = 26.sp)
                    Spacer(Modifier.height(7.dp))
                    Text(
                        step.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = SugarPalette.ink,
                    )
                    Spacer(Modifier.height(5.dp))
                    Text(
                        step.text,
                        fontSize = 12.sp,
                        lineHeight = 17.sp,
                        color = SugarPalette.inkSoft,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }

        SectionTitle(
            "Today's case",
            "The lineup rotates every morning — whatever's in the bin was baked overnight.",
        )
        Spacer(Modifier.height(14.dp))
        Box(
            modifier =
                Modifier.background(SugarPalette.raspberrySoft, CircleShape)
                    .padding(horizontal = 14.dp, vertical = 6.dp),
        ) {
            Text(
                lineup.title.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.1.sp,
                color = SugarPalette.raspberry,
            )
        }
        lineup.pastries.forEach { pastry ->
            Spacer(Modifier.height(12.dp))
            Card {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(15.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier =
                            Modifier.size(46.dp)
                                .background(SugarPalette.raspberrySoft, RoundedCornerShape(13.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(pastry.emoji, fontSize = 22.sp)
                    }
                    Spacer(Modifier.width(13.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            pastry.name,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Serif,
                            color = SugarPalette.ink,
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            pastry.description,
                            fontSize = 11.5.sp,
                            lineHeight = 15.sp,
                            color = SugarPalette.inkSoft,
                        )
                    }
                    Spacer(Modifier.width(10.dp))
                    Text(
                        SugarFreshness.formatPrice(pastry.priceCents),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = SugarPalette.raspberry,
                    )
                }
            }
        }

        SectionTitle("Find a machine", "Live from the bins — statuses update with the clock.")
        SugarContent.machines.forEach { machine ->
            val status = SugarFreshness.statusAt(machine.schedule, day, minute)
            Spacer(Modifier.height(12.dp))
            Card {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                machine.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif,
                                color = SugarPalette.ink,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(machine.spot, fontSize = 12.sp, color = SugarPalette.inkSoft)
                        }
                        Spacer(Modifier.width(10.dp))
                        StatusBadge(status)
                    }
                    machine.note?.let { note ->
                        Spacer(Modifier.height(7.dp))
                        Text(
                            note,
                            fontSize = 11.sp,
                            fontStyle = FontStyle.Italic,
                            color = SugarPalette.inkSoft,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(44.dp))
        HostBlock()
        Spacer(Modifier.height(18.dp))
        Text(
            SugarContent.DONATION_NOTE,
            fontSize = 12.sp,
            color = SugarPalette.inkSoft,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(26.dp))
        Text(
            "${SugarContent.NAME} · Built with Repobot",
            fontSize = 12.sp,
            color = SugarPalette.inkSoft,
        )
        Spacer(Modifier.height(44.dp))
    }
}

@Composable
private fun MachineIllustration(lineup: SugarContent.Lineup) {
    val shelf = (lineup.pastries + lineup.pastries).take(6)
    Column(
        modifier =
            Modifier.width(220.dp)
                .background(SugarPalette.pinkDeep, RoundedCornerShape(24.dp))
                .border(3.dp, SugarPalette.raspberry, RoundedCornerShape(24.dp))
                .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            SugarContent.NAME,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = SugarPalette.ink,
        )
        Spacer(Modifier.height(10.dp))
        Column(
            modifier =
                Modifier.fillMaxWidth()
                    .background(Color(0xFFFFF8FB), RoundedCornerShape(14.dp))
                    .border(2.dp, SugarPalette.raspberry, RoundedCornerShape(14.dp))
                    .padding(vertical = 10.dp),
        ) {
            shelf.chunked(3).forEach { row ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    row.forEach { pastry -> Text(pastry.emoji, fontSize = 22.sp) }
                }
                Spacer(Modifier.height(6.dp))
            }
        }
        Spacer(Modifier.height(10.dp))
        Box(
            modifier =
                Modifier.fillMaxWidth().background(SugarPalette.ink, RoundedCornerShape(9.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                "TAP · GRAB · GO",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.4.sp,
                color = SugarPalette.pinkDeep,
                modifier = Modifier.padding(vertical = 6.dp),
            )
        }
    }
}

@Composable
private fun SectionTitle(title: String, kicker: String) {
    Spacer(Modifier.height(44.dp))
    Text(
        title,
        fontSize = 23.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Serif,
        color = SugarPalette.ink,
        textAlign = TextAlign.Center,
    )
    Spacer(Modifier.height(5.dp))
    Text(
        kicker,
        fontSize = 12.sp,
        color = SugarPalette.inkSoft,
        textAlign = TextAlign.Center,
    )
    Spacer(Modifier.height(8.dp))
}

@Composable
private fun Card(content: @Composable () -> Unit) {
    Box(
        modifier =
            Modifier.fillMaxWidth()
                .background(Color.White, RoundedCornerShape(16.dp))
                .border(1.dp, SugarPalette.line, RoundedCornerShape(16.dp)),
    ) {
        content()
    }
}

@Composable
private fun StatusBadge(status: SugarFreshness.CaseStatus) {
    val (foreground, background) =
        when (status.kind) {
            SugarFreshness.StatusKind.FRESH -> SugarPalette.mint to SugarPalette.mintSoft
            SugarFreshness.StatusKind.SELLING_FAST -> SugarPalette.amber to SugarPalette.amberSoft
            SugarFreshness.StatusKind.UPCOMING ->
                SugarPalette.raspberry to SugarPalette.raspberrySoft
            SugarFreshness.StatusKind.SOLD_OUT,
            SugarFreshness.StatusKind.CLOSED,
            -> SugarPalette.neutral to SugarPalette.neutralSoft
        }
    Box(
        modifier =
            Modifier.background(background, CircleShape)
                .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(status.label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = foreground)
    }
}

@Composable
private fun HostBlock() {
    val uriHandler = LocalUriHandler.current
    Column(
        modifier =
            Modifier.fillMaxWidth()
                .background(SugarPalette.raspberry, RoundedCornerShape(20.dp))
                .padding(26.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            SugarContent.HOST_PITCH,
            fontSize = 19.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = Color.White,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(14.dp))
        Box(
            modifier =
                Modifier.background(Color.White, CircleShape)
                    .clickable { uriHandler.openUri("mailto:${SugarContent.EMAIL}") }
                    .padding(horizontal = 26.dp, vertical = 12.dp),
        ) {
            Text(
                "Talk to us",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = SugarPalette.raspberry,
            )
        }
    }
}
