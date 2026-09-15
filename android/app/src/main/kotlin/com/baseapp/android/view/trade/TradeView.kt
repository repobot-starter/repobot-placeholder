package com.baseapp.android.view.trade

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import java.util.Calendar

/** Editorial paper-and-ink palette mirroring the web TradePage styles. */
private object TradePalette {
    val paper = Color(0xFFF7F6F4)
    val ink = Color(0xFF12161F)
    val secondary = Color(0xFF576074)
    val border = Color(0xFFDCE1EA)
    val surface = Color(0xFFFFFFFF)
    val surfaceAlt = Color(0xFFF3F5F8)
    val accent = Color(0xFF1F6FEB)
    val liveGreen = Color(0xFF1E8A56)
    val partnerGray = Color(0xFFA8A8A8)
    val contactMeta = Color(0xFFB6BCC8)
}

/** Status pill tint per shipment tone, mirroring the ops design language. */
private fun toneColor(tone: TradeContent.ShipmentTone): Color = when (tone) {
    TradeContent.ShipmentTone.SUCCESS -> Color(0xFF1E8A56)
    TradeContent.ShipmentTone.INFO -> Color(0xFF2266D4)
    TradeContent.ShipmentTone.WARNING -> Color(0xFFB06E1B)
    TradeContent.ShipmentTone.NEUTRAL -> Color(0xFF5B657A)
}

/**
 * Home surface for the `trade` pack: a marketing site for a trade or
 * supply-chain business, rendered entirely from [TradeContent]. An editorial
 * paper-and-ink shell carries the pitch; ops-grade components (KPI strip,
 * journey timeline, live shipment board) carry the proof.
 */
@Composable
fun TradeView() {
    val context = LocalContext.current

    fun open(url: String) {
        context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(TradePalette.paper),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(36.dp),
            modifier = Modifier
                .widthIn(max = 700.dp)
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
        ) {
            TopBar(::open)
            Hero(::open)
            StatStrip()
            CommoditiesSection()
            JourneySection()
            BoardSection()
            StandardsSection()
            ContactBand(::open)
            Footer()
        }
    }
}

/* ------------------------------------------------------------------ top bar */

@Composable
private fun TopBar(open: (String) -> Unit) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 14.dp),
        ) {
            Text(
                text = TradeContent.company.name,
                color = TradePalette.ink,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                modifier = Modifier.weight(1f),
            )
            CtaButton(label = "Request a quote", open = open)
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(TradePalette.border),
        )
    }
}

/** The black "Request a quote" button — the page's one recurring CTA. */
@Composable
private fun CtaButton(label: String, open: (String) -> Unit) {
    Text(
        text = label,
        color = TradePalette.surface,
        fontSize = 14.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(TradePalette.ink)
            .clickable { open("mailto:${TradeContent.company.email}") }
            .padding(horizontal = 18.dp, vertical = 11.dp)
            .semantics { contentDescription = "Email ${TradeContent.company.name}" },
    )
}

/* --------------------------------------------------------------------- hero */

@Composable
private fun Hero(open: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = TradeContent.company.kicker.uppercase(),
            color = TradePalette.secondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.4.sp,
        )
        Text(
            text = TradeContent.company.statement,
            color = TradePalette.ink,
            fontSize = 40.sp,
            lineHeight = 44.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = TradeContent.company.intro,
            color = TradePalette.secondary,
            fontSize = 16.sp,
            lineHeight = 25.sp,
        )
        CtaButton(label = "Request a quote", open = open)
    }
}

/* ---------------------------------------------------------------- KPI strip */

@Composable
private fun StatStrip() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TradePalette.surface)
            .border(1.dp, TradePalette.border, RoundedCornerShape(14.dp)),
    ) {
        TradeContent.stats.chunked(2).forEachIndexed { rowIndex, rowStats ->
            if (rowIndex > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(TradePalette.border),
                )
            }
            Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                rowStats.forEachIndexed { cellIndex, stat ->
                    if (cellIndex > 0) {
                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .fillMaxHeight()
                                .background(TradePalette.border),
                        )
                    }
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 18.dp, vertical = 18.dp),
                    ) {
                        Text(
                            text = stat.value,
                            color = TradePalette.ink,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Medium,
                        )
                        Text(
                            text = stat.label.uppercase(),
                            color = TradePalette.secondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.4.sp,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                    }
                }
            }
        }
    }
}

/* ----------------------------------------------------------------- sections */

@Composable
private fun SectionHeader(title: String, subtitle: String?) {
    Column {
        Text(
            text = title,
            color = TradePalette.ink,
            fontSize = 26.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Serif,
        )
        if (subtitle != null) {
            Text(
                text = subtitle,
                color = TradePalette.secondary,
                fontSize = 14.sp,
                lineHeight = 21.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
        }
    }
}

/* ---------------------------------------------------------- commodity cards */

@Composable
private fun CommoditiesSection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionHeader(
            title = "What we move",
            subtitle = "Every product graded to spec, documented per load, and traceable " +
                "back to its source.",
        )
        TradeContent.commodities.forEach { commodity ->
            CommodityCard(commodity)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CommodityCard(commodity: TradeContent.TradeCommodity) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TradePalette.surface)
            .border(1.dp, TradePalette.border, RoundedCornerShape(14.dp))
            .padding(18.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(commodity.accent),
        ) {
            Text(
                text = commodity.monogram,
                color = TradePalette.ink,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = commodity.name,
                color = TradePalette.ink,
                fontSize = 16.sp,
                lineHeight = 20.sp,
                fontWeight = FontWeight.Bold,
            )
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                CommodityChip(commodity.spec)
                CommodityChip(commodity.origin)
            }
            Text(
                text = commodity.note,
                color = TradePalette.secondary,
                fontSize = 13.sp,
                lineHeight = 20.sp,
            )
        }
    }
}

@Composable
private fun CommodityChip(label: String) {
    Text(
        text = label,
        color = TradePalette.secondary,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(CircleShape)
            .background(TradePalette.surfaceAlt)
            .border(1.dp, TradePalette.border, CircleShape)
            .padding(horizontal = 8.dp, vertical = 2.dp),
    )
}

/* --------------------------------------------------------- journey timeline */

@Composable
private fun JourneySection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionHeader(
            title = "How it gets there",
            subtitle = "One team owns the load from the tract to the receiving port — no " +
                "hand-offs, no black holes.",
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(TradePalette.surface)
                .border(1.dp, TradePalette.border, RoundedCornerShape(14.dp))
                .padding(vertical = 8.dp),
        ) {
            TradeContent.journey.forEachIndexed { index, step ->
                JourneyRow(
                    step = step,
                    index = index,
                    isLast = index == TradeContent.journey.lastIndex,
                )
            }
        }
    }
}

@Composable
private fun JourneyRow(step: TradeContent.TradeJourneyStep, index: Int, isLast: Boolean) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min)
            .padding(horizontal = 20.dp, vertical = 12.dp),
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .width(12.dp)
                .fillMaxHeight()
                .padding(top = 5.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(9.dp)
                    .clip(CircleShape)
                    .background(TradePalette.accent),
            )
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .width(1.dp)
                        .padding(top = 4.dp)
                        .background(TradePalette.border),
                )
            }
        }

        Column {
            Text(
                text = "Step ${index + 1}".uppercase(),
                color = TradePalette.secondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
            )
            Text(
                text = step.title,
                color = TradePalette.ink,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 2.dp),
            )
            Text(
                text = step.description,
                color = TradePalette.secondary,
                fontSize = 13.sp,
                lineHeight = 20.sp,
                modifier = Modifier.padding(top = 3.dp),
            )
        }
    }
}

/* ------------------------------------------------------------ shipment board */

@Composable
private fun BoardSection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionHeader(
            title = "On the water right now",
            subtitle = "A live cut of our shipment board — the same one our ops desk " +
                "works from.",
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(TradePalette.surface)
                .border(1.dp, TradePalette.border, RoundedCornerShape(14.dp)),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TradePalette.surfaceAlt)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
            ) {
                Text(
                    text = "Shipment board".uppercase(),
                    color = TradePalette.secondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.4.sp,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    text = "● Updated daily",
                    color = TradePalette.liveGreen,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            TradeContent.shipments.forEach { shipment ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(TradePalette.border),
                )
                ShipmentRow(shipment)
            }
        }
    }
}

@Composable
private fun ShipmentRow(shipment: TradeContent.TradeShipment) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(3.dp),
            modifier = Modifier.weight(1f),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = shipment.ref,
                    color = TradePalette.ink,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = shipment.lane,
                    color = TradePalette.ink,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Text(
                text = shipment.commodity,
                color = TradePalette.secondary,
                fontSize = 12.sp,
            )
            Text(
                text = "ETA ${shipment.eta}",
                color = TradePalette.secondary,
                fontSize = 12.sp,
            )
        }

        StatusPill(status = shipment.status, tone = shipment.tone)
    }
}

@Composable
private fun StatusPill(status: String, tone: TradeContent.ShipmentTone) {
    val color = toneColor(tone)
    Text(
        text = status,
        color = color,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    )
}

/* --------------------------------------------------------- partners & certs */

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StandardsSection() {
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        SectionHeader(title = "Held to a standard", subtitle = null)

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            TradeContent.certifications.forEach { certification ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(TradePalette.surface)
                        .border(1.dp, TradePalette.border, CircleShape)
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                ) {
                    Text(
                        text = certification.code,
                        color = TradePalette.ink,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.5.sp,
                    )
                    Text(
                        text = certification.label,
                        color = TradePalette.secondary,
                        fontSize = 12.sp,
                    )
                }
            }
        }

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(28.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            TradeContent.partners.forEach { partner ->
                Text(
                    text = partner.uppercase(),
                    color = TradePalette.partnerGray,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.6.sp,
                )
            }
        }
    }
}

/* --------------------------------------------------------------- contact band */

@Composable
private fun ContactBand(open: (String) -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(18.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TradePalette.ink)
            .padding(horizontal = 24.dp, vertical = 32.dp),
    ) {
        Text(
            text = "Tell us what you need on the water, and when.",
            color = TradePalette.paper,
            fontSize = 26.sp,
            lineHeight = 31.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = TradeContent.company.email,
            color = TradePalette.ink,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(TradePalette.paper)
                .clickable { open("mailto:${TradeContent.company.email}") }
                .padding(horizontal = 18.dp, vertical = 11.dp)
                .semantics { contentDescription = "Email ${TradeContent.company.name}" },
        )
        Text(
            text = "${TradeContent.company.phone} · ${TradeContent.company.location}",
            color = TradePalette.contactMeta,
            fontSize = 13.sp,
        )
    }
}

/* ------------------------------------------------------------------- footer */

@Composable
private fun Footer() {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "© ${Calendar.getInstance().get(Calendar.YEAR)} ${TradeContent.company.name}",
            color = TradePalette.secondary,
            fontSize = 12.sp,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "Made with TradeBot",
            color = TradePalette.secondary,
            fontSize = 12.sp,
        )
    }
}
