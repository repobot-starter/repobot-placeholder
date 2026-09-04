// On non-Darwin platforms Foundation defines the CoreGraphics geometry types.
// Re-export the ones the kernel's theme files reference so `import
// CoreGraphics` resolves on wasm.
@_exported import struct Foundation.CGFloat
@_exported import struct Foundation.CGPoint
@_exported import struct Foundation.CGRect
@_exported import struct Foundation.CGSize
