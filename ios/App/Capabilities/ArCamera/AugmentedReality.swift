import ARKit
import RealityKit
import UIKit
import Vision
import simd

/// Anchored content + raycasting for camera components: turn a Vision
/// bounding box (normalized image coordinates) into a screen point, raycast
/// it onto real-world geometry, and pin a checkmark badge there that stays
/// put as the phone moves. This is what makes a scan feel physical — the
/// mark lives on the object, not on the screen.
///
/// LiDAR devices resolve raycasts against real plane geometry; others fall
/// back to estimated planes automatically (the `allowing:` ladder in
/// `raycastWorldPointResultOnScreen`), so the same code runs everywhere.
@MainActor
final class AugmentedReality {
  private var arView: ARView?

  func setArView(_ view: ARView) {
    arView = view
  }

  /// Anchors are scene state, not view state — clear them when the camera
  /// view disappears or stale marks greet the next session.
  func reset() {
    if let arView {
      arView.scene.anchors.removeAll()
      self.arView = nil
    }
  }

  /// Pins a badge on real-world geometry behind the given Vision-normalized
  /// rect (e.g. a detected QR code's boundingBox). Returns false when no
  /// surface answered the raycast — normal while tracking warms up; try
  /// again on a later frame.
  @discardableResult
  func placeAnchorAtNormalizedRect(
    _ normalizedRect: CGRect,
    _ frame: ARFrame,
    id: String,
    color: UIColor
  ) -> Bool {
    guard let arView else {
      return false
    }
    let point = ARUtils.normalizedRectToScreenMidpoint(normalizedRect, arView.frame.size, frame)
    guard let anchor = ARContent.checkmarkBadgeAnchor(arView, at: point, color: color) else {
      return false
    }
    arView.scene.addAnchor(anchor)
    Haptics.success()
    return true
  }

  /// The real-world 3D point behind a Vision-normalized image point.
  func raycastWorldPoint(_ normalizedPoint: CGPoint, _ frame: ARFrame) -> simd_float3? {
    guard let arView else {
      return nil
    }
    let screenPoint = ARUtils.normalizedPointToScreenPoint(normalizedPoint, arView.frame.size, frame)
    return raycastWorldPointOnScreen(screenPoint)
  }

  /// The real-world 3D point behind a screen point (e.g. a tap location).
  func raycastWorldPointOnScreen(_ screenPoint: CGPoint) -> simd_float3? {
    guard let arView else {
      return nil
    }
    // Prefer mapped plane geometry, then estimated planes, then the
    // infinite extension of known planes — most to least trustworthy.
    let queries: [ARRaycastQuery.Target] = [
      .existingPlaneGeometry, .estimatedPlane, .existingPlaneInfinite,
    ]
    for target in queries {
      if let result = arView.raycast(from: screenPoint, allowing: target, alignment: .any).first {
        let column = result.worldTransform.columns.3
        return simd_float3(column.x, column.y, column.z)
      }
    }
    return nil
  }

  /// Where a Vision-normalized rect lands on screen (for drawing overlays).
  func normalizedRectToScreenRect(_ normalizedRect: CGRect, _ frame: ARFrame) -> CGRect? {
    guard let arView else {
      return nil
    }
    return ARUtils.translateNormalizedRectToScreenRect(normalizedRect, arView.frame.size, frame)
  }
}

/// Coordinate plumbing between Vision (normalized, sensor-oriented) and the
/// screen. Vision results must pass through the frame's displayTransform —
/// the camera sensor is landscape while the app is portrait.
@MainActor
enum ARUtils {
  static func translateNormalizedRectToScreenRect(
    _ normalizedRect: CGRect,
    _ screenSize: CGSize,
    _ frame: ARFrame
  ) -> CGRect {
    let toPortraitScreen = frame.displayTransform(for: .portrait, viewportSize: screenSize)
    let screenNormalized = normalizedRect.applying(toPortraitScreen)
    return screenNormalized.applying(CGAffineTransform(scaleX: screenSize.width, y: screenSize.height))
  }

  static func normalizedRectToScreenMidpoint(
    _ normalizedRect: CGRect,
    _ screenSize: CGSize,
    _ frame: ARFrame
  ) -> CGPoint {
    let screenRect = translateNormalizedRectToScreenRect(normalizedRect, screenSize, frame)
    return CGPoint(x: screenRect.midX, y: screenRect.midY)
  }

  static func normalizedPointToScreenPoint(
    _ normalizedPoint: CGPoint,
    _ screenSize: CGSize,
    _ frame: ARFrame
  ) -> CGPoint {
    let rect = CGRect(x: normalizedPoint.x, y: normalizedPoint.y, width: 0, height: 0)
    return translateNormalizedRectToScreenRect(rect, screenSize, frame).origin
  }
}

/// The anchored badge itself: a small rounded chip with a checkmark, facing
/// the camera at the moment it is placed. One composition, reused by every
/// scanning surface, so "scanned" looks the same across the app.
@MainActor
private enum ARContent {
  static func checkmarkBadgeAnchor(
    _ arView: ARView,
    at screenPoint: CGPoint,
    color: UIColor
  ) -> AnchorEntity? {
    guard let worldTransform = raycastTransform(arView, screenPoint) else {
      return nil
    }
    // Anchor with the camera's orientation at placement time so the badge
    // faces the user, positioned at the raycast hit.
    var cameraTransform = arView.cameraTransform
    let position = simd_float3(
      worldTransform.columns.3.x, worldTransform.columns.3.y, worldTransform.columns.3.z
    )
    cameraTransform.translation = position
    let anchor = AnchorEntity(world: cameraTransform.matrix)
    guard let badge = buildCheckmarkBadge(color) else {
      return nil
    }
    anchor.addChild(badge)
    return anchor
  }

  private static func raycastTransform(_ arView: ARView, _ point: CGPoint) -> matrix_float4x4? {
    let queries: [ARRaycastQuery.Target] = [
      .existingPlaneGeometry, .estimatedPlane, .existingPlaneInfinite,
    ]
    for target in queries {
      if let result = arView.raycast(from: point, allowing: target, alignment: .any).first {
        return result.worldTransform
      }
    }
    return nil
  }

  private static func buildCheckmarkBadge(_ baseColor: UIColor) -> Entity? {
    let group = Entity()

    // Chip proportions in meters: ~7cm chip reads clearly at arm's length.
    let side: Float = 0.068
    let cornerRadius: Float = 0.008
    let badgeDepth: Float = 0.0036
    let topInset: Float = 0.005
    let topDepth: Float = 0.0014

    let baseChip = ModelEntity(
      mesh: .generateBox(size: side, cornerRadius: cornerRadius),
      materials: [SimpleMaterial(color: baseColor.withAlphaComponent(0.98), isMetallic: false)]
    )
    baseChip.scale = SIMD3<Float>(1, 1, badgeDepth / side)

    let topChipSide = side - topInset
    let topChip = ModelEntity(
      mesh: .generateBox(size: topChipSide, cornerRadius: max(0.001, cornerRadius * 0.75)),
      materials: [SimpleMaterial(color: baseColor.withAlphaComponent(0.84), isMetallic: false)]
    )
    topChip.scale = SIMD3<Float>(1, 1, topDepth / topChipSide)
    topChip.position = SIMD3<Float>(0, 0, (badgeDepth / 2) + (topDepth / 2))

    guard let font = MeshResource.Font(name: "Arial-BoldMT", size: 0.040) else {
      return nil
    }
    let checkText = ModelEntity(
      mesh: .generateText("✓", extrusionDepth: 0.0015, font: font, alignment: .center),
      materials: [SimpleMaterial(color: .white, isMetallic: false)]
    )
    checkText.position = SIMD3<Float>(-0.0098, -0.0215, (badgeDepth / 2) + topDepth + 0.0007)

    group.addChild(baseChip)
    group.addChild(topChip)
    group.addChild(checkText)
    return group
  }
}
