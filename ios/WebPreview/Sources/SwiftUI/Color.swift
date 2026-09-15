import CoreGraphics
import Foundation

/// Color doubles as a View (fills its proposal) and as the dialect's shape
/// style. All colors reduce to a CSS color string.
public struct Color: View, _PrimitiveView, Hashable, Sendable {
  public typealias Body = Never

  public enum RGBColorSpace: Sendable {
    case sRGB
    case sRGBLinear
    case displayP3
  }

  let css: String

  init(css: String) { self.css = css }

  public init(
    _ colorSpace: RGBColorSpace = .sRGB, red: Double, green: Double, blue: Double,
    opacity: Double = 1
  ) {
    self.css =
      "rgba(\(Int((red * 255).rounded())), \(Int((green * 255).rounded())), \(Int((blue * 255).rounded())), \(opacity))"
  }

  public init(red: Double, green: Double, blue: Double, opacity: Double = 1) {
    self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
  }

  public init(white: Double, opacity: Double = 1) {
    self.init(red: white, green: white, blue: white, opacity: opacity)
  }

  public init(hue: Double, saturation: Double, brightness: Double, opacity: Double = 1) {
    // HSB → HSL for CSS.
    let lightness = brightness * (1 - saturation / 2)
    let saturationHSL =
      lightness == 0 || lightness == 1
      ? 0 : (brightness - lightness) / Swift.min(lightness, 1 - lightness)
    self.css =
      "hsla(\(Int(hue * 360)), \(Int(saturationHSL * 100))%, \(Int(lightness * 100))%, \(opacity))"
  }

  public static let clear = Color(css: "rgba(0, 0, 0, 0)")
  public static let black = Color(css: "#000000")
  public static let white = Color(css: "#ffffff")
  public static let gray = Color(css: "#8e8e93")
  public static let red = Color(css: "#ff3b30")
  public static let orange = Color(css: "#ff9500")
  public static let yellow = Color(css: "#ffcc00")
  public static let green = Color(css: "#34c759")
  public static let mint = Color(css: "#00c7be")
  public static let teal = Color(css: "#30b0c7")
  public static let cyan = Color(css: "#32ade6")
  public static let blue = Color(css: "#007aff")
  public static let indigo = Color(css: "#5856d6")
  public static let purple = Color(css: "#af52de")
  public static let pink = Color(css: "#ff2d55")
  public static let brown = Color(css: "#a2845e")
  public static let primary = Color(css: "#000000")
  public static let secondary = Color(css: "rgba(60, 60, 67, 0.6)")
  public static let accentColor = Color(css: "#007aff")

  public func opacity(_ value: Double) -> Color {
    Color(css: "color-mix(in srgb, \(css) \(Int((value * 100).rounded()))%, transparent)")
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ColorNode(css: css)]
  }
}

final class _ColorNode: _LayoutNode {
  let css: String
  init(css: String) {
    self.css = css
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 10, height: proposal.height ?? 10)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    node.styles["background-color"] = css
    parent.add(node)
  }
}

// MARK: - Gradients

public struct UnitPoint: Hashable, Sendable {
  public var x: CGFloat
  public var y: CGFloat
  public init(x: CGFloat, y: CGFloat) {
    self.x = x
    self.y = y
  }
  public static let top = UnitPoint(x: 0.5, y: 0)
  public static let bottom = UnitPoint(x: 0.5, y: 1)
  public static let leading = UnitPoint(x: 0, y: 0.5)
  public static let trailing = UnitPoint(x: 1, y: 0.5)
  public static let center = UnitPoint(x: 0.5, y: 0.5)
  public static let topLeading = UnitPoint(x: 0, y: 0)
  public static let topTrailing = UnitPoint(x: 1, y: 0)
  public static let bottomLeading = UnitPoint(x: 0, y: 1)
  public static let bottomTrailing = UnitPoint(x: 1, y: 1)
}

public struct Gradient: Hashable, Sendable {
  public struct Stop: Hashable, Sendable {
    public var color: Color
    public var location: CGFloat
    public init(color: Color, location: CGFloat) {
      self.color = color
      self.location = location
    }
  }
  public var stops: [Stop]
  public init(colors: [Color]) {
    let count = Swift.max(colors.count - 1, 1)
    stops = colors.enumerated().map {
      Stop(color: $0.element, location: CGFloat($0.offset) / CGFloat(count))
    }
  }
  public init(stops: [Stop]) { self.stops = stops }

  var cssStops: String {
    stops.map { "\($0.color.css) \(Int(($0.location * 100).rounded()))%" }
      .joined(separator: ", ")
  }
}

public struct LinearGradient: View, _PrimitiveView {
  public typealias Body = Never
  let gradient: Gradient
  let startPoint: UnitPoint
  let endPoint: UnitPoint

  public init(gradient: Gradient, startPoint: UnitPoint, endPoint: UnitPoint) {
    self.gradient = gradient
    self.startPoint = startPoint
    self.endPoint = endPoint
  }

  public init(colors: [Color], startPoint: UnitPoint, endPoint: UnitPoint) {
    self.init(gradient: Gradient(colors: colors), startPoint: startPoint, endPoint: endPoint)
  }

  public init(stops: [Gradient.Stop], startPoint: UnitPoint, endPoint: UnitPoint) {
    self.init(gradient: Gradient(stops: stops), startPoint: startPoint, endPoint: endPoint)
  }

  var cssBackground: String {
    let dx = (endPoint.x - startPoint.x)
    let dy = (endPoint.y - startPoint.y)
    // CSS angle: 0deg points up; measured clockwise.
    let radians = _atan2(dx, -dy)
    let degrees = radians * 180 / .pi
    return "linear-gradient(\(Int(degrees.rounded()))deg, \(gradient.cssStops))"
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_BackgroundImageNode(css: cssBackground)]
  }
}

public struct RadialGradient: View, _PrimitiveView {
  public typealias Body = Never
  let gradient: Gradient
  let center: UnitPoint
  let startRadius: CGFloat
  let endRadius: CGFloat

  public init(gradient: Gradient, center: UnitPoint, startRadius: CGFloat, endRadius: CGFloat) {
    self.gradient = gradient
    self.center = center
    self.startRadius = startRadius
    self.endRadius = endRadius
  }

  public init(colors: [Color], center: UnitPoint, startRadius: CGFloat, endRadius: CGFloat) {
    self.init(
      gradient: Gradient(colors: colors), center: center, startRadius: startRadius,
      endRadius: endRadius)
  }

  var cssBackground: String {
    let cx = Int((center.x * 100).rounded())
    let cy = Int((center.y * 100).rounded())
    return "radial-gradient(circle \(Int(endRadius))px at \(cx)% \(cy)%, \(gradient.cssStops))"
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_BackgroundImageNode(css: cssBackground)]
  }
}

final class _BackgroundImageNode: _LayoutNode {
  let css: String
  init(css: String) {
    self.css = css
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 10, height: proposal.height ?? 10)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    node.styles["background"] = css
    parent.add(node)
  }
}

/// Minimal atan2 to avoid pulling a math module; accurate enough for
/// gradient angles.
func _atan2(_ y: CGFloat, _ x: CGFloat) -> CGFloat {
  if x > 0 { return _atan(y / x) }
  if x < 0 && y >= 0 { return _atan(y / x) + .pi }
  if x < 0 && y < 0 { return _atan(y / x) - .pi }
  if y > 0 { return .pi / 2 }
  if y < 0 { return -.pi / 2 }
  return 0
}

func _atan(_ value: CGFloat) -> CGFloat {
  // Padé-style approximation, |error| < 0.005 rad.
  if value > 1 { return .pi / 2 - _atan(1 / value) }
  if value < -1 { return -.pi / 2 - _atan(1 / value) }
  return value / (1 + 0.28 * value * value)
}
