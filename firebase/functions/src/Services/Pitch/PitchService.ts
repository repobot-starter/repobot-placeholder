import { asc, desc, eq } from "drizzle-orm"
import {
    allPitchSlideKinds,
    PitchSlide,
    pitchSlideInsertSchema,
    pitchSlidesTable,
    PitchSlideKind,
} from "../../Data/Pitch/PitchSlide.js"
import { PitchDeck, pitchDeckInsertSchema, pitchDecksTable } from "../../Data/Pitch/PitchDeck.js"
import { pitchDb } from "../../Data/PitchDatabase.js"
import { Upload } from "../../Data/Storage/Upload.js"
import { idempotentInsertAndGet } from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"
import { documentGenerationService } from "../Documents/DocumentGenerationService.js"
import { quickBooksService } from "../QuickBooks/QuickBooksService.js"
import { storageService } from "../Storage/StorageService.js"

/**
 * The pitch domain: investor decks whose chart slides read the owner's live
 * books. Brand and copy are stored; the numbers never are — traction,
 * revenue, margins, and runway are computed from the accounting connection
 * at read and export time, and the PDF export rides the documents kernel
 * (the pitch-deck template under documents/templates/).
 */
class PitchService {
    /**
     * Creates a deck with the full outline. Slide copy defaults are written
     * from the live books when connected, placeholders otherwise — either
     * way every slide is editable afterwards.
     */
    async createDeck(request: CreateDeckRequest): Promise<PitchDeck> {
        const newDeck = pitchDeckInsertSchema.parse({
            userId: request.userId,
            name: request.name,
            companyName: request.companyName,
            tagline: request.tagline ?? null,
        })
        const deck = await idempotentInsertAndGet(pitchDb, pitchDecksTable, newDeck, request.idempotencyKey)
        await this.seedSlides(deck)
        return deck
    }

    /** The caller's decks, newest first. */
    async listDecks(userId: string): Promise<PitchDeck[]> {
        return await pitchDb
            .select()
            .from(pitchDecksTable)
            .where(eq(pitchDecksTable.userId, userId))
            .orderBy(desc(pitchDecksTable.rowCreatedAt))
    }

    /** One deck, owner-checked. */
    async getDeck(request: { userId: string; deckId: string }): Promise<PitchDeck> {
        const [deck] = await pitchDb
            .select()
            .from(pitchDecksTable)
            .where(eq(pitchDecksTable.id, request.deckId))
            .limit(1)
        if (deck === undefined || deck.userId !== request.userId) {
            throw new RpcError("NOT_FOUND", "There is no such deck.")
        }
        return deck
    }

    /** Updates brand fields (owner-checked). */
    async updateDeck(request: UpdateDeckRequest): Promise<PitchDeck> {
        const deck = await this.getDeck(request)
        const changes: Partial<PitchDeck> = { rowUpdatedAt: new Date() }
        if (request.name !== undefined && request.name !== null) {
            const name = request.name.trim()
            if (name.length === 0 || name.length > 120) {
                throw new RpcError("INVALID_ARGUMENT", "Deck names are 1-120 characters.")
            }
            changes.name = name
        }
        if (request.companyName !== undefined && request.companyName !== null) {
            const companyName = request.companyName.trim()
            if (companyName.length === 0 || companyName.length > 120) {
                throw new RpcError("INVALID_ARGUMENT", "Company names are 1-120 characters.")
            }
            changes.companyName = companyName
        }
        if (request.tagline !== undefined) {
            const tagline = request.tagline?.trim() ?? ""
            changes.tagline = tagline.length === 0 ? null : tagline
        }
        if (request.logoUploadId !== undefined) {
            changes.logoUploadId =
                request.logoUploadId === null || request.logoUploadId === "" ? null : request.logoUploadId
        }
        if (request.accentColor !== undefined && request.accentColor !== null) {
            if (!/^#[0-9a-fA-F]{6}$/.test(request.accentColor)) {
                throw new RpcError("INVALID_ARGUMENT", 'Accent colors are hex, e.g. "#1f6feb".')
            }
            changes.accentColor = request.accentColor
        }
        const [updated] = await pitchDb
            .update(pitchDecksTable)
            .set(changes)
            .where(eq(pitchDecksTable.id, deck.id))
            .returning()
        return updated
    }

    /** Deletes a deck and its slides (owner-checked). */
    async deleteDeck(request: { userId: string; deckId: string }): Promise<void> {
        const deck = await this.getDeck(request)
        await pitchDb.delete(pitchSlidesTable).where(eq(pitchSlidesTable.deckId, deck.id))
        await pitchDb.delete(pitchDecksTable).where(eq(pitchDecksTable.id, deck.id))
    }

    /** The deck's slides in outline order. */
    async listSlides(deckId: string): Promise<PitchSlide[]> {
        return await pitchDb
            .select()
            .from(pitchSlidesTable)
            .where(eq(pitchSlidesTable.deckId, deckId))
            .orderBy(asc(pitchSlidesTable.position))
    }

    /** Updates a slide's copy or include toggle (owner-checked via the deck). */
    async updateSlide(request: UpdateSlideRequest): Promise<PitchSlide> {
        const [slide] = await pitchDb
            .select()
            .from(pitchSlidesTable)
            .where(eq(pitchSlidesTable.id, request.slideId))
            .limit(1)
        if (slide === undefined) {
            throw new RpcError("NOT_FOUND", "There is no such slide.")
        }
        await this.getDeck({ userId: request.userId, deckId: slide.deckId })
        const changes: Partial<PitchSlide> = { rowUpdatedAt: new Date() }
        if (request.title !== undefined && request.title !== null) {
            const title = request.title.trim()
            if (title.length === 0 || title.length > 120) {
                throw new RpcError("INVALID_ARGUMENT", "Slide titles are 1-120 characters.")
            }
            changes.title = title
        }
        if (request.body !== undefined && request.body !== null) {
            changes.body = request.body.trim()
        }
        if (request.included !== undefined && request.included !== null) {
            if (slide.kind === "COVER" && request.included === false) {
                throw new RpcError("INVALID_ARGUMENT", "The cover slide cannot be excluded.")
            }
            changes.included = request.included
        }
        const [updated] = await pitchDb
            .update(pitchSlidesTable)
            .set(changes)
            .where(eq(pitchSlidesTable.id, slide.id))
            .returning()
        return updated
    }

    /**
     * The live numbers behind the chart slides, computed from the owner's
     * books; undefined when the books are not connected.
     */
    async deckData(userId: string): Promise<PitchDeckData | undefined> {
        const connection = await quickBooksService.getConnectionForUser(userId)
        if (connection === undefined) {
            return undefined
        }
        const pnl = await quickBooksService.profitAndLossForConnection(connection)
        const balance = await quickBooksService.balanceSheetForConnection(connection)
        const snapshot = await quickBooksService.snapshotForConnection(connection)

        const revenueSeries = pnl.map((period) => ({
            month: period.month,
            minorUnits: period.totalIncomeMinorUnits,
        }))
        const netIncomeSeries = pnl.map((period) => ({
            month: period.month,
            minorUnits: period.netIncomeMinorUnits,
        }))
        const expenseSeries = pnl.map((period) => ({
            month: period.month,
            minorUnits: period.totalExpensesMinorUnits,
        }))
        const cashSeries = balance.map((period) => ({
            month: period.month,
            minorUnits:
                period.assetLines.find((line) => line.category === "Cash")?.minorUnits ??
                period.totalAssetsMinorUnits,
        }))

        const first = pnl[0]
        const latest = pnl[pnl.length - 1]
        const revenueGrowthPercent =
            first.totalIncomeMinorUnits === 0
                ? 0
                : Math.round(
                      ((latest.totalIncomeMinorUnits - first.totalIncomeMinorUnits) /
                          first.totalIncomeMinorUnits) *
                          100,
                  )
        const netMarginPercent =
            latest.totalIncomeMinorUnits === 0
                ? 0
                : Math.round((latest.netIncomeMinorUnits / latest.totalIncomeMinorUnits) * 100)

        // Trailing-three-month average net income: burn when negative.
        const trailing = netIncomeSeries.slice(-3)
        const averageNetIncomeMinorUnits = Math.round(
            trailing.reduce((sum, entry) => sum + entry.minorUnits, 0) / trailing.length,
        )
        const latestCashMinorUnits = cashSeries[cashSeries.length - 1].minorUnits
        const runwayMonths =
            averageNetIncomeMinorUnits >= 0
                ? undefined
                : Math.floor(latestCashMinorUnits / -averageNetIncomeMinorUnits)

        return {
            companyName: connection.companyName,
            currency: snapshot.currency,
            revenueSeries,
            expenseSeries,
            netIncomeSeries,
            cashSeries,
            revenueGrowthPercent,
            netMarginPercent,
            averageNetIncomeMinorUnits,
            latestCashMinorUnits,
            runwayMonths,
            trailingTwelveMonthRevenueMinorUnits: revenueSeries
                .slice(-12)
                .reduce((sum, entry) => sum + entry.minorUnits, 0),
            customerCount: snapshot.customerCount,
            paidInvoiceCount: snapshot.paidInvoiceCount,
        }
    }

    /**
     * Renders the deck to a PDF through the documents kernel and files it
     * PRIVATE for the owner. Requires connected books — the chart slides
     * are the deck.
     */
    async exportDeckPdf(request: {
        idempotencyKey: string
        userId: string
        deckId: string
    }): Promise<Upload> {
        const deck = await this.getDeck(request)
        const data = await this.deckData(request.userId)
        if (data === undefined) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "The books are not connected. Connect QuickBooks or Xero first — the deck's " +
                    "numbers come from the live connection.",
            )
        }
        const slides = await this.listSlides(deck.id)
        const included = new Map(slides.map((slide) => [slide.kind, slide]))
        const slideFor = (kind: PitchSlideKind): PitchSlide | undefined => {
            const slide = included.get(kind)
            return slide !== undefined && slide.included ? slide : undefined
        }

        const logoDataUri = await this.logoDataUri(deck)
        const cover = slideFor("COVER")
        const traction = slideFor("TRACTION")
        const revenue = slideFor("REVENUE")
        const margins = slideFor("MARGINS")
        const runway = slideFor("RUNWAY")
        const ask = slideFor("ASK")

        const overrides: Record<string, unknown> = {
            companyName: deck.companyName,
            tagline: deck.tagline ?? cover?.body ?? "",
            accentColor: deck.accentColor,
            hasLogo: logoDataUri !== undefined,
            logoDataUri: logoDataUri ?? "",
            preparedDate: new Date().toISOString().slice(0, 10),

            hasTraction: traction !== undefined,
            tractionTitle: traction?.title ?? "",
            tractionBody: traction?.body ?? "",
            tractionStats:
                traction === undefined
                    ? []
                    : [
                          {
                              label: "Trailing 12-month revenue",
                              value: formatMoney(data.trailingTwelveMonthRevenueMinorUnits),
                          },
                          { label: "Revenue growth, trailing year", value: `${data.revenueGrowthPercent}%` },
                          { label: "Active customers", value: `${data.customerCount}` },
                          { label: "Invoices collected", value: `${data.paidInvoiceCount}` },
                      ],

            hasRevenue: revenue !== undefined,
            revenueTitle: revenue?.title ?? "",
            revenueBody: revenue?.body ?? "",
            revenueBars: revenue === undefined ? [] : bars(data.revenueSeries),

            hasMargins: margins !== undefined,
            marginsTitle: margins?.title ?? "",
            marginsBody: margins?.body ?? "",
            netIncomeBars: margins === undefined ? [] : bars(data.netIncomeSeries),

            hasRunway: runway !== undefined,
            runwayTitle: runway?.title ?? "",
            runwayBody: runway?.body ?? "",
            cashBars: runway === undefined ? [] : bars(data.cashSeries),
            runwayStats:
                runway === undefined
                    ? []
                    : [
                          { label: "Cash on hand", value: formatMoney(data.latestCashMinorUnits) },
                          {
                              label: "Avg monthly net income (3 mo)",
                              value: formatMoney(data.averageNetIncomeMinorUnits),
                          },
                          {
                              label: "Runway",
                              value:
                                  data.runwayMonths === undefined
                                      ? "Cash-flow positive"
                                      : `${data.runwayMonths} months`,
                          },
                      ],

            hasAsk: ask !== undefined,
            askTitle: ask?.title ?? "",
            askBody: ask?.body ?? "",
        }

        const result = await documentGenerationService.generateAndFileDocument({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            visibility: "PRIVATE",
            templateKey: "pitch-deck",
            overrides,
        })
        return result.upload
    }

    private async logoDataUri(deck: PitchDeck): Promise<string | undefined> {
        if (deck.logoUploadId === null) {
            return undefined
        }
        const file = await storageService.readFileBytes({
            userId: deck.userId,
            uploadId: deck.logoUploadId,
        })
        return `data:${file.upload.contentType};base64,${file.bytes.toString("base64")}`
    }

    private async seedSlides(deck: PitchDeck): Promise<void> {
        const existing = await this.listSlides(deck.id)
        if (existing.length > 0) {
            // Idempotency replay.
            return
        }
        const data = await this.deckData(deck.userId)
        const defaults = defaultSlideCopy(deck, data)
        let position = 0
        for (const kind of allPitchSlideKinds) {
            const copy = defaults[kind]
            const newSlide = pitchSlideInsertSchema.parse({
                deckId: deck.id,
                position,
                kind,
                title: copy.title,
                body: copy.body,
            })
            await pitchDb.insert(pitchSlidesTable).values({ ...newSlide })
            position += 1
        }
    }
}

export const pitchService = new PitchService()

export interface CreateDeckRequest {
    idempotencyKey: string
    userId: string
    name: string
    companyName: string
    tagline?: string | null
}

export interface UpdateDeckRequest {
    userId: string
    deckId: string
    name?: string | null
    companyName?: string | null
    /** Explicit null clears; undefined leaves unchanged. */
    tagline?: string | null
    /** Explicit null (or "") clears; undefined leaves unchanged. */
    logoUploadId?: string | null
    accentColor?: string | null
}

export interface UpdateSlideRequest {
    userId: string
    slideId: string
    title?: string | null
    body?: string | null
    included?: boolean | null
}

export interface PitchSeriesPoint {
    month: string
    minorUnits: number
}

export interface PitchDeckData {
    companyName: string
    currency: string
    revenueSeries: PitchSeriesPoint[]
    expenseSeries: PitchSeriesPoint[]
    netIncomeSeries: PitchSeriesPoint[]
    cashSeries: PitchSeriesPoint[]
    revenueGrowthPercent: number
    netMarginPercent: number
    averageNetIncomeMinorUnits: number
    latestCashMinorUnits: number
    /** Whole months of runway at the trailing burn; undefined when cash-flow positive. */
    runwayMonths: number | undefined
    trailingTwelveMonthRevenueMinorUnits: number
    customerCount: number
    paidInvoiceCount: number
}

/** Whole-dollar money for deck copy, e.g. "$184,500". */
function formatMoney(minorUnits: number): string {
    const dollars = Math.round(minorUnits / 100)
    const formatted = Math.abs(dollars).toLocaleString("en-US")
    return `${dollars < 0 ? "-" : ""}$${formatted}`
}

/** "Aug" column labels for the CSS bar charts. */
function monthLabel(isoMonth: string): string {
    const date = new Date(`${isoMonth}-01T00:00:00Z`)
    return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
}

/** CSS bar-chart rows: heights scaled to the series maximum (min 4% so bars show). */
function bars(series: PitchSeriesPoint[]): { label: string; value: string; heightPercent: number }[] {
    const max = Math.max(...series.map((entry) => Math.abs(entry.minorUnits)), 1)
    return series.map((entry) => ({
        label: monthLabel(entry.month),
        value: formatMoney(entry.minorUnits),
        heightPercent: Math.max(4, Math.round((Math.abs(entry.minorUnits) / max) * 100)),
    }))
}

function defaultSlideCopy(
    deck: PitchDeck,
    data: PitchDeckData | undefined,
): Record<PitchSlideKind, { title: string; body: string }> {
    return {
        COVER: {
            title: deck.companyName,
            body: deck.tagline ?? "The numbers behind the story.",
        },
        TRACTION: {
            title: "Traction",
            body:
                data === undefined
                    ? "Connect your books to fill this slide with live numbers."
                    : `Revenue grew ${data.revenueGrowthPercent}% over the trailing year, reaching ` +
                      `${formatMoney(data.trailingTwelveMonthRevenueMinorUnits)} across ` +
                      `${data.customerCount} active customers.`,
        },
        REVENUE: {
            title: "Revenue",
            body: "Monthly revenue, trailing thirteen months — live from the books.",
        },
        MARGINS: {
            title: "Margins",
            body:
                data === undefined
                    ? "Net income by month, live from the books."
                    : `Net margin ran ${data.netMarginPercent}% in the latest month; the chart shows ` +
                      "monthly net income for the trailing thirteen months.",
        },
        RUNWAY: {
            title: "Runway",
            body:
                data === undefined || data.runwayMonths === undefined
                    ? "Cash on hand and the trailing burn — currently cash-flow positive."
                    : `${formatMoney(data.latestCashMinorUnits)} on hand covers about ` +
                      `${data.runwayMonths} months at the trailing burn.`,
        },
        ASK: {
            title: "The ask",
            body: "We're raising to accelerate what already works. Edit this slide with your round size, use of funds, and milestones.",
        },
    }
}
