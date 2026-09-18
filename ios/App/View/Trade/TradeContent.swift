import SwiftUI

/// Everything the TradeBot surface renders — the native twin of
/// `web/app/src/View/Trade/content.ts`. Edit this file (or ask the agent to)
/// and the app updates; there is no backend and no CMS. Keep it in sync with
/// the web content file.
///
/// The sample content is a timber exporter, but the template fits any trade
/// or supply-chain business: swap the commodities for coffee lots, steel
/// coils, or produce pallets and the page keeps working.
enum TradeContent {
  struct TradeCompany {
    let name: String
    /// Small uppercase kicker above the statement, e.g. "Timber export".
    let kicker: String
    /// The hero statement — one bold sentence about what the business moves.
    let statement: String
    /// One supporting paragraph under the statement.
    let intro: String
    let location: String
    let email: String
    let phone: String
  }

  /// Big-number proof points rendered as an ops-style KPI strip.
  struct TradeStat: Identifiable {
    let value: String
    let label: String
    var id: String { label }
  }

  /// A commodity/product card with spec chips.
  struct TradeCommodity: Identifiable {
    let name: String
    /// Short spec line, e.g. "8–16″ diameter · debarked".
    let spec: String
    /// Where it comes from, e.g. "Georgia & Alabama tracts".
    let origin: String
    let note: String
    /// Two-letter monogram shown on the card tile.
    let monogram: String
    /// Tile tint behind the monogram.
    let accent: Color
    var id: String { name }
  }

  /// One step of the supply-chain journey timeline.
  struct TradeJourneyStep: Identifiable {
    let title: String
    let description: String
    var id: String { title }
  }

  /// Status pill tones, mirrored from the ops design language.
  enum ShipmentTone {
    case success
    case info
    case warning
    case neutral
  }

  /// A row on the live shipment board (the ops-table teaser).
  struct TradeShipment: Identifiable {
    /// Reference code, rendered in tabular numerals, e.g. "TE-4821".
    let ref: String
    /// Lane, e.g. "Savannah → Qingdao".
    let lane: String
    let commodity: String
    let eta: String
    let status: String
    let tone: ShipmentTone
    var id: String { ref }
  }

  struct TradeCertification: Identifiable {
    /// Short code on the chip, e.g. "FSC".
    let code: String
    let label: String
    var id: String { code }
  }

  static let company = TradeCompany(
    name: "Meridian Timber Co.",
    kicker: "Timber export · est. 2011",
    statement: "From forest to port, on schedule.",
    intro:
      "We source sawlogs from managed tracts across the Southeast, grade them at our own yards, and load them into containers that sail on time. Buyers on three continents plan mills around our schedule.",
    location: "Savannah, Georgia",
    email: "sales@meridiantimber.example",
    phone: "+1 (912) 555-0114"
  )

  static let stats: [TradeStat] = [
    TradeStat(value: "12,400", label: "Loads delivered"),
    TradeStat(value: "98.2%", label: "On-time departures"),
    TradeStat(value: "14", label: "Ports served"),
    TradeStat(value: "36", label: "Buyer partners"),
  ]

  static let commodities: [TradeCommodity] = [
    TradeCommodity(
      name: "Southern Yellow Pine sawlogs",
      spec: "8–16″ diameter · debarked",
      origin: "Georgia & Alabama tracts",
      note:
        "Our volume product: graded at the yard, photographed by the load, shipped within ten days of harvest.",
      monogram: "SP",
      accent: Color(hex: "#E8EDF5")),
    TradeCommodity(
      name: "White Oak stave logs",
      spec: "12″+ · veneer & stave grade",
      origin: "Appalachian foothills",
      note:
        "Hand-selected for cooperages and veneer mills. Every log tagged and traceable to its tract.",
      monogram: "WO",
      accent: Color(hex: "#F2E4C9")),
    TradeCommodity(
      name: "Kiln-dried dimensional lumber",
      spec: "2×4 – 2×12 · KD19",
      origin: "Partner mills, Gulf region",
      note:
        "Bundled, wrapped, and containerized to export spec. ISPM-15 heat treatment documented per unit.",
      monogram: "KD",
      accent: Color(hex: "#D9F0D5")),
    TradeCommodity(
      name: "Hardwood pulpwood",
      spec: "Mixed hardwood · 4′ lengths",
      origin: "Thinning operations",
      note:
        "Steady weekly volume for pulp and pellet buyers who need a dependable baseline.",
      monogram: "HP",
      accent: Color(hex: "#F7D9CF")),
  ]

  static let journey: [TradeJourneyStep] = [
    TradeJourneyStep(
      title: "Sourced",
      description:
        "Standing timber cruised and bought from managed tracts; harvest scheduled with the logger."),
    TradeJourneyStep(
      title: "Graded",
      description:
        "Every load ticketed at our yard — species, diameter class, and weight recorded on arrival."),
    TradeJourneyStep(
      title: "Loaded",
      description:
        "Containers packed to buyer spec, fumigated where required, and photographed before sealing."),
    TradeJourneyStep(
      title: "Sailing",
      description:
        "Bookings tracked from ingate to vessel departure; rolled containers rebooked the same day."),
    TradeJourneyStep(
      title: "Delivered",
      description:
        "Documents released on sailing; buyers see the ETA before the ship clears the channel."),
  ]

  static let shipments: [TradeShipment] = [
    TradeShipment(
      ref: "MT-4821", lane: "Savannah → Qingdao",
      commodity: "SYP sawlogs · 42 containers",
      eta: "Aug 14", status: "On water", tone: .info),
    TradeShipment(
      ref: "MT-4830", lane: "Savannah → Busan",
      commodity: "White Oak staves · 8 containers",
      eta: "Aug 21", status: "Loading", tone: .warning),
    TradeShipment(
      ref: "MT-4788", lane: "Brunswick → Rotterdam",
      commodity: "KD lumber · 16 containers",
      eta: "Jul 30", status: "Delivered", tone: .success),
    TradeShipment(
      ref: "MT-4835", lane: "Savannah → Haiphong",
      commodity: "Hardwood pulp · 24 containers",
      eta: "Sep 02", status: "Booked", tone: .neutral),
  ]

  static let partners: [String] = [
    "Hapag-Lloyd",
    "Maersk",
    "Georgia Ports",
    "CMA CGM",
    "Norfolk Southern",
    "USDA APHIS",
  ]

  static let certifications: [TradeCertification] = [
    TradeCertification(code: "FSC", label: "Chain of custody certified"),
    TradeCertification(code: "PEFC", label: "Sustainable sourcing"),
    TradeCertification(code: "ISPM-15", label: "Export heat treatment"),
    TradeCertification(code: "SFI", label: "Fiber sourcing standard"),
  ]
}
