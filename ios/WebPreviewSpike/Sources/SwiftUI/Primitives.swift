// Concrete views the Folio surface uses: Text, stacks, ScrollView, Button,
// Spacer, GeometryReader, Color-as-view, and shapes.
import Foundation

// MARK: - Alignment vocabulary

public struct HorizontalAlignment: Equatable, Sendable {
  let key: String
  public static let leading = HorizontalAlignment(key: "leading")
  public static let center = HorizontalAlignment(key: "center")
  public static let trailing = HorizontalAlignment(key: "trailing")

  var flexAlign: String {
    switch key {
    case "leading": return "flex-start"
    case "trailing": return "flex-end"
    default: return "center"
    }
  }
}

public struct VerticalAlignment: Equatable, Sendable {
  let key: String
  public static let top = VerticalAlignment(key: "top")
  public static let center = VerticalAlignment(key: "center")
  public static let bottom = VerticalAlignment(key: "bottom")
  public static let firstTextBaseline = VerticalAlignment(key: "firstTextBaseline")

  var flexAlign: String {
    switch key {
    case "top": return "flex-start"
    case "bottom": return "flex-end"
    case "firstTextBaseline": return "baseline"
    default: return "center"
    }
  }
}

public struct Alignment: Equatable, Sendable {
  public var horizontal: HorizontalAlignment
  public var vertical: VerticalAlignment
  public init(horizontal: HorizontalAlignment, vertical: VerticalAlignment) {
    self.horizontal = horizontal
    self.vertical = vertical
  }
  public static let center = Alignment(horizontal: .center, vertical: .center)
  public static let leading = Alignment(horizontal: .leading, vertical: .center)
  public static let trailing = Alignment(horizontal: .trailing, vertical: .center)
  public static let top = Alignment(horizontal: .center, vertical: .top)
  public static let bottom = Alignment(horizontal: .center, vertical: .bottom)
  public static let topLeading = Alignment(horizontal: .leading, vertical: .top)
  public static let topTrailing = Alignment(horizontal: .trailing, vertical: .top)
  public static let bottomLeading = Alignment(horizontal: .leading, vertical: .bottom)
  public static let bottomTrailing = Alignment(horizontal: .trailing, vertical: .bottom)

  var justifyItems: String { horizontal.flexAlign.replacingOccurrences(of: "flex-", with: "") }
  var alignItems: String { vertical.flexAlign.replacingOccurrences(of: "flex-", with: "") }
}

public struct Axis {
  public struct Set: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let horizontal = Set(rawValue: 1)
    public static let vertical = Set(rawValue: 2)
  }
}

// MARK: - Text

public struct Text: View, _Primitive {
  let content: String
  public init(_ content: String) { self.content = content }
  public init(verbatim: String) { self.content = verbatim }
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node(tag: "span")
    node.text = content
    node.style["white-space"] = "pre-wrap"
    return [node]
  }
}

// MARK: - Stacks

public struct VStack<Content: View>: View, _Primitive {
  let alignment: HorizontalAlignment
  let spacing: CGFloat?
  let content: Content

  public init(
    alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil,
    @ViewBuilder content: () -> Content
  ) {
    self.alignment = alignment
    self.spacing = spacing
    self.content = content()
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node()
    node.style["display"] = "flex"
    node.style["flex-direction"] = "column"
    node.style["align-items"] = alignment.flexAlign
    node.style["gap"] = "\(spacing ?? 8)px"
    let children = content._nodes()
    if children.contains(where: { $0.fillsWidth }) {
      node.style["width"] = "100%"
      node.fillsWidth = true
    }
    node.children = children
    return [node]
  }
}

public struct HStack<Content: View>: View, _Primitive {
  let alignment: VerticalAlignment
  let spacing: CGFloat?
  let content: Content

  public init(
    alignment: VerticalAlignment = .center, spacing: CGFloat? = nil,
    @ViewBuilder content: () -> Content
  ) {
    self.alignment = alignment
    self.spacing = spacing
    self.content = content()
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node()
    node.style["display"] = "flex"
    node.style["flex-direction"] = "row"
    node.style["align-items"] = alignment.flexAlign
    node.style["gap"] = "\(spacing ?? 8)px"
    let children = content._nodes()
    if children.contains(where: { $0.fillsWidth }) {
      node.style["width"] = "100%"
      node.fillsWidth = true
    }
    node.children = children
    return [node]
  }
}

public struct ZStack<Content: View>: View, _Primitive {
  let alignment: Alignment
  let content: Content

  public init(alignment: Alignment = .center, @ViewBuilder content: () -> Content) {
    self.alignment = alignment
    self.content = content()
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    let children = content._nodes()
    var node = _Node()
    // Spike approximation: a ZStack whose children carry `.alignmentGuide`
    // (the FlowChips wrapping pattern) renders as a wrapping flex row.
    if children.contains(where: { $0.hasAlignmentGuide }) {
      node.style["display"] = "flex"
      node.style["flex-wrap"] = "wrap"
      node.style["gap"] = "8px"
      node.children = children
      return [node]
    }
    node.style["display"] = "grid"
    node.style["justify-items"] = alignment.justifyItems
    node.style["align-items"] = alignment.alignItems
    node.style["width"] = "100%"
    node.style["height"] = "100%"
    node.children = children.map { child in
      var child = child
      child.style["grid-area"] = "1 / 1"
      return child
    }
    return [node]
  }
}

// MARK: - ScrollView

public struct ScrollView<Content: View>: View, _Primitive {
  let axes: Axis.Set
  let showsIndicators: Bool
  let content: Content

  public init(
    _ axes: Axis.Set = .vertical, showsIndicators: Bool = true,
    @ViewBuilder content: () -> Content
  ) {
    self.axes = axes
    self.showsIndicators = showsIndicators
    self.content = content()
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node()
    // A ScrollView always fills the proposed space along its axes.
    node.style["width"] = "100%"
    var children = content._nodes()
    if axes.contains(.horizontal) {
      node.style["overflow-x"] = "auto"
      // Content must keep its natural width so it scrolls instead of
      // flex-shrinking to fit.
      children = children.map { child in
        var child = child
        child.style["width"] = "max-content"
        return child
      }
    }
    if axes.contains(.vertical) {
      node.style["overflow-y"] = "auto"
      node.style["height"] = "100%"
    }
    if !showsIndicators { node.style["scrollbar-width"] = "none" }
    node.children = children
    return [node]
  }
}

// MARK: - Button

public struct Button<Label: View>: View, _Primitive {
  let action: () -> Void
  let label: Label

  public init(action: @escaping () -> Void, @ViewBuilder label: () -> Label) {
    self.action = action
    self.label = label()
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node(tag: "button")
    node.style["appearance"] = "none"
    node.style["background"] = "none"
    node.style["border"] = "none"
    node.style["padding"] = "0"
    node.style["margin"] = "0"
    node.style["font"] = "inherit"
    node.style["color"] = "inherit"
    node.style["letter-spacing"] = "inherit"
    node.style["text-align"] = "inherit"
    node.style["cursor"] = "pointer"
    node.style["display"] = "block"
    node.onClick = action
    let children = label._nodes()
    if children.contains(where: { $0.fillsWidth }) {
      node.style["width"] = "100%"
      node.fillsWidth = true
    }
    node.children = children
    return [node]
  }
}

extension Button where Label == Text {
  public init(_ title: String, action: @escaping () -> Void) {
    self.action = action
    self.label = Text(title)
  }
}

// MARK: - Spacer

public struct Spacer: View, _Primitive {
  public init(minLength: CGFloat? = nil) {}
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node()
    node.style["flex-grow"] = "1"
    node.style["align-self"] = "stretch"
    // A Spacer makes its stack claim the whole proposed main axis.
    node.fillsWidth = true
    return [node]
  }
}

// MARK: - GeometryReader

public struct GeometryProxy {
  public let size: CGSize
}

public struct GeometryReader<Content: View>: View, _Primitive {
  let content: (GeometryProxy) -> Content
  public init(@ViewBuilder content: @escaping (GeometryProxy) -> Content) {
    self.content = content
  }
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    // Spike: fixed iPhone-ish proposal instead of measuring the DOM.
    let proxy = GeometryProxy(size: CGSize(width: 390, height: 800))
    var node = _Node()
    node.style["width"] = "100%"
    node.style["height"] = "100%"
    node.children = content(proxy)._nodes()
    return [node]
  }
}

// MARK: - Color (view + style)

public struct Color: View, _Primitive, Equatable, Sendable {
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
      "rgba(\(Int(red * 255)), \(Int(green * 255)), \(Int(blue * 255)), \(opacity))"
  }

  public init(red: Double, green: Double, blue: Double, opacity: Double = 1) {
    self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
  }

  public static let clear = Color(css: "rgba(0, 0, 0, 0)")
  public static let black = Color(css: "#000000")
  public static let white = Color(css: "#ffffff")
  public static let primary = Color(css: "#000000")
  public static let secondary = Color(css: "rgba(60, 60, 67, 0.6)")

  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var node = _Node()
    node.style["background-color"] = css
    node.style["width"] = "100%"
    node.style["height"] = "100%"
    node.style["align-self"] = "stretch"
    node.style["justify-self"] = "stretch"
    node.style["flex-grow"] = "1"
    return [node]
  }
}

// MARK: - Shapes

public enum RoundedCornerStyle: Sendable {
  case circular
  case continuous
}

public protocol Shape: View {
  var _radiusCSS: String { get }
}

extension Shape {
  public var body: Never { fatalError() }

  public func fill(_ color: Color) -> some View {
    _ShapeView(radiusCSS: _radiusCSS, fill: color, stroke: nil, lineWidth: 0)
  }

  public func stroke(_ color: Color, lineWidth: CGFloat = 1) -> some View {
    _ShapeView(radiusCSS: _radiusCSS, fill: nil, stroke: color, lineWidth: lineWidth)
  }
}

public struct Rectangle: Shape, _Primitive {
  public init() {}
  public var _radiusCSS: String { "0" }
  public func _render() -> [_Node] { fill(.black)._nodes() }
}

public struct RoundedRectangle: Shape, _Primitive {
  public let cornerRadius: CGFloat
  public init(cornerRadius: CGFloat, style: RoundedCornerStyle = .circular) {
    self.cornerRadius = cornerRadius
  }
  public var _radiusCSS: String { "\(cornerRadius)px" }
  public func _render() -> [_Node] { fill(.black)._nodes() }
}

public struct Capsule: Shape, _Primitive {
  public init() {}
  public var _radiusCSS: String { "9999px" }
  public func _render() -> [_Node] { fill(.black)._nodes() }
}

public struct Circle: Shape, _Primitive {
  public init() {}
  public var _radiusCSS: String { "50%" }
  public func _render() -> [_Node] { fill(.black)._nodes() }
}

struct _ShapeView: View, _Primitive {
  let radiusCSS: String
  let fill: Color?
  let stroke: Color?
  let lineWidth: CGFloat

  var body: Never { fatalError() }
  func _render() -> [_Node] {
    var node = _Node()
    node.style["border-radius"] = radiusCSS
    node.style["width"] = "100%"
    node.style["height"] = "100%"
    node.style["align-self"] = "stretch"
    node.style["justify-self"] = "stretch"
    node.style["box-sizing"] = "border-box"
    if let fill { node.style["background-color"] = fill.css }
    if let stroke { node.style["border"] = "\(lineWidth)px solid \(stroke.css)" }
    return [node]
  }
}
