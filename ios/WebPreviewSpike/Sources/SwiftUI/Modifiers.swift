// View modifiers as wrapper views. Two kinds:
// - inherited-style wrappers (`display: contents`) for font/color/etc.
// - box wrappers for padding/frame/background/overlay/clip.
// `fillsWidth` crudely mirrors SwiftUI's `.frame(maxWidth: .infinity)`
// expansion propagating up through wrappers and stacks.
import Foundation

public struct Edge {
  public struct Set: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let top = Set(rawValue: 1)
    public static let bottom = Set(rawValue: 2)
    public static let leading = Set(rawValue: 4)
    public static let trailing = Set(rawValue: 8)
    public static let horizontal: Set = [.leading, .trailing]
    public static let vertical: Set = [.top, .bottom]
    public static let all: Set = [.top, .bottom, .leading, .trailing]
  }
}

public enum TextAlignment: Sendable {
  case leading
  case center
  case trailing

  var css: String {
    switch self {
    case .leading: return "left"
    case .center: return "center"
    case .trailing: return "right"
    }
  }
}

public struct ViewDimensions {
  public let width: CGFloat
  public let height: CGFloat
}

public struct PlainButtonStyle: Sendable {
  public init() {}
  public static var plain: PlainButtonStyle { PlainButtonStyle() }
}

extension _Node {
  var fillsWidth: Bool {
    get { style["--fills-width"] == "1" }
    set { style["--fills-width"] = newValue ? "1" : nil }
  }
}

/// `display: contents` wrapper carrying inherited CSS (color, font, …).
struct _InheritedStyle<Content: View>: View, _Primitive {
  let content: Content
  let styles: [String: String]

  var body: Never { fatalError() }
  func _render() -> [_Node] {
    var node = _Node()
    node.style["display"] = "contents"
    for (key, value) in styles { node.style[key] = value }
    let children = content._nodes()
    node.hasAlignmentGuide = children.contains { $0.hasAlignmentGuide }
    node.fillsWidth = children.contains { $0.fillsWidth }
    node.children = children
    return [node]
  }
}

/// Real box wrapper (padding, clip, …) propagating width expansion.
struct _BoxStyle<Content: View>: View, _Primitive {
  let content: Content
  let styles: [String: String]

  var body: Never { fatalError() }
  func _render() -> [_Node] {
    var node = _Node()
    for (key, value) in styles { node.style[key] = value }
    let children = content._nodes()
    if children.contains(where: { $0.fillsWidth }) {
      node.style["width"] = node.style["width"] ?? "100%"
      node.fillsWidth = true
    }
    node.hasAlignmentGuide = children.contains { $0.hasAlignmentGuide }
    node.children = children
    return [node]
  }
}

struct _Frame<Content: View>: View, _Primitive {
  let content: Content
  var width: CGFloat? = nil
  var height: CGFloat? = nil
  var maxWidth: CGFloat? = nil
  var alignment: Alignment = .center

  var body: Never { fatalError() }
  func _render() -> [_Node] {
    var node = _Node()
    node.style["display"] = "flex"
    node.style["justify-content"] = alignment.horizontal.flexAlign
    node.style["align-items"] = alignment.vertical.flexAlign
    if let width {
      node.style["width"] = "\(width)px"
      node.style["flex-shrink"] = "0"
    } else {
      // No explicit width: fill the parent (crude stand-in for SwiftUI's
      // pass-through width proposal; correct for every Folio use).
      node.style["width"] = "100%"
      node.fillsWidth = maxWidth != nil
    }
    if let maxWidth, maxWidth != .infinity {
      node.style["max-width"] = "\(maxWidth)px"
      node.style["margin-inline"] = "auto"
    }
    if let height {
      node.style["height"] = "\(height)px"
      node.style["flex-shrink"] = "0"
    }
    let children = content._nodes()
    if children.contains(where: { $0.fillsWidth }) { node.fillsWidth = true }
    node.children = children
    return [node]
  }
}

/// background/overlay: CSS grid stacking decoration under/over content.
struct _Decorated<Content: View, Decoration: View>: View, _Primitive {
  let content: Content
  let decoration: Decoration
  let decorationOnTop: Bool
  let alignment: Alignment

  var body: Never { fatalError() }
  func _render() -> [_Node] {
    var node = _Node()
    node.style["display"] = "grid"
    let contentNodes = content._nodes().map { child -> _Node in
      var child = child
      child.style["grid-area"] = "1 / 1"
      return child
    }
    let decorationNodes = decoration._nodes().map { deco -> _Node in
      var deco = deco
      deco.style["grid-area"] = "1 / 1"
      if alignment != .center {
        deco.style["align-self"] = alignment.vertical.flexAlign
        deco.style["justify-self"] = alignment.horizontal.flexAlign
        // Edge-aligned decorations (e.g. hairline rules) span the cross axis.
        deco.style["justify-self"] = "stretch"
      }
      if decorationOnTop { deco.style["pointer-events"] = "none" }
      return deco
    }
    if contentNodes.contains(where: { $0.fillsWidth }) {
      node.style["width"] = "100%"
      node.fillsWidth = true
    }
    node.children = decorationOnTop ? contentNodes + decorationNodes : decorationNodes + contentNodes
    return [node]
  }
}

struct _AlignmentGuideMarker<Content: View>: View, _Primitive {
  let content: Content
  var body: Never { fatalError() }
  func _render() -> [_Node] {
    content._nodes().map { child -> _Node in
      var child = child
      child.hasAlignmentGuide = true
      return child
    }
  }
}

// MARK: - Public modifier surface

extension View {
  public func padding(_ edges: Edge.Set = .all, _ length: CGFloat? = nil) -> some View {
    let amount = length ?? 16
    var styles: [String: String] = ["box-sizing": "border-box"]
    if edges.contains(.top) { styles["padding-top"] = "\(amount)px" }
    if edges.contains(.bottom) { styles["padding-bottom"] = "\(amount)px" }
    if edges.contains(.leading) { styles["padding-left"] = "\(amount)px" }
    if edges.contains(.trailing) { styles["padding-right"] = "\(amount)px" }
    return _BoxStyle(content: self, styles: styles)
  }

  public func padding(_ length: CGFloat) -> some View {
    padding(.all, length)
  }

  public func frame(
    width: CGFloat? = nil, height: CGFloat? = nil, alignment: Alignment = .center
  ) -> some View {
    _Frame(content: self, width: width, height: height, alignment: alignment)
  }

  public func frame(
    minWidth: CGFloat? = nil, idealWidth: CGFloat? = nil, maxWidth: CGFloat? = nil,
    minHeight: CGFloat? = nil, idealHeight: CGFloat? = nil, maxHeight: CGFloat? = nil,
    alignment: Alignment = .center
  ) -> some View {
    _Frame(content: self, maxWidth: maxWidth, alignment: alignment)
  }

  public func background<Background: View>(
    _ background: Background, alignment: Alignment = .center
  ) -> some View {
    _Decorated(
      content: self, decoration: background, decorationOnTop: false, alignment: alignment)
  }

  public func overlay<Overlay: View>(
    _ overlay: Overlay, alignment: Alignment = .center
  ) -> some View {
    _Decorated(content: self, decoration: overlay, decorationOnTop: true, alignment: alignment)
  }

  public func clipShape<S: Shape>(_ shape: S) -> some View {
    _BoxStyle(content: self, styles: ["overflow": "hidden", "border-radius": shape._radiusCSS])
  }

  public func font(_ font: Font?) -> some View {
    _InheritedStyle(content: self, styles: font?.cssProperties ?? [:])
  }

  public func foregroundStyle(_ color: Color) -> some View {
    _InheritedStyle(content: self, styles: ["color": color.css])
  }

  public func foregroundColor(_ color: Color?) -> some View {
    _InheritedStyle(content: self, styles: color.map { ["color": $0.css] } ?? [:])
  }

  public func lineSpacing(_ spacing: CGFloat) -> some View {
    // Unitless so it recomputes against the (inner) font size; the exact px
    // spacing is approximated as a ratio bump.
    _InheritedStyle(content: self, styles: ["line-height": "\(1.2 + Double(spacing) * 0.04)"])
  }

  public func kerning(_ kerning: CGFloat) -> some View {
    _InheritedStyle(content: self, styles: ["letter-spacing": "\(kerning)px"])
  }

  public func multilineTextAlignment(_ alignment: TextAlignment) -> some View {
    _InheritedStyle(content: self, styles: ["text-align": alignment.css])
  }

  public func lineLimit(_ limit: Int?) -> some View {
    guard let limit else { return _InheritedStyle(content: self, styles: [:]) }
    return _InheritedStyle(
      content: self,
      styles: [
        "display": "-webkit-box",
        "-webkit-line-clamp": "\(limit)",
        "-webkit-box-orient": "vertical",
        "overflow": "hidden",
      ])
  }

  public func ignoresSafeArea() -> Self { self }

  public func buttonStyle(_ style: PlainButtonStyle) -> Self { self }

  public func alignmentGuide(
    _ g: HorizontalAlignment, computeValue: @escaping (ViewDimensions) -> CGFloat
  ) -> some View {
    _AlignmentGuideMarker(content: self)
  }

  public func alignmentGuide(
    _ g: VerticalAlignment, computeValue: @escaping (ViewDimensions) -> CGFloat
  ) -> some View {
    _AlignmentGuideMarker(content: self)
  }

  public func opacity(_ value: Double) -> some View {
    _BoxStyle(content: self, styles: ["opacity": "\(value)"])
  }

  public func cornerRadius(_ radius: CGFloat) -> some View {
    _BoxStyle(content: self, styles: ["border-radius": "\(radius)px", "overflow": "hidden"])
  }
}
