// The View modifier surface. Three families:
//  1. Environment modifiers — mutate the build context for the subtree.
//  2. Layout modifiers — wrap the subtree's nodes in layout-engine nodes.
//  3. Paint/no-op modifiers — CSS effects, or accepted-but-inert APIs
//     (animation, transition, sheet…) kept so kernel code compiles; the
//     dialect lint documents which are inert.
import CoreGraphics
import Foundation

// MARK: - Modifier plumbing

/// A view that transforms the build context before building its content.
struct _EnvView<Content: View>: View, _PrimitiveView {
  typealias Body = Never
  let content: Content
  let transform: (inout EnvironmentValues) -> Void

  func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    transform(&childCtx.environment)
    return _buildNodes(content, &childCtx)
  }
}

/// A view that wraps each of its content's nodes in a layout node.
struct _WrapView<Content: View>: View, _PrimitiveView {
  typealias Body = Never
  let content: Content
  let wrap: (_LayoutNode, inout _BuildContext) -> _LayoutNode

  func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    let nodes = _buildNodes(content, &childCtx)
    return nodes.map { wrap($0, &childCtx) }
  }
}

extension View {
  func _env(_ transform: @escaping (inout EnvironmentValues) -> Void) -> some View {
    _EnvView(content: self, transform: transform)
  }

  func _wrap(_ wrap: @escaping (_LayoutNode, inout _BuildContext) -> _LayoutNode) -> some View {
    _WrapView(content: self, wrap: wrap)
  }
}

// MARK: - Environment modifiers

public enum TextAlignment: Hashable, Sendable {
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

extension View {
  public func font(_ font: Font?) -> some View {
    _env { if let font { $0.font = font } }
  }

  public func foregroundStyle(_ color: Color) -> some View {
    _env { $0.foregroundCSS = color.css }
  }

  public func foregroundColor(_ color: Color?) -> some View {
    _env { if let color { $0.foregroundCSS = color.css } }
  }

  public func multilineTextAlignment(_ alignment: TextAlignment) -> some View {
    _env { $0.textAlignmentCSS = alignment.css }
  }

  public func lineSpacing(_ spacing: CGFloat) -> some View {
    _env { $0.lineSpacing = spacing }
  }

  public func kerning(_ kerning: CGFloat) -> some View {
    _env { $0.kerning = kerning }
  }

  public func lineLimit(_ limit: Int?) -> some View {
    _env { $0.lineLimit = limit }
  }

  public func disabled(_ isDisabled: Bool) -> some View {
    _env { $0.isDisabled = $0.isDisabled || isDisabled }
  }

  public func tint(_ color: Color?) -> some View {
    _env { $0.tintCSS = color?.css }
  }

  public func italic() -> some View {
    _env { $0.font = $0.font.italic() }
  }

  public func monospacedDigit() -> some View {
    _env { $0.font = $0.font.monospacedDigit() }
  }

  public func fontDesign(_ design: Font.Design?) -> some View {
    _env { if let design { $0.font.design = design } }
  }

  public func environment<V>(
    _ keyPath: WritableKeyPath<EnvironmentValues, V>, _ value: V
  ) -> some View {
    _env { $0[keyPath: keyPath] = value }
  }

  public func environmentObject<T: ObservableObject>(_ object: T) -> some View {
    _env { $0.objects[ObjectIdentifier(T.self)] = object }
  }

  public func textCase(_ textCase: Text.Case?) -> some View {
    _wrap { node, _ in
      _EffectNode(
        child: node,
        styles: ["text-transform": textCase == .uppercase ? "uppercase" : "lowercase"])
    }
  }

  public func truncationMode(_ mode: Text.TruncationMode) -> some View {
    _env { $0.truncationCSS = "ellipsis" }
  }
}

extension Text {
  public enum Case: Hashable, Sendable {
    case uppercase
    case lowercase
  }
  public enum TruncationMode: Hashable, Sendable {
    case head
    case middle
    case tail
  }
}

// MARK: - Padding / frame / layout modifiers

public enum Edge: Hashable, CaseIterable, Sendable {
  case top
  case leading
  case bottom
  case trailing

  public struct Set: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let top = Set(rawValue: 1)
    public static let leading = Set(rawValue: 2)
    public static let bottom = Set(rawValue: 4)
    public static let trailing = Set(rawValue: 8)
    public static let horizontal: Set = [.leading, .trailing]
    public static let vertical: Set = [.top, .bottom]
    public static let all: Set = [.top, .leading, .bottom, .trailing]
  }
}

extension View {
  public func padding(_ insets: EdgeInsets) -> some View {
    _wrap { node, _ in _PaddingNode(insets: insets, child: node) }
  }

  public func padding(_ edges: Edge.Set = .all, _ length: CGFloat? = nil) -> some View {
    let amount = length ?? 16
    var insets = EdgeInsets()
    if edges.contains(.top) { insets.top = amount }
    if edges.contains(.leading) { insets.leading = amount }
    if edges.contains(.bottom) { insets.bottom = amount }
    if edges.contains(.trailing) { insets.trailing = amount }
    return padding(insets)
  }

  public func padding(_ length: CGFloat) -> some View {
    padding(.all, length)
  }

  public func frame(
    width: CGFloat? = nil, height: CGFloat? = nil, alignment: Alignment = .center
  ) -> some View {
    _wrap { node, _ in
      _FixedFrameNode(width: width, height: height, alignment: alignment, child: node)
    }
  }

  public func frame(
    minWidth: CGFloat? = nil, idealWidth: CGFloat? = nil, maxWidth: CGFloat? = nil,
    minHeight: CGFloat? = nil, idealHeight: CGFloat? = nil, maxHeight: CGFloat? = nil,
    alignment: Alignment = .center
  ) -> some View {
    _wrap { node, _ in
      _FlexFrameNode(
        minWidth: minWidth, maxWidth: maxWidth, minHeight: minHeight, maxHeight: maxHeight,
        alignment: alignment, child: node)
    }
  }

  public func fixedSize(horizontal: Bool, vertical: Bool) -> some View {
    _wrap { node, _ in
      _FixedSizeNode(horizontal: horizontal, vertical: vertical, child: node)
    }
  }

  public func fixedSize() -> some View {
    fixedSize(horizontal: true, vertical: true)
  }

  public func layoutPriority(_ priority: Double) -> some View {
    _wrap { node, _ in _PriorityNode(child: node, priority: priority) }
  }

  public func alignmentGuide(
    _ guide: HorizontalAlignment, computeValue: @escaping (ViewDimensions) -> CGFloat
  ) -> some View {
    _wrap { node, _ in
      _AlignmentGuideNode(child: node, horizontalKey: guide, horizontalValue: computeValue)
    }
  }

  public func alignmentGuide(
    _ guide: VerticalAlignment, computeValue: @escaping (ViewDimensions) -> CGFloat
  ) -> some View {
    _wrap { node, _ in
      _AlignmentGuideNode(child: node, verticalKey: guide, verticalValue: computeValue)
    }
  }

  public func offset(x: CGFloat = 0, y: CGFloat = 0) -> some View {
    _wrap { node, _ in
      _EffectNode(child: node, styles: ["transform": "translate(\(x)px, \(y)px)"])
    }
  }
}

// MARK: - Background / overlay / clipping

extension View {
  public func background<Background: View>(
    _ background: Background, alignment: Alignment = .center
  ) -> some View {
    _wrap { node, ctx in
      var decorationCtx = ctx
      decorationCtx.path += "/bg"
      let decorations = _buildNodes(background, &decorationCtx)
      return _DecoratedNode(
        content: node, decorations: decorations, onTop: false, alignment: alignment)
    }
  }

  public func background<Background: View>(
    alignment: Alignment = .center, @ViewBuilder content: () -> Background
  ) -> some View {
    background(content(), alignment: alignment)
  }

  public func overlay<Overlay: View>(
    _ overlay: Overlay, alignment: Alignment = .center
  ) -> some View {
    _wrap { node, ctx in
      var decorationCtx = ctx
      decorationCtx.path += "/ov"
      let decorations = _buildNodes(overlay, &decorationCtx)
      return _DecoratedNode(
        content: node, decorations: decorations, onTop: true, alignment: alignment)
    }
  }

  public func overlay<Overlay: View>(
    alignment: Alignment = .center, @ViewBuilder content: () -> Overlay
  ) -> some View {
    overlay(content(), alignment: alignment)
  }

  public func clipShape<S: Shape>(_ shape: S) -> some View {
    _wrap { node, _ in
      _EffectNode(
        child: node, styles: ["border-radius": shape._radiusCSS, "overflow": "hidden"])
    }
  }

  public func cornerRadius(_ radius: CGFloat) -> some View {
    _wrap { node, _ in
      _EffectNode(child: node, styles: ["border-radius": "\(radius)px", "overflow": "hidden"])
    }
  }

  public func clipped() -> some View {
    _wrap { node, _ in _EffectNode(child: node, styles: ["overflow": "hidden"]) }
  }

  public func shadow(
    color: Color = Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.33),
    radius: CGFloat, x: CGFloat = 0, y: CGFloat = 0
  ) -> some View {
    _wrap { node, _ in
      _EffectNode(
        child: node,
        styles: ["filter": "drop-shadow(\(x)px \(y)px \(radius)px \(color.css))"])
    }
  }
}

// MARK: - Visual effects

public struct Angle: Hashable, Sendable {
  public var degrees: Double
  public var radians: Double { degrees * .pi / 180 }
  public init(degrees: Double) { self.degrees = degrees }
  public init(radians: Double) { self.degrees = radians * 180 / .pi }
  public static func degrees(_ value: Double) -> Angle { Angle(degrees: value) }
  public static func radians(_ value: Double) -> Angle { Angle(radians: value) }
  public static let zero = Angle(degrees: 0)
}

extension View {
  public func opacity(_ value: Double) -> some View {
    _wrap { node, _ in _EffectNode(child: node, styles: ["opacity": "\(value)"]) }
  }

  public func scaleEffect(_ scale: CGFloat) -> some View {
    _wrap { node, _ in _EffectNode(child: node, styles: ["transform": "scale(\(scale))"]) }
  }

  public func rotationEffect(_ angle: Angle) -> some View {
    _wrap { node, _ in
      _EffectNode(child: node, styles: ["transform": "rotate(\(angle.degrees)deg)"])
    }
  }

  public func rotation3DEffect(
    _ angle: Angle, axis: (x: CGFloat, y: CGFloat, z: CGFloat),
    anchor: UnitPoint = .center, anchorZ: CGFloat = 0, perspective: CGFloat = 1
  ) -> some View {
    _wrap { node, _ in
      _EffectNode(
        child: node,
        styles: [
          "transform": "rotate3d(\(axis.x), \(axis.y), \(axis.z), \(angle.degrees)deg)"
        ])
    }
  }

  public func blur(radius: CGFloat) -> some View {
    _wrap { node, _ in _EffectNode(child: node, styles: ["filter": "blur(\(radius)px)"]) }
  }

  public func zIndex(_ value: Double) -> some View {
    _wrap { node, _ in _EffectNode(child: node, styles: ["z-index": "\(Int(value))"]) }
  }
}

// MARK: - Lifecycle & events

extension View {
  public func onAppear(perform action: (() -> Void)? = nil) -> some View {
    _wrap { node, ctx in
      if let action {
        ctx.effects.appears.append(
          .init(path: ctx.path + "/appear", isTask: false, action: action))
      }
      return node
    }
  }

  public func onDisappear(perform action: (() -> Void)? = nil) -> some View {
    self
  }

  public func task(_ action: @escaping () async -> Void) -> some View {
    _wrap { node, ctx in
      ctx.effects.appears.append(
        .init(path: ctx.path + "/task", isTask: true, action: { Task { await action() } }))
      return node
    }
  }

  public func task(priority: TaskPriority, _ action: @escaping () async -> Void) -> some View {
    task(action)
  }

  public func onChange<V: Equatable>(
    of value: V, perform action: @escaping (V) -> Void
  ) -> some View {
    _onChange(value: value) { action(value) }
  }

  public func onChange<V: Equatable>(
    of value: V, _ action: @escaping () -> Void
  ) -> some View {
    _onChange(value: value, action: action)
  }

  public func onChange<V: Equatable>(
    of value: V, _ action: @escaping (V, V) -> Void
  ) -> some View {
    _onChange(value: value) { action(value, value) }
  }

  private func _onChange<V: Equatable>(
    value: V, action: @escaping () -> Void
  ) -> some View {
    _wrap { node, ctx in
      ctx.effects.changes.append(
        .init(
          path: ctx.path + "/change",
          newValue: value,
          isEqualToPrevious: { ($0 as? V) == value },
          perform: action))
      return node
    }
  }

  public func onTapGesture(count: Int = 1, perform action: @escaping () -> Void) -> some View {
    _wrap { node, ctx in
      _ButtonNode(child: node, action: action, disabled: false, pathId: ctx.path + "/tap")
    }
  }

  public func onSubmit(_ action: @escaping () -> Void) -> some View {
    _wrap { node, _ in
      if let input = node as? _InputNode { input.onSubmit = action }
      return node
    }
  }
}

// MARK: - Accepted-but-inert modifiers (documented in the dialect contract)

public struct Animation: Sendable {
  public static func easeInOut(duration: Double) -> Animation { Animation() }
  public static func easeIn(duration: Double) -> Animation { Animation() }
  public static func easeOut(duration: Double) -> Animation { Animation() }
  public static func linear(duration: Double) -> Animation { Animation() }
  public static let easeInOut = Animation()
  public static let `default` = Animation()
  public static func spring(
    response: Double = 0.5, dampingFraction: Double = 0.825, blendDuration: Double = 0
  ) -> Animation { Animation() }
  public func repeatForever(autoreverses: Bool = true) -> Animation { self }
  public func delay(_ delay: Double) -> Animation { self }
}

public struct AnyTransition: Sendable {
  public static let opacity = AnyTransition()
  public static let slide = AnyTransition()
  public static let scale = AnyTransition()
  public static func move(edge: Edge) -> AnyTransition { AnyTransition() }
  public func combined(with other: AnyTransition) -> AnyTransition { self }
}

public struct PlainButtonStyleToken: Sendable {
  public static let plain = PlainButtonStyleToken()
  public static let borderless = PlainButtonStyleToken()
  public static let bordered = PlainButtonStyleToken()
  public static let automatic = PlainButtonStyleToken()
}

public struct PlainTextFieldStyleToken: Sendable {
  public static let plain = PlainTextFieldStyleToken()
  public static let roundedBorder = PlainTextFieldStyleToken()
  public static let automatic = PlainTextFieldStyleToken()
}

public enum TextInputAutocapitalization: Sendable {
  case never
  case words
  case sentences
  case characters
}

public enum UIKeyboardType: Sendable {
  case `default`
  case emailAddress
  case numberPad
  case decimalPad
  case URL
}

public enum ControlSize: Sendable {
  case mini
  case small
  case regular
  case large
}

public enum PresentationDetent: Hashable, Sendable {
  case medium
  case large
}

public enum ScrollIndicatorVisibility: Sendable {
  case automatic
  case visible
  case hidden
  case never
}

public struct DragGesture: Sendable {
  public struct Value: Sendable {
    public var translation: CGSize = .zero
    public var location: CGPoint = .zero
    public var startLocation: CGPoint = .zero
  }
  public init(minimumDistance: CGFloat = 10, coordinateSpace: CoordinateSpace = .local) {}
  public func onChanged(_ action: @escaping (Value) -> Void) -> DragGesture { self }
  public func onEnded(_ action: @escaping (Value) -> Void) -> DragGesture { self }
}

public struct AccessibilityTraits: ExpressibleByArrayLiteral, Sendable {
  public static let isSelected = AccessibilityTraits()
  public static let isButton = AccessibilityTraits()
  public static let isHeader = AccessibilityTraits()
  public static let isImage = AccessibilityTraits()
  public init() {}
  public init(arrayLiteral elements: AccessibilityTraits...) {}
}

public enum TextSelectability: Sendable {
  case enabled
  case disabled
}

public struct KeyEquivalent: Sendable {
  public init(_ character: Character) {}
}

public struct EventModifiers: OptionSet, Sendable {
  public let rawValue: Int
  public init(rawValue: Int) { self.rawValue = rawValue }
  public static let command = EventModifiers(rawValue: 1 << 0)
  public static let shift = EventModifiers(rawValue: 1 << 1)
  public static let option = EventModifiers(rawValue: 1 << 2)
  public static let control = EventModifiers(rawValue: 1 << 3)
}

public enum ScenePhase: Hashable, Sendable {
  case active
  case inactive
  case background
}

enum ScenePhaseKey: EnvironmentKey {
  static let defaultValue = ScenePhase.active
}

extension EnvironmentValues {
  public var scenePhase: ScenePhase {
    get { self[ScenePhaseKey.self] }
    set { self[ScenePhaseKey.self] = newValue }
  }
}

extension View {
  public func buttonStyle(_ style: PlainButtonStyleToken) -> some View { self }
  public func textFieldStyle(_ style: PlainTextFieldStyleToken) -> some View { self }
  public func animation<V: Equatable>(_ animation: Animation?, value: V) -> some View { self }
  public func transition(_ transition: AnyTransition) -> some View { self }
  public func contentShape<S: Shape>(_ shape: S) -> some View { self }
  public func allowsHitTesting(_ enabled: Bool) -> some View { self }
  public func ignoresSafeArea(
    _ regions: SafeAreaRegions = .all, edges: Edge.Set = .all
  ) -> some View { self }
  public func textInputAutocapitalization(_ mode: TextInputAutocapitalization?) -> some View {
    self
  }
  public func autocorrectionDisabled(_ disabled: Bool = true) -> some View { self }
  public func keyboardType(_ type: UIKeyboardType) -> some View { self }
  public func controlSize(_ size: ControlSize) -> some View { self }
  public func refreshable(action: @escaping () async -> Void) -> some View { self }
  public func gesture(_ gesture: DragGesture) -> some View { self }
  public func presentationDetents(_ detents: Swift.Set<PresentationDetent>) -> some View { self }
  public func scrollIndicators(_ visibility: ScrollIndicatorVisibility) -> some View { self }
  public func scrollDisabled(_ disabled: Bool = true) -> some View { self }

  /// Sheets don't present in the preview (documented gap): content is
  /// built only to keep its state registrations stable, never shown.
  public func sheet<Content: View>(
    isPresented: Binding<Bool>, onDismiss: (() -> Void)? = nil,
    @ViewBuilder content: () -> Content
  ) -> some View { self }

  public func accessibilityLabel(_ label: String) -> some View { self }
  public func accessibilityLabel(_ label: Text) -> some View { self }
  public func accessibilityAddTraits(_ traits: AccessibilityTraits) -> some View { self }
  public func textSelection(_ selectability: TextSelectability) -> some View { self }
  public func keyboardShortcut(
    _ key: KeyEquivalent, modifiers: EventModifiers = .command
  ) -> some View { self }
  /// Hidden views keep their layout space on iOS; opacity(0) matches that.
  public func hidden() -> some View { opacity(0) }
  /// Explicit identity only affects animation/scroll targeting, which the
  /// preview doesn't implement; state identity remains structural.
  public func id<ID: Hashable>(_ id: ID) -> some View { self }

  public func safeAreaInset<Content: View>(
    edge: VerticalEdge, alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil,
    @ViewBuilder content: () -> Content
  ) -> some View {
    // Approximation: overlay the inset content at the given edge.
    overlay(content(), alignment: edge == .bottom ? .bottom : .top)
  }
}

public enum VerticalEdge: Hashable, Sendable {
  case top
  case bottom
}

public struct SafeAreaRegions: OptionSet, Sendable {
  public let rawValue: Int
  public init(rawValue: Int) { self.rawValue = rawValue }
  public static let container = SafeAreaRegions(rawValue: 1)
  public static let keyboard = SafeAreaRegions(rawValue: 2)
  public static let all: SafeAreaRegions = [.container, .keyboard]
}
