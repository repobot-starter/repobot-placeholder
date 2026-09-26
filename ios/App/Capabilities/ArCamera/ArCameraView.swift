import ARKit
import RealityKit
import SwiftUI
import UIKit

/// The camera shell every camera capability in this app builds on: an ARKit
/// world-tracking session whose frames stream to a delegate ("camera
/// component") at ~60fps. ARKit rather than plain AVCapture because the same
/// shell then gives every consumer AR for free — plane raycasts to find
/// real-world points and anchored content placed in the environment (see
/// AugmentedReality.swift) — while a photo or QR consumer just reads
/// `frame.capturedImage` and ignores the rest.
///
/// Lifted from the TimberEye field app, where this exact shell runs a
/// production log-scanning workflow. Consumers: QrScannerCamera,
/// PhotoCaptureCamera, or your own ArFrameDelegate.
@MainActor
protocol ArFrameDelegate: AnyObject {
  func viewDidLoad(view arView: ARView)
  func viewDidDisappear()
  /// Called with every camera frame, roughly 60 per second. Heavy work must
  /// gate itself (see the `isProcessing` pattern in QrScannerCamera) so one
  /// frame finishes before the next begins.
  func frameDidUpdate(newFrame frame: ARFrame)
}

// Default no-ops so simple consumers only implement frameDidUpdate.
extension ArFrameDelegate {
  func viewDidLoad(view arView: ARView) {}
  func viewDidDisappear() {}
}

/// The SwiftUI face of the shell. Embed it and pass your camera component:
///
///     ArCameraView(arFrameDelegate: camera)
struct ArCameraView: UIViewControllerRepresentable {
  let arFrameDelegate: ArFrameDelegate

  func makeUIViewController(context: Context) -> ArViewController {
    ArViewController(arFrameDelegate: arFrameDelegate)
  }

  func updateUIViewController(_ uiViewController: ArViewController, context: Context) {}
}

final class ArViewController: UIViewController, ARSessionDelegate {
  private let arView: ARView
  private let arFrameDelegate: ArFrameDelegate

  init(arFrameDelegate: ArFrameDelegate) {
    arView = ARView()
    self.arFrameDelegate = arFrameDelegate
    super.init(nibName: nil, bundle: nil)
    arView.environment.sceneUnderstanding.options = [.collision]
    // Camera-first rendering: every cinematic AR effect off, so anchored
    // content reads as crisp UI over a plain camera feed.
    arView.renderOptions = [
      .disableMotionBlur,
      .disableDepthOfField,
      .disablePersonOcclusion,
      .disableGroundingShadows,
      .disableFaceMesh,
      .disableAREnvironmentLighting,
      .disableHDR,
    ]
    arView.automaticallyConfigureSession = false
    arView.session.delegate = self
    arView.frame = view.frame
    view.addSubview(arView)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    arFrameDelegate.viewDidLoad(view: arView)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    // Start here rather than in init: frames delivered before the session
    // settles briefly claim `.normal` tracking and then regress, which
    // flickers any UI keyed to tracking state.
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    arView.session.run(configuration)
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    arFrameDelegate.viewDidDisappear()
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    arFrameDelegate.frameDidUpdate(newFrame: frame)
  }
}
