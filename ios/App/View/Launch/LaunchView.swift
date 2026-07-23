import SwiftUI

/// Deep-navy SaaS palette with a sun-gold accent, mirroring the web styles.
private enum LaunchPalette {
  static let bg = Color(hex: "#0C1022")
  static let surface = Color(hex: "#141A33")
  static let line = Color(hex: "#252D4F")
  static let text = Color(hex: "#EEF0FB")
  static let subtle = Color(hex: "#9AA3C7")
  static let gold = Color(hex: "#F5B83D")
  static let confirm = Color(hex: "#8FE3A5")
}

/// Home surface for the `launch` pack: a startup landing page rendered
/// entirely from `LaunchContent` — hero with waitlist capture, features,
/// steps, pricing with a billing toggle, and FAQ. The waitlist stores
/// locally (this pack is client-only).
struct LaunchView: View {
  @AppStorage("launchbot-waitlist-email") private var joinedEmail = ""
  @State private var email = ""
  @State private var billing: Billing = .monthly
  @State private var openQuestion: String?

  private enum Billing { case monthly, yearly }

  var body: some View {
    ZStack {
      LaunchPalette.bg.ignoresSafeArea()

      ScrollView {
        VStack(spacing: 44) {
          hero
          featureSection
          stepsSection
          pricingSection
          faqSection
          footerBar
        }
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .padding(.bottom, 28)
        .frame(maxWidth: 700)
      }
    }
  }

  private var hero: some View {
    VStack(spacing: 18) {
      HStack(spacing: 8) {
        Text(LaunchContent.product.logoEmoji)
        Text(LaunchContent.product.name)
          .font(.headline.weight(.bold))
          .foregroundStyle(LaunchPalette.text)
      }

      Text(LaunchContent.product.headline)
        .font(.system(size: 36, weight: .bold))
        .foregroundStyle(LaunchPalette.text)
        .multilineTextAlignment(.center)

      Text(LaunchContent.product.subheadline)
        .font(.subheadline)
        .foregroundStyle(LaunchPalette.subtle)
        .multilineTextAlignment(.center)
        .lineSpacing(4)

      if joinedEmail.isEmpty {
        VStack(spacing: 10) {
          TextField(
            LaunchContent.product.waitlistPlaceholder,
            text: $email
          )
          .keyboardType(.emailAddress)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
          .font(.callout)
          .foregroundStyle(LaunchPalette.text)
          .padding(.horizontal, 16)
          .padding(.vertical, 13)
          .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .fill(LaunchPalette.surface)
          )
          .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .stroke(LaunchPalette.line, lineWidth: 1)
          )

          Button {
            let trimmed = email.trimmingCharacters(in: .whitespaces)
            guard trimmed.contains("@") else { return }
            joinedEmail = trimmed
          } label: {
            Text(LaunchContent.product.waitlistCta)
              .font(.callout.weight(.bold))
              .foregroundStyle(LaunchPalette.surface)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 13)
              .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                  .fill(LaunchPalette.gold)
              )
          }
          .buttonStyle(.plain)
        }
      } else {
        Text("You're on the list — watch your inbox for the next cohort.")
          .font(.footnote.weight(.semibold))
          .foregroundStyle(LaunchPalette.confirm)
      }

      if !LaunchContent.product.trustedBy.isEmpty {
        Text(LaunchContent.product.trustedBy.joined(separator: "   ").uppercased())
          .font(.caption2.weight(.bold))
          .kerning(1.0)
          .foregroundStyle(LaunchPalette.subtle.opacity(0.7))
          .multilineTextAlignment(.center)
          .padding(.top, 8)
      }
    }
  }

  private var featureSection: some View {
    VStack(spacing: 14) {
      sectionHeader(kicker: "Features", title: "Everything your week is hiding")
      ForEach(LaunchContent.features) { feature in
        card {
          VStack(alignment: .leading, spacing: 8) {
            Text(feature.emoji).font(.system(size: 28))
            Text(feature.title)
              .font(.callout.weight(.bold))
              .foregroundStyle(LaunchPalette.text)
            Text(feature.description)
              .font(.subheadline)
              .foregroundStyle(LaunchPalette.subtle)
              .lineSpacing(3)
          }
        }
      }
    }
  }

  private var stepsSection: some View {
    VStack(spacing: 14) {
      sectionHeader(kicker: "How it works", title: "Three steps, one honest week")
      ForEach(Array(LaunchContent.steps.enumerated()), id: \.element.id) { index, step in
        card {
          VStack(alignment: .leading, spacing: 8) {
            Text("\(index + 1)")
              .font(.callout.weight(.bold))
              .foregroundStyle(LaunchPalette.surface)
              .frame(width: 32, height: 32)
              .background(Circle().fill(LaunchPalette.gold))
            Text(step.title)
              .font(.callout.weight(.bold))
              .foregroundStyle(LaunchPalette.text)
            Text(step.description)
              .font(.subheadline)
              .foregroundStyle(LaunchPalette.subtle)
              .lineSpacing(3)
          }
        }
      }
    }
  }

  private var pricingSection: some View {
    VStack(spacing: 16) {
      sectionHeader(kicker: "Pricing", title: "Pay for the hours you get back")

      HStack(spacing: 4) {
        billingButton(label: "Monthly", value: .monthly)
        billingButton(label: "Yearly", value: .yearly)
      }
      .padding(4)
      .background(Capsule().fill(LaunchPalette.surface))
      .overlay(Capsule().stroke(LaunchPalette.line, lineWidth: 1))

      ForEach(LaunchContent.pricing) { tier in
        let price = billing == .monthly ? tier.monthly : tier.yearlyPerMonth
        card(highlighted: tier.highlighted) {
          VStack(alignment: .leading, spacing: 10) {
            if let badge = tier.badge {
              Text(badge.uppercased())
                .font(.caption2.weight(.bold))
                .foregroundStyle(LaunchPalette.surface)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(LaunchPalette.gold))
            }
            Text(tier.name)
              .font(.headline.weight(.bold))
              .foregroundStyle(LaunchPalette.text)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
              Text(price == 0 ? "Free" : "$\(price)")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(LaunchPalette.text)
              if price > 0 {
                Text("/mo")
                  .font(.subheadline)
                  .foregroundStyle(LaunchPalette.subtle)
              }
            }
            Text(tier.description)
              .font(.subheadline)
              .foregroundStyle(LaunchPalette.subtle)
            VStack(alignment: .leading, spacing: 7) {
              ForEach(tier.features, id: \.self) { item in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                  Text("✓")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(LaunchPalette.gold)
                  Text(item)
                    .font(.subheadline)
                    .foregroundStyle(LaunchPalette.text)
                }
              }
            }
          }
        }
      }
    }
  }

  private var faqSection: some View {
    VStack(spacing: 12) {
      sectionHeader(kicker: "FAQ", title: "Fair questions")
      ForEach(LaunchContent.faq) { item in
        card {
          VStack(alignment: .leading, spacing: 10) {
            Button {
              withAnimation(.easeInOut(duration: 0.2)) {
                openQuestion = openQuestion == item.question ? nil : item.question
              }
            } label: {
              HStack {
                Text(item.question)
                  .font(.subheadline.weight(.semibold))
                  .foregroundStyle(LaunchPalette.text)
                  .multilineTextAlignment(.leading)
                Spacer()
                Text(openQuestion == item.question ? "–" : "+")
                  .font(.title3)
                  .foregroundStyle(LaunchPalette.subtle)
              }
            }
            .buttonStyle(.plain)

            if openQuestion == item.question {
              Text(item.answer)
                .font(.subheadline)
                .foregroundStyle(LaunchPalette.subtle)
                .lineSpacing(3)
            }
          }
        }
      }
    }
  }

  private var footerBar: some View {
    Text("Made with LaunchBot")
      .font(.caption)
      .foregroundStyle(LaunchPalette.subtle)
  }

  private func sectionHeader(kicker: String, title: String) -> some View {
    VStack(spacing: 6) {
      Text(kicker.uppercased())
        .font(.caption.weight(.bold))
        .kerning(1.6)
        .foregroundStyle(LaunchPalette.gold)
      Text(title)
        .font(.title3.weight(.bold))
        .foregroundStyle(LaunchPalette.text)
        .multilineTextAlignment(.center)
    }
  }

  private func billingButton(label: String, value: Billing) -> some View {
    Button {
      billing = value
    } label: {
      Text(label)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(billing == value ? LaunchPalette.surface : LaunchPalette.subtle)
        .padding(.horizontal, 18)
        .padding(.vertical, 8)
        .background(Capsule().fill(billing == value ? LaunchPalette.gold : Color.clear))
    }
    .buttonStyle(.plain)
  }

  private func card<Content: View>(
    highlighted: Bool = false,
    @ViewBuilder content: () -> Content
  ) -> some View {
    content()
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(20)
      .background(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .fill(LaunchPalette.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(highlighted ? LaunchPalette.gold : LaunchPalette.line, lineWidth: 1)
      )
  }
}

#Preview {
  LaunchView()
}
