import SwiftUI

/// Bakery-pink palette, mirrored from SugarPage.styles.css.ts.
private enum SugarPalette {
  static let paper = Color(red: 0.992, green: 0.953, blue: 0.965)
  static let ink = Color(red: 0.275, green: 0.141, blue: 0.184)
  static let inkSoft = Color(red: 0.576, green: 0.439, blue: 0.486)
  static let line = Color(red: 0.953, green: 0.859, blue: 0.894)
  static let raspberry = Color(red: 0.824, green: 0.267, blue: 0.494)
  static let raspberrySoft = Color(red: 0.984, green: 0.890, blue: 0.929)
  static let pinkDeep = Color(red: 0.965, green: 0.741, blue: 0.831)
  static let mint = Color(red: 0.184, green: 0.420, blue: 0.322)
  static let mintSoft = Color(red: 0.886, green: 0.941, blue: 0.910)
  static let amber = Color(red: 0.690, green: 0.478, blue: 0.141)
  static let amberSoft = Color(red: 0.973, green: 0.925, blue: 0.847)
  static let neutral = Color(red: 0.553, green: 0.506, blue: 0.537)
  static let neutralSoft = Color(red: 0.941, green: 0.918, blue: 0.929)
}

struct SugarView: View {
  var body: some View {
    let now = Date()
    let calendar = Calendar.current
    let day = calendar.component(.weekday, from: now) - 1
    let minute = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
    let lineup = SugarContent.lineups[
      SugarFreshness.lineupIndexForDay(
        SugarFreshness.epochDay(now), lineupCount: SugarContent.lineups.count)]

    ZStack {
      SugarPalette.paper.ignoresSafeArea()
      ScrollView {
        VStack(spacing: 0) {
          hero
          machineIllustration(lineup)
          sectionTitle("How it works", kicker: "Same promise at every machine, every day.")
          stepCards
          sectionTitle(
            "Today's case",
            kicker: "The lineup rotates every morning — whatever's in the bin was baked overnight.")
          caseBadge(lineup.title)
          pastryCards(lineup)
          sectionTitle("Find a machine", kicker: "Live from the bins — statuses update with the clock.")
          machineCards(day: day, minute: minute)
          hostBlock
          Text(SugarContent.donationNote)
            .font(.caption)
            .foregroundStyle(SugarPalette.inkSoft)
            .multilineTextAlignment(.center)
            .padding(.top, 18)
          Text("\(SugarContent.name) · Built with Repobot")
            .font(.caption)
            .foregroundStyle(SugarPalette.inkSoft)
            .padding(.top, 26)
        }
        .padding(.horizontal, 22)
        .padding(.bottom, 48)
      }
    }
  }

  private var hero: some View {
    VStack(spacing: 10) {
      Text(SugarContent.name)
        .font(.system(size: 40, weight: .bold, design: .serif))
        .foregroundStyle(SugarPalette.raspberry)
        .multilineTextAlignment(.center)
      Text(SugarContent.tagline)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(SugarPalette.ink)
      Text(SugarContent.story)
        .font(.footnote)
        .foregroundStyle(SugarPalette.inkSoft)
        .multilineTextAlignment(.center)
        .lineSpacing(3)
    }
    .padding(.top, 40)
  }

  private func machineIllustration(_ lineup: SugarContent.Lineup) -> some View {
    let shelf = Array((lineup.pastries + lineup.pastries).prefix(6))
    return VStack(spacing: 12) {
      Text(SugarContent.name)
        .font(.system(size: 14, weight: .bold, design: .serif))
        .foregroundStyle(SugarPalette.ink)
      LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 10) {
        ForEach(Array(shelf.enumerated()), id: \.offset) { _, pastry in
          Text(pastry.emoji).font(.system(size: 24))
        }
      }
      .padding(10)
      .background(RoundedCornerShapeFill())
      Text("TAP · GRAB · GO")
        .font(.system(size: 10, weight: .bold))
        .kerning(1.4)
        .foregroundStyle(SugarPalette.pinkDeep)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(RoundedRectangle(cornerRadius: 9).fill(SugarPalette.ink))
    }
    .padding(16)
    .frame(width: 220)
    .background(RoundedRectangle(cornerRadius: 24).fill(SugarPalette.pinkDeep))
    .overlay(
      RoundedRectangle(cornerRadius: 24).strokeBorder(SugarPalette.raspberry, lineWidth: 3)
    )
    .padding(.top, 26)
  }

  private var stepCards: some View {
    VStack(spacing: 12) {
      ForEach(SugarContent.howItWorks, id: \.title) { step in
        VStack(spacing: 7) {
          Text(step.emoji).font(.system(size: 28))
          Text(step.title)
            .font(.system(size: 16, weight: .bold, design: .serif))
            .foregroundStyle(SugarPalette.ink)
          Text(step.text)
            .font(.caption)
            .foregroundStyle(SugarPalette.inkSoft)
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(18)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(SugarPalette.line))
      }
    }
    .padding(.top, 20)
  }

  private func sectionTitle(_ title: String, kicker: String) -> some View {
    VStack(spacing: 5) {
      Text(title)
        .font(.system(size: 24, weight: .bold, design: .serif))
        .foregroundStyle(SugarPalette.ink)
      Text(kicker)
        .font(.caption)
        .foregroundStyle(SugarPalette.inkSoft)
        .multilineTextAlignment(.center)
    }
    .padding(.top, 44)
  }

  private func caseBadge(_ title: String) -> some View {
    Text(title.uppercased())
      .font(.system(size: 11, weight: .bold))
      .kerning(1.1)
      .foregroundStyle(SugarPalette.raspberry)
      .padding(.horizontal, 14)
      .padding(.vertical, 6)
      .background(Capsule().fill(SugarPalette.raspberrySoft))
      .padding(.top, 16)
  }

  private func pastryCards(_ lineup: SugarContent.Lineup) -> some View {
    VStack(spacing: 12) {
      ForEach(lineup.pastries, id: \.name) { pastry in
        HStack(spacing: 14) {
          Text(pastry.emoji)
            .font(.system(size: 26))
            .frame(width: 48, height: 48)
            .background(RoundedRectangle(cornerRadius: 13).fill(SugarPalette.raspberrySoft))
          VStack(alignment: .leading, spacing: 3) {
            Text(pastry.name)
              .font(.system(size: 16, weight: .semibold, design: .serif))
              .foregroundStyle(SugarPalette.ink)
            Text(pastry.description)
              .font(.caption)
              .foregroundStyle(SugarPalette.inkSoft)
              .multilineTextAlignment(.leading)
          }
          Spacer()
          Text(SugarFreshness.formatPrice(pastry.priceCents))
            .font(.system(size: 16, weight: .bold, design: .serif))
            .foregroundStyle(SugarPalette.raspberry)
        }
        .padding(15)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(SugarPalette.line))
      }
    }
    .padding(.top, 16)
  }

  private func machineCards(day: Int, minute: Int) -> some View {
    VStack(spacing: 12) {
      ForEach(SugarContent.machines, id: \.name) { machine in
        let status = SugarFreshness.statusAt(machine.schedule, day: day, minute: minute)
        VStack(alignment: .leading, spacing: 7) {
          HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
              Text(machine.name)
                .font(.system(size: 17, weight: .bold, design: .serif))
                .foregroundStyle(SugarPalette.ink)
              Text(machine.spot)
                .font(.caption)
                .foregroundStyle(SugarPalette.inkSoft)
            }
            Spacer()
            statusBadge(status)
          }
          if let note = machine.note {
            Text(note)
              .font(.caption2.italic())
              .foregroundStyle(SugarPalette.inkSoft)
          }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(SugarPalette.line))
      }
    }
    .padding(.top, 20)
  }

  private func statusBadge(_ status: SugarFreshness.CaseStatus) -> some View {
    let (foreground, background): (Color, Color) =
      switch status.kind {
      case .fresh: (SugarPalette.mint, SugarPalette.mintSoft)
      case .sellingFast: (SugarPalette.amber, SugarPalette.amberSoft)
      case .upcoming: (SugarPalette.raspberry, SugarPalette.raspberrySoft)
      case .soldOut, .closed: (SugarPalette.neutral, SugarPalette.neutralSoft)
      }
    return Text(status.label)
      .font(.caption2.weight(.bold))
      .foregroundStyle(foreground)
      .padding(.horizontal, 10)
      .padding(.vertical, 5)
      .background(Capsule().fill(background))
  }

  private var hostBlock: some View {
    VStack(spacing: 14) {
      Text(SugarContent.hostPitch)
        .font(.system(size: 20, weight: .bold, design: .serif))
        .foregroundStyle(.white)
        .multilineTextAlignment(.center)
      Link(destination: URL(string: "mailto:\(SugarContent.email)")!) {
        Text("Talk to us")
          .font(.subheadline.weight(.bold))
          .foregroundStyle(SugarPalette.raspberry)
          .padding(.horizontal, 26)
          .padding(.vertical, 12)
          .background(Capsule().fill(Color.white))
      }
    }
    .frame(maxWidth: .infinity)
    .padding(26)
    .background(RoundedRectangle(cornerRadius: 20).fill(SugarPalette.raspberry))
    .padding(.top, 44)
  }
}

/// The machine's white "window" behind the pastry shelf grid.
private struct RoundedCornerShapeFill: View {
  var body: some View {
    RoundedRectangle(cornerRadius: 14)
      .fill(Color(red: 1.0, green: 0.973, blue: 0.984))
      .overlay(
        RoundedRectangle(cornerRadius: 14)
          .strokeBorder(Color(red: 0.824, green: 0.267, blue: 0.494), lineWidth: 2))
  }
}

#Preview {
  SugarView()
}
