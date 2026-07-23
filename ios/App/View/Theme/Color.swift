import SwiftUI

extension Color {
  init(hex: String) {
    let trimmed = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var intValue: UInt64 = 0
    Scanner(string: trimmed).scanHexInt64(&intValue)

    let red, green, blue, alpha: UInt64
    switch trimmed.count {
    case 8:
      (red, green, blue, alpha) = ((intValue >> 24) & 255, (intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255)
    default:
      (red, green, blue, alpha) = ((intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255, 255)
    }

    self.init(
      .sRGB,
      red: Double(red) / 255,
      green: Double(green) / 255,
      blue: Double(blue) / 255,
      opacity: Double(alpha) / 255
    )
  }

  init(rgba: String) {
    let normalized = rgba
      .replacingOccurrences(of: "rgba(", with: "")
      .replacingOccurrences(of: ")", with: "")
      .replacingOccurrences(of: " ", with: "")
    let components = normalized.split(separator: ",")
    guard components.count == 4,
          let r = Double(components[0]),
          let g = Double(components[1]),
          let b = Double(components[2]),
          let a = Double(components[3]) else {
      self = .clear
      return
    }

    self.init(
      .sRGB,
      red: r / 255,
      green: g / 255,
      blue: b / 255,
      opacity: a
    )
  }
}
