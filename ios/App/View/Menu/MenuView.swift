import SwiftUI

/// Warm café palette, mirrored from MenuPage.styles.css.ts.
private enum MenuPalette {
  static let cream = Color(red: 0.980, green: 0.961, blue: 0.925)
  static let espresso = Color(red: 0.169, green: 0.129, blue: 0.102)
  static let espressoSoft = Color(red: 0.478, green: 0.416, blue: 0.361)
  static let line = Color(red: 0.902, green: 0.863, blue: 0.796)
  static let copper = Color(red: 0.706, green: 0.384, blue: 0.176)
  static let copperSoft = Color(red: 0.957, green: 0.898, blue: 0.835)
  static let open = Color(red: 0.243, green: 0.420, blue: 0.310)
  static let closed = Color(red: 0.627, green: 0.294, blue: 0.235)
}

struct MenuView: View {
  @State private var activeSection = MenuContent.menu[0].title
  @State private var filters: Set<MenuContent.Dietary> = []
  @Environment(\.openURL) private var openURL

  private var section: MenuContent.Section {
    MenuContent.menu.first { $0.title == activeSection } ?? MenuContent.menu[0]
  }

  private var visibleItems: [MenuContent.Item] {
    section.items.filter { item in filters.allSatisfy { item.dietary.contains($0) } }
  }

  var body: some View {
    ZStack {
      MenuPalette.cream.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 0) {
          hero
          sectionTabs
          dietaryRow
          if let note = section.note {
            Text(note)
              .font(.footnote.italic())
              .foregroundStyle(MenuPalette.espressoSoft)
              .frame(maxWidth: .infinity)
              .padding(.top, 10)
          }
          itemsList
          hoursSection
          contactSection
          Text("\(MenuContent.name) — \(MenuContent.tagline). Built with Repobot.")
            .font(.caption)
            .foregroundStyle(MenuPalette.espressoSoft)
            .frame(maxWidth: .infinity)
            .padding(.top, 28)
        }
        .padding(.horizontal, 22)
        .padding(.bottom, 48)
      }
    }
  }

  // MARK: - Hero

  private var hero: some View {
    let now = Date()
    let calendar = Calendar.current
    let day = calendar.component(.weekday, from: now) - 1  // 1..7 -> 0..6
    let minute = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
    let status = MenuHours.statusAt(MenuContent.weeklyHours, day: day, minute: minute)
    let label = MenuHours.statusLabel(MenuContent.weeklyHours, day: day, minute: minute)

    return VStack(spacing: 10) {
      Text(MenuContent.name)
        .font(.system(size: 38, weight: .bold, design: .serif))
        .foregroundStyle(MenuPalette.espresso)
        .multilineTextAlignment(.center)
        .padding(.top, 26)
      Text(MenuContent.tagline)
        .font(.subheadline)
        .foregroundStyle(MenuPalette.espressoSoft)
      HStack(spacing: 8) {
        Circle()
          .fill(status.open ? MenuPalette.open : MenuPalette.closed)
          .frame(width: 8, height: 8)
        Text(label)
          .font(.footnote.weight(.semibold))
          .foregroundStyle(MenuPalette.espresso)
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 8)
      .background(Capsule().fill(Color.white))
      .overlay(Capsule().strokeBorder(MenuPalette.line))
      Text(MenuContent.about)
        .font(.footnote)
        .foregroundStyle(MenuPalette.espressoSoft)
        .multilineTextAlignment(.center)
        .lineSpacing(3)
        .padding(.top, 6)
    }
    .frame(maxWidth: .infinity)
  }

  // MARK: - Menu

  private var sectionTabs: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(MenuContent.menu) { s in
          let isActive = s.title == activeSection
          Button {
            activeSection = s.title
          } label: {
            Text(s.title)
              .font(.footnote.weight(.semibold))
              .foregroundStyle(isActive ? MenuPalette.cream : MenuPalette.espressoSoft)
              .padding(.horizontal, 16)
              .padding(.vertical, 8)
              .background(Capsule().fill(isActive ? MenuPalette.copper : Color.clear))
              .overlay(
                Capsule().strokeBorder(isActive ? MenuPalette.copper : MenuPalette.line))
          }
          .buttonStyle(.plain)
        }
      }
    }
    .padding(.top, 22)
  }

  private var dietaryRow: some View {
    HStack(spacing: 8) {
      ForEach(MenuContent.Dietary.allCases, id: \.rawValue) { mark in
        let isActive = filters.contains(mark)
        Button {
          if isActive { filters.remove(mark) } else { filters.insert(mark) }
        } label: {
          Text(mark.label)
            .font(.caption.weight(.semibold))
            .foregroundStyle(isActive ? MenuPalette.copper : MenuPalette.espressoSoft)
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(Capsule().fill(isActive ? MenuPalette.copperSoft : Color.clear))
            .overlay(
              Capsule()
                .strokeBorder(
                  isActive ? MenuPalette.copper : MenuPalette.line,
                  style: StrokeStyle(lineWidth: 1, dash: isActive ? [] : [4, 3])))
        }
        .buttonStyle(.plain)
      }
    }
    .frame(maxWidth: .infinity)
    .padding(.top, 12)
  }

  private var itemsList: some View {
    VStack(spacing: 0) {
      ForEach(visibleItems) { item in
        VStack(alignment: .leading, spacing: 4) {
          HStack(alignment: .firstTextBaseline) {
            HStack(spacing: 8) {
              Text(item.name)
                .font(.system(size: 17, weight: .semibold, design: .serif))
                .foregroundStyle(MenuPalette.espresso)
              if item.popular {
                Text("Popular")
                  .font(.system(size: 10, weight: .bold))
                  .foregroundStyle(MenuPalette.copper)
                  .padding(.horizontal, 8)
                  .padding(.vertical, 2)
                  .background(Capsule().fill(MenuPalette.copperSoft))
              }
              ForEach(item.dietary, id: \.rawValue) { mark in
                Text(mark.rawValue)
                  .font(.system(size: 10, weight: .bold))
                  .foregroundStyle(MenuPalette.open)
                  .padding(.horizontal, 4)
                  .padding(.vertical, 1)
                  .overlay(
                    RoundedRectangle(cornerRadius: 4).strokeBorder(MenuPalette.open))
              }
            }
            Spacer()
            Text(MenuContent.formatPrice(item.priceCents))
              .font(.system(size: 16, weight: .semibold, design: .serif))
              .foregroundStyle(MenuPalette.espresso)
          }
          Text(item.description)
            .font(.footnote)
            .foregroundStyle(MenuPalette.espressoSoft)
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) {
          Rectangle().fill(MenuPalette.line).frame(height: 1)
        }
      }
      if visibleItems.isEmpty {
        Text("Nothing in \(section.title.lowercased()) fits that filter — try another section.")
          .font(.footnote.italic())
          .foregroundStyle(MenuPalette.espressoSoft)
          .padding(.vertical, 28)
      }
    }
    .padding(.top, 8)
  }

  // MARK: - Hours & contact

  private var hoursSection: some View {
    let today = Calendar.current.component(.weekday, from: Date()) - 1
    return VStack(alignment: .leading, spacing: 6) {
      Text("Hours")
        .font(.system(size: 20, weight: .semibold, design: .serif))
        .foregroundStyle(MenuPalette.espresso)
        .padding(.bottom, 6)
      ForEach(0..<7, id: \.self) { d in
        let entry = MenuContent.weeklyHours.first { $0.day == d }
        let text =
          entry.map { e in
            e.intervals
              .map { "\(MenuHours.formatMinute($0.open)) – \(MenuHours.formatMinute($0.close))" }
              .joined(separator: ", ")
          } ?? "Closed"
        HStack {
          Text(MenuHours.dayNames[d])
            .foregroundStyle(d == today ? MenuPalette.espresso : MenuPalette.espressoSoft)
          Spacer()
          Text(text)
            .foregroundStyle(MenuPalette.espresso)
        }
        .font(d == today ? .footnote.weight(.bold) : .footnote)
      }
      Text(MenuContent.hoursNote)
        .font(.caption.italic())
        .foregroundStyle(MenuPalette.espressoSoft)
        .padding(.top, 8)
    }
    .padding(.top, 36)
  }

  private var contactSection: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("Find us")
        .font(.system(size: 20, weight: .semibold, design: .serif))
        .foregroundStyle(MenuPalette.espresso)
        .padding(.bottom, 2)
      Text(MenuContent.address)
        .font(.footnote)
        .foregroundStyle(MenuPalette.espresso)
      contactLink("Get directions →") {
        let query = MenuContent.mapsQuery.addingPercentEncoding(
          withAllowedCharacters: .urlQueryAllowed)
        if let url = URL(string: "https://maps.google.com/?q=\(query ?? "")") {
          openURL(url)
        }
      }
      contactLink(MenuContent.phone) {
        let digits = MenuContent.phone.filter { $0.isNumber || $0 == "+" }
        if let url = URL(string: "tel:\(digits)") { openURL(url) }
      }
      contactLink(MenuContent.email) {
        if let url = URL(string: "mailto:\(MenuContent.email)") { openURL(url) }
      }
      contactLink("Instagram →") {
        if let url = URL(string: MenuContent.instagram) { openURL(url) }
      }
    }
    .padding(.top, 30)
  }

  private func contactLink(_ label: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(label)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(MenuPalette.copper)
    }
    .buttonStyle(.plain)
  }
}

#Preview {
  MenuView()
}
