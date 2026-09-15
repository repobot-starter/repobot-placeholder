// Interactive controls: Button, TextField/SecureField/TextEditor, Toggle,
// Picker, ProgressView, Label, Link, ShareLink.
import CoreGraphics
import Foundation

// MARK: - Button

public struct Button<Label: View>: View, _PrimitiveView {
  public typealias Body = Never
  let action: () -> Void
  let label: Label

  public init(action: @escaping () -> Void, @ViewBuilder label: () -> Label) {
    self.action = action
    self.label = label()
  }

  public init(_ title: String, action: @escaping () -> Void) where Label == Text {
    self.action = action
    self.label = Text(title)
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Btn"
    let children = _buildNodes(label, &childCtx)
    let child =
      children.count == 1
      ? children[0]
      : _StackNode(
        axis: .horizontal, spacing: nil, alignmentH: .leading, alignmentV: .center,
        children: children)
    return [
      _ButtonNode(
        child: child, action: action, disabled: ctx.environment.isDisabled,
        pathId: childCtx.path)
    ]
  }
}

final class _ButtonNode: _LayoutNode {
  let child: _LayoutNode
  let action: () -> Void
  let disabled: Bool
  let pathId: String

  init(child: _LayoutNode, action: @escaping () -> Void, disabled: Bool, pathId: String) {
    self.child = child
    self.action = action
    self.disabled = disabled
    self.pathId = pathId
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize { child.sizeThatFits(proposal) }

  override func place(in frame: CGRect, parent: _DomNode) {
    let button = _DomNode(tag: "button")
    button.frame = frame
    button.pathId = pathId
    button.styles["background"] = "none"
    button.styles["border"] = "none"
    button.styles["padding"] = "0"
    button.styles["margin"] = "0"
    button.styles["cursor"] = disabled ? "default" : "pointer"
    button.styles["font"] = "inherit"
    button.styles["text-align"] = "inherit"
    if disabled {
      button.attributes["disabled"] = "disabled"
      button.styles["pointer-events"] = "none"
    } else {
      button.onClick = action
    }
    parent.add(button)
    child.place(in: CGRect(origin: .zero, size: frame.size), parent: button)
  }

  override func firstBaseline(for size: CGSize) -> CGFloat { child.firstBaseline(for: size) }
}

// MARK: - Text inputs

public struct TextField: View, _PrimitiveView {
  public typealias Body = Never
  let placeholder: String
  let text: Binding<String>
  let isMultiline: Bool

  public init(_ placeholder: String, text: Binding<String>) {
    self.placeholder = placeholder
    self.text = text
    self.isMultiline = false
  }

  public init(_ placeholder: String, text: Binding<String>, axis: Axis) {
    self.placeholder = placeholder
    self.text = text
    self.isMultiline = axis == .vertical
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/TF"
    return [
      _InputNode(
        kind: isMultiline ? .textArea : .textField, text: text, placeholder: placeholder,
        environment: ctx.environment, pathId: childCtx.path)
    ]
  }
}

public struct SecureField: View, _PrimitiveView {
  public typealias Body = Never
  let placeholder: String
  let text: Binding<String>

  public init(_ placeholder: String, text: Binding<String>) {
    self.placeholder = placeholder
    self.text = text
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/SF"
    return [
      _InputNode(
        kind: .secureField, text: text, placeholder: placeholder,
        environment: ctx.environment, pathId: childCtx.path)
    ]
  }
}

public struct TextEditor: View, _PrimitiveView {
  public typealias Body = Never
  let text: Binding<String>

  public init(text: Binding<String>) {
    self.text = text
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/TE"
    return [
      _InputNode(
        kind: .textEditor, text: text, placeholder: "",
        environment: ctx.environment, pathId: childCtx.path)
    ]
  }
}

final class _InputNode: _LayoutNode {
  enum Kind {
    case textField
    case secureField
    case textArea  // TextField(axis: .vertical): grows with content
    case textEditor  // TextEditor: fills its proposal
  }

  let kind: Kind
  let text: Binding<String>
  let placeholder: String
  let style: _TextStyle
  let pathId: String
  var onSubmit: (() -> Void)?

  init(
    kind: Kind, text: Binding<String>, placeholder: String, environment: EnvironmentValues,
    pathId: String
  ) {
    self.kind = kind
    self.text = text
    self.placeholder = placeholder
    self.style = _TextStyle(
      font: environment.font,
      colorCSS: environment.foregroundCSS,
      alignCSS: environment.textAlignmentCSS,
      lineSpacing: environment.lineSpacing,
      kerning: environment.kerning,
      lineLimit: nil)
    self.pathId = pathId
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let width = proposal.width ?? 120
    switch kind {
    case .textField, .secureField:
      return CGSize(width: width, height: style.cssLineHeight)
    case .textArea:
      let value = text.wrappedValue.isEmpty ? placeholder : text.wrappedValue
      let measured = _TextMeasurer.shared.measure(text: value, style: style, maxWidth: width)
      return CGSize(width: width, height: Swift.max(style.cssLineHeight, measured.height))
    case .textEditor:
      return CGSize(width: width, height: proposal.height ?? style.cssLineHeight * 5)
    }
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let isArea = kind == .textArea || kind == .textEditor
    let node = _DomNode(tag: isArea ? "textarea" : "input")
    node.frame = frame
    node.pathId = pathId
    if !isArea {
      node.attributes["type"] = kind == .secureField ? "password" : "text"
    }
    if !placeholder.isEmpty { node.attributes["placeholder"] = placeholder }
    node.attributes["value"] = text.wrappedValue
    node.styles = style.cssProperties
    node.styles["background"] = "transparent"
    node.styles["border"] = "none"
    node.styles["outline"] = "none"
    node.styles["padding"] = "0"
    node.styles["margin"] = "0"
    node.styles["resize"] = "none"
    node.styles["box-sizing"] = "border-box"
    node.onInput = { [text] newValue in text.wrappedValue = newValue }
    node.onEnter = onSubmit
    parent.add(node)
  }
}

// MARK: - Toggle

public struct Toggle<Label: View>: View, _PrimitiveView {
  public typealias Body = Never
  let isOn: Binding<Bool>
  let label: Label

  public init(isOn: Binding<Bool>, @ViewBuilder label: () -> Label) {
    self.isOn = isOn
    self.label = label()
  }

  public init(_ title: String, isOn: Binding<Bool>) where Label == Text {
    self.isOn = isOn
    self.label = Text(title)
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Tgl"
    var children = _buildNodes(label, &childCtx)
    let tintCSS = ctx.environment.tintCSS ?? "#34c759"
    if !children.isEmpty {
      children.append(_SpacerNode(minLength: 8))
    }
    let switchNode = _SwitchNode(isOn: isOn, tintCSS: tintCSS, pathId: childCtx.path)
    children.append(switchNode)
    if children.count == 1 { return children }
    let stack = _StackNode(
      axis: .horizontal, spacing: 8, alignmentH: .leading, alignmentV: .center,
      children: children)
    for child in children { (child as? _SpacerNode)?.axis = .horizontal }
    return [stack]
  }
}

final class _SwitchNode: _LayoutNode {
  let isOn: Binding<Bool>
  let tintCSS: String
  let pathId: String

  init(isOn: Binding<Bool>, tintCSS: String, pathId: String) {
    self.isOn = isOn
    self.tintCSS = tintCSS
    self.pathId = pathId
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize { CGSize(width: 51, height: 31) }

  override func place(in frame: CGRect, parent: _DomNode) {
    let on = isOn.wrappedValue
    let track = _DomNode(tag: "button")
    track.frame = frame
    track.pathId = pathId
    track.styles["border"] = "none"
    track.styles["padding"] = "0"
    track.styles["border-radius"] = "16px"
    track.styles["background-color"] = on ? tintCSS : "rgba(120, 120, 128, 0.16)"
    track.styles["cursor"] = "pointer"
    track.styles["transition"] = "background-color 0.2s"
    track.onClick = { [isOn] in isOn.wrappedValue.toggle() }
    parent.add(track)

    let knob = _DomNode()
    knob.frame = CGRect(x: on ? 22 : 2, y: 2, width: 27, height: 27)
    knob.styles["border-radius"] = "50%"
    knob.styles["background-color"] = "#ffffff"
    knob.styles["box-shadow"] = "0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)"
    knob.styles["transition"] = "left 0.2s"
    track.add(knob)
  }
}

// MARK: - Picker (segmented-style row of options)

public struct Picker<SelectionValue: Hashable, Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let title: String
  let selection: Binding<SelectionValue>
  let content: Content

  public init(
    _ title: String, selection: Binding<SelectionValue>, @ViewBuilder content: () -> Content
  ) {
    self.title = title
    self.selection = selection
    self.content = content()
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    // Renders its options as a plain HStack; .tag() selection is wired
    // through _TagModifier when present.
    var childCtx = ctx
    childCtx.path += "/Pick"
    let children = _buildNodes(content, &childCtx)
    return [
      _StackNode(
        axis: .horizontal, spacing: 8, alignmentH: .leading, alignmentV: .center,
        children: children)
    ]
  }
}

// MARK: - ProgressView

public struct ProgressView: View, _PrimitiveView {
  public typealias Body = Never
  let value: Double?
  let total: Double

  public init() {
    self.value = nil
    self.total = 1
  }

  public init(value: Double?, total: Double = 1.0) {
    self.value = value
    self.total = total
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    if let value {
      return [_ProgressBarNode(fraction: total > 0 ? value / total : 0, tint: ctx.environment.tintCSS)]
    }
    return [_SpinnerNode(tint: ctx.environment.tintCSS)]
  }
}

final class _SpinnerNode: _LayoutNode {
  let tint: String?
  init(tint: String?) {
    self.tint = tint
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize { CGSize(width: 20, height: 20) }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    let color = tint ?? "rgba(60, 60, 67, 0.6)"
    node.html = """
      <svg width="\(Int(frame.width))" height="\(Int(frame.height))" viewBox="0 0 20 20" \
      style="display:block">\
      <circle cx="10" cy="10" r="8" fill="none" stroke="\(color)" stroke-opacity="0.25" \
      stroke-width="2.5"/>\
      <path d="M 10 2 A 8 8 0 0 1 18 10" fill="none" stroke="\(color)" stroke-width="2.5" \
      stroke-linecap="round">\
      <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" \
      dur="0.8s" repeatCount="indefinite"/></path></svg>
      """
    parent.add(node)
  }
}

final class _ProgressBarNode: _LayoutNode {
  let fraction: Double
  let tint: String?
  init(fraction: Double, tint: String?) {
    self.fraction = Swift.min(Swift.max(fraction, 0), 1)
    self.tint = tint
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 160, height: 4)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let track = _DomNode()
    track.frame = frame
    track.styles["background-color"] = "rgba(120, 120, 128, 0.2)"
    track.styles["border-radius"] = "2px"
    parent.add(track)
    let fill = _DomNode()
    fill.frame = CGRect(x: 0, y: 0, width: frame.width * fraction, height: frame.height)
    fill.styles["background-color"] = tint ?? "#007aff"
    fill.styles["border-radius"] = "2px"
    track.add(fill)
  }
}

// MARK: - Label

public struct Label: View {
  let title: String
  let systemImage: String

  public init(_ title: String, systemImage: String) {
    self.title = title
    self.systemImage = systemImage
  }

  public var body: some View {
    HStack(spacing: 5) {
      Image(systemName: systemImage)
      Text(title)
    }
  }
}

// MARK: - Link / ShareLink

public struct Link<Label: View>: View, _PrimitiveView {
  public typealias Body = Never
  let destination: URL
  let label: Label

  public init(destination: URL, @ViewBuilder label: () -> Label) {
    self.destination = destination
    self.label = label()
  }

  public init(_ title: String, destination: URL) where Label == Text {
    self.destination = destination
    self.label = Text(title)
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Link"
    let children = _buildNodes(label, &childCtx)
    let child =
      children.count == 1
      ? children[0]
      : _StackNode(
        axis: .horizontal, spacing: nil, alignmentH: .leading, alignmentV: .center,
        children: children)
    let url = destination
    return [
      _ButtonNode(
        child: child, action: { OpenURLAction()(url) }, disabled: false, pathId: childCtx.path)
    ]
  }
}

public struct ShareLink<Label: View>: View, _PrimitiveView {
  public typealias Body = Never
  let item: URL
  let label: Label

  public init(item: URL, @ViewBuilder label: () -> Label) {
    self.item = item
    self.label = label()
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Share"
    let children = _buildNodes(label, &childCtx)
    let child =
      children.count == 1
      ? children[0]
      : _StackNode(
        axis: .horizontal, spacing: nil, alignmentH: .leading, alignmentV: .center,
        children: children)
    let url = item
    return [
      _ButtonNode(
        child: child, action: { OpenURLAction()(url) }, disabled: false, pathId: childCtx.path)
    ]
  }
}
