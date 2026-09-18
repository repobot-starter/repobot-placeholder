import ARKit
import RealityKit
import UIKit
import Vision

/// QR scanning on the AR camera shell: every detected code gets an anchored
/// checkmark pinned to it in the real world (plus a success haptic), and the
/// deduplicated set of scanned values streams to the owner. Point at a wall
/// of codes and sweep — no per-code "hold steady" ritual.
///
/// Usage:
///
///     @State private var camera = QrScannerCamera(badgeColor: .systemGreen)
///     ArCameraView(arFrameDelegate: camera)
///     // camera.scannedValues grows as codes land; camera.isScanning gates it.
@MainActor
@Observable
final class QrScannerCamera: ARCamera {
  /// Every distinct QR payload scanned this session, in no particular order.
  private(set) var scannedValues: Set<String> = []
  var isScanning = true

  private let badgeColor: UIColor
  private let onScan: ((String) -> Void)?
  private var isProcessing = false

  /// - Parameters:
  ///   - badgeColor: The anchored checkmark's chip color (brand accent).
  ///   - onScan: Called once per distinct payload, on the main actor.
  init(badgeColor: UIColor, onScan: ((String) -> Void)? = nil) {
    self.badgeColor = badgeColor
    self.onScan = onScan
  }

  override func frameDidUpdate(newFrame frame: ARFrame) {
    super.frameDidUpdate(newFrame: frame)
    // Gate: tracking must be up (raycasts need geometry), scanning enabled,
    // and the previous frame's detection finished (Vision takes longer than
    // one frame; overlapping requests just heat the phone).
    guard trackingStateNormal, isScanning, !isProcessing else {
      return
    }
    isProcessing = true
    Task { @MainActor in
      defer { isProcessing = false }
      let codes = await QrDetection.detectQrs(frame.capturedImage)
      for code in codes where !scannedValues.contains(code.value) {
        // Only count the code once its badge actually lands on real
        // geometry — a detection with no surface behind it retries on a
        // later frame instead of silently swallowing the scan.
        let placed = augmentedReality.placeAnchorAtNormalizedRect(
          code.boundingBox, frame, id: code.value, color: badgeColor
        )
        if placed {
          scannedValues.insert(code.value)
          onScan?(code.value)
        }
      }
    }
  }
}

/// Vision-based QR detection over a camera frame. Add symbologies here if a
/// project needs more than QR (EAN, Code 128, ...) — the request supports
/// every common barcode.
enum QrDetection {
  static func detectQrs(_ pixelBuffer: CVPixelBuffer) async -> [QrCode] {
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .downMirrored)
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    guard let results = VnRequestExecutor.execute(handler, request) else {
      return []
    }
    return results.compactMap { observation in
      (observation as? VNBarcodeObservation).flatMap(QrCode.init)
    }
  }
}

/// A detected code with a guaranteed non-empty payload (Vision's
/// payloadStringValue is optional; this class does the check once).
final class QrCode {
  private let observation: VNBarcodeObservation
  let value: String

  init?(_ observation: VNBarcodeObservation) {
    guard let value = observation.payloadStringValue, !value.isEmpty else {
      return nil
    }
    self.value = value
    self.observation = observation
  }

  /// Vision-normalized image coordinates; convert via ARUtils for screen.
  var boundingBox: CGRect { observation.boundingBox }
}

/// One place Vision requests run, so error handling and background
/// preference are uniform for every capability (QR, CoreML detection).
enum VnRequestExecutor {
  static func execute(_ handler: VNImageRequestHandler, _ request: VNImageBasedRequest) -> [VNObservation]? {
    request.preferBackgroundProcessing = true
    do {
      try handler.perform([request])
    } catch {
      return []
    }
    return request.results
  }
}
