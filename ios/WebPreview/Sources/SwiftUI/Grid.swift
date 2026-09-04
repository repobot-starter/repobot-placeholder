// LazyVGrid + GridItem. "Lazy" only in name here: previews render whole
// screens, so every cell is laid out eagerly.
import CoreGraphics
import Foundation

public struct GridItem: Sendable {
  public enum Size: Sendable {
    case fixed(CGFloat)
    case flexible(minimum: CGFloat = 10, maximum: CGFloat = .infinity)
    case adaptive(minimum: CGFloat, maximum: CGFloat = .infinity)
  }

  public var size: Size
  public var spacing: CGFloat?
  public var alignment: Alignment?

  public init(_ size: Size = .flexible(), spacing: CGFloat? = nil, alignment: Alignment? = nil) {
    self.size = size
    self.spacing = spacing
    self.alignment = alignment
  }
}

public struct LazyVGrid<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let columns: [GridItem]
  let alignment: HorizontalAlignment
  let spacing: CGFloat?
  let content: Content

  public init(
    columns: [GridItem], alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil,
    @ViewBuilder content: () -> Content
  ) {
    self.columns = columns
    self.alignment = alignment
    self.spacing = spacing
    self.content = content()
  }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/Grid"
    return [
      _GridNode(
        columns: columns, rowSpacing: spacing ?? 8, cellAlignment: alignment,
        children: _buildNodes(content, &childCtx))
    ]
  }
}

final class _GridNode: _LayoutNode {
  let columns: [GridItem]
  let rowSpacing: CGFloat
  let cellAlignment: HorizontalAlignment
  let children: [_LayoutNode]

  init(
    columns: [GridItem], rowSpacing: CGFloat, cellAlignment: HorizontalAlignment,
    children: [_LayoutNode]
  ) {
    self.columns = columns
    self.rowSpacing = rowSpacing
    self.cellAlignment = cellAlignment
    self.children = children
    super.init()
  }

  private struct Grid {
    var columnWidths: [CGFloat]
    var columnSpacing: CGFloat
    var rowHeights: [CGFloat]
  }

  /// Resolves column count/widths for the available width, then measures
  /// row heights as the max cell height per row.
  private func resolve(_ proposal: _Proposal) -> Grid {
    let available = proposal.width ?? 360
    let columnSpacing = columns.first?.spacing ?? 8

    var widths: [CGFloat] = []
    if columns.count == 1, case .adaptive(let minimum, let maximum) = columns[0].size {
      // Adaptive: as many min-width columns as fit, stretched to fill.
      let count = Swift.max(1, Int((available + columnSpacing) / (minimum + columnSpacing)))
      let width = Swift.min(
        maximum, (available - columnSpacing * CGFloat(count - 1)) / CGFloat(count))
      widths = Array(repeating: width, count: count)
    } else {
      // Fixed columns claim their size; flexible columns share the rest.
      let totalSpacing = columnSpacing * CGFloat(columns.count - 1)
      var remaining = available - totalSpacing
      var flexibleCount = 0
      for column in columns {
        if case .fixed(let width) = column.size { remaining -= width } else { flexibleCount += 1 }
      }
      let flexWidth = flexibleCount > 0 ? Swift.max(0, remaining / CGFloat(flexibleCount)) : 0
      widths = columns.map { column in
        switch column.size {
        case .fixed(let width): return width
        case .flexible(let minimum, let maximum), .adaptive(let minimum, let maximum):
          return Swift.min(Swift.max(flexWidth, minimum), maximum)
        }
      }
    }

    let columnCount = widths.count
    var rowHeights: [CGFloat] = []
    for rowStart in stride(from: 0, to: children.count, by: columnCount) {
      var rowHeight: CGFloat = 0
      for offset in 0..<columnCount where rowStart + offset < children.count {
        let size = children[rowStart + offset].sizeThatFits(
          _Proposal(width: widths[offset], height: nil))
        rowHeight = Swift.max(rowHeight, size.height)
      }
      rowHeights.append(rowHeight)
    }
    return Grid(columnWidths: widths, columnSpacing: columnSpacing, rowHeights: rowHeights)
  }

  override func measure(_ proposal: _Proposal) -> CGSize {
    let grid = resolve(proposal)
    let width =
      grid.columnWidths.reduce(0, +) + grid.columnSpacing * CGFloat(grid.columnWidths.count - 1)
    let height =
      grid.rowHeights.reduce(0, +) + rowSpacing * CGFloat(Swift.max(0, grid.rowHeights.count - 1))
    return CGSize(width: proposal.width ?? width, height: height)
  }

  override func place(in frame: CGRect, parent: _DomNode) {
    let grid = resolve(_Proposal(width: frame.width, height: frame.height))
    let columnCount = grid.columnWidths.count
    var y = frame.minY
    for (row, rowHeight) in grid.rowHeights.enumerated() {
      var x = frame.minX
      for offset in 0..<columnCount {
        let index = row * columnCount + offset
        guard index < children.count else { break }
        let cellWidth = grid.columnWidths[offset]
        let size = children[index].sizeThatFits(_Proposal(width: cellWidth, height: nil))
        let alignedX = x + (cellWidth - size.width) * cellAlignment.fraction
        children[index].place(
          in: CGRect(
            x: alignedX, y: y + (rowHeight - size.height) / 2, width: size.width,
            height: size.height),
          parent: parent)
        x += cellWidth + grid.columnSpacing
      }
      y += rowHeight + rowSpacing
    }
  }
}
