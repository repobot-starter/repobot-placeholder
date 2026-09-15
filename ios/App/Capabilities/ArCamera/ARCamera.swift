import ARKit
import RealityKit

/// Base class for camera components that need AR: normal-tracking-state
/// gating plus an AugmentedReality handle for placing anchored content.
///
/// The session takes 2–5 seconds after appearing to reach normal tracking
/// (it is mapping the room); observe `trackingStateNormal` to show a
/// "warming up" hint instead of a camera that silently ignores input.
@MainActor
@Observable
class ARCamera: ArFrameDelegate {
  private(set) var trackingStateNormal = false
  let augmentedReality = AugmentedReality()

  func viewDidLoad(view arView: ARView) {
    augmentedReality.setArView(arView)
  }

  func viewDidDisappear() {
    augmentedReality.reset()
  }

  func frameDidUpdate(newFrame frame: ARFrame) {
    let tracking: Bool
    switch frame.camera.trackingState {
    case .notAvailable:
      tracking = false
    case .normal:
      tracking = true
    case .limited(let reason):
      switch reason {
      case .initializing, .relocalizing:
        tracking = false
      default:
        // Limited-but-usable (excessive motion, low light): raycasts still
        // land, so don't block the user.
        tracking = true
      }
    }
    if tracking != trackingStateNormal {
      trackingStateNormal = tracking
    }
  }
}
