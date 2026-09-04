import ARKit
import CoreImage
import RealityKit
import UIKit

/// Plain photo capture on the AR camera shell: the live feed renders through
/// ArCameraView, and `snapPhoto()` arms a one-frame grab — the next camera
/// frame is cropped square, rotated upright, and published as `image`.
///
/// Usage:
///
///     @State private var camera = PhotoCaptureCamera()
///     ArCameraView(arFrameDelegate: camera)
///     Button("Take photo") { camera.snapPhoto() }
///     // observe camera.image for the result; upload via the storage kernel.
@MainActor
@Observable
final class PhotoCaptureCamera: ArFrameDelegate {
  private var isArmed = false
  /// The captured photo; nil until the first snap. Set it back to nil for a
  /// retake flow.
  var image: UIImage?

  func snapPhoto() {
    isArmed = true
  }

  func frameDidUpdate(newFrame frame: ARFrame) {
    guard isArmed else {
      return
    }
    // Disarm immediately: exactly one frame per snap.
    isArmed = false
    guard
      let squared = CameraImageUtils.cropBufferToSquareUiImage(frame.capturedImage),
      // The camera sensor is landscape; rotate the crop upright.
      let upright = squared.rotate(.pi / 2)
    else {
      return
    }
    image = upright
    Haptics.impact(.rigid)
  }
}

/// Frame-to-image plumbing shared by capture surfaces.
enum CameraImageUtils {
  /// The camera frame as a center-cropped square UIImage — the shape photo
  /// UIs want, without the caller touching CoreVideo.
  static func cropBufferToSquareUiImage(_ buffer: CVPixelBuffer) -> UIImage? {
    let ciImage = CIImage(cvPixelBuffer: buffer)
    let context = CIContext()
    let rect = CGRect(
      x: 0, y: 0,
      width: CVPixelBufferGetWidth(buffer), height: CVPixelBufferGetHeight(buffer)
    )
    guard let cgImage = context.createCGImage(ciImage, from: rect) else {
      return nil
    }
    return UIImage(cgImage: cgImage).cropCenter()
  }
}

extension UIImage {
  /// Center-crops to a square of the shorter edge.
  func cropCenter() -> UIImage? {
    let breadth = min(size.width, size.height)
    let origin = CGPoint(
      x: size.width > size.height ? ((size.width - size.height) / 2).rounded(.down) : 0,
      y: size.height > size.width ? ((size.height - size.width) / 2).rounded(.down) : 0
    )
    let cropRect = CGRect(origin: origin, size: CGSize(width: breadth, height: breadth))
    guard let cropped = cgImage?.cropping(to: cropRect) else {
      return nil
    }
    return UIImage(cgImage: cropped, scale: scale, orientation: imageOrientation)
  }

  /// A copy rotated by the given radians (the camera sensor delivers
  /// landscape frames; portrait UIs rotate by .pi / 2).
  func rotate(_ radians: CGFloat) -> UIImage? {
    var newSize = CGRect(origin: .zero, size: size)
      .applying(CGAffineTransform(rotationAngle: radians)).size
    // Trim float noise so CoreGraphics doesn't round the canvas up a pixel.
    newSize.width = newSize.width.rounded(.down)
    newSize.height = newSize.height.rounded(.down)

    let format = UIGraphicsImageRendererFormat.default()
    format.scale = scale
    let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
    return renderer.image { rendererContext in
      let context = rendererContext.cgContext
      context.translateBy(x: newSize.width / 2, y: newSize.height / 2)
      context.rotate(by: radians)
      draw(in: CGRect(
        x: -size.width / 2, y: -size.height / 2, width: size.width, height: size.height
      ))
    }
  }
}
