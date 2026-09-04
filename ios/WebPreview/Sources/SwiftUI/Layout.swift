// The propose/respond layout engine.
//
// Views build a tree of _LayoutNode. Layout runs SwiftUI's protocol: a
// parent proposes a size (each dimension Optional — nil means "ideal"),
// the child responds with the size it wants, and the parent places it.
// Placement emits _DomNode records — absolutely positioned divs with
// frames computed here in Swift. CSS never decides geometry; it only
// paints (fonts, colors, borders, shadows) and scrolls.
import CoreGraphics
import Foundation

// MARK: - Proposal

public struct _Proposal: Hashable {
  public var width: CGFloat?
  public var height: CGFloat?
  public init(width: CGFloat? = nil, height: CGFloat? = nil) {
    self.width = width
    self.height = height
  }
}

// MARK: - DOM output records

public final class _DomNode {
  public var tag: String
  /// Frame relative to the parent _DomNode's coordinate space.
  public var frame: CGRect = .zero
  public var styles: [String: String] = [:]
  public var attributes: [String: String] = [:]
  public var text: String?
  /// Raw innerHTML (used for inline SVG symbols); mutually exclusive with text.
  public var html: String?
  public var children: [_DomNode] = []
  public var onClick: (() -> Void)?
  public var onInput: ((String) -> Void)?
  public var onEnter: (() -> Void)?
  /// Stable id for focus/scroll restoration across re-renders.
  public var pathId: String?

  public init(tag: String = "div") { self.tag = tag }

  public func add(_ child: _DomNode) { children.append(child) }
}

// MARK: - Layout node base

open class _LayoutNode {
  private var cache: [_Proposal: CGSize] = [:]

  public init() {}

  public final func sizeThatFits(_ proposal: _Proposal) -> CGSize {
    if let hit = cache[proposal] { return hit }
    let size = measure(proposal)
    cache[proposal] = size
    return size
  }

  /// Subclasses respond to the proposal here.
  open func measure(_ proposal: _Proposal) -> CGSize { .zero }

  /// Emit DOM records for the given frame (relative to `parent`).
  open func place(in frame: CGRect, parent: _DomNode) {}

  /// Distance from the top of the node to its first text baseline, given
  /// its laid-out size. Containers forward to their first child.
  open func firstBaseline(for size: CGSize) -> CGFloat { size.height }

  /// Spacers report the axis assigned by their enclosing stack.
  var spacerMinLength: CGFloat? { nil }

  /// Layout priority (SwiftUI's .layoutPriority; default 0).
  open var layoutPriority: Double { 0 }

  /// How much this node can stretch along an axis; stacks sort by this.
  final func flexibility(_ axis: Axis) -> CGFloat {
    let huge: CGFloat = 1_000_000
    let maxProposal = axis == .horizontal
      ? _Proposal(width: huge, height: nil) : _Proposal(width: nil, height: huge)
    let minProposal = axis == .horizontal
      ? _Proposal(width: 0, height: nil) : _Proposal(width: nil, height: 0)
    let maxSize = sizeThatFits(maxProposal)
    let minSize = sizeThatFits(minProposal)
    return axis == .horizontal ? maxSize.width - minSize.width : maxSize.height - minSize.height
  }
}

public enum Axis: Hashable {
  case horizontal
  case vertical

  public struct Set: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let horizontal = Set(rawValue: 1)
    public static let vertical = Set(rawValue: 2)
  }
}

// MARK: - Alignment

public struct HorizontalAlignment: Hashable, Sendable {
  let fraction: CGFloat  // 0 leading, 0.5 center, 1 trailing
  let key: String
  public static let leading = HorizontalAlignment(fraction: 0, key: "leading")
  public static let center = HorizontalAlignment(fraction: 0.5, key: "center")
  public static let trailing = HorizontalAlignment(fraction: 1, key: "trailing")
}

public struct VerticalAlignment: Hashable, Sendable {
  let fraction: CGFloat
  let key: String
  public static let top = VerticalAlignment(fraction: 0, key: "top")
  public static let center = VerticalAlignment(fraction: 0.5, key: "center")
  public static let bottom = VerticalAlignment(fraction: 1, key: "bottom")
  public static let firstTextBaseline = VerticalAlignment(fraction: 1, key: "firstTextBaseline")
  public static let lastTextBaseline = VerticalAlignment(fraction: 1, key: "lastTextBaseline")
}

public struct Alignment: Hashable, Sendable {
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
}

// MARK: - Stack layout (VStack / HStack share the algorithm)

final class _StackNode: _LayoutNode {
  let axis: Axis
  let spacing: CGFloat
  let alignmentH: HorizontalAlignment
  let alignmentV: VerticalAlignment
  let children: [_LayoutNode]

  init(
    axis: Axis, spacing: CGFloat?, alignmentH: HorizontalAlignment,
    alignmentV: VerticalAlignment, children: [_LayoutNode]
  ) {
    self.axis = axis
    // SwiftUI's default sibling spacing is context-dependent; 8 is the
    // common value and what the kernel dialect is designed around.
    self.spacing = spacing ?? 8
    self.alignmentH = alignmentH
    self.alignmentV = alignmentV
    self.children = children
    super.init()
  }

  private func main(_ size: CGSize) -> CGFloat { axis == .horizontal ? size.width : size.height }
  private func cross(_ size: CGSize) -> CGFloat { axis == .horizontal ? size.height : size.width }

  /// SwiftUI's stack algorithm: children are sized in ascending flexibility
  /// order, each proposed an equal share of what's left. Spacers only
  /// reserve their minimum up front and absorb whatever remains at the end
  /// (so a Text next to a Spacer gets the full width, matching SwiftUI).
  private func layoutChildren(_ proposal: _Proposal) -> [CGSize] {
    let count = children.count
    guard count > 0 else { return [] }
    let totalSpacing = spacing * CGFloat(count - 1)
    let mainProposal = axis == .horizontal ? proposal.width : proposal.height

    let spacerIndices = children.indices.filter { children[$0] is _SpacerNode }
    let spacerMinTotal = spacerIndices.reduce(CGFloat(0)) {
      $0 + ((children[$1] as? _SpacerNode)?.minLength ?? 0)
    }
    let contentIndices = children.indices.filter { !(children[$0] is _SpacerNode) }

    // Higher layoutPriority lays out first with the full remaining space;
    // within a priority band, ascending flexibility.
    let order = contentIndices.sorted { a, b in
      if children[a].layoutPriority != children[b].layoutPriority {
        return children[a].layoutPriority > children[b].layoutPriority
      }
      return children[a].flexibility(axis) < children[b].flexibility(axis)
    }

    var remaining = mainProposal.map { Swift.max(0, $0 - totalSpacing - spacerMinTotal) }
    var sizes = [CGSize](repeating: .zero, count: count)
    for (position, index) in order.enumerated() {
      let slotCount = CGFloat(order.count - position)
      var childProposal = proposal
      let share = remaining.map { $0 / slotCount }
      if axis == .horizontal {
        childProposal.width = share
      } else {
        childProposal.height = share
      }
      let size = children[index].sizeThatFits(childProposal)
      sizes[index] = size
      if remaining != nil {
        remaining = Swift.max(0, remaining! - main(size))
      }
    }

    // Spacers: minimum plus an equal split of the leftover.
    if !spacerIndices.isEmpty {
      let extra = (remaining ?? 0) / CGFloat(spacerIndices.count)
      for index in spacerIndices {
        let minLength = (children[index] as? _SpacerNode)?.minLength ?? 0
        sizes[index] =
          axis == .horizontal
          ? CGSize(width: minLength + extra, height: 0)
          : CGSize(width: 0, height: minLength + extra)
      }
    }
    return sizes
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let sizes = layoutChildren(proposal)
    guard !sizes.isEmpty else { return .zero }
    let totalMain = sizes.reduce(0) { $0 + main($1) } + spacing * CGFloat(sizes.count - 1)
    let maxCross = sizes.reduce(0) { Swift.max($0, cross($1)) }
    return axis == .horizontal
      ? CGSize(width: totalMain, height: maxCross)
      : CGSize(width: maxCross, height: totalMain)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let proposal = _Proposal(width: frame.width, height: frame.height)
    let sizes = layoutChildren(proposal)
    guard !sizes.isEmpty else { return }

    // Baseline alignment for HStacks: align every child's first baseline.
    var baselineOffsets: [CGFloat]? = nil
    if axis == .horizontal,
      alignmentV.key == "firstTextBaseline" || alignmentV.key == "lastTextBaseline"
    {
      let baselines = children.indices.map { children[$0].firstBaseline(for: sizes[$0]) }
      let anchor = baselines.max() ?? 0
      baselineOffsets = baselines.map { anchor - $0 }
    }

    var cursor: CGFloat = 0
    for index in children.indices {
      let size = sizes[index]
      var x: CGFloat
      var y: CGFloat
      if axis == .horizontal {
        x = frame.minX + cursor
        if let offsets = baselineOffsets {
          y = frame.minY + offsets[index]
        } else {
          y = frame.minY + (frame.height - size.height) * alignmentV.fraction
        }
        cursor += size.width + spacing
      } else {
        y = frame.minY + cursor
        x = frame.minX + (frame.width - size.width) * alignmentH.fraction
        cursor += size.height + spacing
      }
      children[index].place(
        in: CGRect(x: x, y: y, width: size.width, height: size.height), parent: parent)
    }
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    guard let first = children.first else { return size.height }
    let sizes = layoutChildren(_Proposal(width: size.width, height: size.height))
    return first.firstBaseline(for: sizes.first ?? size)
  }
}

// MARK: - ZStack layout (also implements alignmentGuide semantics)

final class _ZStackNode: _LayoutNode {
  let alignment: Alignment
  let children: [_LayoutNode]

  init(alignment: Alignment, children: [_LayoutNode]) {
    self.alignment = alignment
    self.children = children
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    var size = CGSize.zero
    for child in children {
      let childSize = child.sizeThatFits(proposal)
      size.width = Swift.max(size.width, childSize.width)
      size.height = Swift.max(size.height, childSize.height)
    }
    return size
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let proposal = _Proposal(width: frame.width, height: frame.height)
    for child in children {
      let size = child.sizeThatFits(proposal)
      let dims = ViewDimensions(size: size)

      // Anchor position inside the stack for the stack's alignment.
      let anchorX = frame.width * alignment.horizontal.fraction
      let anchorY = frame.height * alignment.vertical.fraction
      // The child's guide value for that alignment (custom guides override).
      let guideX = (child as? _AlignmentGuideNode)?.horizontalGuide(alignment.horizontal, dims)
        ?? size.width * alignment.horizontal.fraction
      let guideY = (child as? _AlignmentGuideNode)?.verticalGuide(alignment.vertical, dims)
        ?? size.height * alignment.vertical.fraction

      let x = frame.minX + anchorX - guideX
      let y = frame.minY + anchorY - guideY
      child.place(in: CGRect(x: x, y: y, width: size.width, height: size.height), parent: parent)
    }
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    children.first?.firstBaseline(for: size) ?? size.height
  }
}

public struct ViewDimensions {
  let size: CGSize
  public var width: CGFloat { size.width }
  public var height: CGFloat { size.height }
  public subscript(alignment: HorizontalAlignment) -> CGFloat { size.width * alignment.fraction }
  public subscript(alignment: VerticalAlignment) -> CGFloat { size.height * alignment.fraction }
}

/// Wrapper node produced by .alignmentGuide — transparent for sizing,
/// consulted by the enclosing ZStack (or stack) during placement.
final class _AlignmentGuideNode: _LayoutNode {
  let child: _LayoutNode
  let horizontalKey: HorizontalAlignment?
  let horizontalValue: ((ViewDimensions) -> CGFloat)?
  let verticalKey: VerticalAlignment?
  let verticalValue: ((ViewDimensions) -> CGFloat)?

  init(
    child: _LayoutNode,
    horizontalKey: HorizontalAlignment? = nil,
    horizontalValue: ((ViewDimensions) -> CGFloat)? = nil,
    verticalKey: VerticalAlignment? = nil,
    verticalValue: ((ViewDimensions) -> CGFloat)? = nil
  ) {
    self.child = child
    self.horizontalKey = horizontalKey
    self.horizontalValue = horizontalValue
    self.verticalKey = verticalKey
    self.verticalValue = verticalValue
    super.init()
  }

  func horizontalGuide(_ key: HorizontalAlignment, _ dims: ViewDimensions) -> CGFloat? {
    if let horizontalKey, horizontalKey == key, let horizontalValue {
      return horizontalValue(dims)
    }
    if let inner = child as? _AlignmentGuideNode {
      return inner.horizontalGuide(key, dims)
    }
    return nil
  }

  func verticalGuide(_ key: VerticalAlignment, _ dims: ViewDimensions) -> CGFloat? {
    if let verticalKey, verticalKey == key, let verticalValue {
      return verticalValue(dims)
    }
    if let inner = child as? _AlignmentGuideNode {
      return inner.verticalGuide(key, dims)
    }
    return nil
  }

  override func measure(_ proposal: _Proposal) -> CGSize { child.sizeThatFits(proposal) }
  override func place(in frame: CGRect, parent: _DomNode) { child.place(in: frame, parent: parent) }
  override func firstBaseline(for size: CGSize) -> CGFloat { child.firstBaseline(for: size) }
  override var layoutPriority: Double { child.layoutPriority }
}

// MARK: - Frame nodes

/// .frame(width:height:alignment:)
final class _FixedFrameNode: _LayoutNode {
  let width: CGFloat?
  let height: CGFloat?
  let alignment: Alignment
  let child: _LayoutNode

  init(width: CGFloat?, height: CGFloat?, alignment: Alignment, child: _LayoutNode) {
    self.width = width
    self.height = height
    self.alignment = alignment
    self.child = child
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let childProposal = _Proposal(width: width ?? proposal.width, height: height ?? proposal.height)
    let childSize = child.sizeThatFits(childProposal)
    return CGSize(width: width ?? childSize.width, height: height ?? childSize.height)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let childProposal = _Proposal(width: width ?? frame.width, height: height ?? frame.height)
    let childSize = child.sizeThatFits(childProposal)
    let x = frame.minX + (frame.width - childSize.width) * alignment.horizontal.fraction
    let y = frame.minY + (frame.height - childSize.height) * alignment.vertical.fraction
    child.place(
      in: CGRect(x: x, y: y, width: childSize.width, height: childSize.height), parent: parent)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    let childSize = child.sizeThatFits(_Proposal(width: width ?? size.width, height: height ?? size.height))
    let y = (size.height - childSize.height) * alignment.vertical.fraction
    return y + child.firstBaseline(for: childSize)
  }
}

/// .frame(minWidth:maxWidth:minHeight:maxHeight:alignment:)
final class _FlexFrameNode: _LayoutNode {
  let minWidth: CGFloat?
  let maxWidth: CGFloat?
  let minHeight: CGFloat?
  let maxHeight: CGFloat?
  let alignment: Alignment
  let child: _LayoutNode

  init(
    minWidth: CGFloat?, maxWidth: CGFloat?, minHeight: CGFloat?, maxHeight: CGFloat?,
    alignment: Alignment, child: _LayoutNode
  ) {
    self.minWidth = minWidth
    self.maxWidth = maxWidth
    self.minHeight = minHeight
    self.maxHeight = maxHeight
    self.alignment = alignment
    self.child = child
    super.init()
  }

  private func resolve(
    proposed: CGFloat?, childLength: CGFloat, min minBound: CGFloat?, max maxBound: CGFloat?
  ) -> CGFloat {
    // SwiftUI rule: the frame is the proposal clamped to [min, max], where
    // a missing bound defers to the child's response. Applying the lower
    // bound last makes min win when bounds conflict.
    guard minBound != nil || maxBound != nil else { return childLength }
    let proposal = proposed ?? childLength
    let upper = maxBound.map { $0 == .infinity ? CGFloat.greatestFiniteMagnitude : $0 }
      ?? childLength
    let lower = minBound ?? childLength
    return Swift.max(Swift.min(proposal, upper), lower)
  }

  private func childProposal(_ proposal: _Proposal) -> _Proposal {
    func clamp(_ value: CGFloat?, _ lower: CGFloat?, _ upper: CGFloat?) -> CGFloat? {
      guard var v = value else { return nil }
      if let lower { v = Swift.max(v, lower) }
      if let upper, upper != .infinity { v = Swift.min(v, upper) }
      return v
    }
    return _Proposal(
      width: clamp(proposal.width, minWidth, maxWidth),
      height: clamp(proposal.height, minHeight, maxHeight))
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let childSize = child.sizeThatFits(childProposal(proposal))
    let width = resolve(
      proposed: proposal.width, childLength: childSize.width, min: minWidth, max: maxWidth)
    let height = resolve(
      proposed: proposal.height, childLength: childSize.height, min: minHeight, max: maxHeight)
    return CGSize(width: width, height: height)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let childSize = child.sizeThatFits(
      childProposal(_Proposal(width: frame.width, height: frame.height)))
    let x = frame.minX + (frame.width - childSize.width) * alignment.horizontal.fraction
    let y = frame.minY + (frame.height - childSize.height) * alignment.vertical.fraction
    child.place(
      in: CGRect(x: x, y: y, width: childSize.width, height: childSize.height), parent: parent)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    let childSize = child.sizeThatFits(childProposal(_Proposal(width: size.width, height: size.height)))
    let y = (size.height - childSize.height) * alignment.vertical.fraction
    return y + child.firstBaseline(for: childSize)
  }
}

// MARK: - Padding

final class _PaddingNode: _LayoutNode {
  let insets: EdgeInsets
  let child: _LayoutNode

  init(insets: EdgeInsets, child: _LayoutNode) {
    self.insets = insets
    self.child = child
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let inner = _Proposal(
      width: proposal.width.map { Swift.max(0, $0 - insets.leading - insets.trailing) },
      height: proposal.height.map { Swift.max(0, $0 - insets.top - insets.bottom) })
    let childSize = child.sizeThatFits(inner)
    return CGSize(
      width: childSize.width + insets.leading + insets.trailing,
      height: childSize.height + insets.top + insets.bottom)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let inner = CGRect(
      x: frame.minX + insets.leading,
      y: frame.minY + insets.top,
      width: Swift.max(0, frame.width - insets.leading - insets.trailing),
      height: Swift.max(0, frame.height - insets.top - insets.bottom))
    child.place(in: inner, parent: parent)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat {
    let innerSize = CGSize(
      width: Swift.max(0, size.width - insets.leading - insets.trailing),
      height: Swift.max(0, size.height - insets.top - insets.bottom))
    return insets.top + child.firstBaseline(for: innerSize)
  }

  override var layoutPriority: Double { child.layoutPriority }
}

public struct EdgeInsets: Hashable, Sendable {
  public var top: CGFloat
  public var leading: CGFloat
  public var bottom: CGFloat
  public var trailing: CGFloat
  public init(top: CGFloat = 0, leading: CGFloat = 0, bottom: CGFloat = 0, trailing: CGFloat = 0) {
    self.top = top
    self.leading = leading
    self.bottom = bottom
    self.trailing = trailing
  }
}

// MARK: - fixedSize

final class _FixedSizeNode: _LayoutNode {
  let horizontal: Bool
  let vertical: Bool
  let child: _LayoutNode

  init(horizontal: Bool, vertical: Bool, child: _LayoutNode) {
    self.horizontal = horizontal
    self.vertical = vertical
    self.child = child
    super.init()
  }

  private func inner(_ proposal: _Proposal) -> _Proposal {
    _Proposal(
      width: horizontal ? nil : proposal.width,
      height: vertical ? nil : proposal.height)
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    child.sizeThatFits(inner(proposal))
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    child.place(in: frame, parent: parent)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat { child.firstBaseline(for: size) }
}

// MARK: - Background / overlay decoration

final class _DecoratedNode: _LayoutNode {
  let content: _LayoutNode
  let decorations: [_LayoutNode]
  let decorationOnTop: Bool
  let alignment: Alignment

  init(content: _LayoutNode, decorations: [_LayoutNode], onTop: Bool, alignment: Alignment) {
    self.content = content
    self.decorations = decorations
    self.decorationOnTop = onTop
    self.alignment = alignment
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    content.sizeThatFits(proposal)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let placeDecorations = {
      for decoration in self.decorations {
        let size = decoration.sizeThatFits(_Proposal(width: frame.width, height: frame.height))
        let x = frame.minX + (frame.width - size.width) * self.alignment.horizontal.fraction
        let y = frame.minY + (frame.height - size.height) * self.alignment.vertical.fraction
        decoration.place(
          in: CGRect(x: x, y: y, width: size.width, height: size.height), parent: parent)
      }
    }
    if decorationOnTop {
      content.place(in: frame, parent: parent)
      placeDecorations()
    } else {
      placeDecorations()
      content.place(in: frame, parent: parent)
    }
  }

  override func firstBaseline(for size: CGSize) -> CGFloat { content.firstBaseline(for: size) }
  override var layoutPriority: Double { content.layoutPriority }
}

// MARK: - Effect wrapper (opacity, shadow, transforms, clipping…)

final class _EffectNode: _LayoutNode {
  let child: _LayoutNode
  /// CSS applied to a wrapper div around the child's emitted DOM.
  let styles: [String: String]

  init(child: _LayoutNode, styles: [String: String]) {
    self.child = child
    self.styles = styles
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize { child.sizeThatFits(proposal) }

  override func place(in frame: CGRect, parent: _DomNode) {
    let wrapper = _DomNode()
    wrapper.frame = frame
    wrapper.styles = styles
    parent.add(wrapper)
    child.place(in: CGRect(origin: .zero, size: frame.size), parent: wrapper)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat { child.firstBaseline(for: size) }
  override var layoutPriority: Double { child.layoutPriority }
}

// MARK: - Layout priority marker

final class _PriorityNode: _LayoutNode {
  let child: _LayoutNode
  let priority: Double

  init(child: _LayoutNode, priority: Double) {
    self.child = child
    self.priority = priority
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize { child.sizeThatFits(proposal) }
  override func place(in frame: CGRect, parent: _DomNode) { child.place(in: frame, parent: parent) }
  override func firstBaseline(for size: CGSize) -> CGFloat { child.firstBaseline(for: size) }
  override var layoutPriority: Double { priority }
}
