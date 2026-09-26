import ARKit
import CoreML
import UIKit
import Vision

/// A generic CoreML object detector over camera frames — the pattern behind
/// TimberEye's production log detector, with the model injected instead of
/// hardcoded. Drop a detection model (.mlpackage) into the Xcode project,
/// then:
///
///     let detector = ObjectDetector {
///       try VNCoreMLModel(for: MyDetectionModel(configuration: .init()).model)
///     }
///     // per frame (gate like QrScannerCamera does):
///     let hits = await detector.detect(frame.capturedImage, label: "dog", minimumConfidence: 0.6)
///
/// The model loads asynchronously off the first frames; `isModelLoaded`
/// drives a loading hint. Detection results come back in Vision-normalized
/// coordinates — convert with ARUtils to draw overlays, or raycast through
/// AugmentedReality to anchor content on the detected object.
@MainActor
@Observable
final class ObjectDetector {
  private var model: VNCoreMLModel?
  private(set) var isModelLoaded = false

  /// - Parameter loadModel: Builds the VNCoreMLModel (typically wrapping the
  ///   Xcode-generated model class). Runs once, off the main thread's
  ///   critical path; a throw leaves the detector permanently inert.
  init(loadModel: @escaping @Sendable () throws -> VNCoreMLModel) {
    Task { @MainActor in
      // Model compilation can take seconds for large models; detached so
      // the camera UI appears immediately.
      let loaded = await Task.detached(priority: .userInitiated) {
        try? loadModel()
      }.value
      model = loaded
      isModelLoaded = loaded != nil
    }
  }

  /// All detections in the frame, filtered by label and confidence. Empty
  /// label matches every class. Returns nil while the model is loading.
  func detect(
    _ buffer: CVPixelBuffer,
    label: String = "",
    minimumConfidence: VNConfidence = 0.5
  ) async -> [VNRecognizedObjectObservation]? {
    guard let model else {
      return nil
    }
    let handler = VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .downMirrored)
    let request = VNCoreMLRequest(model: model)
    request.imageCropAndScaleOption = .scaleFill
    guard let results = VnRequestExecutor.execute(handler, request) else {
      return nil
    }
    let observations = results.compactMap { $0 as? VNRecognizedObjectObservation }
    return observations.filter { observation in
      guard observation.confidence >= minimumConfidence else {
        return false
      }
      guard !label.isEmpty else {
        return true
      }
      return observation.labels.first?.identifier == label
    }
  }

  /// The most prominent detection near the center of the frame — the "what
  /// am I pointing at" query. `centerBand` is the normalized band (on both
  /// axes) a detection's center must fall within.
  func detectCenterObject(
    _ buffer: CVPixelBuffer,
    label: String = "",
    minimumConfidence: VNConfidence = 0.5,
    centerBand: ClosedRange<CGFloat> = 0.3...0.7
  ) async -> VNRecognizedObjectObservation? {
    guard let observations = await detect(buffer, label: label, minimumConfidence: minimumConfidence)
    else {
      return nil
    }
    return observations
      .filter { observation in
        centerBand.contains(observation.boundingBox.midX)
          && centerBand.contains(observation.boundingBox.midY)
      }
      .max { $0.boundingBox.width < $1.boundingBox.width }
  }
}
