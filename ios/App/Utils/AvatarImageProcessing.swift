import UIKit

/// Prepares a picked photo for the avatar upload: downscales to a sensible
/// avatar resolution and JPEG-compresses, so a 20 MB camera photo never
/// rides through the upload path at full size (the storage kernel caps
/// uploads at 20 MB, and avatars render at ~44 pt).
enum AvatarImageProcessing {
  static let maxDimension: CGFloat = 1024
  static let jpegQuality: CGFloat = 0.8
  static let contentType = "image/jpeg"

  /// The downscaled pixel size: fits within maxDimension on the long edge,
  /// preserving aspect ratio; images already small enough pass through.
  static func targetSize(for size: CGSize, maxDimension: CGFloat = maxDimension) -> CGSize {
    let longEdge = max(size.width, size.height)
    guard longEdge > maxDimension, longEdge > 0 else {
      return size
    }
    let scale = maxDimension / longEdge
    return CGSize(
      width: (size.width * scale).rounded(),
      height: (size.height * scale).rounded()
    )
  }

  /// Downscaled, JPEG-compressed bytes for the upload; nil when the data is
  /// not a decodable image.
  static func jpegData(from imageData: Data) -> Data? {
    guard let image = UIImage(data: imageData) else {
      return nil
    }
    let target = targetSize(for: image.size)
    if target == image.size {
      return image.jpegData(compressionQuality: jpegQuality)
    }
    let format = UIGraphicsImageRendererFormat.default()
    // The picked image's point size already accounts for its pixel density;
    // render at 1x so the target size is the actual pixel size.
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(size: target, format: format)
    let resized = renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: target))
    }
    return resized.jpegData(compressionQuality: jpegQuality)
  }
}
