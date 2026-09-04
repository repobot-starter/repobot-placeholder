// Preview-build CoreGraphics: the geometry vocabulary the kernel dialect
// uses. FoundationEssentials does not define these on wasm, so there is no
// collision; device builds use the real CoreGraphics.

public typealias CGFloat = Double

public struct CGPoint: Hashable, Sendable {
  public var x: CGFloat
  public var y: CGFloat
  public init(x: CGFloat = 0, y: CGFloat = 0) {
    self.x = x
    self.y = y
  }
  public static let zero = CGPoint()
}

public struct CGSize: Hashable, Sendable {
  public var width: CGFloat
  public var height: CGFloat
  public init(width: CGFloat = 0, height: CGFloat = 0) {
    self.width = width
    self.height = height
  }
  public static let zero = CGSize()
}

public struct CGRect: Hashable, Sendable {
  public var origin: CGPoint
  public var size: CGSize
  public init(origin: CGPoint = .zero, size: CGSize = .zero) {
    self.origin = origin
    self.size = size
  }
  public init(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
    self.origin = CGPoint(x: x, y: y)
    self.size = CGSize(width: width, height: height)
  }
  public static let zero = CGRect()

  public var minX: CGFloat { origin.x }
  public var minY: CGFloat { origin.y }
  public var maxX: CGFloat { origin.x + size.width }
  public var maxY: CGFloat { origin.y + size.height }
  public var width: CGFloat { size.width }
  public var height: CGFloat { size.height }
  public var midX: CGFloat { origin.x + size.width / 2 }
  public var midY: CGFloat { origin.y + size.height / 2 }
}
