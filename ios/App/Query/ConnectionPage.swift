import Foundation

struct ConnectionPage<Item> {
  let items: [Item]
  let endCursor: String?
  let hasNextPage: Bool
}
