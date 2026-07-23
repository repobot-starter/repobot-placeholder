import SwiftUI

/// Editorial paper-and-ink palette mirroring the web TradePage styles.
private enum TradePalette {
  static let paper = Color(hex: "#F7F6F4")
  static let ink = Color(hex: "#12161F")
  static let secondary = Color(hex: "#576074")
  static let border = Color(hex: "#DCE1EA")
  static let surface = Color(hex: "#FFFFFF")
  static let surfaceAlt = Color(hex: "#F3F5F8")
  static let accent = Color(hex: "#1F6FEB")
  static let contactMeta = Color(hex: "#B6BCC8")
  static let partnerMark = Color(hex: "#A8A8A8")

  /// Status pill tones, mirrored from the ops design language.
  static func toneColor(_ tone: TradeContent.ShipmentTone) -> Color {
    switch tone {
    case .success: return Color(hex: "#1E8A56")
    case .info: return Color(hex: "#2266D4")
    case .warning: return Color(hex: "#B06E1B")
    case .neutral: return Color(hex: "#5B657A")
    }
  }
}

/// Home surface for the `trade` pack: a marketing site for a trade or
/// supply-chain business, rendered entirely from `TradeContent`. An editorial
/// paper-and-ink shell carries the pitch; ops-grade components (KPI strip,
/// journey timeline, live shipment board) carry the proof.
struct TradeView: View {
  @Environment(\.openURL) private var openURL

  var body: some View {
    ZStack {
      TradePalette.paper.ignoresSafeArea()

      ScrollView {
        VStack(alignment: .leading, spacing: 36) {
          topBar
          hero
          statStrip
          commoditiesSection
          journeySection
          boardSection
          standardsSection
          contactBand
          footer
        }
        .padding(.horizontal, 22)
        .padding(.top, 16)
        .padding(.bottom, 28)
        .frame(maxWidth: 700)
      }
    }
  }

  // MARK: - Top bar

  private var topBar: some View {
    HStack(alignment: .center, spacing: 16) {
      Text(TradeContent.company.name)
        .font(.system(size: 20, weight: .bold, design: .serif))
        .foregroundStyle(TradePalette.ink)
      Spacer()
      quoteButton
    }
    .padding(.bottom, 14)
    .overlay(Rectangle().fill(TradePalette.border).frame(height: 1), alignment: .bottom)
  }

  // MARK: - Hero

  private var hero: some View {
    VStack(alignment: .leading, spacing: 14) {
      Text(TradeContent.company.kicker.uppercased())
        .font(.caption.weight(.bold))
        .kerning(2.4)
        .foregroundStyle(TradePalette.secondary)

      Text(TradeContent.company.statement)
        .font(.system(size: 40, weight: .black, design: .serif))
        .foregroundStyle(TradePalette.ink)
        .lineSpacing(2)

      Text(TradeContent.company.intro)
        .font(.subheadline)
        .foregroundStyle(TradePalette.secondary)
        .lineSpacing(4)

      quoteButton
        .padding(.top, 8)
    }
  }

  private var quoteButton: some View {
    Button {
      open("mailto:\(TradeContent.company.email)")
    } label: {
      Text("Request a quote")
        .font(.footnote.weight(.semibold))
        .foregroundStyle(TradePalette.surface)
        .padding(.horizontal, 18)
        .padding(.vertical, 11)
        .background(RoundedRectangle(cornerRadius: 5, style: .continuous).fill(TradePalette.ink))
    }
    .buttonStyle(.plain)
  }

  // MARK: - KPI strip

  private var statStrip: some View {
    VStack(spacing: 0) {
      statRow(TradeContent.stats[0], TradeContent.stats[1])
      Rectangle().fill(TradePalette.border).frame(height: 1)
      statRow(TradeContent.stats[2], TradeContent.stats[3])
    }
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(TradePalette.surface)
    )
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(TradePalette.border, lineWidth: 1)
    )
  }

  private func statRow(_ left: TradeContent.TradeStat, _ right: TradeContent.TradeStat)
    -> some View
  {
    HStack(spacing: 0) {
      statCell(left)
      Rectangle().fill(TradePalette.border).frame(width: 1)
      statCell(right)
    }
    .fixedSize(horizontal: false, vertical: true)
  }

  private func statCell(_ stat: TradeContent.TradeStat) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(stat.value)
        .font(.system(size: 28, weight: .medium))
        .monospacedDigit()
        .foregroundStyle(TradePalette.ink)
      Text(stat.label.uppercased())
        .font(.caption2.weight(.semibold))
        .kerning(0.35)
        .foregroundStyle(TradePalette.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(.horizontal, 18)
    .padding(.vertical, 18)
  }

  // MARK: - Commodities

  private var commoditiesSection: some View {
    VStack(alignment: .leading, spacing: 16) {
      sectionHeader(
        title: "What we move",
        sub: "Every product graded to spec, documented per load, and traceable back to its source.")

      VStack(spacing: 14) {
        ForEach(TradeContent.commodities) { commodity in
          commodityCard(commodity)
        }
      }
    }
  }

  private func commodityCard(_ commodity: TradeContent.TradeCommodity) -> some View {
    HStack(alignment: .top, spacing: 14) {
      Text(commodity.monogram)
        .font(.system(size: 17, weight: .bold, design: .serif))
        .foregroundStyle(TradePalette.ink)
        .frame(width: 52, height: 52)
        .background(
          RoundedRectangle(cornerRadius: 10, style: .continuous).fill(commodity.accent))

      VStack(alignment: .leading, spacing: 6) {
        Text(commodity.name)
          .font(.callout.weight(.bold))
          .foregroundStyle(TradePalette.ink)

        HStack(spacing: 6) {
          commodityChip(commodity.spec)
          commodityChip(commodity.origin)
        }

        Text(commodity.note)
          .font(.footnote)
          .foregroundStyle(TradePalette.secondary)
          .lineSpacing(3)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(16)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(TradePalette.surface)
    )
    .overlay(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(TradePalette.border, lineWidth: 1)
    )
  }

  private func commodityChip(_ label: String) -> some View {
    Text(label)
      .font(.caption2.weight(.semibold))
      .foregroundStyle(TradePalette.secondary)
      .lineLimit(1)
      .padding(.horizontal, 8)
      .padding(.vertical, 3)
      .background(Capsule().fill(TradePalette.surfaceAlt))
      .overlay(Capsule().stroke(TradePalette.border, lineWidth: 1))
  }

  // MARK: - Journey timeline

  private var journeySection: some View {
    VStack(alignment: .leading, spacing: 16) {
      sectionHeader(
        title: "How it gets there",
        sub:
          "One team owns the load from the tract to the receiving port — no hand-offs, no black holes.")

      VStack(spacing: 0) {
        ForEach(Array(TradeContent.journey.enumerated()), id: \.element.id) { index, step in
          journeyRow(step, index: index, isLast: index == TradeContent.journey.count - 1)
        }
      }
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(TradePalette.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .stroke(TradePalette.border, lineWidth: 1)
      )
    }
  }

  private func journeyRow(_ step: TradeContent.TradeJourneyStep, index: Int, isLast: Bool)
    -> some View
  {
    HStack(alignment: .top, spacing: 14) {
      VStack(spacing: 0) {
        Circle()
          .fill(TradePalette.accent)
          .frame(width: 9, height: 9)
          .overlay(Circle().stroke(TradePalette.border, lineWidth: 1))
          .padding(.top, 5)
        if !isLast {
          Rectangle()
            .fill(TradePalette.border)
            .frame(width: 1)
            .frame(maxHeight: .infinity)
            .padding(.top, 4)
        }
      }
      .frame(width: 12)

      VStack(alignment: .leading, spacing: 3) {
        Text("Step \(index + 1)".uppercased())
          .font(.caption2.weight(.bold))
          .kerning(1.2)
          .foregroundStyle(TradePalette.secondary)
        Text(step.title)
          .font(.subheadline.weight(.bold))
          .foregroundStyle(TradePalette.ink)
        Text(step.description)
          .font(.footnote)
          .foregroundStyle(TradePalette.secondary)
          .lineSpacing(3)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 20)
    .padding(.vertical, 14)
    .fixedSize(horizontal: false, vertical: true)
  }

  // MARK: - Shipment board

  private var boardSection: some View {
    VStack(alignment: .leading, spacing: 16) {
      sectionHeader(
        title: "On the water right now",
        sub: "A live cut of our shipment board — the same one our ops desk works from.")

      VStack(spacing: 0) {
        boardHeader
        ForEach(TradeContent.shipments) { shipment in
          boardRow(shipment)
          if shipment.id != TradeContent.shipments.last?.id {
            Rectangle().fill(TradePalette.border).frame(height: 1)
          }
        }
      }
      .background(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(TradePalette.surface)
      )
      .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .stroke(TradePalette.border, lineWidth: 1)
      )
    }
  }

  private var boardHeader: some View {
    HStack(spacing: 10) {
      Text("Shipment board".uppercased())
        .font(.caption.weight(.bold))
        .kerning(0.35)
        .foregroundStyle(TradePalette.secondary)
      Spacer()
      Text("● Updated daily")
        .font(.caption2.weight(.bold))
        .foregroundStyle(TradePalette.toneColor(.success))
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .background(TradePalette.surfaceAlt)
    .overlay(Rectangle().fill(TradePalette.border).frame(height: 1), alignment: .bottom)
  }

  private func boardRow(_ shipment: TradeContent.TradeShipment) -> some View {
    VStack(alignment: .leading, spacing: 5) {
      HStack(alignment: .firstTextBaseline, spacing: 10) {
        Text(shipment.ref)
          .font(.footnote.weight(.bold))
          .monospacedDigit()
          .foregroundStyle(TradePalette.ink)
        Text(shipment.lane)
          .font(.footnote.weight(.semibold))
          .foregroundStyle(TradePalette.ink)
        Spacer()
        statusPill(shipment)
      }

      Text("\(shipment.commodity) · ETA \(shipment.eta)")
        .font(.caption)
        .foregroundStyle(TradePalette.secondary)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
  }

  private func statusPill(_ shipment: TradeContent.TradeShipment) -> some View {
    let tone = TradePalette.toneColor(shipment.tone)
    return Text(shipment.status)
      .font(.caption.weight(.semibold))
      .foregroundStyle(tone)
      .padding(.horizontal, 10)
      .padding(.vertical, 3)
      .background(
        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(tone.opacity(0.14)))
  }

  // MARK: - Certifications & partners

  private var standardsSection: some View {
    VStack(alignment: .leading, spacing: 16) {
      sectionHeader(title: "Held to a standard", sub: nil)

      VStack(alignment: .leading, spacing: 10) {
        ForEach(TradeContent.certifications) { certification in
          certChip(certification)
        }
      }

      LazyVGrid(
        columns: [GridItem(.adaptive(minimum: 140), alignment: .leading)],
        alignment: .leading, spacing: 14
      ) {
        ForEach(TradeContent.partners, id: \.self) { partner in
          Text(partner.uppercased())
            .font(.caption.weight(.bold))
            .kerning(1.6)
            .foregroundStyle(TradePalette.partnerMark)
            .lineLimit(1)
        }
      }
      .padding(.top, 10)
    }
  }

  private func certChip(_ certification: TradeContent.TradeCertification) -> some View {
    HStack(spacing: 8) {
      Text(certification.code)
        .font(.caption.weight(.heavy))
        .kerning(0.5)
        .foregroundStyle(TradePalette.ink)
      Text(certification.label)
        .font(.caption)
        .foregroundStyle(TradePalette.secondary)
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 8)
    .background(Capsule().fill(TradePalette.surface))
    .overlay(Capsule().stroke(TradePalette.border, lineWidth: 1))
  }

  // MARK: - Contact band & footer

  private var contactBand: some View {
    VStack(alignment: .leading, spacing: 18) {
      Text("Tell us what you need on the water, and when.")
        .font(.system(size: 28, weight: .black, design: .serif))
        .foregroundStyle(TradePalette.paper)
        .lineSpacing(2)

      Button {
        open("mailto:\(TradeContent.company.email)")
      } label: {
        Text(TradeContent.company.email)
          .font(.footnote.weight(.semibold))
          .foregroundStyle(TradePalette.ink)
          .padding(.horizontal, 18)
          .padding(.vertical, 11)
          .background(
            RoundedRectangle(cornerRadius: 5, style: .continuous).fill(TradePalette.paper))
      }
      .buttonStyle(.plain)

      Text("\(TradeContent.company.phone) · \(TradeContent.company.location)")
        .font(.footnote)
        .foregroundStyle(TradePalette.contactMeta)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 24)
    .padding(.vertical, 32)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(TradePalette.ink)
    )
    .padding(.top, 12)
  }

  private var footer: some View {
    HStack(spacing: 12) {
      Text("© \(String(Calendar.current.component(.year, from: Date()))) \(TradeContent.company.name)")
      Spacer()
      Text("Made with TradeBot")
    }
    .font(.caption)
    .foregroundStyle(TradePalette.secondary)
  }

  // MARK: - Helpers

  private func sectionHeader(title: String, sub: String?) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title)
        .font(.system(size: 26, weight: .black, design: .serif))
        .foregroundStyle(TradePalette.ink)
      if let sub {
        Text(sub)
          .font(.footnote)
          .foregroundStyle(TradePalette.secondary)
          .lineSpacing(3)
      }
    }
    .padding(.top, 10)
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func open(_ url: String) {
    guard let parsed = URL(string: url) else { return }
    openURL(parsed)
  }
}

#Preview {
  TradeView()
}
