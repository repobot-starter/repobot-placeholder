/**
 * The checkout pack's presentation copy — everything a user would rewrite to
 * sell their own thing. The page sells one real event: a small-group home
 * cooking class. What checkout CHARGES (price, currency) stays server-side
 * in firebase/functions/src/Services/Shop/ShopCatalog.ts (the `session`
 * product) so the client can never tamper with it; this file is only how
 * the page reads.
 */
export const checkoutContent = {
    /** Must match the ShopCatalog entry the page sells. */
    productKey: "session",
    brandName: "Salt & Ember",
    brandTag: "Supper classes",
    eyebrow: "A Salt & Ember supper class",
    className: "Handmade Pasta Night",
    dateLine: "Thursday, October 15",
    timeLine: "6:30 – 9:30 in the evening",
    placeLine: "The Salt & Ember kitchen · 214 Rowan St",
    lede:
        "Three hours, twelve aprons, one long wooden table. Roll, fill, and " +
        "sauce fresh pasta entirely from scratch — then sit down and eat it " +
        "together, glasses full.",
    host: {
        initials: "MB",
        name: "Hosted by Mara Bellucci",
        bio: "Fifteen years in Bologna's trattorie. She will fix your ravioli without judgment.",
    },
    menuTitle: "The evening's menu",
    menu: [
        {
            course: "First",
            dish: "Tagliatelle al ragù",
            note: "Hand-cut ribbons, slow-simmered beef & pork ragù",
        },
        {
            course: "Second",
            dish: "Ricotta & lemon ravioli",
            note: "Rolled thin, folded by hand, brown butter and sage",
        },
        {
            course: "To finish",
            dish: "Affogato",
            note: "Vanilla gelato drowned in hot espresso",
        },
    ],
    reserveLabel: "Reserve a seat",
    priceUnit: "per seat",
    seatsTotal: 12,
    seatsLeft: 4,
    seatsNote: "seats left at the table",
    includesTitle: "Your seat includes",
    includes: [
        "Every ingredient, tool, and an apron",
        "Wine poured while you cook",
        "Recipe cards to take home",
        "Dinner — you eat everything you make",
    ],
    trustLine: "Powered by Stripe · Test mode, no card charged",
    footerNote: "Payments are processed by Stripe. You'll get a receipt by email.",
}
