import { expect } from "chai"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { PdfRenderRequest, setPdfRendererForTests } from "../../src/Services/Documents/PdfRenderClient.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"

async function connectBooks(context: TestContext, user: GqlUser): Promise<void> {
    await context.quickBooksHelper.connectMyBooks(
        { idempotencyKey: `books-${user.id}`, provider: "QUICKBOOKS" },
        user,
    )
}

const OUTLINE = ["COVER", "TRACTION", "REVENUE", "MARGINS", "RUNWAY", "ASK"]

describe("Pitch", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    describe("decks", function () {
        it("creates the full outline with placeholder copy before the books connect", async function () {
            const deck = await this.pitchHelper.createDeck(this.defaults.user!, {
                idempotencyKey: "deck-1",
                name: "Seed round",
                companyName: "Acme Analytics",
                tagline: "Numbers that sell themselves.",
            })
            expect(deck.companyName).to.equal("Acme Analytics")
            expect(deck.accentColor).to.equal("#1f6feb")
            expect(deck.slides.map((slide) => slide.kind)).to.deep.equal(OUTLINE)
            expect(deck.slides.every((slide) => slide.included)).to.equal(true)

            const cover = deck.slides[0]
            expect(cover.title).to.equal("Acme Analytics")
            expect(cover.body).to.equal("Numbers that sell themselves.")
            const traction = deck.slides[1]
            expect(traction.body).to.contain("Connect your books")
        })

        it("replays the idempotency key instead of duplicating the deck or its slides", async function () {
            const input = {
                idempotencyKey: "deck-same",
                name: "Deck",
                companyName: "Acme",
            }
            const first = await this.pitchHelper.createDeck(this.defaults.user!, input)
            const second = await this.pitchHelper.createDeck(this.defaults.user!, input)
            expect(second.id).to.equal(first.id)
            expect(second.slides).to.have.length(OUTLINE.length)
            expect(await this.pitchHelper.listDecks(this.defaults.user!)).to.have.length(1)
        })

        it("writes live numbers into the default copy when the books are connected", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-live",
                name: "Live deck",
                companyName: "Acme",
            })
            const traction = deck.slides.find((slide) => slide.kind === "TRACTION")!
            expect(traction.body).to.match(/Revenue grew -?\d+% over the trailing year/)
            const margins = deck.slides.find((slide) => slide.kind === "MARGINS")!
            expect(margins.body).to.match(/Net margin ran -?\d+%/)
        })

        it("updates brand fields and validates the accent color", async function () {
            const user = this.defaults.user!
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-brand",
                name: "Deck",
                companyName: "Acme",
            })
            const updated = await this.pitchHelper.updateDeck(user, {
                deckId: deck.id,
                name: "Series A",
                companyName: "Acme Inc.",
                tagline: "",
                accentColor: "#0e9f6e",
            })
            expect(updated.name).to.equal("Series A")
            expect(updated.companyName).to.equal("Acme Inc.")
            expect(updated.tagline).to.equal(null)
            expect(updated.accentColor).to.equal("#0e9f6e")

            await expect(
                this.pitchHelper.updateDeck(user, { deckId: deck.id, accentColor: "blue" }),
            ).to.be.rejectedWith("hex")
        })

        it("scopes decks to their owner and deletes slides with the deck", async function () {
            const user = this.defaults.user!
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-scope",
                name: "Mine",
                companyName: "Acme",
            })

            const strangerAccount = await this.identityHelper.createAndGetAccount()
            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: strangerAccount.id }),
                }),
            )
            await expect(this.pitchHelper.getDeck(stranger, deck.id)).to.be.rejectedWith("no such deck")
            expect(await this.pitchHelper.listDecks(stranger)).to.deep.equal([])

            expect(await this.pitchHelper.deleteDeck(user, deck.id)).to.equal(true)
            await expect(this.pitchHelper.getDeck(user, deck.id)).to.be.rejectedWith("no such deck")
        })
    })

    describe("slides", function () {
        it("edits copy and toggles inclusion, but never the cover", async function () {
            const user = this.defaults.user!
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-slides",
                name: "Deck",
                companyName: "Acme",
            })
            const ask = deck.slides.find((slide) => slide.kind === "ASK")!
            const updated = await this.pitchHelper.updateSlide(user, {
                slideId: ask.id,
                title: "The raise",
                body: "We're raising $2M.",
                included: false,
            })
            expect(updated.title).to.equal("The raise")
            expect(updated.body).to.equal("We're raising $2M.")
            expect(updated.included).to.equal(false)

            const cover = deck.slides.find((slide) => slide.kind === "COVER")!
            await expect(
                this.pitchHelper.updateSlide(user, { slideId: cover.id, included: false }),
            ).to.be.rejectedWith("cover")
        })

        it("refuses slide edits from strangers", async function () {
            const user = this.defaults.user!
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-stranger",
                name: "Deck",
                companyName: "Acme",
            })
            const strangerAccount = await this.identityHelper.createAndGetAccount()
            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: strangerAccount.id }),
                }),
            )
            await expect(
                this.pitchHelper.updateSlide(stranger, {
                    slideId: deck.slides[1].id,
                    title: "Hijack",
                }),
            ).to.be.rejectedWith("no such deck")
        })
    })

    describe("deck data", function () {
        it("serves nothing before the books connect", async function () {
            expect(await this.pitchHelper.getDeckData(this.defaults.user!)).to.equal(null)
        })

        it("serves internally consistent metrics from the live books", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)
            const data = (await this.pitchHelper.getDeckData(user))!
            expect(data.revenueSeries).to.have.length(13)
            expect(data.cashSeries).to.have.length(13)

            // Net income is income minus expenses, month by month.
            for (let index = 0; index < data.revenueSeries.length; index += 1) {
                expect(data.netIncomeSeries[index].minorUnits).to.equal(
                    data.revenueSeries[index].minorUnits - data.expenseSeries[index].minorUnits,
                )
            }

            // The headline aggregates recompute from the series they summarize.
            const trailingTwelve = data.revenueSeries
                .slice(-12)
                .reduce((sum, entry) => sum + entry.minorUnits, 0)
            expect(data.trailingTwelveMonthRevenueMinorUnits).to.equal(trailingTwelve)
            expect(data.latestCashMinorUnits).to.equal(data.cashSeries[data.cashSeries.length - 1].minorUnits)
        })
    })

    describe("PDF export", function () {
        it("fails FAILED_PRECONDITION before the books connect", async function () {
            const user = this.defaults.user!
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-noconn",
                name: "Deck",
                companyName: "Acme",
            })
            await expect(this.pitchHelper.exportDeckPdf(user, deck.id, "export-noconn")).to.be.rejectedWith(
                "not connected",
            )
        })

        it("renders the included slides and files a PRIVATE pdf upload", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)
            const deck = await this.pitchHelper.createDeck(user, {
                idempotencyKey: "deck-export",
                name: "Deck",
                companyName: "Acme Analytics",
                tagline: "Numbers that sell themselves.",
            })
            const ask = deck.slides.find((slide) => slide.kind === "ASK")!
            await this.pitchHelper.updateSlide(user, { slideId: ask.id, included: false })

            const renderRequests: PdfRenderRequest[] = []
            setPdfRendererForTests({
                renderHtmlToPdf: async (request) => {
                    renderRequests.push(request)
                    return Buffer.from("%PDF-deck")
                },
            })
            try {
                const upload = await this.pitchHelper.exportDeckPdf(user, deck.id, "export-1")
                expect(upload.contentType).to.equal("application/pdf")
                expect(upload.visibility).to.equal("PRIVATE")
                expect(upload.status).to.equal("READY")
                expect(upload.fileName).to.match(/^pitch-deck-.*\.pdf$/)
            } finally {
                setPdfRendererForTests(undefined)
            }

            expect(renderRequests).to.have.length(1)
            const html = renderRequests[0].html
            expect(html).to.not.contain("{{")
            expect(html).to.contain("Acme Analytics")
            expect(html).to.contain("Numbers that sell themselves.")
            // The chart slides made it in; the excluded ask slide did not.
            expect(html).to.contain("Traction")
            expect(html).to.contain("Revenue")
            expect(html).to.not.contain("The ask")
        })
    })
})
