// Image (SF Symbols subset as inline SVG) and AsyncImage.
//
// The symbol table covers every systemName used by the kernel's non-game
// surface (see scripts/verify-ios-preview-dialect.mjs, which enforces it).
// Paths are hand-drawn 24×24 stroke icons approximating SF Symbols.
import CoreGraphics
import Foundation

public struct Image: View, _PrimitiveView {
  public typealias Body = Never
  let systemName: String?
  let assetName: String?
  var isResizable = false
  var objectFit = "contain"

  public init(systemName: String) {
    self.systemName = systemName
    self.assetName = nil
  }

  public init(_ name: String) {
    self.systemName = nil
    self.assetName = name
  }

  public func resizable() -> Image {
    var image = self
    image.isResizable = true
    return image
  }

  public func scaledToFit() -> Image {
    var image = self
    image.objectFit = "contain"
    return image
  }

  public func scaledToFill() -> Image {
    var image = self
    image.objectFit = "cover"
    return image
  }

  public func renderingMode(_ mode: TemplateRenderingMode) -> Image { self }

  public enum TemplateRenderingMode {
    case original
    case template
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    [
      _ImageNode(
        systemName: systemName, assetName: assetName, resizable: isResizable,
        colorCSS: ctx.environment.foregroundCSS, fontSize: ctx.environment.font.size)
    ]
  }
}

final class _ImageNode: _LayoutNode {
  let systemName: String?
  let assetName: String?
  let resizable: Bool
  let colorCSS: String
  let fontSize: CGFloat

  init(systemName: String?, assetName: String?, resizable: Bool, colorCSS: String, fontSize: CGFloat) {
    self.systemName = systemName
    self.assetName = assetName
    self.resizable = resizable
    self.colorCSS = colorCSS
    self.fontSize = fontSize
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    if resizable {
      return CGSize(width: proposal.width ?? 20, height: proposal.height ?? 20)
    }
    // SF Symbols track the current font size.
    let side = (fontSize * 1.05).rounded()
    return CGSize(width: side, height: side)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode()
    node.frame = frame
    if let systemName {
      node.html = _SFSymbols.svg(
        named: systemName, width: frame.width, height: frame.height, colorCSS: colorCSS)
    } else {
      node.styles["background-color"] = "rgba(120, 120, 128, 0.2)"
      node.styles["border-radius"] = "4px"
      node.attributes["title"] = assetName ?? ""
    }
    parent.add(node)
  }
}

enum _SFSymbols {
  /// path data + whether it's filled (default: stroked).
  static let table: [String: (path: String, filled: Bool)] = [
    "xmark": ("M6 6 L18 18 M18 6 L6 18", false),
    "arrow.left": ("M20 12 L5 12 M11 5 L4 12 L11 19", false),
    "arrow.up": ("M12 20 L12 5 M5 11 L12 4 L19 11", false),
    "arrow.up.right": ("M6 18 L17.5 6.5 M8 6 L18 6 L18 16", false),
    "chevron.backward": ("M15 4.5 L7 12 L15 19.5", false),
    "chevron.forward": ("M9 4.5 L17 12 L9 19.5", false),
    "chevron.up": ("M4.5 15.5 L12 8 L19.5 15.5", false),
    "chevron.down": ("M4.5 8.5 L12 16 L19.5 8.5", false),
    "exclamationmark.triangle":
      ("M12 3.5 L21.5 19.5 L2.5 19.5 Z M12 9.5 L12 14 M12 16.5 L12 16.6", false),
    "folder":
      ("M3 7 C3 5.9 3.9 5 5 5 L9 5 L11 7.5 L19 7.5 C20.1 7.5 21 8.4 21 9.5 L21 17 C21 18.1 20.1 19 19 19 L5 19 C3.9 19 3 18.1 3 17 Z",
       false),
    "gearshape":
      ("M12 8.2 A3.8 3.8 0 1 0 12 15.8 A3.8 3.8 0 1 0 12 8.2 M12 2.5 L12 5 M12 19 L12 21.5 M4.5 7 L6.6 8.3 M17.4 15.7 L19.5 17 M4.5 17 L6.6 15.7 M17.4 8.3 L19.5 7 M2.5 12 L5 12 M19 12 L21.5 12",
       false),
    "line.3.horizontal": ("M4 7 L20 7 M4 12 L20 12 M4 17 L20 17", false),
    "person.2":
      ("M9 5.5 A3.2 3.2 0 1 0 9 11.9 A3.2 3.2 0 1 0 9 5.5 M2.5 19 C2.5 15.7 5.4 13.5 9 13.5 C12.6 13.5 15.5 15.7 15.5 19 M16.5 6.8 A2.7 2.7 0 1 1 16.4 12.1 M17.5 14 C20 14.5 21.7 16.4 21.7 19",
       false),
    "rectangle.portrait.and.arrow.right":
      ("M13.5 4 L6.5 4 C5.4 4 4.5 4.9 4.5 6 L4.5 18 C4.5 19.1 5.4 20 6.5 20 L13.5 20 M16.5 8 L20.5 12 L16.5 16 M20.5 12 L10 12",
       false),
    "sparkles":
      ("M11 4 L12.4 8.6 L17 10 L12.4 11.4 L11 16 L9.6 11.4 L5 10 L9.6 8.6 Z M18 13.5 L18.8 15.7 L21 16.5 L18.8 17.3 L18 19.5 L17.2 17.3 L15 16.5 L17.2 15.7 Z",
       true),
    "stop.fill": ("M7 7 C7 6.4 7.4 6 8 6 L16 6 C16.6 6 17 6.4 17 7 L17 17 C17 17.6 16.6 18 16 18 L8 18 C7.4 18 7 17.6 7 17 Z", true),
    "plus": ("M12 4 L12 20 M4 12 L20 12", false),
    "checkmark": ("M4 12.5 L9.5 18 L20 6", false),
    "magnifyingglass": ("M10.5 4 A6.5 6.5 0 1 0 10.5 17 A6.5 6.5 0 1 0 10.5 4 M15.5 15.5 L21 21", false),
  ]

  static func svg(named name: String, width: CGFloat, height: CGFloat, colorCSS: String) -> String {
    guard let symbol = table[name] else {
      // Unknown symbol: a hollow diamond placeholder, visually obvious.
      return svgBody(
        path: "M12 3 L21 12 L12 21 L3 12 Z", filled: false, width: width, height: height,
        colorCSS: colorCSS)
    }
    return svgBody(
      path: symbol.path, filled: symbol.filled, width: width, height: height, colorCSS: colorCSS)
  }

  private static func svgBody(
    path: String, filled: Bool, width: CGFloat, height: CGFloat, colorCSS: String
  ) -> String {
    let paint =
      filled
      ? "fill=\"\(colorCSS)\" stroke=\"none\""
      : "fill=\"none\" stroke=\"\(colorCSS)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\""
    return """
      <svg width="\(Int(width))" height="\(Int(height))" viewBox="0 0 24 24" \
      style="display:block"><path d="\(path)" \(paint)/></svg>
      """
  }
}

// MARK: - AsyncImage

public struct AsyncImage<Content: View, Placeholder: View>: View, _PrimitiveView {
  public typealias Body = Never
  let url: URL?
  let content: (Image) -> Content
  let placeholder: () -> Placeholder

  public init(
    url: URL?,
    @ViewBuilder content: @escaping (Image) -> Content,
    @ViewBuilder placeholder: @escaping () -> Placeholder
  ) {
    self.url = url
    self.content = content
    self.placeholder = placeholder
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/AImg"
    guard let url else {
      return _buildNodes(placeholder(), &childCtx)
    }
    // The browser loads the img itself; content(Image) is evaluated to pick
    // up resizable/objectFit flags, then rendered as a real <img>.
    let probe = Image(systemName: "")
    let configured = content(probe)
    var fit = "cover"
    var resizable = true
    if let image = configured as? Image {
      fit = image.objectFit
      resizable = image.isResizable
    }
    return [_AsyncImageNode(url: url.absoluteString, objectFit: fit, resizable: resizable)]
  }
}

extension AsyncImage where Content == Image, Placeholder == EmptyView {
  public init(url: URL?) {
    self.init(url: url, content: { $0 }, placeholder: { EmptyView() })
  }
}

final class _AsyncImageNode: _LayoutNode {
  let url: String
  let objectFit: String
  let resizable: Bool

  init(url: String, objectFit: String, resizable: Bool) {
    self.url = url
    self.objectFit = objectFit
    self.resizable = resizable
    super.init()
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    CGSize(width: proposal.width ?? 40, height: proposal.height ?? 40)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let node = _DomNode(tag: "img")
    node.frame = frame
    node.attributes["src"] = url
    node.styles["object-fit"] = objectFit
    node.styles["width"] = "100%"
    node.styles["height"] = "100%"
    parent.add(node)
  }
}
