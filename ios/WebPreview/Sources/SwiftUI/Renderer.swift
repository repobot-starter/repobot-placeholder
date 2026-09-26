// DOM renderer and runtime.
//
// Render cycle: build (view tree → layout nodes, resolving environment and
// binding state) → layout (propose/respond from the container size) →
// emit (absolutely positioned divs) → restore focus/scroll → run effects
// (onAppear/task once per structural identity, onChange on value changes).
import CoreGraphics
import Foundation
import JavaScriptKit

// MARK: - Text measurement

final class _TextMeasurer {
  static let shared = _TextMeasurer()

  private var element: JSObject?
  private var cache: [String: CGSize] = [:]

  private func measurerElement() -> JSObject {
    if let element { return element }
    let document = JSObject.global.document
    let node = document.createElement("div").object!
    node.id = "swiftui-measurer"
    let style = node.style.object!
    style.cssText = .string(
      "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;"
        + "white-space:pre-wrap;overflow-wrap:break-word;width:max-content;contain:layout;")
    _ = document.body.appendChild(node)
    element = node
    return node
  }

  func measure(text: String, style: _TextStyle, maxWidth: CGFloat?) -> CGSize {
    let font = style.font
    let family = font.customFamily.map { "'\($0)', \(font.design.cssFamily)" }
      ?? font.design.cssFamily
    let key =
      "\(text)|\(font.size)|\(font.weight.css)|\(family)|\(font.isItalic)|\(style.kerning)|"
      + "\(style.cssLineHeight)|\(maxWidth.map { "\($0)" } ?? "-")"
    if let hit = cache[key] { return hit }

    let node = measurerElement()
    let styleObject = node.style.object!
    styleObject["font-size"] = .string("\(font.size)px")
    styleObject["font-weight"] = .string("\(font.weight.css)")
    styleObject["font-family"] = .string(family)
    styleObject["font-style"] = .string(font.isItalic ? "italic" : "normal")
    styleObject["line-height"] = .string("\(style.cssLineHeight)px")
    styleObject["letter-spacing"] = .string(style.kerning != 0 ? "\(style.kerning)px" : "normal")
    styleObject["max-width"] = .string(maxWidth.map { "\($0)px" } ?? "none")
    node.textContent = .string(text.isEmpty ? " " : text)

    let rect = node.getBoundingClientRect!().object!
    // Round up: a fractionally undersized frame would re-wrap in the DOM.
    let size = CGSize(
      width: (rect.width.number ?? 0).rounded(.up),
      height: (rect.height.number ?? 0).rounded(.up))
    cache[key] = size
    return size
  }
}

// MARK: - Runtime

public enum _WebRuntime {
  static var rootView: (any View)?
  static var containerId = "swiftui-root"
  static var renderScheduled = false
  static var renderedOnce = false

  /// JSClosures kept alive for the currently mounted DOM.
  static var liveClosures: [JSClosure] = []
  static var pendingClosureRelease: [JSClosure] = []

  /// Effect bookkeeping across renders.
  static var appearedPaths: Set<String> = []
  static var previousChangeValues: [String: Any] = [:]

  public static func mount(_ view: some View, containerId: String = "swiftui-root") {
    rootView = view
    self.containerId = containerId
    installResizeListener()
    render()
  }

  public static func scheduleRerender() {
    guard !renderScheduled else { return }
    renderScheduled = true
    _ = JSObject.global.setTimeout?(
      JSOneshotClosure { _ in
        renderScheduled = false
        render()
        return .undefined
      }, 0)
  }

  static func installResizeListener() {
    let closure = JSClosure { _ in
      scheduleRerender()
      return .undefined
    }
    liveClosures.append(closure)
    _ = JSObject.global.window.addEventListener("resize", closure)
  }

  static func render() {
    guard let rootView else { return }
    let document = JSObject.global.document
    guard let container = document.getElementById(containerId).object else {
      JSObject.global.console.error("WebPreview: no #\(containerId) container")
      return
    }

    let width = container.clientWidth.number ?? 390
    let height = container.clientHeight.number ?? 844

    // 1. Build.
    _StateStore.shared.beginRenderPass()
    let effects = _EffectRegistry()
    var ctx = _BuildContext(environment: EnvironmentValues(), path: "", effects: effects)
    let nodes = _buildAny(rootView, &ctx)
    let root: _LayoutNode =
      nodes.count == 1
      ? nodes[0]
      : _ZStackNode(alignment: .center, children: nodes)

    // 2. Layout.
    let proposal = _Proposal(width: width, height: height)
    let size = root.sizeThatFits(proposal)
    let dom = _DomNode()
    dom.frame = CGRect(x: 0, y: 0, width: width, height: height)
    // Root content is centered in the container, SwiftUI-style.
    let x = (width - size.width) / 2
    let y = (height - size.height) / 2
    root.place(in: CGRect(x: x, y: y, width: size.width, height: size.height), parent: dom)
    _StateStore.shared.endRenderPass()

    // 3. Emit, preserving focus and scroll positions.
    let focusState = captureFocus(document: document)
    let scrollState = captureScroll(container: container)

    pendingClosureRelease = liveClosures
    liveClosures = []

    container.innerHTML = ""
    for child in dom.children {
      _ = container.appendChild!(materialize(child, document: document))
    }

    restoreScroll(container: container, state: scrollState)
    restoreFocus(document: document, state: focusState)

    // Release the previous render's closures now that its DOM is gone.
    pendingClosureRelease = []

    // 4. Effects.
    runEffects(effects)

    if !renderedOnce {
      renderedOnce = true
      _ = JSObject.global.window.object!.__previewFirstRender?()
    }
  }

  // MARK: DOM materialization

  static func materialize(_ node: _DomNode, document: JSValue) -> JSValue {
    let element = document.createElement(node.tag)
    let object = element.object!

    var css = node.styles
    css["position"] = "absolute"
    css["left"] = "\(node.frame.minX)px"
    css["top"] = "\(node.frame.minY)px"
    css["width"] = "\(node.frame.width)px"
    css["height"] = "\(node.frame.height)px"
    if css["box-sizing"] == nil { css["box-sizing"] = "border-box" }
    let cssText = css.map { "\($0.key):\($0.value)" }.joined(separator: ";")
    object.style.object!.cssText = .string(cssText)

    for (name, value) in node.attributes {
      _ = object.setAttribute?(name, value)
    }
    if let pathId = node.pathId {
      _ = object.setAttribute?("data-pid", pathId)
    }
    if let text = node.text {
      object.textContent = .string(text)
    } else if let html = node.html {
      object.innerHTML = .string(html)
    }
    if node.tag == "input" || node.tag == "textarea" {
      object.value = .string(node.attributes["value"] ?? "")
    }

    if let onClick = node.onClick {
      let closure = JSClosure { _ in
        onClick()
        return .undefined
      }
      liveClosures.append(closure)
      _ = object.addEventListener?("click", closure)
    }
    if let onInput = node.onInput {
      let closure = JSClosure { args in
        let value = args.first?.target.value.string ?? ""
        onInput(value)
        return .undefined
      }
      liveClosures.append(closure)
      _ = object.addEventListener?("input", closure)
    }
    if let onEnter = node.onEnter {
      let closure = JSClosure { args in
        if args.first?.key.string == "Enter" {
          onEnter()
        }
        return .undefined
      }
      liveClosures.append(closure)
      _ = object.addEventListener?("keydown", closure)
    }

    for child in node.children {
      _ = object.appendChild?(materialize(child, document: document))
    }
    return element
  }

  // MARK: Focus & scroll restoration

  struct FocusState {
    let pathId: String
    let selectionStart: Int?
    let selectionEnd: Int?
  }

  static func captureFocus(document: JSValue) -> FocusState? {
    guard let active = document.activeElement.object,
      let pathId = active.getAttribute?("data-pid").string
    else { return nil }
    return FocusState(
      pathId: pathId,
      selectionStart: active.selectionStart.number.map(Int.init),
      selectionEnd: active.selectionEnd.number.map(Int.init))
  }

  static func restoreFocus(document: JSValue, state: FocusState?) {
    guard let state,
      let element = document.querySelector("[data-pid=\"\(state.pathId)\"]").object
    else { return }
    _ = element.focus?()
    if let start = state.selectionStart, let end = state.selectionEnd {
      _ = element.setSelectionRange?(start, end)
    }
  }

  static func captureScroll(container: JSObject) -> [String: (CGFloat, CGFloat)] {
    var state: [String: (CGFloat, CGFloat)] = [:]
    guard let list = container.querySelectorAll?("[data-scroll]").object else { return state }
    let count = Int(list.length.number ?? 0)
    for index in 0..<count {
      guard let item = list.item?(index).object,
        let pathId = item.getAttribute?("data-pid").string
      else { continue }
      state[pathId] = (item.scrollLeft.number ?? 0, item.scrollTop.number ?? 0)
    }
    return state
  }

  static func restoreScroll(container: JSObject, state: [String: (CGFloat, CGFloat)]) {
    guard !state.isEmpty,
      let list = container.querySelectorAll?("[data-scroll]").object
    else { return }
    let count = Int(list.length.number ?? 0)
    for index in 0..<count {
      guard let item = list.item?(index).object,
        let pathId = item.getAttribute?("data-pid").string,
        let saved = state[pathId]
      else { continue }
      item.scrollLeft = .number(saved.0)
      item.scrollTop = .number(saved.1)
    }
  }

  // MARK: Effects

  static func runEffects(_ effects: _EffectRegistry) {
    // onAppear/task: fire once per continuous structural presence.
    var presentPaths: Set<String> = []
    for appear in effects.appears {
      presentPaths.insert(appear.path)
      if !appearedPaths.contains(appear.path) {
        appearedPaths.insert(appear.path)
        appear.action()
      }
    }
    appearedPaths.formIntersection(presentPaths)

    // onChange: compare against the previous render's value.
    var nextValues: [String: Any] = [:]
    for change in effects.changes {
      nextValues[change.path] = change.newValue
      if let previous = previousChangeValues[change.path], !change.isEqualToPrevious(previous) {
        change.perform()
      }
    }
    previousChangeValues = nextValues
  }
}
