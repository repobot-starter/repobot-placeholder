import CoreGraphics
import Foundation

public struct Font: Hashable, Sendable {
  public struct Weight: Hashable, Sendable {
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

  public enum Design: Hashable, Sendable {
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
      case .rounded:
        return
          "ui-rounded, -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', Arial, sans-serif"
      case .default:
        return
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
      }
    }
  }

  var size: CGFloat
  var weight: Weight
  var design: Design
  var isItalic: Bool = false
  var isMonospacedDigit: Bool = false
  /// Bundled family (Font.custom); the host page provides @font-face rules
  /// for the TTFs in ios/App/Fonts (see PREVIEW-CONTRACT.md).
  var customFamily: String? = nil

  // iOS default type scale (Apple HIG "large" Dynamic Type sizes).
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
    Font(size: size, weight: weight, design: design)
  }

  public static func custom(_ name: String, size: CGFloat) -> Font {
    var font = Font(size: size, weight: .regular, design: .default)
    font.customFamily = name
    return font
  }

  public static func custom(_ name: String, size: CGFloat, relativeTo textStyle: Font) -> Font {
    custom(name, size: size)
  }

  public func weight(_ weight: Weight) -> Font {
    var font = self
    font.weight = weight
    return font
  }

  public func bold() -> Font { weight(.bold) }

  public func italic() -> Font {
    var font = self
    font.isItalic = true
    return font
  }

  public func monospacedDigit() -> Font {
    var font = self
    font.isMonospacedDigit = true
    return font
  }

  public func monospaced() -> Font {
    var font = self
    font.design = .monospaced
    return font
  }

  /// UIFont line heights for the SF type scale; other sizes approximated.
  var lineHeight: CGFloat {
    switch size {
    case 11: return 13
    case 12: return 16
    case 13: return 18
    case 15: return 20
    case 16: return 21
    case 17: return 22
    case 20: return 25
    case 22: return 28
    case 28: return 34
    case 34: return 41
    default: return (size * 1.25).rounded()
    }
  }

  var cssProperties: [String: String] {
    var props = [
      "font-size": "\(size)px",
      "font-weight": "\(weight.css)",
      "font-family": customFamily.map { "'\($0)', \(design.cssFamily)" } ?? design.cssFamily,
    ]
    if isItalic { props["font-style"] = "italic" }
    if isMonospacedDigit { props["font-variant-numeric"] = "tabular-nums" }
    return props
  }
}
