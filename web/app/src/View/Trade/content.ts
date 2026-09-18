/**
 * Everything TradeBot renders lives in this file: the company, the stats,
 * the commodities, the shipment board, and the contact details. Edit it (or
 * ask the agent to) and the site updates — there is no backend and no CMS.
 *
 * The sample content is a timber exporter, but the template fits any trade
 * or supply-chain business: swap the commodities for coffee lots, steel
 * coils, or produce pallets and the page keeps working.
 */

export interface TradeCompany {
    name: string
    /** The hero statement — one bold sentence about what the business moves. */
    statement: string
    /** One supporting paragraph under the statement. */
    intro: string
    /** Small uppercase kicker above the statement, e.g. "Timber export". */
    kicker: string
    location: string
    email: string
    phone: string
}

/** Big-number proof points rendered as an ops-style KPI strip. */
export interface TradeStat {
    value: string
    label: string
}

/** A commodity/product card with spec chips. */
export interface TradeCommodity {
    name: string
    /** Short spec line, e.g. "8–16″ diameter · debarked". */
    spec: string
    /** Where it comes from, e.g. "Georgia & Alabama tracts". */
    origin: string
    note: string
    /** Two-letter monogram shown on the card tile. */
    monogram: string
    /** Tile tint behind the monogram, e.g. "#e8edf5". */
    accent: string
}

/** One step of the supply-chain journey timeline. */
export interface TradeJourneyStep {
    title: string
    description: string
}

export type ShipmentTone = "success" | "info" | "warning" | "neutral"

/** A row on the live shipment board (the ops-table teaser). */
export interface TradeShipment {
    /** Reference code, rendered in tabular numerals, e.g. "TE-4821". */
    ref: string
    /** Lane, e.g. "Savannah → Qingdao". */
    lane: string
    commodity: string
    eta: string
    status: string
    tone: ShipmentTone
}

export interface TradeCertification {
    /** Short code on the chip, e.g. "FSC". */
    code: string
    label: string
}

export const company: TradeCompany = {
    name: "Meridian Timber Co.",
    kicker: "Timber export · est. 2011",
    statement: "From forest to port, on schedule.",
    intro: "We source sawlogs from managed tracts across the Southeast, grade them at our own yards, and load them into containers that sail on time. Buyers on three continents plan mills around our schedule.",
    location: "Savannah, Georgia",
    email: "sales@meridiantimber.example",
    phone: "+1 (912) 555-0114",
}

export const stats: TradeStat[] = [
    { value: "12,400", label: "Loads delivered" },
    { value: "98.2%", label: "On-time departures" },
    { value: "14", label: "Ports served" },
    { value: "36", label: "Buyer partners" },
]

export const commodities: TradeCommodity[] = [
    {
        name: "Southern Yellow Pine sawlogs",
        spec: "8–16″ diameter · debarked",
        origin: "Georgia & Alabama tracts",
        note: "Our volume product: graded at the yard, photographed by the load, shipped within ten days of harvest.",
        monogram: "SP",
        accent: "#e8edf5",
    },
    {
        name: "White Oak stave logs",
        spec: "12″+ · veneer & stave grade",
        origin: "Appalachian foothills",
        note: "Hand-selected for cooperages and veneer mills. Every log tagged and traceable to its tract.",
        monogram: "WO",
        accent: "#f2e4c9",
    },
    {
        name: "Kiln-dried dimensional lumber",
        spec: "2×4 – 2×12 · KD19",
        origin: "Partner mills, Gulf region",
        note: "Bundled, wrapped, and containerized to export spec. ISPM-15 heat treatment documented per unit.",
        monogram: "KD",
        accent: "#d9f0d5",
    },
    {
        name: "Hardwood pulpwood",
        spec: "Mixed hardwood · 4′ lengths",
        origin: "Thinning operations",
        note: "Steady weekly volume for pulp and pellet buyers who need a dependable baseline.",
        monogram: "HP",
        accent: "#f7d9cf",
    },
]

export const journey: TradeJourneyStep[] = [
    {
        title: "Sourced",
        description:
            "Standing timber cruised and bought from managed tracts; harvest scheduled with the logger.",
    },
    {
        title: "Graded",
        description:
            "Every load ticketed at our yard — species, diameter class, and weight recorded on arrival.",
    },
    {
        title: "Loaded",
        description:
            "Containers packed to buyer spec, fumigated where required, and photographed before sealing.",
    },
    {
        title: "Sailing",
        description:
            "Bookings tracked from ingate to vessel departure; rolled containers rebooked the same day.",
    },
    {
        title: "Delivered",
        description: "Documents released on sailing; buyers see the ETA before the ship clears the channel.",
    },
]

export const shipments: TradeShipment[] = [
    {
        ref: "MT-4821",
        lane: "Savannah → Qingdao",
        commodity: "SYP sawlogs · 42 containers",
        eta: "Aug 14",
        status: "On water",
        tone: "info",
    },
    {
        ref: "MT-4830",
        lane: "Savannah → Busan",
        commodity: "White Oak staves · 8 containers",
        eta: "Aug 21",
        status: "Loading",
        tone: "warning",
    },
    {
        ref: "MT-4788",
        lane: "Brunswick → Rotterdam",
        commodity: "KD lumber · 16 containers",
        eta: "Jul 30",
        status: "Delivered",
        tone: "success",
    },
    {
        ref: "MT-4835",
        lane: "Savannah → Haiphong",
        commodity: "Hardwood pulp · 24 containers",
        eta: "Sep 02",
        status: "Booked",
        tone: "neutral",
    },
]

export const partners: string[] = [
    "Hapag-Lloyd",
    "Maersk",
    "Georgia Ports",
    "CMA CGM",
    "Norfolk Southern",
    "USDA APHIS",
]

export const certifications: TradeCertification[] = [
    { code: "FSC", label: "Chain of custody certified" },
    { code: "PEFC", label: "Sustainable sourcing" },
    { code: "ISPM-15", label: "Export heat treatment" },
    { code: "SFI", label: "Fiber sourcing standard" },
]
