import Foundation

public struct Font: Equatable, Sendable {
  public struct Weight: Equatable, Sendable {
    let css: Int
    public static let ultraLight = Weight(css: 100)
    public static let thin = Weight(css: 200)
    public static let light = Weight(css: 300)
    public static let regular = Weight(css: 400)
    public static let medium = Weight(css: 500)
    public static let semibold = Weight(css: 600)
    public static let bold = Weight(css: 700)
    public static let heavy = Weight(css: 800)
    public static let black = Weight(css: 900)
  }

  public enum Design: Equatable, Sendable {
    case `default`
    case serif
    case rounded
    case monospaced

    var cssFamily: String {
      switch self {
      case .serif:
        return "Georgia, 'Times New Roman', 'New York', serif"
      case .monospaced:
        return "ui-monospace, 'SF Mono', Menlo, monospace"
      default:
        return
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
      }
    }
  }

  var size: Double
  var weight: Weight
  var design: Design

  // iOS default type scale (per Apple HIG "large" Dynamic Type sizes).
  public static let largeTitle = Font(size: 34, weight: .regular, design: .default)
  public static let title = Font(size: 28, weight: .regular, design: .default)
  public static let title2 = Font(size: 22, weight: .regular, design: .default)
  public static let title3 = Font(size: 20, weight: .regular, design: .default)
  public static let headline = Font(size: 17, weight: .semibold, design: .default)
  public static let body = Font(size: 17, weight: .regular, design: .default)
  public static let callout = Font(size: 16, weight: .regular, design: .default)
  public static let subheadline = Font(size: 15, weight: .regular, design: .default)
  public static let footnote = Font(size: 13, weight: .regular, design: .default)
  public static let caption = Font(size: 12, weight: .regular, design: .default)
  public static let caption2 = Font(size: 11, weight: .regular, design: .default)

  public static func system(
    size: CGFloat, weight: Weight = .regular, design: Design = .default
  ) -> Font {
    Font(size: Double(size), weight: weight, design: design)
  }

  public func weight(_ weight: Weight) -> Font {
    Font(size: size, weight: weight, design: design)
  }

  public func bold() -> Font { weight(.bold) }

  var cssProperties: [String: String] {
    [
      "font-size": "\(size)px",
      "font-weight": "\(weight.css)",
      "font-family": design.cssFamily,
    ]
  }
}
