// DOM bridge: walks the _Node tree and materializes elements via
// JavaScriptKit. Full re-render on every state change (spike-grade).
import JavaScriptKit

public enum _WebRuntime {
  static var root: (any View)?
  static var retainedClosures: [JSClosure] = []
  static var renderCount = 0

  public static func mount(_ view: any View) {
    root = view
    render()
    // Signal the host page (cold-start measurement hook).
    if let ready = JSObject.global.__spikeFirstRender.function {
      _ = ready()
    }
  }

  public static func scheduleRerender() {
    render()
  }

  static func render() {
    guard let root else { return }
    let performance = JSObject.global.performance
    let started = performance.now().number ?? 0

    let document = JSObject.global.document
    guard var app = document.getElementById("app").object else { return }
    retainedClosures.removeAll()
    app.innerHTML = .string("")
    for node in root._nodes() {
      _ = app.appendChild!(element(from: node))
    }

    renderCount += 1
    let elapsed = (performance.now().number ?? 0) - started
    _ = JSObject.global.console.log(
      "[spike] render #\(renderCount) took \(String(format: "%.1f", elapsed))ms")
    if let hook = JSObject.global.__spikeRenderStats.function {
      _ = hook(renderCount, elapsed)
    }
  }

  static func element(from node: _Node) -> JSValue {
    let document = JSObject.global.document
    var el = document.createElement(node.tag)
    var css = ""
    for (key, value) in node.style where !key.hasPrefix("--") {
      css += "\(key): \(value); "
    }
    if !css.isEmpty {
      _ = el.setAttribute("style", css)
    }
    if let text = node.text {
      el.textContent = .string(text)
    }
    if let action = node.onClick {
      let closure = JSClosure { _ in
        action()
        return .undefined
      }
      el.onclick = .object(closure)
      retainedClosures.append(closure)
    }
    for child in node.children {
      _ = el.appendChild(element(from: child))
    }
    return el
  }

  static func openExternalURL(_ url: String) {
    _ = JSObject.global.window.open(url, "_blank")
  }
}
