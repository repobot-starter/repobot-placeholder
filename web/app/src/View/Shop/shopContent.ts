/**
 * Everything the storefront says, in one place — edit this file to make the
 * site yours. The book's NAME and PRICE are not here: they live server-side
 * in firebase/functions/src/Services/Shop/ShopCatalog.ts (so the charged
 * amount can't be tampered with) and arrive via the shopProduct query. Keep
 * `bookTitle` below in sync with the catalog's product name.
 */

export interface ShopReview {
    quote: string
    source: string
}

export const shopContent = {
    /** The author's name — the site's wordmark and the cover byline. */
    authorName: "Margaret Hale",
    /** Mirrors the server-side product name on the cover art and page copy. */
    bookTitle: "The Lighthouse Letters",
    eyebrow: "The new novel — available now",
    /** One breath of a pitch under the title. */
    lede: "Forty years of letters wash ashore in a Maine lighthouse, and the keeper's daughter must decide which of them to answer.",
    /** The editions line under the buy button. */
    editionNote: "First edition hardcover · 312 pages · signed by the author",
    excerpt:
        "The first letter arrived the way all true things do — late, water-stained, and addressed to someone I used to be.",
    excerptAttribution: "from Chapter One",
    reviews: [
        {
            quote: "A tide-pull of a novel. Hale writes grief and grace in the same breath.",
            source: "The Harbor Review",
        },
        {
            quote: "Luminous. The rare book that makes silence feel like a character.",
            source: "Coastal Living Book Club",
        },
        {
            quote: "I read it in one sitting and then walked to the sea. You will too.",
            source: "Ellen Marsh, author of Salt & Cedar",
        },
    ] satisfies ShopReview[],
    about: {
        heading: "About the author",
        paragraphs: [
            "Margaret Hale spent thirty years teaching English in a two-room schoolhouse on the Maine coast before writing her first novel at sixty-two. Her stories live where the land runs out — lighthouses, ferry landings, kitchens that smell of woodsmoke.",
            "The Lighthouse Letters is her third novel. She still answers every letter her readers send, by hand, usually with the tide chart open on the table.",
        ],
    },
    footerNote: "Payments are handled securely by Stripe. No account needed.",
} as const
