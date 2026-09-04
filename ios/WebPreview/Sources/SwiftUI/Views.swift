// Primitive views: Text, stacks, ScrollView, Spacer, GeometryReader,
// shapes, Divider, NavigationStack (renders as a plain container).
import CoreGraphics
import Foundation

// MARK: - Text

public struct Text: View, _PrimitiveView {
  public typealias Body = Never
  let content: String
  // Text-returning modifier state (SwiftUI's Text methods return Text).
  var overrideWeight: Font.Weight?
  var overrideItalic = false
  var overrideUnderline = false
  var overrideStrikethrough = false
  var overrideKerning: CGFloat?
  var overrideColor: Color?

  public init(_ content: String) { self.content = content }
  public init(verbatim: String) { self.content = verbatim }

  public func fontWeight(_ weight: Font.Weight?) -> Text {
    var text = self
    text.overrideWeight = weight
    return text
  }

  public func italic() -> Text {
    var text = self
    text.overrideItalic = true
    return text
  }

  public func underline(_ isActive: Bool = true, color: Color? = nil) -> Text {
    var text = self
    text.overrideUnderline = isActive
    return text
  }

  public func strikethrough(_ isActive: Bool = true, color: Color? = nil) -> Text {
    var text = self
    text.overrideStrikethrough = isActive
    return text
  }

  public func kerning(_ kerning: CGFloat) -> Text {
    var text = self
    text.overrideKerning = kerning
    return text
  }

  public func foregroundColor(_ color: Color?) -> Text {
    var text = self
    text.overrideColor = color
    return text
  }

  public func foregroundStyle(_ color: Color) -> Text {
    var text = self
    text.overrideColor = color
    return text
  }

  public static func + (lhs: Text, rhs: Text) -> Text {
    Text(lhs.content + rhs.content)
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var font = ctx.environment.font
    if let overrideWeight { font = font.weight(overrideWeight) }
    if overrideItalic { font = font.italic() }
    let style = _TextStyle(
      font: font,
      colorCSS: overrideColor?.css ?? ctx.environment.foregroundCSS,
      alignCSS: ctx.environment.textAlignmentCSS,
      lineSpacing: ctx.environment.lineSpacing,
      kerning: overrideKerning ?? ctx.environment.kerning,
      lineLimit: ctx.environment.lineLimit,
      underline: overrideUnderline,
      strikethrough: overrideStrikethrough,
      truncationCSS: ctx.environment.truncationCSS)
    return [_TextNode(text: content, style: style)]
  }
}

struct _TextStyle {
  var font: Font
  var colorCSS: String
  var alignCSS: String
  var lineSpacing: CGFloat
  var kerning: CGFloat
  var lineLimit: Int?
  var underline = false
  var strikethrough = false
  var truncationCSS = "ellipsis"

  /// Effective CSS line height in px (SwiftUI adds lineSpacing between lines).
  var cssLineHeight: CGFloat { font.lineHeight + lineSpacing }

  var cssProperties: [String: String] {
    var props = font.cssProperties
    props["color"] = colorCSS
    props["text-align"] = alignCSS
    props["line-height"] = "\(cssLineHeight)px"
    if kerning != 0 { props["letter-spacing"] = "\(kerning)px" }
    var decorations: [String] = []
    if underline { decorations.append("underline") }
    if strikethrough { decorations.append("line-through") }
    if !decorations.isEmpty { props["text-decoration"] = decorations.joined(separator: " ") }
    return props
  }
}

final class _TextNode: _LayoutNode {
  let text: String
  let style: _TextStyle

  init(text: String, style: _TextStyle) {
    self.text = text
    self.style = style
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    var size = _TextMeasurer.shared.measure(
      text: text, style: style, maxWidth: proposal.width)
    if let limit = style.lineLimit {
      size.height = Swift.min(size.height, style.cssLineHeight * CGFloat(limit))
    }
    return size
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    node.text = text
    node.styles = style.cssProperties
    node.styles["white-space"] = "pre-wrap"
    node.styles["overflow-wrap"] = "break-word"
    if let limit = style.lineLimit {
      node.styles["display"] = "-webkit-box"
      node.styles["-webkit-box-orient"] = "vertical"
      node.styles["-webkit-line-clamp"] = "\(limit)"
      node.styles["overflow"] = "hidden"
    }
    parent.add(node)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    // Half-leading model: baseline sits at ~0.77 of the font's ascent
    // within the first line box.
    let font = style.font
    return (style.cssLineHeight - font.size) / 2 + font.size * 0.77
  }
}

// MARK: - Stacks

public struct VStack<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
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

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/V"
    let children = _buildNodes(content, &childCtx)
    for child in children { (child as? _SpacerNode)?.axis = .vertical }
    return [
      _StackNode(
        axis: .vertical, spacing: spacing, alignmentH: alignment, alignmentV: .top,
        children: children)
    ]
  }
}

public struct HStack<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
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

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/H"
    let children = _buildNodes(content, &childCtx)
    for child in children { (child as? _SpacerNode)?.axis = .horizontal }
    return [
      _StackNode(
        axis: .horizontal, spacing: spacing, alignmentH: .leading, alignmentV: alignment,
        children: children)
    ]
  }
}

public struct ZStack<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let alignment: Alignment
  let content: Content

  public init(alignment: Alignment = .center, @ViewBuilder content: () -> Content) {
    self.alignment = alignment
    self.content = content()
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Z"
    return [_ZStackNode(alignment: alignment, children: _buildNodes(content, &childCtx))]
  }
}

/// Laziness is a scrolling optimization the preview doesn't need at preview
/// data sizes; these render all rows eagerly through the plain stacks.
public struct LazyVStack<Content: View>: View {
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

  public var body: some View {
    VStack(alignment: alignment, spacing: spacing) { content }
  }
}

public struct LazyHStack<Content: View>: View {
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

  public var body: some View {
    HStack(alignment: alignment, spacing: spacing) { content }
  }
}

// MARK: - Spacer

public struct Spacer: View, _PrimitiveView {
  public typealias Body = Never
  let minLength: CGFloat?
  public init(minLength: CGFloat? = nil) { self.minLength = minLength }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_SpacerNode(minLength: minLength ?? 8)]
  }
}

final class _SpacerNode: _LayoutNode {
  let minLength: CGFloat
  var axis: Axis = .vertical

  init(minLength: CGFloat) {
    self.minLength = minLength
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let main = axis == .horizontal ? proposal.width : proposal.height
    let length = Swift.max(minLength, main ?? 0)
    // Under a nil (ideal) proposal the spacer collapses to its minimum.
    let resolved = main == nil ? minLength : length
    return axis == .horizontal
      ? CGSize(width: resolved, height: 0)
      : CGSize(width: 0, height: resolved)
  }
}

// MARK: - ScrollView

public struct ScrollView<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
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

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/S"
    let children = _buildNodes(content, &childCtx)
    let child =
      children.count == 1
      ? children[0]
      : _StackNode(
        axis: .vertical, spacing: nil, alignmentH: .center, alignmentV: .top, children: children)
    return [_ScrollNode(axes: axes, child: child, pathId: childCtx.path)]
  }
}

final class _ScrollNode: _LayoutNode {
  let axes: Axis.Set
  let child: _LayoutNode
  let pathId: String

  init(axes: Axis.Set, child: _LayoutNode, pathId: String) {
    self.axes = axes
    self.child = child
    self.pathId = pathId
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    // A ScrollView is greedy: it takes what's proposed. Under an ideal
    // proposal it falls back to the content's size.
    let contentSize = contentSize(for: proposal)
    return CGSize(
      width: proposal.width ?? contentSize.width,
      height: proposal.height ?? contentSize.height)
  }

  private func contentSize(for proposal: _Proposal) -> CGSize {
    // Along scroll axes the content gets an unconstrained (ideal) proposal.
    let contentProposal = _Proposal(
      width: axes.contains(.horizontal) ? nil : proposal.width,
      height: axes.contains(.vertical) ? nil : proposal.height)
    return child.sizeThatFits(contentProposal)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let proposal = _Proposal(width: frame.width, height: frame.height)
    let contentSize = contentSize(for: proposal)

    let scroller = _DomNode()
    scroller.frame = frame
    scroller.pathId = pathId
    scroller.attributes["data-scroll"] = "1"
    scroller.styles["overflow-x"] = axes.contains(.horizontal) ? "auto" : "hidden"
    scroller.styles["overflow-y"] = axes.contains(.vertical) ? "auto" : "hidden"
    scroller.styles["-webkit-overflow-scrolling"] = "touch"
    parent.add(scroller)

    let canvas = _DomNode()
    let canvasSize = CGSize(
      width: Swift.max(contentSize.width, frame.width),
      height: Swift.max(contentSize.height, frame.height))
    canvas.frame = CGRect(origin: .zero, size: canvasSize)
    scroller.add(canvas)

    // SwiftUI centers content on the cross axis when it's narrower.
    let x = axes.contains(.horizontal) ? 0 : Swift.max(0, (frame.width - contentSize.width) / 2)
    child.place(
      in: CGRect(
        x: x, y: 0, width: contentSize.width, height: contentSize.height), parent: canvas)
  }
}

// MARK: - GeometryReader

public struct GeometryProxy {
  public let size: CGSize
  public var safeAreaInsets: EdgeInsets { EdgeInsets() }
  public func frame(in space: CoordinateSpace) -> CGRect {
    CGRect(origin: .zero, size: size)
  }
}

public enum CoordinateSpace: Hashable {
  case global
  case local
  case named(String)
}

public struct GeometryReader<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let content: (GeometryProxy) -> Content

  public init(@ViewBuilder content: @escaping (GeometryProxy) -> Content) {
    self.content = content
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    let captured = ctx
    return [
      _GeometryNode { size in
        var childCtx = captured
        childCtx.path += "/G"
        return _buildNodes(content(GeometryProxy(size: size)), &childCtx)
      }
    ]
  }
}

final class _GeometryNode: _LayoutNode {
  let build: (CGSize) -> [_LayoutNode]

  init(build: @escaping (CGSize) -> [_LayoutNode]) {
    self.build = build
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 10, height: proposal.height ?? 10)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    // Content is built with the resolved size and placed at topLeading.
    let children = build(frame.size)
    let proposal = _Proposal(width: frame.width, height: frame.height)
    for child in children {
      let size = child.sizeThatFits(proposal)
      child.place(
        in: CGRect(x: frame.minX, y: frame.minY, width: size.width, height: size.height),
        parent: parent)
    }
  }
}

// MARK: - Shapes

public protocol Shape: View {
  /// CSS border-radius expression for this shape at layout time.
  var _radiusCSS: String { get }
}

public enum RoundedCornerStyle: Sendable {
  case circular
  case continuous
}

public struct Rectangle: Shape, _PrimitiveView {
  public typealias Body = Never
  public init() {}
  public var _radiusCSS: String { "0" }
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ShapeNode(radiusCSS: _radiusCSS, fillCSS: ctx.environment.foregroundCSS)]
  }
}

public struct RoundedRectangle: Shape, _PrimitiveView {
  public typealias Body = Never
  public let cornerRadius: CGFloat
  public init(cornerRadius: CGFloat, style: RoundedCornerStyle = .continuous) {
    self.cornerRadius = cornerRadius
  }
  public var _radiusCSS: String { "\(cornerRadius)px" }
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ShapeNode(radiusCSS: _radiusCSS, fillCSS: ctx.environment.foregroundCSS)]
  }
}

public struct Capsule: Shape, _PrimitiveView {
  public typealias Body = Never
  public init(style: RoundedCornerStyle = .continuous) {}
  public var _radiusCSS: String { "9999px" }
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ShapeNode(radiusCSS: _radiusCSS, fillCSS: ctx.environment.foregroundCSS)]
  }
}

public struct Circle: Shape, _PrimitiveView {
  public typealias Body = Never
  public init() {}
  public var _radiusCSS: String { "50%" }
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ShapeNode(radiusCSS: _radiusCSS, fillCSS: ctx.environment.foregroundCSS, isCircle: true)]
  }
}

public struct Ellipse: Shape, _PrimitiveView {
  public typealias Body = Never
  public init() {}
  public var _radiusCSS: String { "50%" }
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_ShapeNode(radiusCSS: _radiusCSS, fillCSS: ctx.environment.foregroundCSS)]
  }
}

/// Only lineWidth and dash presence render (dash pattern maps to CSS
/// `dashed`, which won't match iOS dash geometry exactly).
public struct StrokeStyle: Equatable, Sendable {
  public var lineWidth: CGFloat
  public var dash: [CGFloat]

  public init(
    lineWidth: CGFloat = 1, lineCap: Int = 0, lineJoin: Int = 0, miterLimit: CGFloat = 10,
    dash: [CGFloat] = [], dashPhase: CGFloat = 0
  ) {
    self.lineWidth = lineWidth
    self.dash = dash
  }
}

extension Shape {
  public func fill(_ color: Color) -> some View {
    _StyledShape(radiusCSS: _radiusCSS, fill: color, isCircle: self is Circle)
  }

  public func fill(_ gradient: LinearGradient) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, backgroundCSS: gradient.cssBackground,
      isCircle: self is Circle)
  }

  public func fill(_ gradient: RadialGradient) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, backgroundCSS: gradient.cssBackground,
      isCircle: self is Circle)
  }

  public func stroke(_ color: Color, lineWidth: CGFloat = 1) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, stroke: color, strokeWidth: lineWidth,
      isCircle: self is Circle)
  }

  public func strokeBorder(_ color: Color, lineWidth: CGFloat = 1) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, stroke: color, strokeWidth: lineWidth,
      isCircle: self is Circle)
  }

  public func stroke(_ color: Color, style: StrokeStyle) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, stroke: color, strokeWidth: style.lineWidth,
      strokeDashed: !style.dash.isEmpty, isCircle: self is Circle)
  }

  public func strokeBorder(_ color: Color, style: StrokeStyle) -> some View {
    _StyledShape(
      radiusCSS: _radiusCSS, fill: nil, stroke: color, strokeWidth: style.lineWidth,
      strokeDashed: !style.dash.isEmpty, isCircle: self is Circle)
  }
}

struct _StyledShape: View, _PrimitiveView {
  typealias Body = Never
  let radiusCSS: String
  var fill: Color?
  var backgroundCSS: String?
  var stroke: Color?
  var strokeWidth: CGFloat = 0
  var strokeDashed = false
  var isCircle = false

  func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    let node = _ShapeNode(
      radiusCSS: radiusCSS,
      fillCSS: fill?.css ?? "transparent",
      isCircle: isCircle)
    node.backgroundCSS = backgroundCSS
    if let stroke {
      node.strokeCSS = stroke.css
      node.strokeWidth = strokeWidth
      node.strokeDashed = strokeDashed
    }
    return [node]
  }
}

final class _ShapeNode: _LayoutNode {
  let radiusCSS: String
  let fillCSS: String
  let isCircle: Bool
  var backgroundCSS: String?
  var strokeCSS: String?
  var strokeWidth: CGFloat = 0
  var strokeDashed = false

  init(radiusCSS: String, fillCSS: String, isCircle: Bool = false) {
    self.radiusCSS = radiusCSS
    self.fillCSS = fillCSS
    self.isCircle = isCircle
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    var size = CGSize(width: proposal.width ?? 10, height: proposal.height ?? 10)
    if isCircle {
      let side = Swift.min(size.width, size.height)
      size = CGSize(width: side, height: side)
    }
    return size
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    node.styles["border-radius"] = radiusCSS
    if let backgroundCSS {
      node.styles["background"] = backgroundCSS
    } else if fillCSS != "transparent" {
      node.styles["background-color"] = fillCSS
    }
    if let strokeCSS, strokeWidth > 0 {
      node.styles["border"] = "\(strokeWidth)px \(strokeDashed ? "dashed" : "solid") \(strokeCSS)"
      node.styles["box-sizing"] = "border-box"
    }
    parent.add(node)
  }
}

// MARK: - ScrollViewReader

/// Programmatic scroll-to-id is a documented preview gap: the proxy accepts
/// scrollTo calls and ignores them (ids come from the inert .id() modifier).
public struct ScrollViewProxy {
  public func scrollTo<ID: Hashable>(_ id: ID, anchor: UnitPoint? = nil) {}
}

public struct ScrollViewReader<Content: View>: View {
  let content: (ScrollViewProxy) -> Content

  public init(@ViewBuilder content: @escaping (ScrollViewProxy) -> Content) {
    self.content = content
  }

  public var body: some View { content(ScrollViewProxy()) }
}

// MARK: - Divider

public struct Divider: View, _PrimitiveView {
  public typealias Body = Never
  public init() {}

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [_DividerNode()]
  }
}

final class _DividerNode: _LayoutNode {
  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 10, height: 1)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    node.styles["background-color"] = "rgba(60, 60, 67, 0.29)"
    parent.add(node)
  }
}

// MARK: - Navigation chrome (rendered as plain containers)

public struct NavigationStack<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let content: Content
  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Nav"
    return [_ZStackNode(alignment: .center, children: _buildNodes(content, &childCtx))]
  }
}
